const isHTTPLink = (url) => /^https?:/.test(url);

const isHNPage = (url) => /^item/i.test(url);

export { isHTTPLink, isHNPage };
