import { useCallback, useState } from 'react';
import { PlatformColor, StyleSheet, View } from 'react-native';

import { useNavigation, useRoute } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';

import useTheme from '../hooks/useTheme';

import getCommentsMetadata from '../utils/getCommentsMetadata';
import getHTMLText from '../utils/getHTMLText';

import CommentIcon from '../assets/bubble.left.svg';

import Button from './Button';
import Comment from './Comment';
import ReadableWidthContainer from './ReadableWidthContainer';
import Separator from './Separator';
import Text from './Text';

const styles = StyleSheet.create({
  comment: {
    padding: 15,
  },
  innerComment: {
    flexDirection: 'row',
  },
});

function RepliesCommentsButton({
  replies,
  comments,
  level = 1,
  style,
  suffix,
  previews = [],
  onPress = () => {},
  ...props
}) {
  const { colors } = useTheme();
  const countDiffer = replies !== comments;
  const [pressed, setPressed] = useState(false);
  useFocusEffect(
    useCallback(() => {
      let timer = setTimeout(() => {
        setPressed(false);
      }, 300);
      return () => clearTimeout(timer);
    }, []),
  );
  return (
    <View style={styles.innerComment}>
      <CommentBar last />
      <Button
        style={[
          {
            backgroundColor: colors.opaqueBackground,
            flexGrow: 1,
            marginRight: 15,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.opaqueBackground3,
          },
          pressed && { backgroundColor: colors.opaqueBackground2 },
          style,
        ]}
        pressedStyle={{
          backgroundColor: colors.opaqueBackground2,
        }}
        onPress={() => {
          setPressed(true);
          onPress();
        }}
        {...props}
      >
        {!!previews?.length && (
          <>
            {previews.map((comment) => {
              const commentText = getHTMLText(comment.content);
              const firstNonBlockQuoteLine = commentText
                .split(/\n+/)
                .find(
                  (line) => line.trim() !== '' && !line.trim().startsWith('>'),
                );

              return (
                <View
                  key={comment.id}
                  style={{
                    marginBottom: 8,
                    opacity: 0.7,
                  }}
                >
                  <Text numberOfLines={1}>
                    <Text size="subhead" bold>
                      {comment.user}
                    </Text>
                    {'  '}
                    <Text size="subhead">
                      {firstNonBlockQuoteLine || commentText}
                    </Text>
                  </Text>
                </View>
              );
            })}
            <Separator
              style={{ marginRight: -12, marginBottom: 12, marginTop: 8 }}
            />
          </>
        )}
        <Text numberOfLines={1}>
          <View style={{ marginRight: 6, marginBottom: -2 }}>
            <CommentIcon width={15} height={15} color={colors.primary} />
          </View>
          <Text size="subhead" type="link" bold>
            {replies.toLocaleString('en-US')}{' '}
            {replies !== 1 ? 'replies' : 'reply'}
          </Text>
          {countDiffer ? (
            <Text size="footnote" type="insignificant">
              {' '}
              &bull; {comments.toLocaleString('en-US')}{' '}
              {comments !== 1 ? 'comments' : 'comment'}
            </Text>
          ) : (
            suffix && (
              <Text size="footnote" type="insignificant">
                {' '}
                {suffix}
              </Text>
            )
          )}
        </Text>
      </Button>
    </View>
  );
}

function CommentBar({ last = false }) {
  const color = PlatformColor('systemGray2');
  return (
    <View
      style={{
        width: 18,
        position: 'relative',
      }}
      pointerEvents="none"
    >
      <Svg
        width="13"
        height="16"
        viewBox="0 0 13 16"
        strokeLinecap="round"
        color={color}
        style={{ marginTop: -2 }}
      >
        <Path
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          d="M1 1V4C1 8 5 12 9 12H12L9 9M12 12L9 15"
        />
      </Svg>
      {!last && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: 2,
            backgroundColor: color,
            borderTopLeftRadius: 3,
            borderTopRightRadius: 3,
          }}
        />
      )}
    </View>
  );
}

