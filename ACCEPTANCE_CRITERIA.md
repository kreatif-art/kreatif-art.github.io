# Kreatif — Acceptance Criteria

Use this as a QA / release checklist. Mark each item **Pass / Fail / N/A**.

---

## 1. Authentication & roles

| ID | Criterion | Pass when |
|----|-----------|-----------|
| A1 | Sign up with email creates a profile | New user can log in and see Profile |
| A2 | Log in / log out works | Session persists refresh; logout clears it |
| A3 | Fan is default | New account has `is_artist = false` |
| A4 | Artist mode toggle | Profile → turn on/off Artist mode; state persists |
| A5 | Admin route protected | Non-admin cannot use `/admin` tools |

---

## 2. Upload access (artist-only)

| ID | Criterion | Pass when |
|----|-----------|-----------|
| U1 | Navbar Upload hidden for fans | Fan login: no orange Upload control |
| U2 | Navbar Upload visible for artists | Artist login: Upload links to `/upload` |
| U3 | Home CTA for fans | Shows **Enable artist mode** → Profile (not Upload) |
| U4 | Home CTA for artists | Shows **Upload work** → `/upload` |
| U5 | Home CTA for guests | Shows **Join Kreatif** → signup |
| U6 | Browse empty-state action | Fan → enable artist; artist → upload; guest → join |
| U7 | `/upload` guest interstitial | Explains sign-in; Login + Sign up links |
| U8 | `/upload` fan interstitial | Explains artist mode; link to Profile + How to upload |
| U9 | `/upload` artist | Full upload form loads |

---

## 3. Upload standards (technical)

| ID | Criterion | Pass when |
|----|-----------|-----------|
| S1 | Music format | Only MP3 accepted; other types rejected with message |
| S2 | Music size | Reject over 15 MB |
| S3 | Music duration | Reject under 15s or over 15 min; duration saved |
| S4 | Art format | JPEG / PNG / WebP only |
| S5 | Art file size | Reject over 10 MB |
| S6 | Art dimensions | Reject under 800×800 or over 8000×8000 |
| S7 | Cover (music) | Optional; max 5 MB; min ~600×600 |
| S8 | Genre required | Cannot submit without genre |
| S9 | Originality attestation | Required checkbox; row written on success |
| S10 | Free upload cap | Free artist blocked after monthly limit; Pro not capped the same way |
| S11 | Standards copy visible | Upload page + How to upload show limits |

---

## 4. Browse & discovery

| ID | Criterion | Pass when |
|----|-----------|-----------|
| B1 | Browse Music / Art | Lists visible content; genre filter works |
| B2 | Search under genres | Scope: track/art title vs artist; results match |
| B3 | No global nav search | Navbar has no redundant search field |
| B4 | Content detail | Title, artist, genre, media, likes load |
| B5 | Swipe / next item | Detail can move to adjacent item where implemented |

---

## 5. Sound & Sight pairs

| ID | Criterion | Pass when |
|----|-----------|-----------|
| P1 | Pair table readable | Visible pairs appear on home **below** Sound & Sight panel |
| P2 | Create artist pair | Artist can pair own music ↔ own art from detail |
| P3 | Create curated pair | Logged-in user can curate visible works |
| P4 | Pair panel on detail | Shows linked other work; Open / Play where music |
| P5 | Unpair | Creator can remove own pair |
| P6 | Home order | Hero → Sound & Sight chapter → Paired works (no Top 10 CTA on home) |

---

## 6. Engagement

| ID | Criterion | Pass when |
|----|-----------|-----------|
| E1 | Like | Auth user can like/unlike; count updates |
| E2 | Subscribe | Auth user can follow artist; state persists |
| E3 | Tip UI | Fan can open tip modal; fee split shows 10% / 90% |
| E4 | Tip pending without Stripe | Tip saved pending; friendly “Tip recorded” (no raw Edge Function error) |
| E5 | Cannot tip self | Blocked with message |

---

## 7. Player & analyser

| ID | Criterion | Pass when |
|----|-----------|-----------|
| M1 | Play track | Mini player shows; audio plays |
| M2 | Pause / seek / volume | Controls work |
| M3 | Analyser graph | After play gesture, `getAnalyserData` returns data when CORS allows |
| M4 | AudioBars | Bars animate while playing (when analyser works) |
| M5 | Synesthetic bg | Motion increases with playback energy when analyser works |

---

## 8. Monetization (when Stripe configured)

| ID | Criterion | Pass when |
|----|-----------|-----------|
| $1 | Tip checkout | Pay opens Stripe Checkout; webhook marks tip completed |
| $2 | Artist balance | After paid tip, artist `tip_balance_cents` += 90% |
| $3 | Pro checkout | Artist can start Pro ($9.90/mo) Checkout when configured |
| $4 | Connect onboard | Artist Profile → Connect Stripe Express opens Account Link |
| $5 | Request payout | With `payouts_enabled` and balance ≥ $5, transfer succeeds in test mode |
| $6 | Unconfigured Stripe | UI explains beta / pending; no crash |

*If Stripe secrets + functions are not deployed: $1–$5 = N/A; $6 must Pass.*

---

## 9. Pro vs free artist

| ID | Criterion | Pass when |
|----|-----------|-----------|
| R1 | Pro badge | Pro artist shows Pro treatment on profile/content where designed |
| R2 | Feature eligibility | Pro can feature (within rules); free sees upgrade path |
| R3 | Upload limits | Free hits monthly cap messaging; Pro does not use free cap |

---

## 10. Quality / regression smoke

| ID | Criterion | Pass when |
|----|-----------|-----------|
| Q1 | Hard refresh loads latest assets | No stuck old hero / old tip error string |
| Q2 | Mobile nav | Menu works; artist-only Upload rule holds |
| Q3 | Protected media paths | Upload path ownership / size limits still enforced server-side |
| Q4 | RLS | Fan cannot insert content; artist can |

---

## Suggested test accounts

| Role | Account |
|------|---------|
| Pro artist | `kreatif@kreatif.app` |
| Fan | `team.maya@kreatif.test` / `Team2026!` |
| Pro artist | `team.nova@kreatif.test` / `Team2026!` |
| Admin | `admin@kreatif.app` |

---

## Release gate (minimum)

**Ship beta invite only if:**

- [ ] Section 2 (Upload access) all Pass  
- [ ] Section 3 core rejects (S1–S6) Pass  
- [ ] Section 6 E3–E4 Pass  
- [ ] Section 8 $6 Pass (or $1–$2 if Stripe live)  
- [ ] Q1 Pass  

**Ship “payments live” only if:**

- [ ] Section 8 $1–$5 Pass in Stripe **test** mode  
- [ ] Connect onboarding return updates profile flags  

---

*Last updated: 2026-08-22 — aligns with Upload gating, pairs, analyser, tip pending UX, Connect scaffolding.*
