# Slothrise 1.0.0 — release checklist (iOS)

State as read from `feat/real-alarms` at 78fb9f0 on 13 Nov 2026. Nothing here was entered into App
Store Connect; that is deliberate and out of scope for this task. Where a gate says "Release build",
it means the simulator Release build at `/tmp/shots/dd/Build/Products/Release-iphonesimulator`,
which is fb8415b plus bb744e2 and **not** fc70f6c: its `main.jsbundle` contains
`getLastNotificationResponseAsync` but no `nextRing` or `SNOOZED` string, so the snooze countdown is
absent from it. A signed `.ipa` was still not available.

A newer simulator Release build also exists at
`/tmp/sloth-build/dd/Build/Products/Release-iphonesimulator/Slothrise.app`, built from `a2db273`:
adhoc/linker-signed, `x86_64 arm64`, `main.jsbundle` carries `nextRing` and `SNOOZED`, all three sounds
present at source size, no `EXDevLauncher` / dev-menu file. It is not a device build and it is not signed
for distribution, so it moves neither A1 nor B1.

Legend: **DONE** verified · **DRAFT** written, not submitted · **TODO** work remains · **BLOCKED** needs
something only Revanth can supply · **UNKNOWN** could not be checked without signing in.

## Build environment (local, 13 Nov 2026)

`expo prebuild`'s own `pod install` aborts on this Mac with CocoaPods 1.17.0 / Ruby 4.0.6 when the locale
is not UTF-8 (`UnicodeNormalization` error; `LANG` and `LC_ALL` unset in a plain shell). Re-run
`pod install` with `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8` — exit 0, no project or code change. Toolchain
issue, not an app defect; expect it in a signed production build too.

## A. Binary and signing

| # | Gate | Owner | Status | Notes |
|---|---|---|---|---|
| A1 | Signed iOS device build (ad-hoc or TestFlight) | Revanth + App Engineer | **BLOCKED** | `eas build --profile development --platform ios` stops at "couldn't find any credentials suitable for internal distribution". Needs an interactive `eas credentials` sign-in and the iPhone's UDID registered. Both are Revanth's Apple ID actions. |
| A2 | Production build profile exists | App Engineer | **DONE** | `app/eas.json`: `production` with `autoIncrement: true`, `environment: production`. Never run. |
| A3 | EAS project linked | App Engineer | **DONE** | `app.json` `extra.eas.projectId = f4412f05-…`, owner `revanthsharma`. |
| A4 | Bundle id / version | App Engineer | **DONE** | `com.slothrise.app`, 1.0.0, `supportsTablet: false`. Re-verify from the built `.ipa` at upload time. |
| A5 | Export compliance | App Engineer | **DONE** | `ITSAppUsesNonExemptEncryption: false` in `app.json`; answer "does not use encryption" in the console. |
| A6 | `expo-dev-client` absent from the production binary | App Engineer | **DONE** | `expo-dev-client` stays a dependency, but `eas.json` `production` sets no `developmentClient`, and the Release `.app` contains no `EXDevLauncher` / `ExpoDevMenu` file (`find` over the bundle: none). Re-check the `.ipa` at upload; this is a simulator Release build, not a signed one. |
| A7 | App icon | Design | **TODO** | `app/assets/icon.png` is 1024 × 1024 and opaque (no alpha), but it is the **v1 flat-lavender sloth**, not the v2 icon. The v2 SVG exists (`brand/slothrise-icon-v2-square.svg`) but carries a flat `<rect y="500" width="605" height="105" fill="#4A22B8"/>` — a hard purple bar across the bottom fifth — so rasterising it produces a visible band, and the asset needs fixing before it can ship as v2. Decision is Design's. |
| A8 | Time Sensitive delivery actually works | App Engineer | **TODO** | `src/alarms.ts` sets `interruptionLevel: 'timeSensitive'`, and the repo declares no entitlements. Apple's API doc says the level "can break through system controls such as Notification Summary and Focus"; nothing in the repo or Expo's plugin proves it will in the signed build. Test with Focus on, on device, and check the `.ipa` entitlements. If it does not break Focus, soften the claim in the review notes and do not imply it in the listing. |
| A9 | APNs entitlement | App Engineer | **DONE** | `app/app.json:52` sets `"enableRemoteNotifications": false`, so `expo-notifications` does not add the APNs entitlement. Confirm from the signed `.ipa` at upload. |

