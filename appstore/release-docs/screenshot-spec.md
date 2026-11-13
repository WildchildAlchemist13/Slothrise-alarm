# Slothrise — screenshot spec (iPhone, App Store)

## Size: this is the part that changed

Apple's published specification, checked today (12 Nov 2026) at
`developer.apple.com/help/app-store-connect/reference/screenshot-specifications`:

- **Required for any iPhone app:** at least one screenshot for **"iPhone with Dynamic Island (medium
  display)"**. Accepted portrait sizes: **1179 × 2556** or **1206 × 2622**.
- **"iPhone with Dynamic Island (large display)"** (1320 × 2868, 1290 × 2796, 1260 × 2736) is *not*
  required, and the console scales the medium shot up if the large one is missing.
- No 6.7"/6.9" slot is required any more; the old 1290 × 2796 class is a large-display size only.

**Target: 1206 × 2622 PNG, portrait, sRGB, no transparency, 5 shots.** That is exactly the iPhone 16
Pro simulator at 3× (402 × 874 pt), so captures need no resampling — which is the whole point.

In this account's console (Pop Sheet, 12 Nov 2026) the 6.9" slot did not appear at all, and 1320 × 2868
files were refused as "dimensions invalid" until 1206 × 2622 copies were supplied — so 1206 × 2622 is the
safe target regardless of what the published table lists.

The five files in `appstore/` are 1290 × 2796 and cannot be reused (see "Why the existing shots are
dead" below).

## Why the existing shots are dead

Verified by opening them, not assumed:

- `slothrise-store-1.png` — deep purple/indigo panorama. The app has been warm paper (#FFF8EE) since the
  redesign; `app.json` is now `userInterfaceStyle: "light"`.
- `slothrise-store-4.png` — shows **"7 day streak"** with six lit days, and a floating routine card reading
  **"2 / 5"** with two habits struck through. A fresh install has `streak: 0`, `wins: []`, every habit
  `lastDone: null` (`src/state.ts`), so this state cannot occur on day one.
- The compositor (`tools/compose_store.py`) is built for the old theme: purple gradient `#3A26C4 → #FFD27A`,
  cream-on-dark status bar, `W, H, N = 1290, 2796, 5`, and hardcoded `/home/user/...` paths.

Reusing any of them would put a screenshot in review that no reviewer can reproduce in the app.

## The five shots

All five show real screens from a **Release-configuration build** on the iPhone 16 Pro simulator, Light
appearance, fresh install (delete the app between captures), status bar overridden to 9:41 with full
battery and Wi-Fi:

```bash
xcrun simctl status_bar booted override --time 9:41 --batteryState charged --batteryLevel 100 --wifiBars 3 --cellularBars 4
```

Capture with `xcrun simctl io booted screenshot shots/<name>.png` (1206 × 2622, no resize).

Capture from a **Release** build (`npx expo run:ios --configuration Release`): the Home screen's
"TRY IT" shortcuts are behind `__DEV__` and must not appear in any shot.

| # | File | Headline (overlay) | Screen to show | State to create first |
|---|---|---|---|---|
| 1 | `01-hello.png` | `Hello, wake up!!` | Brand hero — no phone. Paper background, wordmark, hanging Snooze, app chip | — |
| 2 | `02-ring.png` | `Earn your way out of bed` | Ringing screen: `HELLO, WAKE UP!!`, time `6:30`, label `Gym before the chaos`, hold button | Toggle the 6:30 alarm on, tap "Ring the 6:30 alarm now" from Home |
| 3 | `03-mission.png` | `Three sums. Then quiet.` | Mission screen: `STILL RINGING`, one sum, keypad | From the ringing screen, hold to wake; stop on the first sum |
| 4 | `04-win.png` | `Only mornings that count` | Wake win: `You're up.` / `No snooze. That one counts.` / `1 day streak`, week strip with today only filled | Answer all three sums correctly on a fresh install |
| 5 | `05-gentle.png` | `Or let the sun do it` | Gentle mode: `EASY NOW, SLEEPYHEAD`, `9:00`, `Slow start`, `Sunrise 42%`, rising warm sky | Open Gentle mode and capture at ~40 % of the 180 s sunrise |

Notes per shot:

- **1:** the mascot art in `app/assets/snooze-hang.png` is only 395 × 520 — at the ~760 px display width
  the old compositor used, it is a 1.9× upscale and will look soft. Re-render from
  `brand/source/snooze-hanging.webp` (1536 × 1024) or `brand/snooze-head.svg` instead of enlarging the PNG.
  Use the 1024 × 1024 `app/assets/icon.png` in the chip; it is the current icon.
- **2:** the ring screen's label comes from the alarm, so it reads `Gym before the chaos` with the seeded
  schedule. Do not overwrite it with invented copy.
- **3:** the sum is randomly generated (`MissionScreen.makeSum`), so capture whatever it shows — e.g.
  `24 + 37`. Do not composite a tidy sum over a blurred screen; the keypad must be the real one.
- **4:** streak must read **1**. The old "7 day streak" is the single most misleading thing in the current set.
- **5:** this must be the real Gentle screen, not the dark illustration + two floating cards the old slide 5
  used. Sunrise percentage ticks live, so capture mid-rise.

Headlines are deliberately free of the old "The alarm you can't sleep through" claim: the app cannot
override the mute switch, and a screenshot promising otherwise is a 1-star review waiting to happen.

## Compositing with `tools/compose_store.py`

The script is the right tool and the wrong theme. Changes it needs before it can produce these shots:

1. `W, H, N = 1206, 2622, 5`; the phone frame is built for a 1170 × 2532 screen — keep the 390 × 844 pt
   ratio (it is the same 19.5:9 shape) but scale `width` so the screen lands at 1206 px wide.
2. Replace the purple panorama (`.pano` gradient, `.cloud`, dark `.status`) with paper `#FFF8EE`, a single
   soft sunrise arc in `#FFB81C`/`#FF7A45`, plum ink `#2B0A22`, and a dark status bar.
3. Point `APP` and `BRAND` at this clone (`/tmp/slothrise-store-release/app`,
   `/tmp/slothrise-store-release/brand`) — the current `/home/user/...` paths do not exist on this Mac.
4. Use the real captures: slide 2 `ringing`, slide 3 `mission` (its current slide 3 fakes a mission card
   over the welcome screen), slide 4 `win`, slide 5 `gentle` (its current slide 5 has no phone at all).
5. Replace the slide-1 headline and drop the old slide-3 "tilt / push / tap" cards only if the captures no
   longer carry them — the interactions are real, so they can stay, in paper colours.
6. Render the panorama at 6030 × 2622 in headless Chrome, then slice with
   `sips --cropOffset 0 <i*1206>` five times, or render each slide as its own 1206 × 2622 page (simpler,
   no giant canvas).

## Upload order and limits

- Order 01 → 05; slot 1 is the search-result thumbnail, so the hero goes first.
- Apple allows 3–10 per display size; 5 is enough and leaves room for a routine shot later.
- No device frames are required and Apple accepts them; the current set uses them and can keep doing so.
- Localise later if the app is localised — it is English-only in 1.0.
