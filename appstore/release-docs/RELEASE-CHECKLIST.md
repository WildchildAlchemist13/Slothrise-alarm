# Slothrise 1.0.0 — release checklist (iOS)

State as read from `feat/real-alarms` at 4ecad75 on 12 Nov 2026. Nothing here was entered into App
Store Connect; that is deliberate and out of scope for this task.

Legend: **DONE** verified · **DRAFT** written, not submitted · **TODO** work remains · **BLOCKED** needs
something only Revanth can supply · **UNKNOWN** could not be checked without signing in.

## A. Binary and signing

| # | Gate | Owner | Status | Notes |
|---|---|---|---|---|
| A1 | Signed iOS device build (ad-hoc or TestFlight) | Revanth + App Engineer | **BLOCKED** | `eas build --profile development --platform ios` stops at "couldn't find any credentials suitable for internal distribution". Needs an interactive `eas credentials` sign-in and the iPhone's UDID registered. Both are Revanth's Apple ID actions. |
| A2 | Production build profile exists | App Engineer | **DONE** | `app/eas.json`: `production` with `autoIncrement: true`, `environment: production`. Never run. |
| A3 | EAS project linked | App Engineer | **DONE** | `app.json` `extra.eas.projectId = f4412f05-…`, owner `revanthsharma`. |
| A4 | Bundle id / version | App Engineer | **DONE** | `com.slothrise.app`, 1.0.0, `supportsTablet: false`. Re-verify from the built `.ipa` at upload time. |
| A5 | Export compliance | App Engineer | **DONE** | `ITSAppUsesNonExemptEncryption: false` in `app.json`; answer "does not use encryption" in the console. |
| A6 | `expo-dev-client` absent from the production binary | App Engineer | **TODO** | It is a dependency in `package.json`. The `production` profile does not set `developmentClient`, so the launcher should be excluded — confirm no `EXDevLauncher` / `ExpoDevMenu` in the `.ipa` before upload. |
| A7 | App icon | Design | **DONE** | `app/assets/icon.png` is 1024 × 1024. App Store icons must have no transparency — check it, and confirm it is the v2 light icon, not the purple original. |
| A8 | Time Sensitive delivery actually works | App Engineer | **TODO** | `src/alarms.ts` sets `interruptionLevel: 'timeSensitive'`, and the repo declares no entitlements. Apple's API doc says the level "can break through system controls such as Notification Summary and Focus"; nothing in the repo or Expo's plugin proves it will in the signed build. Test with Focus on, on device, and check the `.ipa` entitlements. If it does not break Focus, soften the claim in the review notes and do not imply it in the listing. |
| A9 | APNs entitlement | App Engineer | **TODO** | `expo-notifications` adds the APNs entitlement by default (`enableRemoteNotifications: true`). The app is local-notification only; set `"enableRemoteNotifications": false` so the binary does not claim a push capability it never uses. |

## B. The thing that decides the review

