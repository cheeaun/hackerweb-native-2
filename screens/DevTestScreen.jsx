import React from 'react';
import { View } from 'react-native';
import Text from '../components/Text';
import HTMLView from '../components/HTMLView';

export default function DevTestScreen() {
  return (
    <View style={{ padding: 8 }}>
      <Text bolder>HTMLView</Text>
      <HTMLView
        html={`<p>&test <a href="https://google.com/">google.com</a> test</p><p>&gt; test <a href="https://google.com/">google.com</a> test</p><p>&gt; test <a href="https://google.com/">google.com</a> test</p>`}
      />
    </View>
  );
}
