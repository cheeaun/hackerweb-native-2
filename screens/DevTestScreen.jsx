import React from 'react';
import { View } from 'react-native';
import Text from '../components/Text';
import HTMLView from '../components/HTMLView';
import HTMLView2 from '../components/HTMLView2';

export default function DevTestScreen() {
  return (
    <View style={{ padding: 8 }}>
      <Text bolder>HTMLView</Text>
      <HTMLView
        html={`<p>&test <a href="https://google.com/">google.com</a> test</p><p>&gt; test <a href="https://google.com/">google.com</a> test</p><p>&gt; test <a href="https://google.com/">google.com</a> test</p>`}
      />
      <HTMLView
        html={`<p><i>&gt; <a href="https://google.com/">google.com</a> test<p>&gt; test <a href="https://google.com/">google.com</a> test<p>test <a href="https://google.com/">google.com</a> test</p>`}
      />
      <Text bolder>HTMLView2</Text>
      <HTMLView2
        html={`<p>&test <a href="https://google.com/">google.com</a> test</p><p>&gt; test <a href="https://google.com/">google.com</a> test</p><p>&gt; test <a href="https://google.com/">google.com</a> test</p>`}
      />
      <HTMLView2
        html={`<p><i>&gt; <a href="https://google.com/">google.com</a> test<p>&gt; test <a href="https://google.com/">google.com</a> test<p>test <a href="https://google.com/">google.com</a> test</p>`}
      />
    </View>
  );
}
