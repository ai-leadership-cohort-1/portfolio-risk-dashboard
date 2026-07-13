# NAB Slide Layouts — 2024 "EVO" template

Source of truth: `ppt/slideMasters/` + `ppt/slideLayouts/` of
**NAB PPT Template_16x9_18Oct24**. Positions below are in **inches**
(`914400 EMU = 1 inch`).

## Canvas
- **Slide size: `9144000 × 5143500` EMU = `10″ × 5.625″` — standard 16:9
  (`type="screen16x9"`).** Unlike the 2023 metric deck, this is PowerPoint's
  default widescreen size.

## Structure: 15 masters × 60 layouts
The template is organised into **15 slide masters, each a functional family** of
layouts (60 in total). When cloning with python-pptx, find a layout **by name**
across all masters (see SKILL.md) rather than relying on a flat index.

| Master | Family | Layouts |
|--------|--------|---------|
| master[0] | How‑To (instructional — **do not ship**) | How‑To using this template, paragraph styles, colour, accessibility |
| master[1] | **Covers** | WHITE cover, BLACK cover, RED cover, IMAGE cover, PANEL at right_ cover 1–2, PANEL at left_ cover 2–4 |
| master[2] | **Dividers** | Divider_white, Divider_red, 1_Divider_black |
| master[3] | **Feature / special** | Feature 1–6, Indigenous Acknowledgement slide |
| master[4] | **Content** | 1_Title and Content, Two Content, 1_Two Content, 2_Two Content, Content with iPad/Laptop/TV graphic/Watch (+1_Content with iPad) |
| master[5] | Graphs/Charts 1–4 | data viz frames |
| master[6] | Meet the team 1–3 | team grids |
| master[7] | Table 1–3 | table frames |
| master[8] | Case Study | 4‑column case study |
| master[9] | Table of contents 1–2 | TOC / agenda |
| master[10] | Boxed layout 1–3 | boxed cards |
| master[11] | Milestone 1–2, Roadmap 1–2, flow chart | process/timeline |
| master[12] | Dashboard 1–3 | KPI dashboards |
| master[13] | Call out 1, Quote 1 | pull quote / callout |
| master[14] | Questions, Thank You 1 | closing |

> python-pptx master indices are 0‑based and were verified against the included
> `nab-template-2024.pptx`: covers=`master[1]`, dividers=`master[2]`,
> content=`master[4]`. The ordering can shift if PowerPoint re‑saves the file, so
> **always resolve by layout name.**

## Key placeholder geometry (inches: x,y  w×h)

### Content master (master[4]) defaults
| Placeholder | x, y | w × h |
|---|---|---|
| Title (`title`) | 0.28, 0.31 | 8.90 × 0.62 |
| Body (`body`/1 or /10) | 0.29, 1.08 | 9.08 × 4.10 |
| Footer (`ftr`/3) | 5.00, 5.33 | 4.60 × 0.25 |
| Slide number (`sldNum`/4) | 9.62, 5.35 | 0.22 × 0.24 |

### Core content layouts
| Layout | Placeholders (type/idx → x,y w×h) |
|---|---|
| **1_Title and Content** | title 0.28,0.31 8.9×0.62 · body/10 0.28,1.08 9.09×4.1 |
| **Two Content** | body/10 0.29,1.08 4.32×4.1 · body/11 5.04,1.08 4.32×4.1 |
| **1_Two Content** (3‑col) | body/10 0.28,1.08 2.79×4.1 · body/12 3.44,… · body/11 6.59,… (each 2.79×4.1) |
| **Content with iPad** | body/29 0.65,1.5 4.42×3.3 (device pic) · body/30 6.17,1.08 3.2×4.1 (text) |
| **Boxed layout 1** | 2 pics (4.28×1.9) over 2 text boxes (3.83×1.98) + small label boxes |
| **Feature 1** | title · body/15 0.29,1.28 4.01×3.9 (text) · pic/14 5.46,1.28 4.54×3.82 (image) |
| **Case Study** | 4 body columns (2.21×4.1) at x = 0.29 / 2.83 / 5.41 + pull box 8.11,1.39 |
| **Meet the team 1** | 4 photo frames (2.18×1.34) + 4 bio boxes (1.89×2.51) |

### Covers (master[1]) — title is large, brandmark top‑right
All three share: title `0.51,0.88 7.27×2.29`, subtitle `body/12 0.5,~3.18 5.84×1.12`,
small line `body/13 0.5,5.1 5.79×0.22`, plus the NAB **star** at ~`8.94,0.29 0.77×0.79`.
| Layout | Background (`<p:bg>`) | Title colour | Star |
|---|---|---|---|
| WHITE cover | white (`bg1`) | black | red (`nab-star-red`) |
| RED cover | red `#ED0000` (`accent1`) | white | white (`nab-star-white`) |
| BLACK cover | black `#000000` (`tx1`) | white | red/white |
| IMAGE cover | full‑bleed photo | white | white |
| PANEL covers | photo + black/white/red side panel | per panel | per panel |

### Dividers (master[2])
Title `0.5,2.18 4.5×1.27`, label `body/14 0.5,4.04 2.36×1.18`, full‑bleed `pic/13 0,0 10×5.64`.
`Divider_white` = white bg, `Divider_red` = red bg (`accent1`), `1_Divider_black` = black bg.

### Closing (master[14])
- **Quote 1** — big title (quote) `1.26,0.84 7.22×3.44`, attribution `body/10 1.26,4.31`.
- **Thank You 1** — centred title band `0,2.54 10×1.18`.

## Logos & media
- Fonts are **not** embedded. Source media lives in `ppt/media/`.
- The brandmark is the **NAB red 7‑point star** (modern NAB uses the star alone, no
  wordmark in this deck). Copied into `assets/` (see assets/README.md):
  `nab-star-red.png` (hi‑res), `nab-star-red-sm.png`, `nab-star-white.png`
  (for red/dark backgrounds).
- Brandmark sits **top‑right** on covers (~`8.94″, 0.29″`, ~`0.77″` square).

## HTML layout classes (mirror the slide layouts)

```css
.nab-slide { aspect-ratio: 16 / 9; background: var(--nab-white);
             padding: 5.5% 2.8%; box-sizing: border-box; position: relative; }
.nab-slide .nab-title { color: var(--nab-red); margin: 0 0 .6rem; }
.nab-two-content  { display: grid; grid-template-columns: 1fr 1fr; gap: 7%; }
.nab-three-content{ display: grid; grid-template-columns: repeat(3,1fr); gap: 6%; }
.nab-cover--white { background: var(--nab-white); }            /* black title, red star */
.nab-cover--red   { background: var(--nab-red);   color:#fff;} /* white title, white star */
.nab-cover--black { background: var(--nab-black); color:#fff;} /* white title, white star */
.nab-cover .nab-star { position:absolute; top:5%; right:2.8%; width:7.7%; }
.nab-footer { position:absolute; bottom:3.9%; left:2.8%; right:2.8%;
              display:flex; justify-content:space-between;
              font-size:.78rem; color: var(--nab-black); }
```
