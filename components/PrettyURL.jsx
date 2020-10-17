import React from 'react';
import { URL } from 'react-native-url-polyfill';

import Text from './Text';

export default ({
  url,
  style,
  prominent = false,
  domainOnly = false,
  ...props
}) => {
  if (!url) return null;
  const link = new URL(url);
  const { hostname, pathname, search, hash } = link;
  const domain = hostname.replace(/^www\./, '');
  return (
    <Text {...props}>
      <Text type="link" bold {...props}>
        {domain}
      </Text>
      {!domainOnly && (
        <Text
          type="link"
          style={[{ opacity: prominent ? 0.8 : 0.4 }, style]}
          {...props}
        >
          {pathname.replace(/\/$/, '')}
          {search}
          {prominent && hash}
        </Text>
      )}
    </Text>
  );
};