| # | Gate | Owner | Status | Notes |
|---|---|---|---|---|
| B1 | Ring test on a real, locked, pocketed iPhone | Revanth + App Engineer | **TODO** | Verified only in the simulator (`DeliveredNotifications.plist`). No hardware test exists. Must cover: ringer on, silent switch on, Focus on, screen locked, phone in a pocket, overnight. Record the outcome in the review notes if it differs from the description. |
| B2 | Mute switch behaviour accepted as a limitation | Revanth | **UNKNOWN** | iOS local notifications cannot override the silent switch and sound once, not until dismissed. This is a product decision, not a bug to hide. Guideline 4.2 minimum functionality is the real risk for an alarm app that can be silenced. |
| B3 | Android parity | App Engineer | **TODO** | Build `5831c912…` was queued when the PR opened; the resource-name failure that blocked prebuild was fixed in 4ecad75 (`alarm_chime.wav`). Parity remains unproven. Not an iOS gate; a Play gate. |
| B4 | Demo/preview path for the reviewer | App Engineer | **DONE** | "Try the alarm right now" on the welcome screen is in the release build (only Home's "TRY IT" shortcuts are `__DEV__`-gated). |
| B5 | In-app purchases | — | **N/A** | No purchase code in the binary. The designed paywall ($19.99/yr, $49.99 lifetime) is not implemented; do not write IAP metadata or attach products to this version. |
| B6 | Gentle mode timings | App Engineer | **TODO** | `SUNRISE_S = 15`, `BACKUP_S = 30` in `src/GentleScreen.tsx` — demo values, commented as such. The description and review notes say three minutes and five. Set 180/300 for the release build, or change the copy to 15/30. |

## C. Store assets and copy

| # | Gate | Owner | Status | Notes |
|---|---|---|---|---|
| C1 | Metadata | Store Release | **DRAFT** | `app-store-metadata.md`: every field within limit (name 25/30, subtitle 29/30, promo 163/170, description 2118/4000, keywords 96/100). |
| C2 | Screenshots | Design + Store Release | **TODO** | All five at `appstore/` are stale (dark theme, invented 7-day streak) and the wrong size class. Spec: `screenshot-spec.md`, five shots at 1206 × 2622. |
| C3 | App Privacy label | Store Release | **DRAFT** | "No, we do not collect data from this app." Sequence and code evidence: `privacy-nutrition-label.md`. |
| C4 | Age rating | Store Release | **DRAFT** | 4+, every content answer None. Record the tier the console actually offers. |
| C5 | Support URL live | Store Release | **DONE** | `https://slothrise-static-website-interactive-yd7gvtjqay.openbot.site` — 200, verified by curl on 12 Nov 2026. The openbot.site copy expires **2026-12-12**. |
| C6 | Privacy Policy URL live | Store Release | **DONE** | `https://slothrise-static-website-interactive-yd7gvtjqay.openbot.site/privacy.html` — 200, verified by curl on 12 Nov 2026. Same 30-day expiry. The live page's Gentle-mode line reads "turns the screen from night into dawn", which is what the code does. |
| C7 | Unused microphone usage string removed | App Engineer | **TODO** | `app.json` passes only `recordAudioAndroid: false` to the expo-audio plugin, whose default `microphonePermission` still writes `NSMicrophoneUsageDescription`. Add `"microphonePermission": false`. One line; costs one rebuild. |
| C8 | Review notes | Store Release | **DRAFT** | In `app-store-metadata.md`; states the mute-switch limit plainly. |
| C9 | Copyright | Store Release | **DRAFT** | `2026 Wildchild Alchemist`. |
| C10 | Permanent home for both pages | Revanth | **TODO** | The openbot.site publish expires 2026-12-12, which is fine for a review cycle but not for a policy URL that must stay reachable. Lasting fix: commit the same two files to `docs/slothrise/` in `BubbleWraps` and push (Pages serves `main` `/docs`), then swap the URLs. Needs Revanth's GitHub write. Do it before 12 Dec, or before the next review submission, whichever is first. |

## D. Account and submission

| # | Gate | Owner | Status | Notes |
|---|---|---|---|---|
| D1 | App Store Connect app record exists | Revanth | **UNKNOWN** | Not checked — no App Store Connect access was used. If no record exists, create one with bundle id `com.slothrise.app` and the name from C1 before any build can be attached. |
| D2 | Apple Developer team | Revanth | **REPORTED** | Team `NW9466J23A` on this Mac. Ownership/role not verified. |
| D3 | Paid Apps agreement / banking / tax | Revanth | **N/A** | App is free with no IAP. Only needed if a paywall ships. |
| D4 | EU availability and trader status | Revanth | **UNKNOWN** | A decision, not a check. Pop Sheet's console showed the developer identified as a trader with no EU restriction; this app needs the same declaration reviewed. |
| D5 | Submit for review | Revanth | **NOT TOUCHED** | Explicitly out of scope until the build is signed and approved. |

## The shortest honest sequence

1. Revanth: `eas credentials` sign-in + register the iPhone UDID → A1.
2. App Engineer: A6, A9, C7, then a production build; check A8 from the `.ipa`.
3. Revanth: one overnight locked-phone ring test (B1). If it fails, stop — the product, not the listing, is the problem.
4. Design: five 1206 × 2622 captures (C2).
5. Pages are live (C5, C6) on the temporary openbot.site host. Before 12 Dec 2026, or before the next
   submission, Revanth commits the same two files to `docs/slothrise/` in `BubbleWraps` and the URLs move (C10).
6. Store Release: enter C1, C3, C4, C8 into the console and save; attach the build.
7. Revanth: submit, or hold for manual release.
