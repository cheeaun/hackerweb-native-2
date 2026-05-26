import { PlatformColor, useColorScheme } from 'react-native';

export default () => {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const colors = {
    link: PlatformColor('link'),
    primary: PlatformColor('systemBlue'),
    primaryInvert: PlatformColor('lightText'),
    red: PlatformColor('systemRed'),
    background: PlatformColor(
      isDark ? 'secondarySystemBackground' : 'systemBackground',
    ),
    background2: PlatformColor(
      isDark ? 'systemBackground' : 'secondarySystemBackground',
    ),
    modalBackground: PlatformColor('systemBackground'), // weird thing on iOS
    opaqueHeader: 'rgba(0,0,0,0.002)',
    opaqueBackground: isDark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.05)',
    opaqueBackground2: isDark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.1)',
    opaqueBackground3: isDark ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.25)',
    secondaryBackground: PlatformColor(
      isDark ? 'tertiarySystemBackground' : 'secondarySystemBackground',
    ),
    opaqueSecondaryBackground: isDark ? 'rgba(0,0,0,.2)' : 'rgba(0,0,0,.05)',
    fill: PlatformColor(isDark ? 'secondarySystemFill' : 'systemFill'),
    text: PlatformColor('label'),
    secondaryText: PlatformColor('secondaryLabel'),
    separator: PlatformColor('separator'),
    opaqueSeparator: PlatformColor('opaqueSeparator'),
    overlay: 'rgba(0, 0, 0, 0.35)',
    white: '#fff',
  };

  return { scheme, isDark, colors };
};
