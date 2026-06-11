import svgpath from 'svgpath';

type Matrix6 = [number, number, number, number, number, number];

const ASCENDER = 700;

const IDENTITY: Matrix6 = [1, 0, 0, 1, 0, 0];

// Compute A × B for two 2×3 affine matrices stored as [a,b,c,d,e,f]
// where the matrix represents: | a c e |
//                               | b d f |
//                               | 0 0 1 |
function multiplyMatrix(A: Matrix6, B: Matrix6): Matrix6 {
  return [
    A[0] * B[0] + A[2] * B[1],
    A[1] * B[0] + A[3] * B[1],
    A[0] * B[2] + A[2] * B[3],
    A[1] * B[2] + A[3] * B[3],
    A[0] * B[4] + A[2] * B[5] + A[4],
    A[1] * B[4] + A[3] * B[5] + A[5],
  ];
}

function parseTransformAttr(transform: string): Matrix6 {
  const matrixMatch = transform.match(
    /matrix\(\s*([-\d.e+]+)[\s,]+([-\d.e+]+)[\s,]+([-\d.e+]+)[\s,]+([-\d.e+]+)[\s,]+([-\d.e+]+)[\s,]+([-\d.e+]+)\s*\)/
  );
  if (matrixMatch) {
    return [
      parseFloat(matrixMatch[1]),
      parseFloat(matrixMatch[2]),
      parseFloat(matrixMatch[3]),
      parseFloat(matrixMatch[4]),
      parseFloat(matrixMatch[5]),
      parseFloat(matrixMatch[6]),
    ];
  }

  const translateMatch = transform.match(
    /translate\(\s*([-\d.e+]+)(?:[\s,]+([-\d.e+]+))?\s*\)/
  );
  if (translateMatch) {
    return [1, 0, 0, 1, parseFloat(translateMatch[1]), parseFloat(translateMatch[2] ?? '0')];
  }

  const scaleMatch = transform.match(/scale\(\s*([-\d.e+]+)(?:[\s,]+([-\d.e+]+))?\s*\)/);
  if (scaleMatch) {
    const sx = parseFloat(scaleMatch[1]);
    const sy = scaleMatch[2] !== undefined ? parseFloat(scaleMatch[2]) : sx;
    return [sx, 0, 0, sy, 0, 0];
  }

  return IDENTITY;
}

// Walk from el up to svgRoot, accumulating transforms outermost-first
function getAncestorMatrix(el: Element, svgRoot: Element): Matrix6 {
  const matrices: Matrix6[] = [];
  let cur: Element | null = el.parentElement;
  while (cur && cur !== svgRoot) {
    const t = cur.getAttribute('transform');
    if (t) matrices.unshift(parseTransformAttr(t)); // prepend → outermost first
    cur = cur.parentElement;
  }
  // outermost × ... × innermost
  return matrices.reduce((acc, m) => multiplyMatrix(acc, m), IDENTITY);
}

// Process a Figma SVG export into a single opentype-ready path string.
// Flattens nested <g transform>, combines all <path> elements, applies
// Y-flip and scale to convert from SVG space to font UPM=1000 space.
export function processFigmaSVG(svgString: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');

  const parseError = doc.querySelector('parsererror');
  if (parseError) throw new Error('Invalid SVG: ' + parseError.textContent);

  const svgEl = doc.querySelector('svg');
  if (!svgEl) throw new Error('No <svg> element found');

  const viewBox = svgEl.getAttribute('viewBox');
  if (!viewBox) throw new Error('SVG missing viewBox');

  const [, , , vbH] = viewBox.trim().split(/[\s,]+/).map(Number);
  if (!vbH || isNaN(vbH) || vbH === 0) throw new Error('Invalid viewBox height');

  const scale = 1000 / vbH;
  // Flip Y: x' = scale·x, y' = vbH·scale − scale·y = 1000 − scale·y
  // Affine matrix [a,b,c,d,e,f]: x'=a·x+c·y+e, y'=b·x+d·y+f
  const flipMatrix: Matrix6 = [scale, 0, 0, -scale, 0, ASCENDER];

  const pathEls = Array.from(doc.querySelectorAll('path'));
  if (pathEls.length === 0) throw new Error('No <path> elements in SVG');

  const results: string[] = [];

  for (const pathEl of pathEls) {
    const d = pathEl.getAttribute('d');
    if (!d?.trim()) continue;

    const ancestorMatrix = getAncestorMatrix(pathEl, svgEl);
    // Final transform: apply ancestor first, then flip into font space
    const composed = multiplyMatrix(flipMatrix, ancestorMatrix);

    const out = svgpath(d)
      .matrix(composed)
      .unarc()
      .unshort()
      .abs()
      .round(4)
      .toString();

    if (out) results.push(out);
  }

  if (results.length === 0) throw new Error('All paths were empty');
  return results.join(' ');
}
