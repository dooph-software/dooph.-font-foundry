# AGENTS.md — dooph Font Foundry

Agent orientation for this repository. Read this before making any changes.

---

## What this is

A client-side Vite + React + TypeScript tool that converts SVG glyphs exported from Figma into installable OTF font files. No backend. No AI APIs. No server-side code. Everything runs in the browser.

Entry point: `src/main.tsx` → `src/App.tsx`.

---

## Repository layout

```
src/
  types.ts          — TypeScript types: Project, WeightEntry, GlyphData, FontMetadata
  store.ts          — CHAR_SET (95-char array), WEIGHT_PRESETS, createInitialProject()
  svgPipeline.ts    — Figma SVG → font-space path string (the transform/flip pipeline)
  fontExport.ts     — opentype.js font builder and OTF Blob download
  index.css         — Design system token remaps + all app layout CSS
  App.tsx           — Root component: state owner, renders TopBar + two panels
  components/
    TopBar.tsx          — Header: family name label, Open Project, Export button
    LeftPanel.tsx       — Weight accordion + character grid + Add Weight / Font Metadata buttons
    RightPanel.tsx      — Glyph editor: preview, SVG drop zone, advance width, Save Glyph, Kerning
    AddWeightModal.tsx  — Modal: name field, value field, preset quick-picks
    FontMetadataModal.tsx — Modal: all OpenType name table fields
    ExportModal.tsx     — Modal: Export OTF (all weights) or Save Progress
    KerningModal.tsx    — Modal: character-pair kerning editor
```

---

## Data model

All application state is a single `Project` object (see `src/types.ts`). It serializes directly to/from `.fontproject.json` via the File System Access API.

```ts
Project {
  familyName: string                  // top-level convenience, always === metadata.familyName
  metadata: FontMetadata              // maps to OpenType name table fields on export
  weights: Record<string, WeightEntry>  // keyed by weight name (e.g. "Regular", "Bold")
  activeWeight: string
  activeChar: string | null
}

WeightEntry {
  def: { name: string; value: number }  // e.g. { name: "Bold", value: 700 }
  glyphs: Record<string, GlyphData>     // keyed by single character, e.g. "A"
  kerningPairs: Record<string, number>  // keyed by two-char string, e.g. { "AV": -60 }
}

GlyphData {
  svgPathData: string    // post-pipeline path data in FONT coordinate space (not SVG space)
  advanceWidth: number
}
```

**State lives entirely in `App.tsx` as a `useState<Project>`.** Components receive `project` and `onProjectChange` as props. There is no context, no store library, no reducer.

---

## SVG pipeline (`src/svgPipeline.ts`)

`processFigmaSVG(svgString: string): string`

Takes a raw Figma SVG export string, returns a single path `d` string in font coordinate space. This is what gets stored in `GlyphData.svgPathData`.

**Steps:**
1. Parse SVG with `DOMParser`.
2. Read `viewBox` to get `viewBoxHeight`.
3. For each `<path>` element, walk ancestor `<g>` elements to accumulate their `transform` attributes as a composed 2×3 affine matrix.
4. Compose that ancestor matrix with the Y-flip+scale matrix: `[scale, 0, 0, -scale, 0, viewBoxHeight*scale]` where `scale = 1000 / viewBoxHeight`.
5. Apply via `svgpath(d).matrix(composed).unarc().unshort().abs().round(4).toString()`.
6. Concatenate all paths with a space (compound glyphs).

**Important:** The output is in font coordinate space — Y=0 is the baseline, Y=800 is the ascender, Y=−200 is the descender. It is not SVG. Do not treat it as SVG for rendering without reversing the transform.

