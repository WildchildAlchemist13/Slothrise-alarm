// Snooze the sloth. The head is the exact traced face from the Slothrise logo (src/snoozeHead.ts);
// the body, arms and feet are drawn in code in the same colours so they can move.
//
// Layers (all share one viewBox, so stacking them at the same size lines them up exactly):
//   <SnoozeBody />  feet, body and belly
//   <SnoozeHead />  the logo head, with expression overlays for eyes and mouth
//   <SnoozeArms />  arms on top, in a "hang" or "cheer" pose
//   <SnoozeFlame /> streak flame for the wake-win screen
import React from 'react';
import Svg, { Ellipse, G, Path } from 'react-native-svg';
import { BRAND } from './sky';
import { HEAD_PATHS } from './snoozeHead';

export const VIEWBOX = { x: -30, y: -30, w: 260, h: 270 };
// Point between the two hands, where Snooze grips the branch (viewBox units).
export const GRIP = { x: 100, y: 53 };
// Neck: the head wobbles around this point (viewBox units).
export const HEAD_PIVOT = { x: 100, y: 140 };

// Logo head -> body coordinates. Face centre (186, 268) in the logo lands on (100, 100) here.
const HEAD_SCALE = 0.42;
const HEAD_TX = 100 - 186 * HEAD_SCALE;
const HEAD_TY = 100 - 268 * HEAD_SCALE;
// Feature positions in the logo's own coordinates.
const LOGO_EYES = [{ x: 117, y: 266 }, { x: 254, y: 266 }];
const LOGO_MOUTH = { x: 186, y: 306 };

export type Eyes = 'logo' | 'closed' | 'open' | 'happy';
export type Mouth = 'logo' | 'open';
export type ArmPose = 'hang' | 'cheer' | 'rest';

const B = BRAND;
const vb = `${VIEWBOX.x} ${VIEWBOX.y} ${VIEWBOX.w} ${VIEWBOX.h}`;
const heightFor = (size: number) => (size * VIEWBOX.h) / VIEWBOX.w;

export function SnoozeBody({ size }: { size: number }) {
  return (
    <Svg width={size} height={heightFor(size)} viewBox={vb}>
      {/* sticker edge so Snooze reads on any sky */}
      <G stroke={B.sticker} strokeWidth={16} fill={B.sticker} strokeLinejoin="round">
        <Ellipse cx={66} cy={204} rx={25} ry={19} />
        <Ellipse cx={134} cy={204} rx={25} ry={19} />
        <Ellipse cx={100} cy={160} rx={66} ry={54} />
      </G>
      <G stroke={B.plum} strokeWidth={5} strokeLinejoin="round">
        <Ellipse cx={66} cy={204} rx={25} ry={19} fill={B.fur} />
        <Ellipse cx={134} cy={204} rx={25} ry={19} fill={B.fur} />
        <Ellipse cx={66} cy={208} rx={14} ry={10} fill={B.cream} stroke="none" />
        <Ellipse cx={134} cy={208} rx={14} ry={10} fill={B.cream} stroke="none" />
        <Path d="M60 205v6M66 204v7M72 205v6M128 205v6M134 204v7M140 205v6" stroke={B.patch} strokeWidth={3.5} strokeLinecap="round" />
        <Ellipse cx={100} cy={160} rx={66} ry={54} fill={B.fur} />
        <Ellipse cx={100} cy={172} rx={40} ry={34} fill={B.cream} stroke="none" />
      </G>
    </Svg>
  );
}

