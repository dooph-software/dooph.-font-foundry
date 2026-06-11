# dooph. font foundry

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./public/wordmark-light.svg">
  <img src="./public/wordmark-dark.svg" alt="dooph." width="200">
</picture>

A dead simple browser-based tool for turning SVG glyph exports from Figma into installable OTF font files. No backend, no server, no AI — everything runs in the browser on localhost (or on our free github pages site!).

This is a read-only publication of the font creation software we use at dooph. Licensed with MIT. Usage of this repo and site never grants you access or rights to dooph intellectual property including but not limited to the trade name 'Dooph LLC', brand name 'dooph.', the wordmark and logomark, and anything else reasonably attributed to the brand.

Feel free to fork but attribute according to the license defined in `LICENSE`

## Quick start

```bash
npm install
npm run dev
# open http://localhost:5173
```

Chrome or Edge is required. Firefox does not support the File System Access API used for open/save.

## Workflow

1. **Design** — Draw glyphs in Figma at a consistent height. Export each glyph frame as SVG.
2. **Select** — Choose a character tile in the left panel (expand a weight to see the full grid).
3. **Upload** — Drop the SVG file into the right panel, or paste the SVG source directly.
4. **Configure** — Set advance width; add kerning pairs if needed.
5. **Save** — Click Save Glyph. The dot indicator on the tile confirms glyph data is stored.
6. **Export** — Hit Export → Export OTF to download a separate `.otf` file for each weight.

To pause and return: Export → Save Progress writes a `.fontproject.json` file. Open Project reloads it.

## Font structure

Each font family starts with a single **Regular (400)** weight. Add as many weights as you like via the Add Weight button — each gets its own glyph set and produces a separate OTF file on export. All weights share the same family name, which is what makes them show up as one family with selectable weights in applications.

**Character set** (95 glyphs per weight):

- Uppercase A–Z, lowercase a–z
- Digits 0–9
- ASCII punctuation and symbols
- Space

**Fixed font metrics:** UPM 1000, ascender 800, descender −200.

## Dependencies and why they were chosen

| Package                         | Version | Role                                                                                                                                                                                             |
| ------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `opentype.js`                   | 2.0.0   | Builds and serializes OTF font files in the browser without any native code. Handles the CFF outline format natively, so Figma's cubic bezier paths are used as-is without quadratic conversion. |
| `svgpath`                       | 2.6.0   | Flattens nested `<g transform>` matrices into path coordinates, converts arcs to beziers, normalizes relative/smooth commands to absolute. Keeps all SVG math out of application code.           |
| `@dooph-software/design-system` | ^1.0.4  | Token-driven React component library. Provides buttons, inputs, modals, and the full visual language — no one-off UI written by hand.                                                            |

## Key decisions

**Figma-only SVG pipeline.** The transform flattening in `src/svgPipeline.ts` assumes Figma's export conventions: `viewBox` is always present, paths use cubic beziers, and `<g>` nesting carries affine matrices or translate/scale transforms. Arbitrary SVG from other sources may not parse correctly.

**Y-axis flip at pipeline time.** SVG coordinates are Y-down; OpenType is Y-up. The conversion `svgY → fontY` is `(viewBoxHeight − y) × (1000 / viewBoxHeight)`, applied as a matrix transform via svgpath when the glyph is first processed. The stored `svgPathData` in the project JSON is already in font coordinate space — it is not SVG anymore.

**`font.download()` is deprecated in opentype.js 2.x.** Export uses `font.toArrayBuffer()` instead, wraps the result in a Blob, and triggers a download via a temporary `<a>` element.

**`preferredFamily` / `preferredSubfamily` (nameIDs 16 & 17)** are not exposed through the opentype.js Font constructor. They are set directly on `font.names.unicode` and `font.names.windows` after construction. These are critical for Windows to group multiple weights under one family name in the font picker.

**`subfamilyName` (nameID 2) is always "Regular"** for legacy compatibility. The actual weight name (e.g. "Bold") goes into `preferredSubfamily` (nameID 17) only. This is standard practice for fonts with more than four weights.

**Kerning pairs are stored as character strings** (`{ "AV": -60 }`) in the project JSON and converted to glyph-index pairs (`"leftIdx,rightIdx"`) at export time. This makes the project file human-readable and decoupled from glyph array order.

**File System Access API for persistence.** No `localStorage`, no IndexedDB. Project state is a single JSON blob written to disk. The `.fontproject.json` extension is excluded from `.gitignore` by default since project files are user data, not source.

## Known constraints

- **Figma source only** — the SVG pipeline is tuned for Figma exports.
- **No hinting** — exported fonts have no TrueType or PostScript hinting. Screen rendering at small sizes will rely entirely on the OS rasterizer.
- **No variable font output** — each weight is a discrete static OTF.
- **Chrome / Edge only** — Firefox lacks `showOpenFilePicker` / `showSaveFilePicker`.

## License

MIT — see [LICENSE](./LICENSE).
