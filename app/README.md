# Slothrise app

The Expo (React Native) app for Slothrise: Alarm & Habits, in the "Cozy Sunrise" design.

## Run it on your phone

1. Install [Node.js](https://nodejs.org) (LTS) on your computer.
2. Install **Expo Go** on your phone (App Store or Play Store).
3. In this folder, run:

   ```bash
   npm install
   ```

   ```bash
   npx expo start
   ```

4. Scan the QR code: with the Camera app on iPhone, or from inside Expo Go on Android. Phone and computer must be on the same Wi-Fi. If they can't see each other, run `npx expo start --tunnel` instead.

## The flow

**Welcome** → *Get started* → **Home** → *Ring the 6:30 alarm now* → **Ringing** → hold to wake → **Math mission** → **Wake win** → **Morning routine**

- **Home** shows the morning view by day and a dim **bedtime** view after 9 pm. The sun/moon button flips between them.
- **Ringing:** the chime loops (even on silent), Snooze sways on the branch, and his eyes open as you hold the button. *Snooze 5 min* says what it costs.
- **Mission:** three sums. A wrong answer shakes and buzzes; the alarm keeps chiming until you're done.
- **Wake win:** Snooze drops in cheering, confetti, and the streak goes up.
- **Routine:** one "Next up" habit with a big Done button; tick or skip the rest.
- **Gentle mode** (*Play the Gentle sunrise*, or *Goodnight, Snooze* at bedtime): night lifts into dawn while soft bells rise from 6% to 100% volume. Hold *I'm up* any time; still in bed when the backup kicks in, the full alarm takes over. A real alarm runs a 180 s sunrise with the full alarm at 300 s (`SUNRISE_S` / `BACKUP_S` in `src/GentleScreen.tsx`); the dev-only *Play the Gentle sunrise* shortcut uses 15 s / 30 s (`DEMO_SUNRISE_S` / `DEMO_BACKUP_S`) so the whole arc is visible quickly.
- The hanging Snooze reacts to **tilt** (he swings), **drag** (push him) and **tap** (he wakes up and says hello).

## Files

- `App.tsx`: fonts, providers and the screen flow
- `src/theme.ts`: design tokens (colours, fonts, radii) and the Snooze pose images
- `src/Tactile.tsx`: buttons that press down, cards, chips, toggle
- `src/HoldButton.tsx`: the press-and-hold wake button
- `src/Scenery.tsx`: sky gradient, rising sun, icons, tab bar
- `src/WelcomeScreen.tsx`, `src/HomeScreen.tsx`, `src/RingingScreen.tsx`, `src/MissionScreen.tsx`, `src/WinScreen.tsx`, `src/RoutineScreen.tsx`, `src/GentleScreen.tsx`: the screens
- `src/ArtHangingSnooze.tsx`: the hand-drawn hanging Snooze, leaning under his hands
- `src/useSwing.ts`: the swing physics (tilt, drag, damping). Set `TILT_SIGN` to `-1` if he swings the wrong way on your phone.
- `src/sound.ts`: alarm sounds (`expo-audio`)
- `assets/poses/`, `assets/snooze-hang.png`: Snooze artwork
- `assets/sounds/`: the three alarm sounds, made with `tools/sounds.py` at the repo root

## Alarms that actually ring

Scheduling lives in `src/alarms.ts` and runs whenever an alarm is toggled; state (alarms, streak, routine, bedtime)
lives in `src/state.ts` on AsyncStorage. Expo Go cannot schedule these — use `npx expo run:ios|android` or an EAS
development build (`npx eas-cli@latest build --profile development`).

- **Android:** exact alarms via `USE_EXACT_ALARM` / `SCHEDULE_EXACT_ALARM`, delivered with `delivery: 'alarmClock'` on a
  MAX-importance channel with `ALARM` audio usage, bypass-DND, a public lock-screen presentation and the looping
  `alarm_chime.wav`. Android 13+ grants `USE_EXACT_ALARM` without a prompt to alarm-clock apps; Android 12 users are
  asked for the exact-alarm permission on first launch.
- **Android limit:** `expo-notifications` in SDK 58 has no full-screen-intent option, so the alarm arrives as a
  high-priority heads-up notification that turns the screen on; tapping it opens the ringing screen. A true
  lock-screen takeover needs a custom native module or a third-party plugin.
- **iOS:** a repeating local notification with the app's chime at `interruptionLevel: 'timeSensitive'`, which breaks
  through Focus. **iOS limits:** a notification cannot bypass the mute switch or ring for minutes like a system alarm,
  and Expo SDK 58 has no AlarmKit support — AlarmKit (iOS 26) would need a third-party native module such as
  `expo-alarm-kit`. The next real step for sound-on-silent is Apple's critical-alert entitlement.
- **Locked phone:** local notifications fire while the device is locked; the in-app ring screen appears when the
  notification is opened. The ring sound itself continues in the background because the app keeps iOS audio
  (`UIBackgroundModes: audio`) and plays with `shouldPlayInBackground`.

## Not yet

- The alarm editor and the Insights tab.
- Lint: `npx expo lint` flags 18 pre-existing React Compiler rules violations in the animation code
  (`useSwing.ts`, `HoldButton.tsx`, `WinScreen.tsx`, `WelcomeScreen.tsx`, `RingingScreen.tsx`, `MissionScreen.tsx`,
  `ArtHangingSnooze.tsx`). They are worklet style, not bugs; the new scheduling and state modules are clean.
