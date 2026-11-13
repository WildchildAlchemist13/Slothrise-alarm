// The app's one source of truth: alarms, streak, routine and bedtime, saved on the phone.
// Nothing here is demo data — if a value is unknown it stays empty and the UI says so.
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AlarmMode = 'mission' | 'gentle';

/** weekdays use 1 = Sunday … 7 = Saturday, the same numbering Expo's triggers use. An empty list means every day. */
export type Alarm = {
  id: string;
  label: string;
  hour: number;
  minute: number;
  weekdays: number[];
  mode: AlarmMode;
  enabled: boolean;
};

export type Habit = { id: string; name: string; mins: number; streak: number; lastDone: string | null };

export type AppState = {
  version: 1;
  alarms: Alarm[];
  /** consecutive days woken with a completed mission */
  streak: number;
  /** the longest streak ever reached — real history, not a decorative number */
  best: number;
  /** YYYY-MM-DD of the last completed wake, null until the first one */
  lastWin: string | null;
  /** YYYY-MM-DD of every wake, newest last, capped */
  wins: string[];
  habits: Habit[];
  /** the time you mean to be in bed, used for the wind-down card */
  bedtime: { hour: number; minute: number };
};

const KEY = 'slothrise/app-state/v1';
const MAX_WINS = 120;

/** Starter alarms — real, editable in code later, and genuinely scheduled. They are presets, not fake history. */
const SEED_ALARMS: Alarm[] = [
  { id: 'gym', label: 'Gym before the chaos', hour: 6, minute: 30, weekdays: [2, 4, 6], mode: 'mission', enabled: true },
  { id: 'write', label: 'Writing sprint', hour: 7, minute: 15, weekdays: [2, 3, 4, 5, 6], mode: 'mission', enabled: true },
  { id: 'slow', label: 'Slow start', hour: 9, minute: 0, weekdays: [1, 7], mode: 'gentle', enabled: true },
];

/** Habits are a fixed list for v1; only their progress is stored. */
const SEED_HABITS: Habit[] = [
  { id: 'water', name: 'Big glass of water', mins: 1, streak: 0, lastDone: null },
  { id: 'write', name: 'Write 300 words', mins: 15, streak: 0, lastDone: null },
  { id: 'bed', name: 'Make the bed', mins: 2, streak: 0, lastDone: null },
  { id: 'stretch', name: '10 min stretch', mins: 10, streak: 0, lastDone: null },
  { id: 'phone', name: 'No phone for 20 min', mins: 20, streak: 0, lastDone: null },
];

export function defaultState(): AppState {
  return {
    version: 1,
    alarms: SEED_ALARMS.map((a) => ({ ...a })),
    streak: 0,
    best: 0,
    lastWin: null,
    wins: [],
    habits: SEED_HABITS.map((h) => ({ ...h })),
    bedtime: { hour: 22, minute: 30 },
  };
}

/** YYYY-MM-DD in the phone's own timezone. */
export function dayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isYesterday(key: string, now: Date): boolean {
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  return dayKey(y) === key;
}

/** The longest run of consecutive days in a sorted list of day keys — the record already earned. */
function longestRun(wins: string[]): number {
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const key of wins) {
    const next = new Date(`${key}T12:00:00`);
    next.setDate(next.getDate() - 1);
    run = prev !== null && dayKey(next) === prev ? run + 1 : 1;
    if (run > best) best = run;
    prev = key;
  }
  return best;
}

/** Coerce whatever is on disk into something safe to render. Unknown shapes fall back to defaults. */
function readState(raw: string): AppState {
  const base = defaultState();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return base;
  }
  if (!parsed || typeof parsed !== 'object') return base;
  const s = parsed as Partial<AppState>;
  const alarms = Array.isArray(s.alarms)
    ? s.alarms
        .filter((a): a is Alarm => !!a && typeof a.id === 'string' && Number.isFinite(a.hour) && Number.isFinite(a.minute))
        .map((a) => ({ ...a, weekdays: Array.isArray(a.weekdays) ? a.weekdays.filter((d) => d >= 1 && d <= 7) : [] }))
    : base.alarms;
  const wins = Array.isArray(s.wins) ? s.wins.filter((w): w is string => typeof w === 'string') : [];
  const habits = Array.isArray(s.habits)
    ? base.habits.map((seed) => {
        const saved = s.habits?.find((h) => h?.id === seed.id);
        return saved ? { ...seed, streak: Number(saved.streak) || 0, lastDone: saved.lastDone ?? null } : seed;
      })
    : base.habits;
  return {
    version: 1,
    alarms: alarms.length ? alarms : base.alarms,
    streak: Number(s.streak) || 0,
    // Installs saved before the record existed derive it from the days they actually woke.
    best: Number(s.best) || longestRun(wins),
    lastWin: typeof s.lastWin === 'string' ? s.lastWin : null,
    wins,
    habits,
    bedtime: s.bedtime && Number.isFinite(s.bedtime.hour) ? s.bedtime : base.bedtime,
  };
}

