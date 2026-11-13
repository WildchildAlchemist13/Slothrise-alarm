# Slothrise — App Store metadata (v1.0.0)

Prepared 12 Nov 2026 for build `com.slothrise.app` 1.0.0. Every value below was character-counted
against Apple's limits. Copy is written from the code at `feat/real-alarms` (fc70f6c), not from the
design canvas — the alarm editor, Insights tab and any paywall do **not** exist in the binary and are
not described.

**Do not enter any of this into App Store Connect until Revanth approves.** An App Store Connect
record for this app is UNKNOWN and was not checked (out of scope for this task).

## Field table

| Field | Limit | Count | Value |
|---|---|---|---|
| Name | 30 | 25 | `Slothrise: Alarm & Habits` |
| Subtitle | 30 | 29 | `Alarm clock with a lazy sloth` |
| Promotional text | 170 | 163 | see below |
| Description | 4000 | 2361 | see below |
| Keywords | 100 | 96 | see below |
| Support URL | — | — | `https://slothrise-static-website-interactive-yd7gvtjqay.openbot.site` — live (200), expires 2026-12-12 |
| Privacy Policy URL | — | — | `https://slothrise-static-website-interactive-yd7gvtjqay.openbot.site/privacy.html` — live (200), expires 2026-12-12 |
| Primary category | — | — | Health & Fitness |
| Secondary category | — | — | Utilities |
| Age rating | — | — | 4+ (lowest tier), every content answer None |
| Copyright | — | — | `2026 Wildchild Alchemist` |
| Price | — | — | Free, no IAP in 1.0 |
| Version release | — | — | Manually release this version |

### Name — 25/30

```
Slothrise: Alarm & Habits
```

### Subtitle — 29/30

```
Alarm clock with a lazy sloth
```

Does not repeat the name. "Sloth" is deliberately in the subtitle, so it is out of the keyword field.

### Promotional text — 163/170

```
Pop out of bed for Snooze, the laziest alarm clock on earth. Hold to wake, solve three sums, keep your streak. Or let Gentle mode raise the sun instead of a siren.
```

Promotional text is editable without a new review, so this is the one field to refresh for a launch push.

### Keywords — 96/100, comma separated, no spaces after commas

```
wake,up,mission,math,snooze,streak,routine,morning,gentle,sunrise,focus,bedtime,early,riser,cozy
```

No word repeats the name (`slothrise`, `alarm`, `habits`) or the subtitle (`alarm`, `clock`, `lazy`, `sloth`).
`offline`, `privacy`, `minimal` and `quiet` were cut only for the 100-character budget.

### Description — 2361/4000

```
Slothrise is an alarm clock with a lazy sloth called Snooze. He would rather stay in bed. You still have to get up.

Three starter alarms are ready on the home screen — gym, a writing sprint, a slow weekend start — each on its own days, each switched on or off with one tap. Slothrise schedules them on your phone, so they ring with the app closed.

When an alarm goes off, the chime loops and Snooze swings on his branch. Press and hold to wake him, then solve three quick sums — or tap twenty times instead if numbers are not your thing. Only then does the ringing stop. He calls that earning your morning.

Then the day starts gently: the wake-up counts toward a streak, and a short morning routine gets you moving before the scroll begins.

GENTLE MODE
For mornings that need a nudge rather than a siren. Open the alarm and the screen turns from night into dawn while the bells climb from a whisper to full volume over three minutes. While the phone is still locked you hear a soft bell every 30 seconds, and tapping that notification opens the sunrise — the climb happens on screen, not in your pocket. Hold "I'm up" any time. Still in bed after five minutes? The full alarm takes over.

WHAT'S INSIDE
- Alarms scheduled on your phone, ringing with the app closed
- Hold to wake, then three sums or twenty taps, then the win
- A streak that only counts mornings you actually got up
- A short morning routine, one habit at a time
- Gentle mode: a three-minute sunrise with a backup alarm
- Warm paper design that dims after 9 pm, with a bedtime wind-down check
- Snooze the sloth, who swings when you tilt the phone and says hello when you tap him

FREE AND QUIET
No account, no sign-in, no ads, no in-app purchases, no analytics. Your alarms, habits and streak stay on your phone. Slothrise does not collect your data and does not send it anywhere.

HONEST LIMITS
Slothrise uses your phone's own notifications. On iPhone the alarm sound repeats for about five minutes — the chime, or the softer bell in Gentle mode — and it is time-sensitive, so it reaches you through Focus — but a notification cannot override the silent switch, so keep the ringer on. Android uses an exact alarm on an alarm-style channel. Ringing on silent on iPhone needs Apple's critical-alert entitlement, which Slothrise does not have.

Made by Wildchild Alchemist. Hello, wake up!!
```