**Supported `<g transform>` formats:** `matrix(a b c d e f)`, `translate(tx ty)`, `scale(sx sy)`. Multiple functions in one attribute string are not composed (Figma doesn't produce them). Unsupported transforms fall back to identity.

---

## Font export (`src/fontExport.ts`)

`exportAllWeights(project)` calls `exportWeightAsOTF(project, weightName)` for each weight.

**Glyph array layout:**
- Index 0: `.notdef` (empty path, 500-unit advance)
- Index 1…N: one glyph per `CHAR_SET` entry in order

**opentype.js specifics:**
- `font.download()` is **deprecated and non-functional in v2**. Download is done via `font.toArrayBuffer()` → `Blob` → object URL → `<a>` click.
- `preferredFamily` (nameID 16) and `preferredSubfamily` (nameID 17) are **not in the `Font` constructor options**. They are set post-construction via `(font as any).names.unicode.preferredFamily = { en: '...' }`. This is required for Windows to group weights under one family.
- `subfamilyName` (nameID 2) is always `"Regular"` regardless of the actual weight — this is the correct OpenType convention for families with more than four weights.
- `font.kerningPairs` expects `{ "leftGlyphIdx,rightGlyphIdx": value }`. Project JSON stores character pairs (`"AV"`) which are converted at export time using the known glyph array order.
- `weightClass` in the opentype.js constructor is typed as `string`, not `number`. Pass `String(weight.def.value)`.

**SVG path → opentype.js Path conversion** (inside `svgPathDataToOpentypePath`):
- After pipeline, paths contain: `M`, `L`, `H`, `V`, `C`, `Q`, `Z` commands (`.unarc()` removed arcs, `.unshort()` expanded S/T).
- `H` and `V` are handled by tracking current position — they are not expanded to `L` by svgpath's `abs()`.
- Uses `path.moveTo`, `path.lineTo`, `path.curveTo`, `path.quadTo`, `path.closePath`.

---

## SVG preview (`RightPanel.tsx` — `GlyphSVGPreview`)

The stored `svgPathData` is in font space (Y-up). To render it as an SVG (Y-down), the component applies:

```
<g transform="translate(0, 800) scale(1, -1)">
  <path d={pathData} />
</g>
```

This maps: `svgY = 800 − fontY`. Ascender (fontY=800) → svgY=0 (top). Baseline (fontY=0) → svgY=800. Descender (fontY=−200) → svgY=1000.

The SVG viewBox is `0 0 {advanceWidth} 1000`. Guide lines are drawn in SVG coordinates (not inside the flipped `<g>`).

---

## Design system rules

**Always read the design system skills before touching UI.** They are in `.agents/skills/` (or `.claude/skills/`).

- Import order is mandatory: `@dooph-software/design-system/styles.css` before `./index.css` (enforced in `src/main.tsx`).
- Use `ButtonVariant` (not `ButtonType` — that doesn't exist). Values: `primary`, `secondary`, `brand`, `ghost`, `text`, `destructive`.
- Use `Modal` / `ModalContent` / `ModalTitle` for all dialogs. Always include a `ModalTitle` — use `className="sr-only"` to hide it visually if the design has no visible title.
- Do not use inline `style={{ color: '...' }}` or hardcoded hex values on dooph components.
- Layout CSS lives in `src/index.css` using `--ui-*` custom properties. Do not add Tailwind utilities that aren't already in the design system's compiled CSS unless you set up Tailwind for the app.
- `cn` from `@dooph-software/design-system` is configured with the correct `text-style-*` conflict group. Import it from there, not from `clsx` or `tailwind-merge` directly.

---

## Persistence

- **Open:** `window.showOpenFilePicker` → `file.text()` → `JSON.parse` → merge with `createInitialProject()` default.
- **Save:** `window.showSaveFilePicker` → `writable.write(JSON.stringify(project, null, 2))`.
- No `localStorage`, no `IndexedDB`, no URL state.
- `.fontproject.json` files are excluded from git (see `.gitignore`).

---

## Character set

`CHAR_SET` in `src/store.ts` is the authoritative ordered array (95 characters):

```
A–Z, a–z, 0–9, !"#$%&'()*+,-./:;<=>?@[\]^_`{|}~, Space
```

Order matters for font export — glyph indices are derived from this array (`CHAR_SET.indexOf(char) + 1`).

---

## What NOT to do

- Do not hand-write binary font encoding. All font logic goes through `opentype.js`.
- Do not write path math beyond the Y-flip/scale pipeline. All transform work goes through `svgpath`.
- Do not add `localStorage` or `IndexedDB` persistence. File System Access API only.
- Do not override `--ui-*` design system tokens with hardcoded values.
- Do not call `font.download()` — it is deprecated and logs an error but does nothing.
- Do not assume `font.names` is a flat object — it has `unicode`, `macintosh`, and `windows` sub-objects.
- Do not add backend endpoints, server-side rendering, or any remote API calls.
- Do not create local button/input/modal components that duplicate design system exports.
