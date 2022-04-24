import { Text } from 'react-native';

import useTheme from '../hooks/useTheme';

const COLORS = {
  default: 'text',
  insignificant: 'secondaryText',
  link: 'link',
};

// https://developer.apple.com/design/human-interface-guidelines/ios/visual-design/typography/
const SIZES = {
  largeTitle: 34,
  title1: 28,
  title2: 22,
  title3: 20,
  body: 17,
  callout: 16,
  subhead: 15,
  footnote: 13,
  caption1: 12,
  caption2: 11,
};

export default function (props) {
  const { colors } = useTheme();
  const {
    type = 'default',
    size = 'body',
    bold,
    bolder,
    style,
    center,
    ...otherProps
  } = props;
  const extraStyle = {
    color: colors[COLORS[type || 'default']],
    fontSize: SIZES[size],
  };
  if (bold) extraStyle.fontWeight = '500';
  if (bolder) extraStyle.fontWeight = '600';
  if (center) extraStyle.textAlign = 'center';
  return <Text {...otherProps} style={[extraStyle, style]} />;
}
