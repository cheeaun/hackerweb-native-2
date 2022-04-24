import { URL } from 'react-native-url-polyfill';

import Text from './Text';

// Domains that allow first sub-dir path e.g.: twitter.com/cheeaun
// Following HN's behaviour
const DOMAINS_FIRSTPATH = /^(github.com|twitter.com|medium.com)/i;

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
  let firstPathname = '';
  let restPathname = decodeURIComponent(pathname);
  if (DOMAINS_FIRSTPATH.test(domain)) {
    const matches = pathname.match(/(\/[^\/]+)(.*)/);
    if (matches) {
      firstPathname = matches[1];
      restPathname = matches[2];
    }
  }
  return (
    <Text {...props}>
      <Text type="link" bold {...props}>
        {domain}
        {firstPathname}
      </Text>
      {!domainOnly && (
        <Text
          type="link"
          style={[{ opacity: prominent ? 0.9 : 0.75 }, style]}
          {...props}
        >
          {restPathname.replace(/\/$/, '')}
          {search}
          {prominent && hash}
        </Text>
      )}
    </Text>
  );
};
