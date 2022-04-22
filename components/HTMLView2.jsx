import React from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  PlatformColor,
  DynamicColorIOS,
  useWindowDimensions,
} from 'react-native';
import { parseFragment } from 'parse5';
import urlRegexSafe from 'url-regex-safe';
import * as entities from 'entities';
import stripIndent from 'strip-indent';

import Text from './Text';

import openBrowser from '../utils/openBrowser';
import openShare from '../utils/openShare';

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
    marginBottom: 6,
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
    opacity: 0.8,
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
  },
  i: {
    fontStyle: 'italic',
    fontSize: baseFontSize,
  },
});

const onLinkPress = (url) => {
  openBrowser(url);
};
const onLinkLongPress = (url) => {
  openShare({ url });
};

function PreView({ children, ...props }) {
  const windowHeight = useWindowDimensions().height;
  return (
    <ScrollView
      automaticallyAdjustContentInsets={false}
      scrollsToTop={false}
      style={[nodeStyles.pre, { maxHeight: windowHeight * 0.5 }]}
      decelerationRate={0} // Easier to read the code
      {...props}
    >
      <View style={nodeStyles.preInner} onStartShouldSetResponder={() => true}>
        {children}
      </View>
    </ScrollView>
  );
}

function dom2elements(nodes, parentName) {
  if (!nodes || !nodes.length) return;
  return nodes.map((node, i) => {
    const { tagName, nodeName, childNodes } = node;
    // Note: React keys must only be unique among siblings, not global
    const key = i;
    if (tagName) {
      const style = nodeStyles[tagName || 'default'];
      let elements = dom2elements(childNodes, tagName);
      if (!elements) return null;
      if (tagName === 'pre') {
        return <PreView key={key}>{elements}</PreView>;
      }
      if (tagName === 'a') {
        const href = node.attrs?.find((attr) => attr.name === 'href').value;
        // Steps to make sure children inside is ACTUALLY text
        const child = childNodes?.length === 1;
        const text = child?.nodeName === '#text' && child.value;
        return (
          <Text
            key={key}
            style={style}
            onPress={onLinkPress.bind(null, href)}
            onLongPress={onLinkLongPress.bind(null, href)}
          >
            {text || elements}
          </Text>
        );
      }
      if (tagName === 'p') {
        let firstChild = childNodes && childNodes[0];
        if (firstChild.tagName) {
          // Sometimes can be an <i> tag
          firstChild = firstChild.childNodes && firstChild.childNodes[0];
        }
        const firstText =
          firstChild && firstChild.nodeName === '#text' && firstChild.value;
        const [_, prefix, __, rest] =
          (firstText || '').match(
            /^((>+|-|\*|[a-z]\)|\d+\.|\(?\d+\)|\d+-|\[\d+\]:?)\s?)([^<>\-\*]{0,1}.*)$/,
          ) || [];
        if (firstText && prefix) {
          firstChild.value = rest || '';
          // Refresh elements
          elements = dom2elements(childNodes, tagName);

          return (
            <View
              key={key}
              style={nodeStyles[prefix.includes('>') ? 'blockquote' : 'li']}
            >
              <Text style={nodeStyles.default}>{prefix}</Text>
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
        // Trim EOL newline
        text = stripIndent(value.replace(/\n$/, ''));
      } else {
        // Trim ALL newlines, because HTML
        text = value.replace(/[\n\s\t]+/g, ' ');
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

export default function HTMLView2({ html, linkify }) {
  if (!html || !html.trim()) return null;
  if (linkify) {
    const containsLink = /<\/a>/i.test(html);
    if (containsLink) {
      console.warn('HTML contains anchors and linkify=true', html);
    } else {
      html = entities
        .decodeHTML(html)
        .replace(/(<\w)/gi, '\n$1') // Some tags are too "sticky"
        .replace(urlRegex, (url) => `<a href="${url}">${url}</a>`);
    }
  }
  const docFrag = parseFragment(html);
  const elements = dom2elements(docFrag.childNodes);
  return elements;
}
