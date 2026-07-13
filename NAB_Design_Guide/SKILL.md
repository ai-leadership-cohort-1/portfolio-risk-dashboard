---
name: NAB_Design_Guide
description: >-
  NAB (National Australia Bank) 2024 "EVO" brand design system for generating
  on-brand PowerPoint decks and HTML pages. Use whenever creating, designing, or
  styling an NAB-branded presentation, slide deck, .pptx/.potx, or web page/artifact
  with the current 2024+ template — covers the exact NAB colour palette (Red #ED0000,
  black, white and a grey ramp — "everything in red, black and white, with a little
  grey"), typography (Epilogue Medium headings, Source Sans Pro body), the NAB star
  brandmark, and the full 60-layout
  system (covers, dividers, content, features, tables, dashboards, team, closing).
---

# NAB Design System — 2024 "EVO"

Generate PowerPoint and HTML output that matches NAB's current (Oct‑2024) brand,
extracted directly from the official **NAB PPT Template_16x9_18Oct24** template.
The reference files are the **single source of truth** for both output paths —
never estimate colours or fonts.

## When to use
Trigger when the user wants to create or restyle anything NAB‑branded with the
**current / 2024 / EVO** look: a deck, slides, a `.pptx`/`.potx`, a pitch/report,
or an NAB web page / artifact.

- **This skill = 2024 "EVO" system** (red/black/white + grey, Epilogue Medium, 60
  layouts, 10″×5.625″ canvas).
- For the **older 2023 red/grey system** (metric 32×18 cm canvas, 6 layouts), use
  the `NAB_Wealth_Design_Guide` skill instead. If the user doesn't specify, prefer
  this EVO skill for new work.

## Brand in one screen
- **Colours:** NAB Red `#ED0000` (primary / titles, `accent1`), black text on white,
  and a grey ramp (`#F5F5F5 #E6E6E6 #B3B3B3 #4D4D4D`) — "everything in red, black and
  white, with a little grey." Links are black. No purple/secondary brand colour. Sea
  teal, green and competitor colours are special‑use only. Full spec → `references/colors.md`.
- **Type:** **Epilogue Medium** headings (titles red, 24 pt), **Source Sans Pro** body
  (black, 13 pt; SemiBold for emphasis). Full ramp → `references/typography.md`.
- **Layouts:** 60 layouts in functional families (covers, dividers, content, features,
  tables, charts, dashboards, team, TOC, closing) on a standard 10″×5.625″ 16:9
  canvas. Map + geometry → `references/layouts.md`.
- **Logo:** NAB **red 7‑point star** (white variant for dark/red backgrounds) in `assets/`.

## Generation procedure
1. **Read the references first** — load `references/colors.md`, `typography.md`, and
   `layouts.md` before producing output. They hold the exact values for both paths.
2. **Pick the path** below based on the requested deliverable.
3. **Map content to layout families** (cover → divider → content/feature/table → closing).
4. **Apply the palette + type tokens** from the references — do not invent values.
5. **Place the NAB star** from `assets/` (cover top‑right); red on light, white on dark/red.

### Path A — PowerPoint via python-pptx
**Always start by cloning the template** so the slide masters, theme (EVO colours),
and 60 layouts are preserved — never build from a blank `Presentation()`.

> python-pptx cannot open a `.potx` directly (template content‑type). Use the
> bundled **`nab-template-2024.pptx`** (same package, converted) as the clone source;
> `nab-template-2024.potx` is kept for PowerPoint users.

```python
from pptx import Presentation
prs = Presentation(".claude/skills/NAB_Design_Guide/templates/nab-template-2024.pptx")

# 60 layouts are spread across 15 masters — resolve BY NAME, not index:
layouts = {l.name: l for m in prs.slide_masters for l in m.slide_layouts}
# e.g. "WHITE cover", "RED cover", "BLACK cover", "1_Title and Content",
#      "Two Content", "Divider_red", "Feature 1", "Table 1", "Thank You 1", ...

# The template ships with ~66 demo slides — delete them before adding your own.
# Drop each slide's relationship (so the orphan part is removed on save — avoids
# duplicate-part corruption) AND remove it from the id list:
xml_slides = prs.slides._sldIdLst
for sld in list(xml_slides):
    prs.part.drop_rel(sld.rId)
    xml_slides.remove(sld)

cover = prs.slides.add_slide(layouts["WHITE cover"])
cover.shapes.title.text = "Quarterly results"        # inherits red Epilogue Medium
body = prs.slides.add_slide(layouts["1_Title and Content"])
body.shapes.title.text = "Performance"
body.placeholders[10].text = "First point"           # body placeholder idx=10
prs.save("out.pptx")
```
- Populate by **placeholder type/idx** (see layouts.md), not absolute coordinates.
- Let text inherit theme colour/font; only set `RGBColor`/`font.name` to override
  (snippets in colors.md / typography.md).

### Path B — HTML
Use CSS custom properties for the palette and the matching font stack, and layout
classes that mirror the slide layouts. Copy the `:root` blocks verbatim from
`references/colors.md` and `references/typography.md`, and the `.nab-slide` /
`.nab-two-content` / `.nab-cover--*` / `.nab-footer` classes from
`references/layouts.md`. Load Epilogue + Source Sans Pro from Google Fonts (or embed
as `@font-face` for self‑contained artifacts). Use `assets/nab-star-red.png`
(or `nab-star-white.png` on dark/red) for the brandmark.

## Files
- `references/colors.md` — full EVO hex palette, theme‑role mapping, CSS + python-pptx
- `references/typography.md` — Epilogue Medium / Source Sans Pro, the 24/20/13/9 pt ramp
- `references/layouts.md` — canvas size, 15‑master/60‑layout map, placeholder geometry
- `assets/` — NAB star brandmark (red hi‑res, red small, white) + font sourcing notes
- `templates/nab-template-2024.pptx` — clone source for python-pptx (all 60 layouts)
- `templates/nab-template-2024.potx` — original PowerPoint template
