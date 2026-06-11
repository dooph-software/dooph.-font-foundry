import * as opentype from 'opentype.js';
import type { Project, WeightEntry } from './types';
import { CHAR_SET } from './store';

const UPM = 1000;
const ASCENDER = 700;
const DESCENDER = -300;

function svgPathDataToOpentypePath(d: string): opentype.Path {
  const path = new opentype.Path();
  const cmdRe = /([MLHVCSQTAZmlhvcsqtaz])([^MLHVCSQTAZmlhvcsqtaz]*)/g;
  let match: RegExpExecArray | null;
  let cx = 0;
  let cy = 0;

  while ((match = cmdRe.exec(d)) !== null) {
    const cmd = match[1];
    const raw = match[2].trim();
    const nums = raw ? raw.split(/[\s,]+/).filter(Boolean).map(Number) : [];

    switch (cmd) {
      case 'M':
        for (let i = 0; i < nums.length; i += 2) {
          if (i === 0) path.moveTo(nums[0], nums[1]);
          else path.lineTo(nums[i], nums[i + 1]);
          cx = nums[i]; cy = nums[i + 1];
        }
        break;
      case 'L':
        for (let i = 0; i < nums.length; i += 2) {
          path.lineTo(nums[i], nums[i + 1]);
          cx = nums[i]; cy = nums[i + 1];
        }
        break;
      case 'H':
        for (const x of nums) { path.lineTo(x, cy); cx = x; }
        break;
      case 'V':
        for (const y of nums) { path.lineTo(cx, y); cy = y; }
        break;
      case 'C':
        for (let i = 0; i + 5 < nums.length; i += 6) {
          path.curveTo(nums[i], nums[i+1], nums[i+2], nums[i+3], nums[i+4], nums[i+5]);
          cx = nums[i+4]; cy = nums[i+5];
        }
        break;
      case 'Q':
        for (let i = 0; i + 3 < nums.length; i += 4) {
          path.quadTo(nums[i], nums[i+1], nums[i+2], nums[i+3]);
          cx = nums[i+2]; cy = nums[i+3];
        }
        break;
      case 'Z':
      case 'z':
        path.closePath();
        cx = 0; cy = 0;
        break;
    }
  }

  return path;
}

function buildGlyphs(weight: WeightEntry): opentype.Glyph[] {
  const notdef = new opentype.Glyph({
    name: '.notdef',
    unicode: 0,
    advanceWidth: 500,
    path: new opentype.Path(),
  });

  const glyphs: opentype.Glyph[] = [notdef];

  for (const char of CHAR_SET) {
    const code = char.codePointAt(0)!;
    const gdata = weight.glyphs[char];
    const advanceWidth = gdata?.advanceWidth ?? 600;
    const glyphPath = gdata?.svgPathData
      ? svgPathDataToOpentypePath(gdata.svgPathData)
      : new opentype.Path();

    glyphs.push(
      new opentype.Glyph({
        name: `uni${code.toString(16).toUpperCase().padStart(4, '0')}`,
        unicode: code,
        advanceWidth,
        path: glyphPath,
      })
    );
  }

  return glyphs;
}

export function exportWeightAsOTF(project: Project, weightName: string): void {
  const weight = project.weights[weightName];
  if (!weight) throw new Error(`Weight "${weightName}" not found`);

  const glyphs = buildGlyphs(weight);

  const font = new opentype.Font({
    familyName: project.familyName,
    styleName: 'Regular', // nameID 2 — always "Regular" for legacy compat
    unitsPerEm: UPM,
    ascender: ASCENDER,
    descender: DESCENDER,
    glyphs,
    copyright: project.metadata.copyright || undefined,
    license: project.metadata.licenseDescription || undefined,
    licenseURL: project.metadata.licenseURL || undefined,
    version: project.metadata.version || 'Version 1.0',
    weightClass: String(weight.def.value),
  } as opentype.FontOptions & { glyphs: opentype.Glyph[] });

  // Set nameID 16 (preferredFamily) and 17 (preferredSubfamily)
  // These aren't in the constructor options — set them post-construction
  const rawNames = (font as unknown as { names: Record<string, Record<string, { en: string }>> }).names;
  for (const platform of ['unicode', 'windows'] as const) {
    if (rawNames[platform]) {
      rawNames[platform].preferredFamily = { en: project.familyName };
      rawNames[platform].preferredSubfamily = { en: weight.def.name };
    }
  }

  // Convert char-pair kerning keys to glyph-index-pair keys
  // Glyph at index 0 = notdef, CHAR_SET[i] = index i+1
  const charToIdx = (c: string) => {
    const i = CHAR_SET.indexOf(c);
    return i >= 0 ? i + 1 : -1;
  };

  const kerningPairs: Record<string, number> = {};
  for (const [pair, value] of Object.entries(weight.kerningPairs)) {
    if (pair.length === 2) {
      const li = charToIdx(pair[0]);
      const ri = charToIdx(pair[1]);
      if (li > 0 && ri > 0) kerningPairs[`${li},${ri}`] = value;
    }
  }
  font.kerningPairs = kerningPairs;

  const buffer = font.toArrayBuffer();
  const blob = new Blob([buffer], { type: 'font/otf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = project.familyName.replace(/\s+/g, '_');
  a.download = `${safeName}-${weight.def.name}.otf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportAllWeights(project: Project): void {
  for (const name of Object.keys(project.weights)) {
    exportWeightAsOTF(project, name);
  }
}
