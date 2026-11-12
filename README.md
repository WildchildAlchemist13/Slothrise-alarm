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
- **Gentle mode** (*Play the Gentle sunrise*, or *Goodnight, Snooze* at bedtime): night lifts into dawn while soft bells rise from 6% to 100% volume. Hold *I'm up* any time; still in bed when the backup kicks in, the full alarm takes over. The demo uses a 15 s sunrise and a 30 s backup; the real timings (180 s and 300 s) are `SUNRISE_S` and `BACKUP_S` in `src/GentleScreen.tsx`.
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

## Not yet

- The alarm editor and the Insights tab.
- Alarms that ring while the app is closed or the phone is locked. These need native alarm scheduling (AlarmKit on iOS, exact alarms on Android), which Expo Go can't run, so that step needs a development build (`npx eas-cli@latest build --profile development`).
- Lint: run `npx expo lint` once on your machine (its first-time setup needs network access).
