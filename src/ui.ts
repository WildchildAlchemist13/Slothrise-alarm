// Shared styles used across screens.
import { StyleSheet } from 'react-native';
import { BRAND } from './sky';

export const ui = StyleSheet.create({
  root: { flex: 1, backgroundColor: BRAND.ink, overflow: 'hidden' },
  pressed: { transform: [{ scale: 0.98 }] },
  ctaLight: {
    alignSelf: 'stretch',
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLightText: { fontFamily: 'Fredoka_700Bold', fontSize: 19, color: BRAND.plum },
  ctaDark: {
    alignSelf: 'stretch',
    height: 66,
    borderRadius: 22,
    backgroundColor: '#1B0F24',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ctaDarkText: { fontFamily: 'Fredoka_700Bold', fontSize: 20, color: '#FBF7FF' },
  bubble: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: '#FFF4E2',
    borderRadius: 22,
    borderWidth: 4,
    borderColor: BRAND.plum,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  bubbleText: { fontFamily: 'Fredoka_700Bold', fontSize: 22, color: BRAND.plum },
});
