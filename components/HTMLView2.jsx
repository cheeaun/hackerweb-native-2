import { useRef, useState } from 'react';
import {
  ActionSheetIOS,
  DynamicColorIOS,
  PlatformColor,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  findNodeHandle,
  useWindowDimensions,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import SyntaxHighlighter from 'react-syntax-highlighter';
import a11yDark from 'react-syntax-highlighter/dist/esm/styles/hljs/a11y-dark';
import a11yLight from 'react-syntax-highlighter/dist/esm/styles/hljs/a11y-light';

import * as Haptics from 'expo-haptics';

import * as entities from 'entities';
import hljs from 'highlight.js';
import { parseFragment } from 'parse5';
import stripIndent from 'strip-indent';
import urlRegexSafe from 'url-regex-safe';

import useStore from '../hooks/useStore';
import useTheme from '../hooks/useTheme';

import openBrowser from '../utils/openBrowser';
import openShare from '../utils/openShare';

import Text from './Text';

const baseFontSize = 15;
const nodeStyles = StyleSheet.create({
  default: {
    fontSize: baseFontSize,
  },
  p: {
    marginBottom: 12,
    fontSize: baseFontSize,
  },
  li: {
    marginBottom: 12,
    // Can't reduce this margin because there's no <ul> or <ol> here
    fontSize: baseFontSize,
    flexDirection: 'row',
  },
  blockquote: {
    marginBottom: 12,
    fontSize: baseFontSize,
    backgroundColor: DynamicColorIOS({
      dark: 'rgba(255,255,255,.05)',
      light: 'rgba(0,0,0,.05)',
    }),
    padding: 8,
  },
  blockquoteWithQuotes: {
    flexDirection: 'row',
  },
  pre: {
    backgroundColor: DynamicColorIOS({
      dark: 'rgba(255,255,255,.05)',
      light: 'rgba(0,0,0,.05)',
    }),
    borderRadius: 4,
    marginBottom: 12,
  },
  preInner: {
    padding: 10,
  },
  code: {
    fontFamily: 'Menlo',
    fontSize: baseFontSize - 2,
  },
  a: {
    color: PlatformColor('link'),
    fontSize: baseFontSize,
    textDecorationLine: 'underline',
    textDecorationColor: '#1e90ff66',
  },
  i: {
    fontStyle: 'italic',
    fontSize: baseFontSize,
  },
});

function Link({ style, url, ...props }) {
  if (!url) return null;

  const navigation = useNavigation();
  const fetchMinimalItem = useStore((state) => state.fetchMinimalItem);
  const [loading, setLoading] = useState(false);

  return (
    <Text
      {...props}
      style={[
        nodeStyles.a,
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
    return <CodeBlock {...props}>{childNodes}</CodeBlock>;
  } else {
    return <PreView {...props}>{elements}</PreView>;
  }
}

function PreView({ children, ...props }) {
  const windowHeight = useWindowDimensions().height;
  return (
    <ScrollView
      automaticallyAdjustContentInsets={false}
      scrollsToTop={false}
      style={[
        nodeStyles.pre,
        {
          maxHeight: windowHeight * 0.5,
        },
      ]}
      decelerationRate={0} // Easier to read the code
      {...props}
    >
      <View style={nodeStyles.preInner} onStartShouldSetResponder={() => true}>
        {children}
      </View>
    </ScrollView>
  );
}

const codeTextColorsLight = {};
Object.entries(a11yLight).forEach(([key, value]) => {
  codeTextColorsLight[key] = value.color;
});
const codeTextColorsDark = {};
Object.entries(a11yDark).forEach(([key, value]) => {
  codeTextColorsDark[key] = value.color;
});

function CodeText({ className, children }) {
  const { isDark } = useTheme();
  const colors = isDark ? codeTextColorsDark : codeTextColorsLight;
  const color = className.reduce(
    (color, _className) => colors[_className] || color,
    null,
  );
  return <Text style={[nodeStyles.code, color && { color }]}>{children}</Text>;
}

function renderRow(row, i) {
  if (row.children) {
    return (
      <CodeText key={i} className={row.properties.className}>
        {row.children.map(renderRow)}
      </CodeText>
    );
  }
  if (row.value) {
    if (typeof row.value === 'string') {
      return row.value.replace(/\n+$/, ' ');
    }
    return row.value;
  }
}

const EmptyTag = ({ children }) => children;

function CodeBlock({ children }) {
  const windowHeight = useWindowDimensions().height;

  let codeText = children
    .map((node) => {
      if (node.tagName === 'code') {
        return node.childNodes.map((node) => node.value).join('');
      }
      return node.value;
    })
    .join('');
  codeText = stripIndent(
    codeText.replace(/^\n+/, '').replace(/\n+$/, ''),
  ).trim();

  const autoHighlightResult = hljs.highlightAuto(codeText);

  const codeblockRef = useRef(null);
  const options = [
    {
      text: 'Close',
      cancel: true,
    },
  ];

  return (
    <SyntaxHighlighter
      CodeTag={EmptyTag}
      PreTag={EmptyTag}
      style={{}}
      language={autoHighlightResult.language || 'plaintext'}
      renderer={({ rows }) => (
        <ScrollView
          automaticallyAdjustContentInsets={false}
          automaticallyAdjustsScrollIndicatorInsets={false}
          scrollsToTop={false}
          style={[nodeStyles.pre, { maxHeight: windowHeight * 0.5 }]}
          decelerationRate={0} // Easier to read the code
        >
          <Pressable
            ref={codeblockRef}
            style={nodeStyles.preInner}
            onLongPress={() => {
              Haptics.selectionAsync();
              ActionSheetIOS.showActionSheetWithOptions(
                {
                  title: `Characters: ${codeText.length.toLocaleString(
                    'en-US',
                  )}  Lines: ${codeText
                    .split('\n')
                    .length.toLocaleString('en-US')}`,
                  message: `Detected languages (relevance score):\n${autoHighlightResult.language.toUpperCase()} (${
                    autoHighlightResult.relevance
                  })${
                    !!autoHighlightResult.second_best &&
                    `, ${autoHighlightResult.second_best?.language?.toUpperCase()} (${
                      autoHighlightResult.second_best?.relevance
                    })`
                  }`,
                  options: options.map((o) => o.text),
                  cancelButtonIndex: options.findIndex((o) => o.cancel),
                  anchor: findNodeHandle(codeblockRef.current),
                },
                (index) => {
                  options[index].action?.();
                },
              );
            }}
          >
            {rows.map(renderRow)}
          </Pressable>
        </ScrollView>
      )}
    >
      {codeText}
    </SyntaxHighlighter>
  );
}

function dom2elements(nodes, parentName, level = 0) {
  if (!nodes || !nodes.length) return;
  let nodeStates = [];
  return nodes.map((node, i) => {
    const { tagName, nodeName, childNodes } = node;
    // Note: React keys must only be unique among siblings, not global
    const key = i + '-' + level;
    if (tagName) {
      const style = nodeStyles[tagName || 'default'];
      let elements = dom2elements(childNodes, tagName, level + 1);
      if (!elements) return null;
      if (tagName === 'pre') {
        return <Pre key={key} elements={elements} childNodes={childNodes} />;
      }
      if (tagName === 'a') {
        const href = node.attrs?.find((attr) => attr.name === 'href').value;
        // Steps to make sure children inside is ACTUALLY text
        const child = childNodes?.length === 1 && childNodes[0];
        const text = child?.nodeName === '#text' && child.value;
        return (
          <Link key={key} url={href}>
            {text || elements}
          </Link>
        );
      }
      if (tagName === 'p') {
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
              <Text style={nodeStyles.default}>{elements}</Text>
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
            /^((>{1,5}|-{1,2}|\+|\*|[a-z]\)|[a-z]\.|\d+\.|\(?\d+\)|\[\d+\]:?)\s?)([^<>\-\*]{0,1}.*)$/is,
          ) || [];
        if (firstText && prefix) {
          firstChild.value = rest || '';
          // Refresh elements
          elements = dom2elements(childNodes, tagName, level + 1);

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
              <Text style={nodeStyles.default} fontVariant={['tabular-nums']}>
                {prefix}
              </Text>
              <Text
                style={[
                  nodeStyles.default,
                  {
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
        <Text key={key} style={style}>
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
                  <Text key={`c-${i}`} style={nodeStyles.code}>
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
          <Text key={key} style={nodeStyles.p}>
            {text}
          </Text>
        );
      }

      return (
        <Text key={key} style={style}>
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

export default function HTMLView2({ html, linkify, DEBUG }) {
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
  const elements = dom2elements(docFrag.childNodes);
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
