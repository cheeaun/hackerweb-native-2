import { ScrollView } from 'react-native';

import HTMLView from '../components/HTMLView';
import HTMLView2 from '../components/HTMLView2';
import Text from '../components/Text';

export default function DevTestScreen() {
  return (
    <ScrollView style={{ padding: 8 }}>
      <Text bolder>HTMLView2</Text>
      <HTMLView2
        html={`<p>This is *italic* _italic_ **bold** __bold__ \`code\` \`\`notCode\`\` \`code again\` trap \`trap.<p>\`start code\` yeah`}
      />
      <HTMLView2
        html={`<pre><code>
        import React from 'react';
        import { View, ScrollView, Text, Platform, ColorValue, TextStyle } from 'react-native';
        import Highlighter, { SyntaxHighlighterProps as HighlighterProps } from 'react-syntax-highlighter';
        import * as HLJSSyntaxStyles from 'react-syntax-highlighter/dist/esm/styles/hljs';
        
        type Node = {
            children?: Node[];
            properties?: {
                className: string[];
            };
            tagName?: string;
            type: string;
            value?: string;
        };</code></pre>`}
      />
      <HTMLView2
        html={`<p>&test <a href="https://google.com/">google.com</a> test</p><p>&gt; test <a href="https://google.com/">google.com</a> test</p><p>&gt; test <a href="https://google.com/">google.com</a> test</p>`}
      />
      <HTMLView2
        html={`<p><i>&gt; <a href="https://google.com/">google.com</a> test<p>&gt; test <a href="https://google.com/">google.com</a> test<p>test <a href="https://google.com/">google.com</a> test</p>`}
      />
      <HTMLView2
        html={`<p>- test<p>- Lorem <i>ipsum dolor sit amet, consectetur adipiscing elit. Etiam luctus mauris turpis, nec venenatis felis tincidunt non. Aenean sit amet lectus sit amet orci convallis tincidunt ac at nulla.<p>- test<p>[1] SuspendisseSuspendisseSuspendisseSuspendisseSuspendisseSuspendisseSuspendisse pharetra et ex et finibus. Donec elementum, diam eget ullamcorper rutrum, ipsum lorem laoreet enim, sed rhoncus odio enim id eros.<p>&gt; Lorem <i>ipsum dolor sit amet, consectetur adipiscing elit. Etiam luctus mauris turpis, nec venenatis felis tincidunt non. Aenean sit amet lectus sit amet orci convallis tincidunt ac at nulla.`}
      />
      <HTMLView2
        html={`<p>test<pre><code>test</code></pre>this text is not paragraph<p>another paragraph here`}
      />
      <HTMLView2
        html={`
            <p><a href="https://news.ycombinator.com/item?id=31075622">Test story link</a>
            <p><a href="https://news.ycombinator.com/item?id=31104289">Test comment link</a>
            <p><a href="https://news.ycombinator.com/item?id=31039184">Test job link</a>
            <p><a href="https://news.ycombinator.com/item?id=29755614">Test poll link</a>
          `}
      />
      <Text bolder>HTMLView</Text>
      <HTMLView
        html={`<p>&test <a href="https://google.com/">google.com</a> test</p><p>&gt; test <a href="https://google.com/">google.com</a> test</p><p>&gt; test <a href="https://google.com/">google.com</a> test</p>`}
      />
      <HTMLView
        html={`<p><i>&gt; <a href="https://google.com/">google.com</a> test<p>&gt; test <a href="https://google.com/">google.com</a> test<p>test <a href="https://google.com/">google.com</a> test</p>`}
      />
    </ScrollView>
  );
}
