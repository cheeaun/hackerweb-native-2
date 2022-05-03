import useStore from '../hooks/useStore';

function stripComments(item) {
  const { comments, ...restItem } = item;
  return restItem;
}

function extractThread(storyID, commentID) {
  const items = [];
  const story = useStore.getState().stories?.find((s) => s.id === storyID);
  if (story) {
    // Drill deep into story's comments and find the comment with the specificed commentID
    (function deepFind(item) {
      if (item.id === commentID) {
        items.push(stripComments(item));
        return true;
      }
      if (item.comments) {
        for (const comment of item.comments) {
          const foundComment = deepFind(comment);
          if (foundComment) {
            items.unshift(stripComments(item));
            return true;
          }
        }
      }
    })(story);
  }
  return items;
}

export default extractThread;