function InnerCommentContainer({
  item,
  accWeight,
  maxWeight,
  level = 1,
  last = false,
  storyID,
}) {
  if (item.dead || (item.deleted && !item.comments.length)) return null;

  const navigation = useNavigation();
  const { zIndex = 0 } = useRoute().params;
  const { repliesCount, totalComments } = getCommentsMetadata(item);
  const totalWeight =
    calcCommentWeight(item) + calcCommentsWeight(item.comments) + accWeight;
  const nextLevel = level + 1;
  const comments = item.comments.filter((c) => !c.dead && !c.deleted);

  const hasOneCommentAndIsShort =
    comments.length === 1 &&
    !comments[0].comments?.length &&
    comments[0].content.length <= 140;

  return (
    <View style={styles.innerComment} key={item.id}>
      <CommentBar last={last} />
      <View style={{ flex: 1, marginTop: 2 }}>
        <Comment item={item} storyID={storyID} />
        {!!repliesCount &&
          ((totalWeight < maxWeight && level < 3) || hasOneCommentAndIsShort ? (
            comments.map((comment, i) => (
              <InnerCommentContainer
                key={comment.id}
                last={i === repliesCount - 1}
                item={comment}
                accWeight={totalWeight}
                maxWeight={maxWeight}
                level={nextLevel}
                storyID={storyID}
              />
            ))
          ) : (
            <RepliesCommentsButton
              level={nextLevel}
              style={{ marginBottom: 15 }}
              replies={repliesCount}
              comments={totalComments}
              suffix={suffixText(comments, repliesCount)}
              onPress={() => {
                if (zIndex > 0) {
                  navigation.setParams({
                    showZIndex: true,
                  });
                }
                navigation.push('Comments', {
                  item,
                  zIndex: zIndex + 1,
                  storyID,
                });
              }}
            />
          ))}
      </View>
    </View>
  );
}

function calcCommentWeight(comment) {
  // TODO: smarter "weight" math
  if (!comment.content) return 0;
  return getHTMLText(comment.content).length / 140;
}

function calcCommentsWeight(comments = []) {
  if (comments.length === 1 && calcCommentWeight(comments[0]) < 3) {
    return 0; // Special case
  }
  return comments.reduce((acc, comment) => acc + calcCommentWeight(comment), 0);
}

function suffixText(comments, repliesCount) {
  const [firstComment, secondComment] = comments;
  return firstComment?.user
    ? `by ${firstComment.user}${
        repliesCount === 2
          ? ` & ${secondComment.user}`
          : repliesCount > 1
          ? ' & others'
          : ''
      }`
    : '';
}

export default function CommentContainer({ item, maxWeight = 5, storyID }) {
  const { zIndex = 0 } = useRoute().params;
  const navigation = useNavigation();

  if (item.dead || (item.deleted && !item.comments.length)) return null;

  const { repliesCount, totalComments } = getCommentsMetadata(item);
  const totalWeight =
    calcCommentWeight(item) + calcCommentsWeight(item.comments);
  const hasPreviews =
    !!item.content && getHTMLText(item.content).length <= 140 * 4;

  const comments = item.comments.filter((c) => !c.dead && !c.deleted);
  const hasOneCommentAndIsShort =
    comments.length === 1 &&
    !comments[0].comments?.length &&
    comments[0].content.length <= 140;

  return (
    <ReadableWidthContainer>
      <View key={item.id} style={styles.comment}>
        <Comment item={item} storyID={storyID} />
        {!!repliesCount &&
          (totalWeight < maxWeight || hasOneCommentAndIsShort ? (
            comments.map((comment, i) => (
              <InnerCommentContainer
                key={comment.id}
                last={i === repliesCount - 1}
                item={comment}
                accWeight={totalWeight}
                maxWeight={maxWeight}
                storyID={storyID}
              />
            ))
          ) : (
            <RepliesCommentsButton
              replies={repliesCount}
              comments={totalComments}
              suffix={suffixText(comments, repliesCount)}
              previews={hasPreviews ? item.comments.slice(0, 2) : []}
              onPress={() => {
                if (zIndex > 0) {
                  navigation.setParams({
                    showZIndex: true,
                  });
                }
                navigation.push('Comments', {
                  item,
                  zIndex: zIndex + 1,
                  storyID,
                });
              }}
            />
          ))}
      </View>
    </ReadableWidthContainer>
  );
}
