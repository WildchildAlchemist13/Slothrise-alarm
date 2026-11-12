// "Cozy Sunrise" design tokens. Drawn like Snooze: plum outlines, warm paper, one bright sun.
// See the Slothrise Redesign canvas, board 2 (Design system).
export const C = {
  // day
  paper: '#FFF8EE',     // ground
  white: '#FFFFFF',     // raised cards
  ink: '#2B0A22',       // text, outlines, shadows
  ink60: '#6B5464',     // secondary text (6.6:1 on paper)
  oat: '#F1E4D3',       // flat cards, fields, tracks
  oatLine: '#E4D3BF',
  sunrise: '#FF7A45',   // main action
  sun: '#FFB81C',       // streaks, rewards, hold fill
  sunSoft: '#FFE9B0',
  leaf: '#2FB67C',      // done
  sky: '#8FD3F5',       // info, gentle
  skySoft: '#E4F4FD',
  peach: '#FFE1D2',
  lilac: '#CDB8FA',
  link: '#C2410C',      // orange that reads as text on paper
  // night (after 9 pm)
  night: '#1A1430',
  nightCard: '#2A2147',
  nightLine: '#3A3060',
  moon: '#F6EAD7',
  dim: '#BFB3DE',
  // art
  branch: '#94502A',
  branchLine: '#37062A',
};

export const F = {
  display: 'Fredoka_700Bold',
  displaySemi: 'Fredoka_600SemiBold',
  body: 'Nunito_600SemiBold',
  bodyBold: 'Nunito_700Bold',
  label: 'Nunito_800ExtraBold',
};

export const R = { s: 12, m: 18, l: 24, xl: 32, pill: 999 };
export const OUTLINE = 2.5;
export const DROP = 4; // straight-down hard shadow

export const POSES = {
  celebrate: require('../assets/poses/snooze-celebrate.png'),
  sleepCloud: require('../assets/poses/snooze-sleep-cloud.png'),
  peek: require('../assets/poses/snooze-peek.png'),
  yawn: require('../assets/poses/snooze-yawn.png'),
  coffee: require('../assets/poses/snooze-coffee.png'),
  sad: require('../assets/poses/snooze-sad.png'),
};
// width / height of each pose, so images keep their shape
export const POSE_RATIO = {
  celebrate: 397 / 476,
  sleepCloud: 474 / 419,
  peek: 427 / 341,
  yawn: 413 / 498,
  coffee: 375 / 498,
  sad: 371 / 497,
};

/** Night palette after 9 pm and before 5 am. */
export const isNight = (d = new Date()) => d.getHours() >= 21 || d.getHours() < 5;
