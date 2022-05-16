import { DynamicColorIOS, PlatformColor, StyleSheet } from 'react-native';

const nodeStyles = StyleSheet.create({
  default: {
    fontSize: 15,
  },
  p: {
    marginBottom: 12,
  },
  li: {
    marginBottom: 12,
    // Can't reduce this margin because there's no <ul> or <ol> here
    flexDirection: 'row',
  },
  blockquote: {
    marginBottom: 12,
    backgroundColor: DynamicColorIOS({
      dark: 'rgba(255,255,255,.05)',
      light: 'rgba(0,0,0,.05)',
    }),
    padding: 8,
    opacity: 0.9,
  },
  blockquoteWithQuotes: {
    flexDirection: 'row',
  },
  pre: {
    backgroundColor: DynamicColorIOS({
      dark: 'rgba(255,255,255,.05)',
      light: 'rgba(0,0,0,.05)',
    }),
    borderRadius: 4,
    marginBottom: 12,
  },
  preInner: {
    padding: 10,
  },
  code: {
    fontFamily: 'Menlo',
  },
  inlineCode: {
    backgroundColor: DynamicColorIOS({
      dark: 'rgba(255,255,255,.05)',
      light: 'rgba(0,0,0,.05)',
    }),
  },
  a: {
    color: PlatformColor('link'),
    textDecorationLine: 'underline',
    textDecorationColor: '#1e90ff66',
  },
  aVisited: {
    color: PlatformColor('systemIndigo'),
    textDecorationColor: '#5856d566',
  },
  i: {
    fontStyle: 'italic',
  },
});

export default nodeStyles;
