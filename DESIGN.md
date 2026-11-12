# WebScrapeX design notes

**Identity: a field instrument.** WebScrapeX is a tool that measures pages and reports readings, so the UI borrows from lab and bench equipment: warm paper, graphite ink, one signal-orange colour for "act here", mono labels like the printing on an instrument panel. It should feel precise and calm, not like a marketing site.

## Palette (OKLCH, `app/globals.css`)

| Token | Light | Dark | Use |
|---|---|---|---|
| `background` | `0.975 0.006 85` warm paper | `0.165 0.01 255` graphite bench | page |
| `card` | `0.995 0.003 85` | `0.2 0.012 255` | panels, tables |
| `muted` | `0.948 0.008 85` | `0.245 0.013 255` | hover, chips, table heads |
| `foreground` | `0.22 0.014 255` | `0.94 0.008 85` | text |
| `muted-foreground` | `0.46 0.014 255` | `0.72 0.012 255` | secondary text (AA on both) |
| `primary` | `0.70 0.172 48` signal orange | `0.77 0.155 58` amber | primary buttons, active marks, selection — always with dark `primary-foreground` text |
| `primary-ink` | `0.50 0.16 42` | `0.81 0.135 62` | orange **text** and links (AA on background) |
| `accent` | `0.55 0.12 165` probe green | `0.80 0.14 162` | success, "allowed", completed |
| `danger` / `warning` | red 27° / ochre 75° | lifted for dark | errors, robots blocks, setup gaps |

Dark mode is tuned separately: surfaces step *up* in lightness, orange shifts toward amber so it reads as a lit readout instead of a glaring fill, and shadows become deeper and inset.

## Type

- **Display:** Bricolage Grotesque (headings, big numbers) — characterful, slightly condensed, tight `-0.02em` tracking.
- **UI:** IBM Plex Sans 15 px body, 13–14 px controls.
- **Data:** IBM Plex Mono for URLs, selectors, counts, timestamps and the `label-mono` eyebrow (11 px, caps, 0.08em).
- Scale: 11 / 13 / 15 / 17 / 20 / 24 / 30 / 40–48 px.

## Shape & spacing

- 4/8 px grid. Page gutters 16 px (mobile) → 24 → 40 px. Content max width 1240 px.
- Radius: 5 px chips, 7 px controls, 10 px panels, 14 px sheets. Hairline 1 px borders everywhere; shadows are low and only on panels.
- Motifs: the **capture-frame** logo (four corner brackets around a sample point), a faint **measuring grid** behind the console header only, **readout strips** (the result page's status/http/size/time row), mono **GET** chip in the URL bar.

## Layout

- Desktop: 248 px left rail (nav, Ctrl+K jump, theme, account) + content.
- Mobile: top bar + bottom tab bar (Console, History, Schedules, AI, More sheet). Touch targets ≥ 44 px. Wide tables scroll inside their frame; the page never scrolls sideways.
- Varied sections: command bar + side pre-flight panel (console), readout strip + tabs (result), card grid (schedules), table (history, API endpoints), split screen with a live sample table (auth).

## Motion

- 150–300 ms, `cubic-bezier(0.25, 1, 0.5, 1)` (ease-out-quart). `motion/react` with `LazyMotion` + `domAnimation`.
- Uses: staggered list entry, field rows sliding in/out, accordion height for the Fields panel, scanning bar + stage readout while a scrape runs, count-up stats, SEO dial sweep, dialog settle.
- `MotionConfig reducedMotion="user"` and a global `prefers-reduced-motion` CSS override.

## Don'ts

No gradient heroes, glass panels, blobs, emoji icons, or three identical icon cards. Orange is never used for body text (use `primary-ink`). Never show env values in the UI — only whether they are set.
