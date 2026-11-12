// Press and hold to confirm. The fill grows while held; letting go early drains it.
import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { Easing, type SharedValue, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import * as Haptics from 'expo-haptics';
import { ui } from './ui';

type Props = {
  label: string;
  onDone: () => void;
  holdMs?: number;
  fillColor?: string;
  /** Optional: share the 0..1 hold progress with the screen (e.g. to open Snooze's eyes). */
  progress?: SharedValue<number>;
  onHoldStart?: () => void;
  onHoldCancel?: () => void;
};

export default function HoldButton({ label, onDone, holdMs = 1100, fillColor = '#FF8A3D', progress, onHoldStart, onHoldCancel }: Props) {
  const own = useSharedValue(0);
  const hold = progress ?? own;

  const finish = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    onDone();
  }, [onDone]);

  const start = () => {
    onHoldStart?.();
    hold.value = withTiming(1, { duration: holdMs * (1 - hold.value), easing: Easing.linear }, (done) => {
      if (done) scheduleOnRN(finish);
    });
  };
  const end = () => {
    if (hold.value < 1) {
      hold.value = withTiming(0, { duration: 250 });
      onHoldCancel?.();
    }
  };

  const fillStyle = useAnimatedStyle(() => ({ width: `${hold.value * 100}%` }));
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityHint="Press and hold" onPressIn={start} onPressOut={end} style={ui.ctaDark}>
      <Animated.View style={[styles.fill, { backgroundColor: fillColor }, fillStyle]} />
      <Text style={ui.ctaDarkText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0 },
});
