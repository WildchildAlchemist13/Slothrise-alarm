# Slothrise — what actually blocks submission today

Four things. Two are about the product; one is pixels, one is account state.

| # | Blocker | Why it blocks | Owner |
|---|---|---|---|
| 1 | No signed device build | `eas build --platform ios` fails at credential selection: no distribution certificate or profile exists, and no iPhone UDID is registered. | Revanth |
| 2 | No real-hardware ring test | The alarm has only been proven in the simulator. A locked, pocketed, overnight iPhone has never run this app. | Revanth + App Engineer |
| 3 | No usable screenshots | All five are dark-theme at 1290 × 2796 and show a 7-day streak a new install cannot have. | Venture Design |
| 4 | App Store Connect state unknown | Whether an app record exists for `com.slothrise.app` has not been checked, and no build can be attached until it does. | Revanth |

## Which of these only Revanth can do

| Blocker | Why it is his alone |
|---|---|
| 1 | Apple ID sign-in, 2FA, distribution certificate and registering the phone's UDID are account actions. |
| 2 | Someone has to leave a phone locked and asleep overnight and report what happened. |
| 4 | App Store Connect access, and the decision to create the record. |

Blocker 3 is design work, not account work: Venture Design can capture and composite it.

The two required URLs are now live on a temporary openbot.site host (expires 12 Dec 2026), so they no
longer block review. Their lasting home is `docs/slothrise/` in `BubbleWraps` — checklist gate C10.

## Decisions that are not blockers but will bite later

- **The mute switch.** iOS local notifications cannot override it, and the alarm sounds once rather than
  until dismissed. Do not ship a listing that claims otherwise; the current metadata states the limit.
  Guideline 4.2 (minimum functionality) is the real rejection risk for an alarm that can be silenced.
- **Unused microphone string.** `NSMicrophoneUsageDescription` is written by the expo-audio plugin's
  default. One line in `app.json` (`"microphonePermission": false`) removes it; do it before review.
- **Time Sensitive capability.** The code asks for `timeSensitive` but the repo declares no entitlement.
  Check the `.ipa`; if it is missing, Focus may not be broken and the alarm's main promise weakens.
- **APNs entitlement.** Added by default although the app is local-notification only. Set
  `enableRemoteNotifications: false`.
- **Android.** The build never completed (resource-name bug fixed at 4ecad75, not re-run). Parity is
  unproven, so a Play submission is further away than the iOS one.
- **Gentle mode is still on demo timings.** `SUNRISE_S = 15`, `BACKUP_S = 30` in `src/GentleScreen.tsx`,
  while the README, description and review notes describe 180 s and 300 s. Fix the constants (one commit)
  or change the copy before the build goes to review.
- **IAP.** No purchase code in the binary. The designed $19.99/yr + $49.99 lifetime paywall is design
  only — do not attach products or write subscription metadata for 1.0.
