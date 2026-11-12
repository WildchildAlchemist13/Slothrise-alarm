// Snooze hanging from the branch, using the hand-drawn art (assets/snooze-hang.png).
//
// The art is one flat image, so instead of rotating it (which would lift the hands off the branch),
// the body leans under the hands with a horizontal skew whose fixed line is the branch. The hands stay
// gripping while the body and legs swing below. The strip of branch inside the image only slides
// sideways, so it blends into the branch drawn here in the same colours.
//
// Expressions are drawn over the art's own eyes and mouth: the art itself is the sleepy face.
import React, { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Ellipse, Path } from 'react-native-svg';
import { GestureDetector, type ComposedGesture } from 'react-native-gesture-handler';
import type { Swing } from './useSwing';

const SLOTH_IMG = require('../assets/snooze-hang.png');
const LEAVES_IMG = require('../assets/branch-leaves.png');

// Measurements of the art, in its own pixels.
const ART = { w: 395, h: 520, feetY: 507 };
const BRANCH = { centerY: 60, thickness: 36, outline: 9, brown: '#94502A', plum: '#37062A' };
const LEAVES = { w: 200, h: 180, branchCenterY: 110, joinX: 170 };
const FACE = {
  eyes: [{ x: 138, y: 172 }, { x: 257, y: 172 }],
  mouth: { x: 197, y: 202 },
  patch: '#8F6160',
  cream: '#FFDFC1',
  plum: '#35062A',
};
const SKEW_PER_RAD = 0.45; // how far the body leans per radian of swing

export type ArtEyes = 'art' | 'closed' | 'open';
export type ArtMouth = 'art' | 'open';

export function artGeometry(displayW: number) {
  const s = displayW / ART.w;
  return { s, displayH: ART.h * s, feetBelowBranch: (ART.feetY - BRANCH.centerY) * s };
}

type Props = {
  width: number;
  displayW: number;
  branchY: number;
  swing: Swing;
  eyes: ArtEyes;
  mouth: ArtMouth;
  zzz: SharedValue<number>;
  gesture: ComposedGesture;
};

function FaceOverlay({ eyes, mouth }: { eyes: ArtEyes; mouth: ArtMouth }) {
  if (eyes === 'art' && mouth === 'art') return null;
  return (
    <Svg style={StyleSheet.absoluteFill} viewBox={`0 0 ${ART.w} ${ART.h}`} pointerEvents="none">
      {eyes !== 'art' &&
        FACE.eyes.map((e, i) => (
          <React.Fragment key={i}>
            <Ellipse cx={e.x} cy={e.y} rx={30} ry={23} fill={FACE.patch} />
            {eyes === 'closed' && (
              <Path d={`M${e.x - 17} ${e.y - 3}q17 15 34 0`} fill="none" stroke={FACE.plum} strokeWidth={6} strokeLinecap="round" />
            )}
            {eyes === 'open' && (
              <>
                <Ellipse cx={e.x} cy={e.y} rx={15} ry={14} fill={FACE.cream} />
                <Ellipse cx={e.x + 1} cy={e.y + 1} rx={10} ry={10} fill={FACE.plum} />
                <Ellipse cx={e.x + 4} cy={e.y - 3} rx={3.2} ry={3.2} fill="#FFFFFF" />
              </>
            )}
          </React.Fragment>
        ))}
      {mouth === 'open' && (
        <>
          <Ellipse cx={FACE.mouth.x} cy={FACE.mouth.y} rx={28} ry={11} fill={FACE.cream} />
          <Path
            d={`M${FACE.mouth.x - 13} ${FACE.mouth.y - 6}q13 22 26 0z`}
            fill={FACE.plum}
            stroke={FACE.plum}
            strokeWidth={3}
            strokeLinejoin="round"
          />
        </>
      )}
    </Svg>
  );
}

export default function ArtHangingSnooze({ width, displayW, branchY, swing, eyes, mouth, zzz, gesture }: Props) {
  const { s, displayH } = artGeometry(displayW);
  const pivotX = (ART.w / 2) * s;
  const pivotY = BRANCH.centerY * s;
  const frame = 2 * Math.max(displayH - pivotY, displayW) + 20;
  const branchH = BRANCH.thickness * s;
  const leavesLeft = 6;

  // Lean under the hands. Positive swing angle means the body goes left.
  const leanStyle = useAnimatedStyle(() => {
    const breathe = 0.012 * Math.sin(swing.time.value * 1.3);
    return { transform: [{ skewX: `${-(swing.theta.value + breathe) * SKEW_PER_RAD}rad` }] };
  });
  const leafStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${swing.omega.value * 0.04}rad` }] }));

  // Floating Z's.
  const zFloat = useSharedValue(0);
  useEffect(() => {
    zFloat.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.quad) }), -1, false);
  }, [zFloat]);
  // Called exactly three times, in the same order every render, so the hook order is stable.
  const zStyle = (i: number) =>
    useAnimatedStyle(() => {
      const p = (zFloat.value + i / 3) % 1;
      return {
        opacity: zzz.value * Math.sin(p * Math.PI),
        transform: [{ translateY: -p * 40 }, { translateX: p * 14 }, { rotate: `${-12 + p * 18}deg` }],
      };
    });
  const z0 = zStyle(0);
  const z1 = zStyle(1);
  const z2 = zStyle(2);

  return (
    <>
      {/* branch, drawn in the art's colours */}
      <View
        pointerEvents="none"
        style={[
          styles.branch,
          {
            top: branchY - branchH / 2,
            height: branchH,
            left: leavesLeft + LEAVES.joinX * s,
            borderTopWidth: BRANCH.outline * s,
            borderBottomWidth: BRANCH.outline * s,
          },
        ]}
      />
      <Animated.Image
        source={LEAVES_IMG}
        pointerEvents="none"
        style={[{ position: 'absolute', left: leavesLeft, top: branchY - LEAVES.branchCenterY * s, width: LEAVES.w * s, height: LEAVES.h * s }, leafStyle]}
      />

      {/* Snooze: a frame centred on the grip line, skewed around its centre */}
      <Animated.View
        pointerEvents="box-none"
        style={[styles.abs, { width: frame, height: frame, left: width / 2 - frame / 2, top: branchY - frame / 2 }, leanStyle]}
      >
        <GestureDetector gesture={gesture}>
          <View style={[styles.abs, { width: displayW, height: displayH, left: frame / 2 - pivotX, top: frame / 2 - pivotY }]}>
            <Image source={SLOTH_IMG} style={{ width: displayW, height: displayH }} accessibilityLabel="Snooze the sloth, hanging from a branch" />
            <FaceOverlay eyes={eyes} mouth={mouth} />
            <View style={[styles.zWrap, { left: displayW * 0.8, top: displayH * 0.18 }]} pointerEvents="none">
              <Animated.Text style={[styles.z, { fontSize: 18 }, z0]}>z</Animated.Text>
              <Animated.Text style={[styles.z, { fontSize: 24 }, z1]}>z</Animated.Text>
              <Animated.Text style={[styles.z, { fontSize: 30 }, z2]}>Z</Animated.Text>
            </View>
          </View>
        </GestureDetector>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  branch: { position: 'absolute', right: -10, backgroundColor: BRANCH.brown, borderColor: BRANCH.plum },
  zWrap: { position: 'absolute', flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  z: { color: '#FFF4E2', fontFamily: 'Fredoka_700Bold' },
});