export async function loadState(): Promise<AppState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? readState(raw) : defaultState();
  } catch {
    return defaultState();
  }
}

export async function saveState(state: AppState): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // a failed write must not crash the morning; the UI stays as it is
  }
}

/** Record a completed wake: today counts once, and the streak only grows if yesterday counted too. */
export function recordWin(state: AppState, now: Date = new Date()): AppState {
  const today = dayKey(now);
  if (state.wins.includes(today)) return state;
  const streak = state.lastWin === today ? state.streak : isYesterday(state.lastWin ?? '', now) ? state.streak + 1 : 1;
  const wins = [...state.wins, today].sort().slice(-MAX_WINS);
  return { ...state, streak, best: Math.max(state.best ?? 0, streak), lastWin: today, wins };
}

export type NextAlarm = { alarm: Alarm; at: Date };

/** The soonest enabled alarm in the next eight days, or null when nothing is enabled. */
export function nextAlarm(alarms: Alarm[], now: Date = new Date()): NextAlarm | null {
  let best: NextAlarm | null = null;
  for (const alarm of alarms) {
    if (!alarm.enabled) continue;
    const days = alarm.weekdays.length ? alarm.weekdays : [1, 2, 3, 4, 5, 6, 7];
    for (let offset = 0; offset <= 8; offset++) {
      const at = new Date(now);
      at.setDate(at.getDate() + offset);
      at.setHours(alarm.hour, alarm.minute, 0, 0);
      if (at.getTime() <= now.getTime()) continue;
      if (!days.includes(at.getDay() + 1)) continue;
      if (!best || at < best.at) best = { alarm, at };
      break;
    }
  }
  return best;
}

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function clock(hour: number, minute: number): { time: string; ampm: string } {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return { time: `${h12}:${`${minute}`.padStart(2, '0')}`, ampm: hour < 12 ? 'am' : 'pm' };
}

export function scheduleText(weekdays: number[]): string {
  if (!weekdays.length) return 'Every day';
  if (weekdays.length === 7) return 'Every day';
  if (weekdays.length === 5 && [2, 3, 4, 5, 6].every((d) => weekdays.includes(d))) return 'Weekdays';
  if (weekdays.length === 2 && weekdays.includes(1) && weekdays.includes(7)) return 'Weekends';
  return weekdays
    .slice()
    .sort((a, b) => a - b)
    .map((d) => WEEKDAY_SHORT[d - 1])
    .join(' · ');
}

/** "IN 8 H 49 MIN" — or "IN 12 MIN" inside the last hour. */
export function countdown(at: Date, now: Date = new Date()): string {
  const mins = Math.max(0, Math.round((at.getTime() - now.getTime()) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `IN ${m} MIN`;
  return `IN ${h} H ${m} MIN`;
}

export function sleepHours(bedtime: { hour: number; minute: number }, alarm: Date): string {
  const bed = new Date(alarm);
  bed.setDate(bed.getDate() - (bedtime.hour * 60 + bedtime.minute > alarm.getHours() * 60 + alarm.getMinutes() ? 1 : 0));
  bed.setHours(bedtime.hour, bedtime.minute, 0, 0);
  const mins = Math.max(0, Math.round((alarm.getTime() - bed.getTime()) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} h ${m} min` : `${h} hours`;
}

/** Monday-based week containing `now`, as day keys. */
export function weekDays(now: Date = new Date()): string[] {
  const day = now.getDay(); // 0 = Sunday
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const out: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + mondayOffset + i);
    out.push(dayKey(d));
  }
  return out;
}

/** Comma list of alarm ids that are off, so the schedule can be rescheduled on any change. */
export function enabledCount(alarms: Alarm[]): number {
  return alarms.filter((a) => a.enabled).length;
}

export { KEY as STORAGE_KEY };
