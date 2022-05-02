const isHTTPLink = (url) => /^https?:/.test(url);

// NOTE: Might not work
// Responses from Algolia and Firebase don't return url
// if item is a story without link
const isHNPage = (url) => /^item/i.test(url);

export { isHTTPLink, isHNPage };
