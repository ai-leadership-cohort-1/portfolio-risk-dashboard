# NAB Colour Palette — 2024 "EVO" template

**Authoritative source: the template's own "How-To colour" guidance slide**
(`ppt/slideLayouts/slideLayout2.xml`), cross‑checked against
`ppt/theme/theme1.xml`. That slide states the rule directly:

> **"Everything should be in Red, Black and White, with a little bit of grey."**
> *"R237 is the only Red we use in PowerPoint."*

NAB's PowerPoint palette is deliberately tiny: **Red + Black + White + grey.**
Do **not** introduce other colours as "brand" colours.

## Focus colours (primary)

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **NAB Red** | `#ED0000` | 237, 0, 0 | Primary brand colour — titles, brandmark, emphasis. The *only* red; never use lighter tints. |
| **Black** | `#000000` | 0, 0, 0 | Body text, dark colourway backgrounds |
| **White** | `#FFFFFF` | 255, 255, 255 | Primary background |

These three are the top row of the template's theme (`accent1`=red, `accent2`=black,
plus white) so they're one click away in PowerPoint.

## Grey ramp ("a little bit of grey")

Named Grey 2–5 on the guidance slide. **Grey 1 is deliberately excluded — too light.**

| Name | Hex | RGB |
|------|-----|-----|
| Grey 2 | `#F5F5F5` | 245, 245, 245 |
| Grey 3 | `#E6E6E6` | 230, 230, 230 |
| Grey 4 | `#B3B3B3` | 179, 179, 179 |
| Grey 5 | `#4D4D4D` | 77, 77, 77 |

(The theme's accent row also carries a mid grey `#808080` as `accent4`; it isn't one of
the named brand greys but appears in the theme. Prefer the named Grey 2–5 above.)

## Special‑use colours — NOT general brand colours

The guidance slide allows these **only** in the narrow cases noted. Never use them as
decorative or "secondary" brand colours (e.g. for banners, panels, headers).

| Name | Hex (approx) | Allowed use only |
|------|------|------------------|
| **Sea** (teal) | `#4C626C` | A single chart that needs **more than 6 categories** (extra series colour). |
| **Green** | `#00B050` | When colour carries meaning — e.g. a green dot in traffic‑light project tracking. |
| Competitor – ANZ | `#007DBA` | Only to represent ANZ. |
| Competitor – CBA | `#FFCC00` | Only to represent CBA. |
| Competitor – Westpac | `#621A4B` | Only to represent Westpac. |

> Note: `#621A4B` (a purple) is **Westpac's** colour, not NAB's.

## ⚠️ Theme slots that are NOT brand colours

`theme1.xml`'s colour scheme contains two purples in the `dk2`/`lt2` slots —
`dk2 = #9A9AC8` and `lt2 = #444693`. **These are not NAB colours.** They are vestigial
theme placeholders: verified to have **zero** literal uses across every slide, layout
and master, and the only `bg2` references in the package sit inside hidden
(`a14:hiddenEffects`) compatibility blocks that never render. Earlier versions of this
skill wrongly described `#444693` as "NAB Indigo, a secondary brand colour" — that was
an error. Ignore these slots; they are not part of the palette.

## CSS custom properties (HTML path)

```css
:root {
  /* Focus colours */
  --nab-red:      #ED0000;  /* primary — titles, brandmark, emphasis (accent1) */
  --nab-black:    #000000;  /* body text + dark colourway */
  --nab-white:    #FFFFFF;  /* background */
  /* Grey ramp (Grey 2 → Grey 5) */
  --nab-grey-2:   #F5F5F5;
  --nab-grey-3:   #E6E6E6;
  --nab-grey-4:   #B3B3B3;
  --nab-grey-5:   #4D4D4D;
  /* Links are black in EVO */
  --nab-link:         #000000;
  --nab-link-visited: #000000;
  /* Special-use only — do NOT use as brand/decorative colours.
     --nab-sea: #4C626C;   charts with >6 categories only
     --nab-green: #00B050; status meaning only (traffic light) */
}
```

## python-pptx usage

```python
from pptx.dml.color import RGBColor
NAB_RED   = RGBColor(0xED, 0x00, 0x00)   # the only red
NAB_BLACK = RGBColor(0x00, 0x00, 0x00)
NAB_WHITE = RGBColor(0xFF, 0xFF, 0xFF)
# greys: F5F5F5 / E6E6E6 / B3B3B3 / 4D4D4D
```
Prefer leaving placeholder text uncoloured so it inherits the theme (red titles,
black body) from the cloned master. Only set explicit `RGBColor` to override.
