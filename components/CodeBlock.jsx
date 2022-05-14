import { useRef } from 'react';
import {
  ActionSheetIOS,
  Pressable,
  ScrollView,
  findNodeHandle,
  useWindowDimensions,
} from 'react-native';

import a11yDark from 'react-syntax-highlighter/dist/esm/styles/hljs/a11y-dark';
import a11yLight from 'react-syntax-highlighter/dist/esm/styles/hljs/a11y-light';

import * as Haptics from 'expo-haptics';

import hljs from 'highlight.js/lib/core';
import stripIndent from 'strip-indent';

import useTheme from '../hooks/useTheme';

import SyntaxHighlighter from './SyntaxHighlighter';
import Text from './Text';
import nodeStyles from './nodeStyles';

const codeTextColorsLight = {};
Object.entries(a11yLight).forEach(([key, value]) => {
  codeTextColorsLight[key] = value.color;
});
const codeTextColorsDark = {};
Object.entries(a11yDark).forEach(([key, value]) => {
  codeTextColorsDark[key] = value.color;
});

function CodeText({ style, className, children }) {
  const { isDark } = useTheme();
  const colors = isDark ? codeTextColorsDark : codeTextColorsLight;
  const color = className.reduce(
    (color, _className) => colors[_className] || color,
    null,
  );
  return (
    <Text style={[nodeStyles.code, style, color && { color }]}>{children}</Text>
  );
}

function renderRow(props) {
  return (row, i) => {
    const { style } = props;
    if (row.children) {
      return (
        <CodeText
          key={i}
          className={row.properties.className}
          style={[
            style,
            {
              fontSize: style.fontSize - 2,
            },
          ]}
        >
          {row.children.map(renderRow(props))}
        </CodeText>
      );
    }
    if (row.value) {
      if (typeof row.value === 'string') {
        return row.value.replace(/\n+$/, ' ');
      }
      return row.value;
    }
  };
}

const EmptyTag = ({ children }) => children;

export default function CodeBlock({ style, children }) {
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
            {rows.map(renderRow({ style }))}
          </Pressable>
        </ScrollView>
      )}
    >
      {codeText}
    </SyntaxHighlighter>
  );
}