## B. The thing that decides the review

| # | Gate | Owner | Status | Notes |
|---|---|---|---|---|
| B1 | Ring test on a real, locked, pocketed iPhone | Revanth + App Engineer | **TODO** | The re-fire chain is proven in the simulator only: at fb8415b, app killed, SpringBoard delivered **10 chimes over 4 min 28 s**, 30 s apart, and stopped once the ring screen opened (QA, `FINDINGS-fb8415b.md`, `/tmp/slothrise-qa/chain1.log`). No hardware test exists. Must cover: ringer on, silent switch on, Focus on, screen locked, phone in a pocket, overnight. Record the outcome in the review notes if it differs from the description. |
| B2 | Mute switch behaviour accepted as a limitation | Revanth | **UNKNOWN** | iOS local notifications still cannot override the silent switch — with the ringer off, the whole chain is silent. It does now repeat (~5 minutes, 10 chimes), so the old "sounds once" concern is gone; what remains is silence on the mute switch, and Highlight 4.2 minimum functionality. Product decision, not a bug to hide. |
| B3 | Android parity | App Engineer | **TODO** | Build `5831c912…` was queued when the PR opened; the resource-name failure that blocked prebuild was fixed in 4ecad75 (`alarm_chime.wav`). Parity remains unproven. Not an iOS gate; a Play gate. |
| B4 | Demo/preview path for the reviewer | App Engineer | **DONE** | "Try the alarm right now" on the welcome screen is in the release build (only Home's "TRY IT" shortcuts are `__DEV__`-gated). |
| B5 | In-app purchases | — | **N/A** | No purchase code in the binary. The designed paywall ($19.99/yr, $49.99 lifetime) is not implemented; do not write IAP metadata or attach products to this version. |
| B6 | Gentle mode timings | App Engineer | **DONE** | `src/GentleScreen.tsx:15-16`: `SUNRISE_S = 180`, `BACKUP_S = 300`, matching the copy. The 15/30 values are now separate `DEMO_*` constants (`:19-20`). |

## C. Store assets and copy

| # | Gate | Owner | Status | Notes |
|---|---|---|---|---|
| C1 | Metadata | Store Release | **DRAFT** | `app-store-metadata.md`: every field within limit (name 25/30, subtitle 29/30, promo 163/170, description 2118/4000, keywords 96/100). |
| C2 | Screenshots | Design + Store Release | **TODO** | All five at `appstore/` are stale (dark theme, invented 7-day streak) and the wrong size class. Spec: `screenshot-spec.md`, five shots at 1206 × 2622. |
| C3 | App Privacy label | Store Release | **DRAFT** | "No, we do not collect data from this app." Sequence and code evidence: `privacy-nutrition-label.md`. |
| C4 | Age rating | Store Release | **DRAFT** | 4+, every content answer None. Record the tier the console actually offers. |
| C5 | Support URL live | Store Release | **DONE** | `https://slothrise-static-website-interactive-yd7gvtjqay.openbot.site` — 200, verified by curl on 12 Nov 2026. The openbot.site copy expires **2026-12-12**. |
| C6 | Privacy Policy URL live | Store Release | **DONE** | `https://slothrise-static-website-interactive-yd7gvtjqay.openbot.site/privacy.html` — 200, verified by curl on 12 Nov 2026. Same 30-day expiry. The live page's Gentle-mode line reads "turns the screen from night into dawn", which is what the code does. |
| C7 | Unused microphone usage string removed | App Engineer | **DONE** | `app/app.json:43` sets `"microphonePermission": false`, and the Release `Slothrise.app/Info.plist` has no `NSMicrophoneUsageDescription` (PlistBuddy: does not exist). |
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
2. App Engineer: production build; check A6, A8, A9 from the `.ipa` (the code side of A6, A9 and C7 is
already done). Design: the A7 icon decision, which is the only binary asset still wrong.
3. Revanth: one overnight locked-phone ring test (B1). If it fails, stop — the product, not the listing, is the problem.
4. Design: five 1206 × 2622 captures (C2).
5. Pages are live (C5, C6) on the temporary openbot.site host. Before 12 Dec 2026, or before the next
   submission, Revanth commits the same two files to `docs/slothrise/` in `BubbleWraps` and the URLs move (C10).
6. Store Release: enter C1, C3, C4, C8 into the console and save; attach the build.
7. Revanth: submit, or hold for manual release.
