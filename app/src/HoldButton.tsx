// The wake action: press and hold. The face fills with Sun while held; letting go early drains it.
// 76 pt tall with a hard shadow, the only button on a ringing screen.
import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, type SharedValue, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import * as Haptics from 'expo-haptics';
import { C, F } from './theme';

const H = 76;
const DROP = 5;

type Props = {
  label: string;
  onDone: () => void;
  holdMs?: number;
  /** Optional: share the 0..1 hold progress with the screen (e.g. to open Snooze's eyes). */
  progress?: SharedValue<number>;
  onHoldStart?: () => void;
  onHoldCancel?: () => void;
  icon?: React.ReactNode;
};

export default function HoldButton({ label, onDone, holdMs = 1100, progress, onHoldStart, onHoldCancel, icon }: Props) {
  const own = useSharedValue(0);
  const hold = progress ?? own;
  const down = useSharedValue(0);

  const finish = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    onDone();
  }, [onDone]);

  const start = () => {
    onHoldStart?.();
    down.value = withTiming(1, { duration: 80 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    hold.value = withTiming(1, { duration: holdMs * (1 - hold.value), easing: Easing.linear }, (done) => {
      if (done) scheduleOnRN(finish);
    });
  };
  const end = () => {
    down.value = withTiming(0, { duration: 120 });
    if (hold.value < 1) {
      hold.value = withTiming(0, { duration: 250 });
      onHoldCancel?.();
    }
  };

  const fillStyle = useAnimatedStyle(() => ({ width: `${hold.value * 100}%` }));
  const faceStyle = useAnimatedStyle(() => ({ transform: [{ translateY: down.value * DROP }] }));
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityHint="Press and hold" onPressIn={start} onPressOut={end} style={{ height: H + DROP }}>
      <View style={styles.shadow} />
      <Animated.View style={[styles.face, faceStyle]}>
        <Animated.View style={[styles.fill, fillStyle]} />
        <View style={styles.row}>
          {icon}
          <Text style={styles.label}>{label}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shadow: { position: 'absolute', left: 0, right: 0, top: DROP, height: H, borderRadius: 26, backgroundColor: C.ink },
  face: { height: H, borderRadius: 26, borderWidth: 3, borderColor: C.ink, backgroundColor: C.white, overflow: 'hidden', justifyContent: 'center' },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: C.sun },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  label: { fontFamily: F.display, fontSize: 23, color: C.ink },
});