Deliberate omissions, because they are not true of this binary: creating or editing alarms, more than one
mission type, widgets, Insights, per-habit streaks beyond today, and any premium tier.

**Timing caveat — resolved, keep it that way.** Two sentences assume Gentle mode's real timings ("over
three minutes", "after five minutes"). The demo binary at 4ecad75 shipped `SUNRISE_S = 15` / `BACKUP_S = 30`;
the Release build at 7168de6 was measured at the real pace (sunrise 3% → 100% at t≈293 s, chime takeover at
t≈308 s), so this copy matches the build. If those constants are ever set back for a demo or a screenshot
pass, change these numbers back rather than shipping this copy.

## Categories

- **Primary: Health & Fitness.** The app's job is waking up and a morning routine, which is the Health &
  Fitness browse path; that is also where streak-and-routine apps sit.
- **Secondary: Utilities.** An alarm clock is a utility, and the category exists for clock/timer searches.

Order is a placement choice, not a review question. Either order passes review.

## Age rating

Current tiers are 4+, 9+, 13+, 16+, 18+ (plus regional overrides the console computes itself).

| Question group | Answer |
|---|---|
| Cartoon or Fantasy Violence | None |
| Realistic Violence, Prolonged Graphic or Sadistic Realistic Violence | None |
| Profanity or Crude Humor | None |
| Mature or Suggestive Themes | None |
| Horror or Fear Themes | None |
| Medical or Treatment Information | None |
| Alcohol, Tobacco, or Drug Use or References | None |
| Simulated Gambling | None |
| Sexual Content, Nudity, Graphic Sexual Content | None |
| Guns or Other Weapons | None |
| User-generated content / messaging / chat | No |
| Advertising | No |
| Web access or unrestricted web browser | No |
| In-app purchases | No |
| Parental controls / age assurance features | None |

Expected result: **4+** across every region, with regional equivalents (Brazil 0+, Korea RCN, Vietnam)
computed by the console. Choose the lowest tier offered if the console labels the tiers differently, and
record which tier the console actually offered, since Apple revised these tiers recently.

## App Review Information

**Contact:** Revanth Sharma, `indiewrittechnology@gmail.com`; his mobile number is added at entry time and is deliberately not written into this public repo.
**Demo account:** not needed — there is no login.
**Notes:**

```
Slothrise is a single-purpose alarm clock. There is no login, no account and no network use: the app
opens on a welcome screen, and "Try the alarm right now" demonstrates the whole flow (ring → hold to
wake → three sums → wake-win → morning routine) in under a minute without waiting for a scheduled alarm.

Alarms are local notifications scheduled by the app for the three starter alarms on the home screen
(Gym 6:30 Mon/Wed/Fri; Writing sprint 7:15 weekdays; Slow start 9:00 weekends). Each can be toggled.
Notification permission is requested on first launch; without it no alarm can ring, and the bedtime
screen says so.

iOS limits we cannot change in this version: a local notification does not bypass the silent switch, and
it sounds once rather than looping until dismissed. With the ringer on, the alarm arrives as a Time
Sensitive notification carrying the app's own sound — the chime, or the softer bell in Gentle mode. Gentle mode is a
180-second rising sunrise with a full backup alarm at 300 seconds.

The app plays bundled alarm chimes and uses haptics. It never records audio and never requests the
microphone. There are no ads, no in-app purchases and no analytics in 1.0, and no data leaves the device.
```

That block contains a 300-second backup claim. It is true only after the Gentle-mode constants are set
to 180/300 (see the timing caveat above); otherwise the note must say 30 seconds.

Keep the microphone sentence only after the `microphonePermission: false` change in `RELEASE-CHECKLIST.md`
gate C7 lands; otherwise the built Info.plist carries an unused mic string that contradicts this note.

## What only Revanth can decide or supply

1. Approve the name/subtitle/category/price as written.
2. Whether the honest-limits paragraph stays in the description (it costs conversions and protects the rating).
3. Confirm the App Store Connect record exists and which Apple ID owns it.
4. Decide the EU availability and trader status declared for this app.
