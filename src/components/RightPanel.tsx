import {
  Button,
  ButtonSize,
  ButtonVariant,
  Input,
  LabelText,
  BodyText,
  PlaceholderIcon,
  Tooltip,
  TooltipTrigger,
  TooltipProvider,
  TooltipContent,
  TooltipTitle,
  TooltipBody,
  TooltipTypes,
} from "@dooph-software/design-system";
import { useRef, useState } from "react";
import { processFigmaSVG } from "../svgPipeline";
import type { Project } from "../types";
import { defaultAdvanceWidth } from "../utils/defaultAdvanceWidth";
import KerningModal from "./KerningModal";

type Props = {
  project: Project;
  onProjectChange: (p: Project) => void;
};

export default function RightPanel({ project, onProjectChange }: Props) {
  const { activeWeight, activeChar } = project;
  const weight = activeWeight ? project.weights[activeWeight] : null;
  const glyph = activeChar && weight ? weight.glyphs[activeChar] : null;

  const [svgInput, setSvgInput] = useState("");
  const [advanceWidth, setAdvanceWidth] = useState(
    String(glyph?.advanceWidth ?? defaultAdvanceWidth(activeChar ?? "")),
  );
  const [dragOver, setDragOver] = useState(false);
  const [kernOpen, setKernOpen] = useState(false);
  const [pipelineError, setPipelineError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Sync advance width when selection changes
  const prevKey = useRef("");
  const currentKey = `${activeWeight}:${activeChar}`;
  if (prevKey.current !== currentKey) {
    prevKey.current = currentKey;
    setSvgInput("");
    setPipelineError("");
    setAdvanceWidth(String(glyph?.advanceWidth ?? defaultAdvanceWidth(activeChar ?? "")));
  }

  function parseSVGInput(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) return;
    try {
      const pathData = processFigmaSVG(trimmed);
      const aw = parseInt(advanceWidth, 10) || 600;
      setSvgInput(trimmed);
      setPipelineError("");
      commitGlyph(pathData, aw);
    } catch (err) {
      setPipelineError(err instanceof Error ? err.message : String(err));
    }
  }

  function commitGlyph(pathData: string, aw: number) {
    if (!activeChar || !activeWeight) return;
    onProjectChange({
      ...project,
      weights: {
        ...project.weights,
        [activeWeight]: {
          ...project.weights[activeWeight],
          glyphs: {
            ...project.weights[activeWeight].glyphs,
            [activeChar]: { svgPathData: pathData, advanceWidth: aw },
          },
        },
      },
    });
  }

  function handleSaveGlyph() {
    if (!activeChar || !activeWeight) return;
    const aw = parseInt(advanceWidth, 10);
    if (isNaN(aw) || aw < 0)
      return alert("Advance width must be a positive number.");

    if (svgInput.trim()) {
      // User has SVG in the textarea — process and save it
      parseSVGInput(svgInput);
    } else if (glyph) {
      // No new SVG — just update the advance width on the existing glyph
      commitGlyph(glyph.svgPathData, aw);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      file.text().then(parseSVGInput);
    } else {
      const text = e.dataTransfer.getData("text/plain");
      if (text) parseSVGInput(text);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) file.text().then(parseSVGInput);
    e.target.value = "";
  }

  function handleKernSave(pair: string, value: number) {
    if (!activeWeight) return;
    const updated = { ...project.weights[activeWeight].kerningPairs };
    if (value === 0) delete updated[pair];
    else updated[pair] = value;
    onProjectChange({
      ...project,
      weights: {
        ...project.weights,
        [activeWeight]: {
          ...project.weights[activeWeight],
          kerningPairs: updated,
        },
      },
    });
  }

  if (!activeChar || !weight) {
    return (
      <div className="panel-right">
        <div className="glyph-editor">
          <div className="glyph-editor-empty">
            <BodyText>Select a character from the left panel to begin editing</BodyText>
          </div>
        </div>
      </div>
    );
  }

  const charLabel =
    activeChar === " "
      ? "Space (U+0020)"
      : `${activeChar} — U+${activeChar.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")}`;

  return (
    <div className="panel-right">
      <div className="glyph-editor">
        <div className="glyph-editor-content">
          {/* Character label */}
          <LabelText>{charLabel} · {activeWeight}</LabelText>

          {/* Ghost / SVG preview */}
          <div className="glyph-preview-area">
            {glyph?.svgPathData ? (
              <GlyphSVGPreview
                pathData={glyph.svgPathData}
                advanceWidth={parseInt(advanceWidth, 10) || 600}
              />
            ) : (
              <span className="glyph-ghost-char" aria-hidden="true">
                {activeChar === " " ? "" : activeChar}
              </span>
            )}
          </div>

          {/* SVG upload / paste area */}
          <div className="glyph-controls">
            <div
              className={`svg-drop-zone${dragOver ? " drag-over" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
            >
              <LabelText style={{ marginBottom: 8, display: 'block' }}>
                Drop SVG file or paste SVG code below · Click to browse
              </LabelText>
              <textarea
                placeholder='<svg viewBox="0 0 100 100" ...>...</svg>'
                value={svgInput}
                onChange={(e) => setSvgInput(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onPaste={(e) => {
                  e.stopPropagation();
                  const text = e.clipboardData.getData("text/plain");
                  if (
                    text.trim().startsWith("<svg") ||
                    text.trim().startsWith("<SVG")
                  ) {
                    e.preventDefault();
                    setSvgInput(text);
                    parseSVGInput(text);
                  }
                }}
              />
              <input
                ref={fileRef}
                type="file"
                accept=".svg,image/svg+xml"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
            </div>

            {pipelineError && (
              <LabelText className="text-destructive">⚠ {pipelineError}</LabelText>
            )}

            {/* Bottom row: advance width left, kerning + save right */}
            <div className="glyph-controls-bottom">
              <div className="glyph-controls-left">
                <LabelText>Advance Width</LabelText>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={ButtonVariant.ghost}
                        size={ButtonSize.iconSm}
                        aria-label="About advance width"
                      >
                        <PlaceholderIcon size="16px" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent variant={TooltipTypes.rich}>
                      <TooltipTitle>Advance width</TooltipTitle>
                      <TooltipBody>
                        The total horizontal space reserved for this character — the glyph itself plus its side breathing room. Narrow characters like "i" need less; wide ones like "M" need more. Adjust it if characters look too cramped or too spaced out next to each other.
                      </TooltipBody>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Input
                  type="number"
                  min={0}
                  step={10}
                  value={advanceWidth}
                  onChange={(e) => setAdvanceWidth(e.target.value)}
                  style={{ width: 100 }}
                />
                <LabelText>units</LabelText>
              </div>
              <div className="glyph-controls-right">
                <Button
                  variant={ButtonVariant.ghost}
                  onClick={() => setKernOpen(true)}
                >
                  Kerning
                </Button>
                <Button variant={ButtonVariant.brand} onClick={handleSaveGlyph}>
                  Save Glyph
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {kernOpen && weight && (
        <KerningModal
          open={kernOpen}
          onOpenChange={setKernOpen}
          activeChar={activeChar}
          weight={weight}
          onSave={handleKernSave}
        />
      )}
    </div>
  );
}

// Renders stored font-space path data as an SVG preview.
//
// Font coordinate space: Y=0 baseline, Y=700 ascender, Y=-300 descender (Y up).
// SVG coordinate space: Y=0 top, Y increases downward.
//
// Mapping: svgY = 700 - fontY
//   → fontY=700 (ascender) → svgY=0 (top)   ✓
//   → fontY=0   (baseline) → svgY=700        ✓
//   → fontY=-300 (descender) → svgY=1000     ✓
//
// Achieved with: translate(0, 700) scale(1, -1)
//   step1 scale(1,-1): (x, fontY) → (x, -fontY)
//   step2 translate(0,700): (x, -fontY) → (x, 700 - fontY) ✓
function GlyphSVGPreview({
  pathData,
  advanceWidth,
}: {
  pathData: string;
  advanceWidth: number;
}) {
  const width = Math.max(advanceWidth, 100);
  const padding = 60;
  const vbX = -padding;
  const vbW = width + padding * 2;
  return (
    <svg
      viewBox={`${vbX} 0 ${vbW} 1000`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      className="glyph-svg-preview"
      aria-hidden="true"
    >
      {/* Baseline at svgY=700 */}
      <line
        x1={vbX}
        y1={700}
        x2={vbX + vbW}
        y2={700}
        stroke="var(--ui-color-border)"
        strokeWidth={1}
      />
      {/* Ascender at svgY=0 */}
      <line
        x1={vbX}
        y1={0}
        x2={vbX + vbW}
        y2={0}
        stroke="var(--ui-color-border)"
        strokeWidth={0.5}
        strokeDasharray="4 4"
      />
      {/* Descender at svgY=1000 */}
      <line
        x1={vbX}
        y1={1000}
        x2={vbX + vbW}
        y2={1000}
        stroke="var(--ui-color-border)"
        strokeWidth={0.5}
        strokeDasharray="4 4"
      />

      <g transform="translate(0, 700) scale(1, -1)">
        <path d={pathData} fill="var(--ui-color-text)" />
      </g>

      {/* Left bearing line at x=0 */}
      <line
        x1={0}
        y1={0}
        x2={0}
        y2={1000}
        stroke="currentColor"
        strokeWidth={1}
        strokeDasharray="4 4"
        opacity={0.2}
      />
      {/* Advance width line at x=advanceWidth */}
      <line
        x1={advanceWidth}
        y1={0}
        x2={advanceWidth}
        y2={1000}
        stroke="currentColor"
        strokeWidth={1}
        strokeDasharray="4 4"
        opacity={0.2}
      />
    </svg>
  );
}
