// Full-screen sky of the hour, with a sun that slowly rises.
import React, { useEffect } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import type { Sky } from './sky';

export default function SkyBackground({ sky, sunTop = 0.62, riseMs = 20000 }: { sky: Sky; sunTop?: number; riseMs?: number }) {
  const { width, height } = useWindowDimensions();
  const sunY = useSharedValue(0);
  useEffect(() => {
    sunY.value = withTiming(1, { duration: riseMs, easing: Easing.out(Easing.cubic) });
  }, [sunY, riseMs]);
  const sunStyle = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - sunY.value) * 120 }] }));
  const d = width * 1.3;
  return (
    <>
      <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={sky.top} />
            <Stop offset="1" stopColor={sky.bottom} />
          </LinearGradient>
        </Defs>
        <Rect width={width} height={height} fill="url(#sky)" />
      </Svg>
      <Animated.View style={[{ position: 'absolute', alignSelf: 'center', top: height * sunTop }, sunStyle]} pointerEvents="none">
        <Svg width={d} height={d}>
          <Circle cx={d / 2} cy={d / 2} r={d / 2} fill={sky.sun} opacity={0.55} />
          <Circle cx={d / 2} cy={d / 2} r={d / 2.6} fill={sky.sun} opacity={0.8} />
        </Svg>
      </Animated.View>
    </>
  );
}
