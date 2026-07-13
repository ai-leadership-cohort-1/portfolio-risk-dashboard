# NAB Typography — 2024 "EVO" system

Source of truth: `<a:fontScheme name="NAB default fonts">` and the master
`txStyles` in `ppt/slideMasters/slideMaster5.xml` (content master) of
**NAB PPT Template_16x9_18Oct24**.

## Font scheme

| Role | Typeface | Used for |
|------|----------|----------|
| **Major** (`+mj-lt`) | **Epilogue Medium** | Headings, slide titles, body L1 emphasis |
| **Minor** (`+mn-lt`) | **Source Sans Pro** | Body copy, captions, footers |

Notes:
- The major font is specifically the **Medium weight** of Epilogue (`Epilogue Medium`),
  not the regular family — a slightly heavier heading face than the 2023 system.
- A **Source Sans Pro SemiBold** variant is used for emphasised body (L2).
- Both are free Google Fonts and are **not embedded** in the template — install them
  for PowerPoint, or load/self‑host for HTML.
  - Epilogue — https://fonts.google.com/specimen/Epilogue
  - Source Sans Pro / Source Sans 3 — https://fonts.google.com/specimen/Source+Sans+3

## Type ramp (from master `txStyles`)

This template is built on a **standard 10″×5.625″ 16:9 canvas**, so the on‑slide
point sizes are smaller than the 2023 metric deck.

| Style | Size | Colour | Font |
|-------|------|--------|------|
| Title (lvl1) | **24 pt** | NAB Red `#ED0000` (`accent1`) | Epilogue Medium |
| Title (lvl2–4) | 20 pt | NAB Red | Source Sans Pro |
| Body L1 | 13 pt | NAB Red `#ED0000` | Epilogue Medium |
| Body L2 | 13 pt | Black (`tx1`) | Source Sans Pro **SemiBold** |
| Body L3–4 | 13 pt | Black | Source Sans Pro |
| Footer / slide number | 9 pt | Black | Source Sans Pro |

**Titles are red, body is black** — the master title style is mapped to `accent1`
(= NAB Red). Body level 1 is also red Epilogue Medium (used as an inline lead‑in),
with the running copy in black Source Sans Pro from level 2 down. Cover layouts
override the title colour (white on RED/BLACK covers, black on WHITE cover).

## CSS (HTML path)

```css
:root {
  --nab-font-heading: "Epilogue Medium", "Epilogue", system-ui, -apple-system, sans-serif;
  --nab-font-body:    "Source Sans Pro", "Source Sans 3", system-ui, -apple-system, sans-serif;
}
/* Ramp mirrors the deck; scale up for screen reading. 1 pt ≈ 1.333 px. */
h1, .nab-title { font-family: var(--nab-font-heading); color: var(--nab-red);
                 font-weight: 500; line-height: 1.1; font-size: 2rem; /* ~24pt */ }
body, .nab-body { font-family: var(--nab-font-body); color: var(--nab-black);
                  font-size: 1.08rem; /* ~13pt scaled */ line-height: 1.45; }
.nab-lead    { font-family: var(--nab-font-heading); color: var(--nab-red); font-weight: 500; }
.nab-strong  { font-weight: 600; /* Source Sans SemiBold */ }
.nab-caption, .nab-footer { font-size: 0.78rem; /* ~9pt */ }
```

## python-pptx

```python
from pptx.util import Pt
para.font.name = "Epilogue Medium"   # headings / lead-in
para.font.size = Pt(24)
para.font.name = "Source Sans Pro"   # body
para.font.size = Pt(13)
```
Best practice: clone a template slide and **type into the existing placeholders**
so sizes/fonts/colours inherit from the master — only set `.font.*` to override.
