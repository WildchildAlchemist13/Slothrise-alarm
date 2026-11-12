// Sky of the hour: every screen takes its colours from the time of day.
export type Sky = { name: string; top: string; bottom: string; sun: string };

const SKIES: { from: number; to: number; sky: Sky }[] = [
  { from: 0, to: 4, sky: { name: 'Deep night', top: '#1B1A5E', bottom: '#2EC5D9', sun: '#A99BFF' } },
  { from: 5, to: 7, sky: { name: 'Dawn', top: '#6B3DF0', bottom: '#FF7A59', sun: '#FFC15E' } },
  { from: 8, to: 11, sky: { name: 'Morning', top: '#FFB84D', bottom: '#5EEAA8', sun: '#FFE14D' } },
  { from: 12, to: 15, sky: { name: 'High noon', top: '#3EE6C8', bottom: '#5BA8FF', sun: '#FFF4B0' } },
  { from: 16, to: 18, sky: { name: 'Golden hour', top: '#FF9F43', bottom: '#FF4D8D', sun: '#FFE14D' } },
  { from: 19, to: 21, sky: { name: 'Dusk', top: '#B84DFF', bottom: '#FF4D8D', sun: '#FFB86B' } },
  { from: 22, to: 23, sky: { name: 'Night', top: '#2A1650', bottom: '#7B5CFF', sun: '#A48CFF' } },
];

export function skyFor(date = new Date()): Sky {
  const h = date.getHours();
  return (SKIES.find((s) => h >= s.from && h <= s.to) ?? SKIES[1]).sky;
}

export const BRAND = {
  plum: '#3C0A2F',
  cap: '#FFB50C',
  capShade: '#F5A300',
  pom: '#FFD34D',
  fur: '#FFA787',
  cream: '#FBE0BE',
  patch: '#956054',
  sticker: '#FFF4E2',
  ink: '#0E0B1A',
};
