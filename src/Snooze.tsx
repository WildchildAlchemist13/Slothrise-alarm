// Snooze the sloth, drawn in code. Two layers so the cap can swing on its own:
//   <SnoozeBody />  everything except the cap
//   <SnoozeCap />   the nightcap and pom-pom, rendered on top in the same coordinate space
// Both use the same viewBox, so stacking them at the same size lines them up exactly.
import React from 'react';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import { BRAND } from './sky';

export const VIEWBOX = { x: -30, y: -30, w: 260, h: 270 };
// Point between the two hands, where Snooze grips the branch (viewBox units).
export const GRIP = { x: 100, y: 46 };
// Pivot for the cap's own wobble (viewBox units).
export const CAP_PIVOT = { x: 105, y: 70 };

export type Eyes = 'closed' | 'half' | 'open' | 'happy';
export type Mouth = 'smile' | 'open';

const B = BRAND;

function Eye({ kind, x }: { kind: Eyes; x: number }) {
  return (
    <G transform={`translate(${x} 102)`}>
      {kind === 'open' && (
        <>
          <Circle r={7.5} fill={B.plum} />
          <Circle cx={2.4} cy={-2.6} r={2.4} fill="#fff" />
        </>
      )}
      {kind === 'half' && (
        <>
          <Circle r={7.5} cy={1} fill={B.plum} />
          <Ellipse cy={-4} rx={10.5} ry={8} fill={B.fur} />
          <Path d="M-10.5 0h21" stroke={B.plum} strokeWidth={4} strokeLinecap="round" />
        </>
      )}
      {kind === 'closed' && <Path d="M-9 -1q9 8 18 0" fill="none" stroke={B.plum} strokeWidth={4} strokeLinecap="round" />}
      {kind === 'happy' && <Path d="M-9 3q9 -10 18 0" fill="none" stroke={B.plum} strokeWidth={4.5} strokeLinecap="round" />}
    </G>
  );
}

// One arm, pointing up to the branch. Rotation and length are fixed for the hanging pose.
function Arm({ x, angle }: { x: number; angle: number }) {
  return (
    <G transform={`translate(${x} 134) rotate(${angle}) scale(1 1.8)`}>
      <Path d="M-12 12a12 12 0 0 1 24 0v26a12 12 0 0 1 -24 0z" fill={B.fur} stroke={B.plum} strokeWidth={4} />
      <Path d="M-6 42v8M0 43v8M6 42v8" stroke={B.patch} strokeWidth={3.5} strokeLinecap="round" />
    </G>
  );
}

export function SnoozeBody({ size, eyes, mouth }: { size: number; eyes: Eyes; mouth: Mouth }) {
  const h = (size * VIEWBOX.h) / VIEWBOX.w;
  return (
    <Svg width={size} height={h} viewBox={`${VIEWBOX.x} ${VIEWBOX.y} ${VIEWBOX.w} ${VIEWBOX.h}`}>
      {/* sticker edge: a thick cream outline behind the silhouette so Snooze reads on any sky */}
      <G stroke={B.sticker} strokeWidth={16} fill={B.sticker} strokeLinejoin="round">
        <Ellipse cx={66} cy={204} rx={25} ry={19} />
        <Ellipse cx={134} cy={204} rx={25} ry={19} />
        <Ellipse cx={100} cy={150} rx={70} ry={62} />
        <Ellipse cx={100} cy={94} rx={64} ry={56} />
      </G>
      <G stroke={B.plum} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round">
        <Ellipse cx={66} cy={204} rx={25} ry={19} fill={B.fur} />
        <Ellipse cx={134} cy={204} rx={25} ry={19} fill={B.fur} />
        <Ellipse cx={66} cy={208} rx={14} ry={10} fill={B.cream} stroke="none" />
        <Ellipse cx={134} cy={208} rx={14} ry={10} fill={B.cream} stroke="none" />
        <Ellipse cx={100} cy={150} rx={70} ry={62} fill={B.fur} />
        <Ellipse cx={100} cy={164} rx={42} ry={38} fill={B.cream} stroke="none" />
        <Ellipse cx={100} cy={94} rx={64} ry={56} fill={B.fur} />
        <Ellipse cx={100} cy={103} rx={50} ry={32} fill={B.cream} stroke="none" />
        <Ellipse cx={75} cy={101} rx={21} ry={12} fill={B.patch} stroke="none" transform="rotate(14 75 101)" />
        <Ellipse cx={125} cy={101} rx={21} ry={12} fill={B.patch} stroke="none" transform="rotate(-14 125 101)" />
        <Eye kind={eyes} x={77} />
        <Eye kind={eyes} x={123} />
        <Ellipse cx={60} cy={121} rx={7} ry={4} fill="#FF8FA3" opacity={0.6} stroke="none" />
        <Ellipse cx={140} cy={121} rx={7} ry={4} fill="#FF8FA3" opacity={0.6} stroke="none" />
        <Path d="M94 111q6-4 12 0q-2 6-6 6q-4 0-6-6z" fill={B.plum} strokeWidth={2} />
        {mouth === 'smile' ? (
          <Path d="M90 121q5 5 10 0q5 5 10 0" fill="none" strokeWidth={3.5} />
        ) : (
          <Path d="M91 119q9 12 18 0z" fill={B.plum} strokeWidth={3.5} />
        )}
      </G>
    </Svg>
  );
}

// Arms sit on the top layer so the hands grip the branch in front of the cap.
export function SnoozeArms({ size }: { size: number }) {
  const h = (size * VIEWBOX.h) / VIEWBOX.w;
  return (
    <Svg width={size} height={h} viewBox={`${VIEWBOX.x} ${VIEWBOX.y} ${VIEWBOX.w} ${VIEWBOX.h}`}>
      <Arm x={56} angle={160} />
      <Arm x={144} angle={-160} />
    </Svg>
  );
}

export function SnoozeCap({ size }: { size: number }) {
  const h = (size * VIEWBOX.h) / VIEWBOX.w;
  return (
    <Svg width={size} height={h} viewBox={`${VIEWBOX.x} ${VIEWBOX.y} ${VIEWBOX.w} ${VIEWBOX.h}`}>
      <G transform="translate(5 -12) scale(.95)" stroke={B.plum} strokeWidth={5} strokeLinejoin="round">
        <Path d="M34 88C36 42 84 14 132 22C166 28 186 60 186 102L172 108C168 74 150 54 122 48C94 42 60 56 48 92Z" fill={B.cap} />
        <Path d="M30 92C50 52 134 40 172 78L170 96C132 64 66 70 42 106Z" fill={B.capShade} />
        <Circle cx={180} cy={114} r={14} fill={B.pom} />
      </G>
    </Svg>
  );
}

/** Convert a viewBox point to pixels inside a Snooze drawn at `size` px wide. */
export function toPx(p: { x: number; y: number }, size: number) {
  const s = size / VIEWBOX.w;
  return { x: (p.x - VIEWBOX.x) * s, y: (p.y - VIEWBOX.y) * s };
}
