# Slothrise: Alarm & Habits

*Hello, wake up!!*

The first screen of the Slothrise app, built with Expo (React Native) so you can try it on your phone in Expo Go.

## What's on screen

Snooze the sloth hangs from a branch under the sky of the hour. The sky colours change with the time of day.

- **Tilt your phone**: Snooze swings like a pendulum. "Level" is however you hold the phone when the app opens, and it slowly re-levels over about 10 seconds if you sit up or lie down. Small hand wobble (about 3 degrees) is ignored.
- **Drag Snooze**: push the swing with your finger. Let go and it coasts to a stop.
- **Swing fast**: Snooze's eyes crack open.
- **Tap Snooze**: it wakes up, says "Hello, wake up!!", buzzes, then dozes off again.
- The nightcap wobbles behind the body, the leaves rustle with the swing, and the sun slowly rises.

All motion is code: `react-native-reanimated` runs the physics every frame on the UI thread (`useFrameCallback`) and reads tilt with `useAnimatedSensor(SensorType.GRAVITY)`. Snooze is drawn with `react-native-svg`.

## The demo flow

**Welcome** → *Let’s get up* → **Ringing** → hold to wake → **Wake win**
**Welcome** → *try Gentle mode* → **Gentle sunrise** → *I’m up* → **Wake win** (or, still in bed after 30 s, the full **Ringing** alarm takes over)

- **Ringing:** the sunrise chime loops at full volume, every beat jolts Snooze and buzzes the phone, and Snooze's eyes open as you hold the button.
- **Gentle mode:** the screen starts dark and brightens into the sky of the hour while soft bells rise from a whisper (6% to 100% volume). Snooze yawns at the start and his eyes drift open halfway. The demo uses a 15 s sunrise and a 30 s backup; the real timings (180 s and 300 s) are `SUNRISE_S` and `BACKUP_S` in `src/GentleScreen.tsx`.
- **Sound** plays even with the phone on silent. All three sounds (`assets/sounds/`) were synthesised for Slothrise, so there are no licences to clear.

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

## Tuning the feel

The knobs are at the top of `src/WelcomeScreen.tsx`:

| Setting | What it does |
|---|---|
| `TILT_SIGN` | Set to `-1` if Snooze swings the wrong way when you tilt |
| `STIFFNESS` | Higher means a faster, snappier swing |
| `DAMPING` | Higher means it settles sooner |
| `MAX_SWING` | Furthest swing angle, in radians |
| `DEAD_ZONE` | How much hand wobble is ignored |

## Files

- `App.tsx`: loads the Fredoka font and the gesture and safe-area providers
- `src/WelcomeScreen.tsx`: the interactive welcome scene
- `src/useSwing.ts`: the swing physics (tilt, drag, damping)
- `src/Snooze.tsx`: Snooze, drawn in code (body, cap and arms are separate layers so they can move independently)
- `src/sky.ts`: sky-of-the-hour colours and brand colours
- `src/GentleScreen.tsx`, `src/RingingScreen.tsx`, `src/WinScreen.tsx`: the alarm screens
- `src/ArtHangingSnooze.tsx`: the hand-drawn hanging Snooze, leaning under its hands
- `src/sound.ts`: alarm sounds (`expo-audio`)
- `assets/icon.png`: the app icon, rendered from the original Slothrise icon

## Not yet

This is a demo of the wake-up experience. Real alarms that ring while the app is closed or the phone is locked need native alarm scheduling (AlarmKit on iOS, exact alarms on Android). Expo Go can't run those, so that step needs a development build (`npx eas-cli@latest build --profile development`).
