import { useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import * as Haptics from 'expo-haptics';

import * as entities from 'entities';
import { parseFragment } from 'parse5';
import stripIndent from 'strip-indent';
import urlRegexSafe from 'url-regex-safe';

import useStore from '../hooks/useStore';

import openBrowser from '../utils/openBrowser';
import openShare from '../utils/openShare';

import Text from './Text';
import nodeStyles from './nodeStyles';

function Link({ style, url, ...props }) {
  if (!url) return null;

  const navigation = useNavigation();
  const fetchMinimalItem = useStore((state) => state.fetchMinimalItem);
  const [loading, setLoading] = useState(false);
  const addLink = useStore((state) => state.addLink);
  const visited = useStore(useCallback((state) => state.visited(url), [url]));

  return (
    <Text
      {...props}
      style={[
        nodeStyles.a,
        visited && nodeStyles.aVisited,
        style,
        {
          opacity: loading ? 0.5 : 1,
        },
      ]}
      onPress={() => {
        if (loading) return;
        // get item ID from HN link
        const [_, itemId] =
          url.match(/^https?:\/\/news\.ycombinator\.com\/item\?id=(\d+)/) || [];
        if (itemId) {
          setLoading(true);
          fetchMinimalItem(+itemId)
            .then((item) => {
              // 4 types: story, comment, job, poll
              // Ignoring `poll` because Algolia API doesn't contain the poll content
              if (item?.type === 'story' || item?.type === 'poll') {
                navigation.push('StoryModal', {
                  id: item.id,
                  tab: 'comments',
                });
                // TODO: Add this when Comments screen allow
                // async loading of comments
                // } else if (item?.type === 'comment') {
                //   navigation.push('Comments', {
                //     id: item.id,
                //   });
              } else {
                openBrowser(url);
              }
            })
            .catch((_) => {
              openBrowser(url);
            })
            .finally(() => {
              setLoading(false);
            });
        } else {
          openBrowser(url);
        }
        setTimeout(() => {
          addLink(url);
        }, 300);
      }}
      onLongPress={() => {
        Haptics.selectionAsync();
        openShare({ url });
      }}
    />
  );
}

function Pre({ elements, childNodes, ...props }) {
  const settingsSyntaxHighlighting = useStore(
    (state) => state.settings.syntaxHighlighting,
  );
  if (settingsSyntaxHighlighting) {
    const CodeBlock = require('./CodeBlock').default;
    return <CodeBlock {...props}>{childNodes}</CodeBlock>;
  } else {
    return <PreView {...props}>{elements}</PreView>;
  }
}

function PreView({ children, style, ...props }) {
  const windowHeight = useWindowDimensions().height;
  const scrollViewRef = useRef(null);
  return (
    <ScrollView
      ref={scrollViewRef}
      automaticallyAdjustContentInsets={false}
      automaticallyAdjustsScrollIndicatorInsets={false}
      scrollsToTop={false}
      style={[
        nodeStyles.pre,
        style,
        {
          maxHeight: windowHeight * 0.5,
        },
      ]}
      decelerationRate={0} // Easier to read the code
      {...props}
    >
      <Pressable
        style={nodeStyles.preInner}
        onPressIn={() => {
          scrollViewRef.current?.flashScrollIndicators();
        }}
      >
        {children}
      </Pressable>
    </ScrollView>
  );
}

function dom2elements(nodes, { parentName, level = 0, fontSize }) {
  if (!nodes || !nodes.length) return;
  let nodeStates = [];

  return nodes.map((node, i) => {
    const { tagName, nodeName, childNodes } = node;
    // Note: React keys must only be unique among siblings, not global
    const key = i + '-' + level;
    if (tagName) {
      const style = nodeStyles[tagName || 'default'];
      let elements = dom2elements(childNodes, {
        parentName: tagName,
        level: level + 1,
        fontSize,
      });
      if (!elements) return null;
      if (tagName === 'pre') {
        return (
          <Pre
            key={key}
            elements={elements}
            childNodes={childNodes}
            style={{ fontSize }}
          />
        );
      }
      if (tagName === 'a') {
        const href = node.attrs?.find((attr) => attr.name === 'href').value;
        // Steps to make sure children inside is ACTUALLY text
        const child = childNodes?.length === 1 && childNodes[0];
        const text = child?.nodeName === '#text' && child.value;
        return (
          <Link key={key} url={href} style={{ fontSize }}>
            {text || elements}
          </Link>
        );
      }
      breakP: if (tagName === 'p') {
        const firstChildNode = childNodes?.[0];
        const isPrevBlockquote = nodeStates[i - 1] === 'blockquote';
        const blockquoteCollapsedStyle = isPrevBlockquote && {
          // Collapse margin between blockquotes
          marginTop: -12,
          paddingTop: 4, // 8 + 4 = 12
        };

        // If first child is <i> and the only child
        if (firstChildNode?.tagName === 'i' && childNodes.length === 1) {
          nodeStates[i] = 'blockquote';
          return (
            <View
              key={key}
              style={[nodeStyles.blockquote, blockquoteCollapsedStyle]}
            >
              <Text style={[nodeStyles.default, { fontSize }]}>{elements}</Text>
            </View>
          );
        }

        let firstChild = firstChildNode;
        if (firstChild?.tagName) {
          // Sometimes can be an <i> tag
          firstChild = firstChild?.childNodes?.[0];
        }
        const firstText = firstChild?.nodeName === '#text' && firstChild?.value;
        const [_, prefix, __, rest] =
          (firstText || '').match(
            /^((>{1,5}|-{1,2}|\+\s|•\s|\*|[a-z]\)|[a-z]\.\s|\d+\.\s|\(?\d+\)|\[\d+\]:?)\s?)([^<>\-\*]{0,1}.*)$/is,
          ) || [];

        if (/\[\d+\]/.test(prefix)) {
          const childText = childNodes
            .filter((n) => n.nodeName === '#text')
            .map((n) => n.value)
            .join('');
          const matches = childText.match(/\[\d+\]/g);
          // This is a paragraph with two or more link references
          // "[1]: <link> [2]: <link>"
          // Usually the commenter should add new lines but forgot to.
          // So we don't need to indent these.
          if (matches?.length > 1) {
            break breakP;
          }
        }

        if (firstText && prefix) {
          firstChild.value = rest || '';
          // Refresh elements
          elements = dom2elements(childNodes, {
            parentName: tagName,
            level: level + 1,
            fontSize,
          });

          const isBlockquote = prefix.includes('>');
          if (isBlockquote) nodeStates[i] = 'blockquote';

          return (
            <View
              key={key}
              style={[
                nodeStyles[isBlockquote ? 'blockquote' : 'li'],
                isBlockquote && nodeStyles.blockquoteWithQuotes,
                isBlockquote && blockquoteCollapsedStyle,
              ]}
            >
              <Text
                style={[nodeStyles.default, { fontSize }]}
                fontVariant={['tabular-nums']}
              >
                {prefix}
              </Text>
              <Text
                style={[
                  nodeStyles.default,
                  {
                    fontSize,
                    flex: 1,
                  },
                ]}
              >
                {elements}
              </Text>
            </View>
          );
        }
      }
      return (
        <Text key={key} style={[style, { fontSize }]}>
          {elements}
        </Text>
      );
    } else if (nodeName === '#text') {
      const style = nodeStyles[parentName || 'default'];
      const { value } = node;
      let text;
      if (parentName === 'code') {
        // Trim EOL newline and strip indents
        text = stripIndent(
          value.replace(/^\n+/, '').replace(/\n+$/, ''),
        ).trim();
      } else {
        // Trim ALL newlines, because HTML
        text = value.replace(/[\n\s\t]+/g, ' ');

        // Markdownify text
        // Support "`" for now
        const separator = '\n\n\n';
        if (/`/.test(text)) {
          text = text
            .replace(
              /(`)[^\s][^`]+[^\s]\1/g,
              (m) => `${separator}${m}${separator}`,
            )
            .split(separator)
            .map((chunk, i) => {
              // if code
              if (/^(`)[^`]+\1$/.test(chunk)) {
                return (
                  <Text
                    key={`c-${i}`}
                    style={[
                      nodeStyles.code,
                      nodeStyles.inlineCode,
                      { fontSize: fontSize - 2 },
                    ]}
                  >
                    {chunk}
                  </Text>
                );
              }
              // others
              return chunk;
            });
        }
      }

      if (level === 0 && !parentName) {
        if (!text.trim()) return null;

        // If root level and there's no parent tag, then it's text that doesn't have a <p> tag
        return (
          <Text key={key} style={[nodeStyles.p, { fontSize }]}>
            {text}
          </Text>
        );
      }

      return (
        <Text
          key={key}
          style={[
            style,
            { fontSize: parentName === 'code' ? fontSize - 2 : fontSize },
          ]}
        >
          {text}
        </Text>
      );
    }
  });
}

const urlRegex = urlRegexSafe({
  localhost: false,
  strict: true,
});

export default function HTMLView2({ html, linkify, fontSize = 15, DEBUG }) {
  if (!html || !html.trim()) return null;
  if (linkify) {
    const containsLink = /<\/a>/i.test(html);
    if (containsLink) {
      console.warn('HTML contains anchors and linkify=true', html);
    } else {
      html = entities
        .decodeHTML(html)
        .replace(/(<\w)/gi, '\n$1') // Some tags are too "sticky"
        .replace(urlRegex, (url) => `<a href="${url}">${url}</a>`)
        .trim();
    }
  }

  /* HTML CLEANUP */
  // Put <p> after </pre>
  if (!/<\/pre>\s*<p>/i.test(html)) {
    html = html.replace(/<\/pre>([^<])/gi, '</pre><p>$1');
  }

  const docFrag = parseFragment(html);
  const elements = dom2elements(docFrag.childNodes, {
    fontSize,
  });
  if (__DEV__ && DEBUG) {
    if (DEBUG) console.log({ html });
    return (
      <Pressable
        onLongPress={() => {
          console.log({ html });
        }}
      >
        {elements}
      </Pressable>
    );
  }
  return elements;
}
