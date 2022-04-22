import React from 'react';
import { ScrollView } from 'react-native';
import Text from '../components/Text';
import HTMLView from '../components/HTMLView';
import HTMLView2 from '../components/HTMLView2';

export default function DevTestScreen() {
  return (
    <ScrollView style={{ padding: 8 }}>
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
      <HTMLView2
        html={`<p>- test<p>- Lorem <i>ipsum dolor sit amet, consectetur adipiscing elit. Etiam luctus mauris turpis, nec venenatis felis tincidunt non. Aenean sit amet lectus sit amet orci convallis tincidunt ac at nulla.<p>- test<p>[1] SuspendisseSuspendisseSuspendisseSuspendisseSuspendisseSuspendisseSuspendisse pharetra et ex et finibus. Donec elementum, diam eget ullamcorper rutrum, ipsum lorem laoreet enim, sed rhoncus odio enim id eros.<p>&gt; Lorem <i>ipsum dolor sit amet, consectetur adipiscing elit. Etiam luctus mauris turpis, nec venenatis felis tincidunt non. Aenean sit amet lectus sit amet orci convallis tincidunt ac at nulla.`}
      />
    </ScrollView>
  );
}
