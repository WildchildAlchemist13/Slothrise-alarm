# Slothrise — App Privacy answers (privacy nutrition label)

**Short answer: "No, we do not collect data from this app." Everything else stays untouched.**

Read from the binary's own source at `feat/real-alarms` (4ecad75), not from the design canvas.

## Evidence from the code

| Claim | Evidence |
|---|---|
| No network calls at all | `grep -rn "fetch(\|axios\|XMLHttpRequest\|http"` across `app/src`, `App.tsx`, `index.ts` → no matches. |
| No analytics SDK | `app/package.json` dependencies: no PostHog, no Sentry, no Amplitude, no Firebase. PostHog is **not** installed, so "no analytics collected" is true of this binary. |
| No ads, no purchase SDK | No AdMob, no RevenueCat, no `expo-iap`, no paywall code. |
| No account, no identity | No auth, no sign-in, no user ID of any kind. |
| Local storage only | `src/state.ts` writes alarms, streak, win dates, habit progress and bedtime to AsyncStorage key `slothrise/app-state/v1`, on the device. |
| Notifications are local | `src/alarms.ts` schedules notifications with `expo-notifications` directly on the phone. No push token is ever requested or sent; no server exists. |
| Audio is bundled | `src/sound.ts` plays three `.wav` files from `app/assets/sounds` via `expo-audio`, with `playsInSilentMode` and background playback. Nothing is recorded. |
| No microphone | `app.json` sets `recordAudioAndroid: false`; no recorder is imported. (See gate C7 — the iOS usage string still needs removing.) |

## The exact click sequence in App Store Connect

App Store Connect → **App Privacy** → **Get Started** (or Edit) → to *"Do you or your third-party
partners collect data from this app?"* answer **No** → **Save** → **Publish**.

Then leave every data category alone: no Identifiers, no Usage Data, no Diagnostics, no Purchases, no
Contacts, nothing. Opening a category and cancelling changes nothing; saving one would switch the label
away from "Data Not Collected".

- **Data linked to you:** none — the label shows "Data Not Collected".
- **Data used to track you:** none. There is no ATT prompt and no `NSUserTrackingUsageDescription`,
  so the tracking questions do not apply. (This is the exact thing that blocked Pop Sheet's label:
  build 4 carried a tracking usage string with no tracking declaration.)
- **Third-party partners:** none. The app bundles no third-party SDK that reports off-device.

## What the reviewer can verify

The app requests exactly one runtime permission: notifications. iOS will also show the audio
background mode, which is declared for keeping the ring audible while the phone is locked, not for
collecting anything. The privacy label and the description ("no account, no ads, no analytics") agree
with each other and with the binary.

## Before pressing Publish

1. The build attached to the version must be the same build whose code was read here — attach only
   a build cut from `feat/real-alarms` (or its merge commit). A build from `main` predates real alarms
   and the light theme.
2. Confirm from the `.ipa` that `NSMicrophoneUsageDescription` is gone (gate C7). A mic string with no
   microphone use invites a review question even though it does not change the data answer.
3. If PostHog or any analytics is added later, this label must be rewritten in the same release — not after.

## Google Play equivalent (not submitted in this task)

Play's Data safety form is a separate declaration and is **not** covered by this file. The matching
answer would be "No data collected" only after the same binary check; the Android build still has to
exist and be tested.