function EyeOverlay({ kind, x, y }: { kind: Exclude<Eyes, 'logo'>; x: number; y: number }) {
  return (
    <G transform={`translate(${x} ${y})`}>
      {/* cover the drawn sleepy eye with the eye-patch colour, then draw the new eye */}
      <Ellipse rx={36} ry={25} fill={B.patch} />
      {kind === 'open' && (
        <>
          <Ellipse rx={22} ry={20} fill={B.cream} />
          <Ellipse cx={2} cy={2} rx={15} ry={15} fill={B.plum} />
          <Ellipse cx={8} cy={-4} rx={5} ry={5} fill="#fff" />
        </>
      )}
      {kind === 'closed' && <Path d="M-22 -4q22 20 44 0" fill="none" stroke={B.plum} strokeWidth={9} strokeLinecap="round" />}
      {kind === 'happy' && <Path d="M-22 8q22 -26 44 0" fill="none" stroke={B.plum} strokeWidth={10} strokeLinecap="round" />}
    </G>
  );
}

export function SnoozeHead({ size, eyes = 'logo', mouth = 'logo' }: { size: number; eyes?: Eyes; mouth?: Mouth }) {
  return (
    <Svg width={size} height={heightFor(size)} viewBox={vb}>
      <G transform={`translate(${HEAD_TX} ${HEAD_TY}) scale(${HEAD_SCALE})`}>
        {/* sticker edge behind the logo outline */}
        <Path d={HEAD_PATHS[0].d} fill={B.sticker} stroke={B.sticker} strokeWidth={22} strokeLinejoin="round" />
        {HEAD_PATHS.map((p, i) => (
          <Path key={i} d={p.d} fill={p.fill} fillRule="evenodd" />
        ))}
        {eyes !== 'logo' && LOGO_EYES.map((e, i) => <EyeOverlay key={i} kind={eyes} x={e.x} y={e.y} />)}
        {mouth === 'open' && (
          <G transform={`translate(${LOGO_MOUTH.x} ${LOGO_MOUTH.y})`}>
            <Ellipse rx={36} ry={15} fill={B.cream} />
            <Path d="M-20 -8q20 34 40 0z" fill={B.plum} stroke={B.plum} strokeWidth={4} strokeLinejoin="round" />
            <Path d="M-8 6q8 6 16 0" fill="none" stroke="#FF8FA3" strokeWidth={6} strokeLinecap="round" />
          </G>
        )}
      </G>
    </Svg>
  );
}

const ARM_POSES: Record<ArmPose, [number, number, number]> = {
  // [left angle, right angle, length scale]
  hang: [160, -160, 1.8],
  cheer: [145, -145, 1.35],
  rest: [-38, 38, 1],
};

function Arm({ x, angle, reach }: { x: number; angle: number; reach: number }) {
  return (
    <G transform={`translate(${x} 140) rotate(${angle}) scale(1 ${reach})`}>
      <Path d="M-12 12a12 12 0 0 1 24 0v26a12 12 0 0 1 -24 0z" fill={B.fur} stroke={B.plum} strokeWidth={4} />
      <Path d="M-6 42v8M0 43v8M6 42v8" stroke={B.patch} strokeWidth={3.5} strokeLinecap="round" />
    </G>
  );
}

export function SnoozeArms({ size, pose = 'hang' }: { size: number; pose?: ArmPose }) {
  const [l, r, reach] = ARM_POSES[pose];
  return (
    <Svg width={size} height={heightFor(size)} viewBox={vb}>
      <Arm x={52} angle={l} reach={reach} />
      <Arm x={148} angle={r} reach={reach} />
    </Svg>
  );
}

export function SnoozeFlame({ size }: { size: number }) {
  return (
    <Svg width={size} height={heightFor(size)} viewBox={vb}>
      <Path
        d="M168 -26c5 11 16 16 16 30a16 16 0 0 1-32 0c0-9 5-13 8-16 0 6 4 10 7 10 0-10-4-15 1-24z"
        fill="#FF8A3D"
        stroke={B.plum}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <Path d="M168 -2c2 5 6 7 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 3 3z" fill="#FFD34D" />
    </Svg>
  );
}

/** Convert a viewBox point to pixels inside a Snooze drawn at `size` px wide. */
export function toPx(p: { x: number; y: number }, size: number) {
  const s = size / VIEWBOX.w;
  return { x: (p.x - VIEWBOX.x) * s, y: (p.y - VIEWBOX.y) * s };
}
