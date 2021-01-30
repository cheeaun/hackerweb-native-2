import * as entities from 'entities';

// Very basic HTML to text conversion
// Could be a markdown thing like convert <b> to *, but leaving this for the future.
// Now, focusing on getting short textual snippet from HTML content.

export default function (html, opts = {}) {
  let txt = entities.decode(html).trim();
  const pres = [];
  if (opts.removePre) {
    txt = txt.replace(/<pre[^<>\/]*>.*<\/pre>/gi, '').trim();
  } else {
    // No idea how to handle <pre>s yet. Too many issues.
  }
  txt = txt
    .replace(/<p>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .trim();
  if (opts.singleLine) {
    txt = txt.replace(/[\n\r].*/g, '');
  } else {
    txt = txt.replace(/\n\n[\n\r]+/, '\n\n');
  }
  return txt.trim();
}
