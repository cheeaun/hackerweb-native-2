const get = (target, prop) => {
  const {
    user,
    time,
    content,
    comments,
    points,
    comments_count,
    poll,

    /* Algolia */
    author, // user
    created_at_i, // time
    text, // content
    children, // comments
    options, // poll

    /* Official (Firebase) */
    by, // user
    score, // points
    kids, // comments (but only IDs)
    descendants, // comments_count
  } = target;

  const isAlgoliaItem = !!author || !!created_at_i || !!text || !!children;
  const isOfficialItem = !!by || !!score || !!kids || !!descendants;
  const isItem = isAlgoliaItem || isOfficialItem;

  switch (prop) {
    case 'user':
      return user || author || by;
    case 'points':
      return points || score;
    case 'time':
      return time || created_at_i;
    case 'content':
      return content || text || '';
    case 'comments':
      // undefined for kids because they are just list of IDs, not actual list of comments
      return kids
        ? undefined
        : (comments || children?.filter((c) => c.text) || []).map(proxyItem);
    case 'comments_count':
      return comments_count || descendants || undefined;
    case 'poll':
      return (
        poll ||
        options?.map((o) => ({
          item: o.text.replace(/<[^>]+>/g, ''),
          points: o.points,
        })) ||
        undefined
      );
    case '__isItem':
      return isItem;
    default:
      return target[prop];
  }
};

function proxyItem(item) {
  if (!item) return;
  if (item.__isItem) return item;
  return new Proxy(item, { get });
}

export default proxyItem;
