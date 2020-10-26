const minReplies = 30;
const repliesRange = minReplies - 3;
const minWeight = 1;
const maxWeight = 15;
const weightRange = minWeight - maxWeight;

export default function repliesCount2MaxWeight(replies) {
  const weight =
    ((replies - minReplies) / repliesRange) * weightRange + minWeight;
  return Math.min(maxWeight, Math.max(minWeight, weight));
}
