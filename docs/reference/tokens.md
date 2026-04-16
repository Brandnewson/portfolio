# Design Tokens — Quick Reference

Source of truth is src/styles/_tokens.scss. This file is for quick lookup during development.

---

## Day mode tokens

```scss
--bg:   #F0E8D0   // Warm parchment — 911 interior cream
--bg2:  #E4D8BC   // Slightly richer cream
--pb:   #EAE0C8   // Panel background
--bd:   rgba(90, 70, 40, 0.15)  // Subtle warm border

--sil:  #B8B2A6   // Targa bar silver — brushed aluminium
--sil2: #D0CAC0   // Lighter silver highlight

--acc:  #8B5A30   // Cognac leather — primary accent
--acc2: #4A2E18   // Deep tobacco — secondary accent

--txt:  #1A120A   // Near-black, warm undertone
--txt2: #6A5040   // Mid warm-brown — secondary text
```

## Night mode tokens

```scss
--bg:   #090A07   // 300ZX cabin — warm near-black
--bg2:  #0D0F0A   // Slightly lighter surface
--pb:   #111410   // Panel bg — subtle green ambient tint

--bd:   rgba(20, 180, 58, 0.14)  // Green-tinted border

--sil:  #182015   // Silver becomes dark green-grey
--sil2: #0F160C   // Deeper structural tone

--acc:  #14CC4A   // Phosphor green — warm CRT (NOT #00FF00)
--acc2: #0A8830   // Dim phosphor — secondary elements

--txt:  #8EC888   // Desaturated green body text
--txt2: #2E5828   // Very dim green — hint text
```

## Phosphor glow (night mode .dv elements)

```scss
text-shadow:
  0 0 8px rgba(20, 204, 74, 0.45),
  0 0 18px rgba(20, 204, 74, 0.15);
```

## Typography

```scss
--font-mono: 'Courier New', Courier, monospace;
--font-serif: Georgia, 'Times New Roman', serif;

// Font usage:
// Day hero name: var(--font-serif)
// Night hero name: var(--font-mono)
// Everything else: var(--font-mono)
```

## Key letter-spacing values

```
Panel IDs / labels:   0.22em
Navigation items:     0.18em
Body instrument text: 0.10em
Tag lines:            0.22em
Data values:          tabular-nums (CSS property)
```

## Tunnel transition timing

```
Total duration:     520ms
Flash peak:         at 175ms
Theme swap:         at 175ms (inside the flash)
Flash animation:    @keyframes tun
                    0%   opacity 0
                    30%  opacity 0.97
                    65%  opacity 0.97
                    100% opacity 0
Flash background:   #040403 (always — both directions)
```

## Panel anatomy

```
border-top:    2px solid var(--sil)   // structural top edge
border:        1px solid var(--bd)    // surrounding border
border-radius: 0 0 5px 5px           // sharp top, slight bottom curve
padding:       11px
```

## Stagger offsets (project panels on index page)

```
Panel 1 (MARL):  margin-top: 22px
Panel 2 (FS):    margin-top: 0   (highest — main tool)
Panel 3 (Helm):  margin-top: 14px
```
