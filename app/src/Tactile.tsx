// Tactile building blocks: buttons that press down onto a hard plum shadow, outlined cards, chips, a toggle.
import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { C, DROP, F, OUTLINE, R } from './theme';

type Variant = 'primary' | 'secondary' | 'leaf' | 'moon';
const FACE: Record<Variant, string> = { primary: C.sunrise, secondary: C.white, leaf: C.leaf, moon: C.moon };

/** A button with a straight-down shadow. Pressing drops the face onto the shadow in 80 ms. */
export function TactileButton({
  label,
  onPress,
  variant = 'primary',
  height = 58,
  shadowColor = C.ink,
  style,
  icon,
}: {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  height?: number;
  shadowColor?: string;
  style?: StyleProp<ViewStyle>;
  icon?: React.ReactNode;
}) {
  const down = useSharedValue(0);
  const faceStyle = useAnimatedStyle(() => ({ transform: [{ translateY: down.value * DROP }] }));
  const ink = variant === 'moon' ? C.night : C.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPressIn={() => {
        down.value = withTiming(1, { duration: 80 });
        Haptics.selectionAsync().catch(() => {});
      }}
      onPressOut={() => (down.value = withTiming(0, { duration: 120 }))}
      onPress={onPress}
      style={[{ height: height + DROP }, style]}
    >
      <View style={[styles.shadow, { height, top: DROP, backgroundColor: shadowColor, borderRadius: R.m }]} />
      <Animated.View style={[styles.face, { height, backgroundColor: FACE[variant], borderColor: variant === 'moon' ? C.moon : C.ink, borderRadius: R.m }, faceStyle]}>
        {icon}
        <Text style={[styles.label, { color: ink }]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

/** Round icon button (e.g. "+"), same press-down behaviour. */
export function TactileIconButton({ onPress, label, children, size = 48, color = C.sun }: { onPress?: () => void; label: string; children: React.ReactNode; size?: number; color?: string }) {
  const down = useSharedValue(0);
  const faceStyle = useAnimatedStyle(() => ({ transform: [{ translateY: down.value * DROP }] }));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPressIn={() => (down.value = withTiming(1, { duration: 80 }))}
      onPressOut={() => (down.value = withTiming(0, { duration: 120 }))}
      onPress={onPress}
      style={{ width: size, height: size + DROP }}
    >
      <View style={[styles.shadow, { width: size, height: size, top: DROP, borderRadius: size / 2, backgroundColor: C.ink }]} />
      <Animated.View style={[styles.round, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }, faceStyle]}>{children}</Animated.View>
    </Pressable>
  );
}

/** Text-only action. Underlined so it still reads as tappable. */
export function TextButton({ label, sub, onPress, color = C.ink }: { label: string; sub?: string; onPress?: () => void; color?: string }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8} style={styles.textBtn}>
      <Text style={[styles.textBtnLabel, { color }]}>{label}</Text>
      {sub ? <Text style={[styles.textBtnSub, { color }]}>{sub}</Text> : null}
    </Pressable>
  );
}

/** Raised card: outline + hard shadow. For things you act on. */
export function Card({ children, style, faceStyle, pad = 16 }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; faceStyle?: StyleProp<ViewStyle>; pad?: number }) {
  return (
    <View style={[{ marginBottom: DROP }, style]}>
      <View style={styles.cardShadow} />
      <View style={[styles.card, { padding: pad }, faceStyle]}>{children}</View>
    </View>
  );
}

/** Flat card: oat fill, no outline. For things you read. */
export function FlatCard({ children, style, pad = 14, night }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; pad?: number; night?: boolean }) {
  return <View style={[{ backgroundColor: night ? C.nightCard : C.oat, borderRadius: R.l - 4, padding: pad }, style]}>{children}</View>;
}

export function Chip({ label, dark }: { label: string; dark?: boolean }) {
  return (
    <View style={[styles.chip, { backgroundColor: dark ? C.ink : C.oat }]}>
      <Text style={[styles.chipText, { color: dark ? C.paper : C.ink }]}>{label}</Text>
    </View>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange?: (v: boolean) => void; label: string }) {
  const x = useSharedValue(on ? 1 : 0);
  React.useEffect(() => {
    x.value = withTiming(on ? 1 : 0, { duration: 160 });
  }, [on, x]);
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: x.value * 24 }] }));
  return (
    <Pressable accessibilityRole="switch" accessibilityState={{ checked: on }} accessibilityLabel={label} onPress={() => onChange?.(!on)} hitSlop={6}>
      <View style={[styles.track, { backgroundColor: on ? C.leaf : C.oat }]}>
        <Animated.View style={[styles.knob, knob]} />
      </View>
    </Pressable>
  );
}

export function Label({ children, color = C.ink60 }: { children: React.ReactNode; color?: string }) {
  return <Text style={[styles.sectionLabel, { color }]}>{children}</Text>;
}

const styles = StyleSheet.create({
  shadow: { position: 'absolute', left: 0, right: 0 },
  face: { borderWidth: OUTLINE, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  round: { position: 'absolute', left: 0, top: 0, borderWidth: OUTLINE, borderColor: C.ink, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: F.displaySemi, fontSize: 19 },
  textBtn: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  textBtnLabel: { fontFamily: F.displaySemi, fontSize: 17, textDecorationLine: 'underline' },
  textBtnSub: { fontFamily: F.bodyBold, fontSize: 12.5, marginTop: 1 },
  // hard shadow drawn as a plum block behind the card: crisp on iOS and Android alike
  cardShadow: { position: 'absolute', left: 0, right: 0, top: DROP, bottom: -DROP, backgroundColor: C.ink, borderRadius: R.l },
  card: { backgroundColor: C.white, borderWidth: OUTLINE, borderColor: C.ink, borderRadius: R.l, overflow: 'hidden' },
  chip: { borderRadius: R.pill, paddingHorizontal: 11, paddingVertical: 5 },
  chipText: { fontFamily: F.label, fontSize: 12.5 },
  track: { width: 60, height: 36, borderRadius: R.pill, borderWidth: OUTLINE, borderColor: C.ink, justifyContent: 'center', paddingHorizontal: 3 },
  knob: { width: 25, height: 25, borderRadius: 13, backgroundColor: C.white, borderWidth: OUTLINE, borderColor: C.ink },
  sectionLabel: { fontFamily: F.label, fontSize: 12, letterSpacing: 1.4 },
});
