// Shared scenery: the earned sky gradient, the outlined sun, and the floating tab bar.
import React from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, DROP, F, OUTLINE, R } from './theme';

/** Full-screen vertical gradient. Only for the ring, the sunrise and the win. */
export function SkyGradient({ stops, id = 'sky' }: { stops: [number, string][]; id?: string }) {
  const { width, height } = useWindowDimensions();
  return (
    <Svg style={StyleSheet.absoluteFill} width={width} height={height} pointerEvents="none">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          {stops.map(([o, c]) => (
            <Stop key={o} offset={String(o)} stopColor={c} />
          ))}
        </LinearGradient>
      </Defs>
      <Rect width={width} height={height} fill={`url(#${id})`} />
    </Svg>
  );
}

/** A big outlined sun disc with a dashed halo, sitting low like it's rising. */
export function RisingSun({ size, style, color = C.sun }: { size: number; style?: StyleProp<ViewStyle>; color?: string }) {
  const halo = size * 1.27;
  return (
    <View pointerEvents="none" style={[{ position: 'absolute', width: halo, height: halo, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Svg width={halo} height={halo} style={StyleSheet.absoluteFill}>
        <Circle cx={halo / 2} cy={halo / 2} r={halo / 2 - 2} fill="none" stroke="rgba(43,10,34,0.25)" strokeWidth={2} strokeDasharray="8 8" />
      </Svg>
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, borderWidth: OUTLINE, borderColor: C.ink }} />
    </View>
  );
}

const ICONS = {
  alarm: 'M12 6a7 7 0 1 0 0 14a7 7 0 1 0 0-14M12 10v3l2 2M5 4 3 6M19 4l2 2',
  routine: 'M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2',
  insights: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
};
export function Icon({ d, size = 20, color = C.ink, width = 2.4 }: { d: string; size?: number; color?: string; width?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
      <Path d={d} />
    </Svg>
  );
}

type Tab = 'alarms' | 'routine';
/** Floating outlined tab bar. Insights is shown as coming soon so the structure is visible. */
export function TabBar({ active, onAlarms, onRoutine }: { active: Tab; onAlarms: () => void; onRoutine: () => void }) {
  const insets = useSafeAreaInsets();
  const tabs: { key: Tab | 'insights'; label: string; d: string; onPress?: () => void }[] = [
    { key: 'alarms', label: 'Alarms', d: ICONS.alarm, onPress: onAlarms },
    { key: 'routine', label: 'Routine', d: ICONS.routine, onPress: onRoutine },
    { key: 'insights', label: 'Soon', d: ICONS.insights },
  ];
  return (
    <View style={[styles.wrap, { bottom: insets.bottom + 12 }]}>
      <View style={styles.shadow} />
      <View style={styles.bar}>
        {tabs.map((t) => {
          const on = t.key === active;
          const off = !t.onPress;
          return (
            <Pressable
              key={t.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: on, disabled: off }}
              accessibilityLabel={t.key === 'insights' ? 'Insights, coming soon' : t.label}
              disabled={off}
              onPress={t.onPress}
              style={[styles.tab, on && styles.tabOn]}
            >
              <Icon d={t.d} color={on ? C.paper : off ? C.ink60 : C.ink} />
              <Text style={[styles.tabText, { color: on ? C.paper : off ? C.ink60 : C.ink }]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 14, right: 14, height: 68 + DROP },
  shadow: { position: 'absolute', left: 0, right: 0, top: DROP, height: 68, borderRadius: R.l, backgroundColor: C.ink },
  bar: { height: 68, borderRadius: R.l, borderWidth: OUTLINE, borderColor: C.ink, backgroundColor: C.white, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, gap: 4 },
  tab: { flex: 1, height: 48, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  tabOn: { backgroundColor: C.ink },
  tabText: { fontFamily: F.label, fontSize: 14 },
});
