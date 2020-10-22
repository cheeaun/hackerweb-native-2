import React from 'react';
import { StyleSheet, View, PlatformColor } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import Text from './Text';
import Button from './Button';
import Comment from './Comment';

import useTheme from '../hooks/useTheme';

import getCommentsMetadata from '../utils/getCommentsMetadata';

const styles = StyleSheet.create({
  comment: {
    padding: 15,
  },
  innerComment: {
    paddingVertical: 8,
    flexDirection: 'row',
  },
  commentBar: {
    width: 3,
    marginRight: 15,
    borderRadius: 4,
  },
});

function RepliesCommentsButton({ replies, comments, ...props }) {
  const { colors } = useTheme();
  const countDiffer = replies !== comments;
  return (
    <Button
      style={{
        backgroundColor: colors.opaqueBackground,
      }}
      pressedStyle={{
        backgroundColor: colors.opaqueBackground2,
      }}
      {...props}
    >
      <Text style={{ textAlign: 'center' }}>
        <Text size="subhead" type="link" bold>
          {replies.toLocaleString()} {replies !== 1 ? 'replies' : 'reply'}
        </Text>
        {countDiffer && (
          <Text size="footnote" type="insignificant">
            {' '}
            &middot; {comments.toLocaleString()}{' '}
            {comments !== 1 ? 'comments' : 'comment'}
          </Text>
        )}
      </Text>
    </Button>
  );
}

function InnerCommentContainer({ item, accWeight, maxWeight, level = 1 }) {
  if (item.deleted && !item.comments.length) return null;

  const navigation = useNavigation();
  const { repliesCount, totalComments } = getCommentsMetadata(item);
  const totalWeight =
    calcCommentsWeight(item.comment) +
    calcCommentsWeight(item.comments) +
    accWeight;
  const nextLevel = level + 1;
  return (
    <View style={styles.innerComment} key={item.id}>
      <View
        style={[
          styles.commentBar,
          {
            backgroundColor: PlatformColor(
              `systemGray${level === 1 ? '' : level}`,
            ),
          },
        ]}
      />
      <View style={{ flex: 1 }}>
        <Comment {...item} />
        {!!item.comments.length &&
          (totalWeight < maxWeight && level < 3 ? (
            item.comments.map((comment) => (
              <InnerCommentContainer
                key={comment.id}
                item={comment}
                accWeight={totalWeight}
                maxWeight={maxWeight}
                level={nextLevel}
              />
            ))
          ) : (
            <RepliesCommentsButton
              replies={repliesCount}
              comments={totalComments}
              onPress={() => {
                navigation.push('Comments', item);
              }}
            />
          ))}
      </View>
    </View>
  );
}

function calcCommentWeight(comment) {
  // TODO: smarter "weight" math
  return comment.content.length / 140;
}

function calcCommentsWeight(comments = []) {
  if (comments.length === 1 && calcCommentWeight(comments[0]) < 3) return 0; // Special case
  return comments.reduce((acc, comment) => acc + calcCommentWeight(comment), 0);
}

export default function CommentContainer({ item, maxWeight = 5 }) {
  const navigation = useNavigation();

  if (item.deleted && !item.comments.length) return null;

  const { repliesCount, totalComments } = getCommentsMetadata(item);
  const totalWeight =
    calcCommentsWeight(item.comment) + calcCommentsWeight(item.comments);

  return (
    <View key={item.id} style={styles.comment}>
      <Comment {...item} />
      {totalWeight < maxWeight ? (
        item.comments.map((comment) => (
          <InnerCommentContainer
            key={comment.id}
            item={comment}
            accWeight={totalWeight}
            maxWeight={maxWeight}
          />
        ))
      ) : (
        <RepliesCommentsButton
          replies={repliesCount}
          comments={totalComments}
          onPress={() => {
            navigation.push('Comments', item);
          }}
        />
      )}
    </View>
  );
}
