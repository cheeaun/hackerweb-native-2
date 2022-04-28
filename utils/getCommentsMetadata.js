export default function getCommentsMetadata(item) {
  const { comments } = item;
  const repliesCount = comments.filter((c) => !c.dead && !c.deleted).length;
  let totalComments = repliesCount;
  (function dive(comments) {
    for (let i = 0, l = comments.length; i < l; i++) {
      const c = comments[i];
      const len = c.comments.filter((c) => !c.dead && !c.deleted).length;
      totalComments += len;
      if (len) dive(c.comments);
    }
  })(comments);
  return { repliesCount, totalComments };
}
