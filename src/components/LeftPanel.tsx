import { BodyText, Button, ButtonVariant, ChevronDownIcon, LabelText } from "@dooph-software/design-system";
import { useState } from "react";
import { CHAR_SET } from "../store";
import type { Project, WeightDef } from "../types";
import AddWeightModal from "./AddWeightModal";
import FontMetadataModal from "./FontMetadataModal";

type Props = {
  project: Project;
  onProjectChange: (p: Project) => void;
};

export default function LeftPanel({ project, onProjectChange }: Props) {
  const [addWeightOpen, setAddWeightOpen] = useState(false);
  const [metaOpen, setMetaOpen] = useState(false);
  const [expandedWeights, setExpandedWeights] = useState<
    Record<string, boolean>
  >(() => ({ [project.activeWeight]: true }));

  function toggleWeight(name: string) {
    setExpandedWeights((prev) => ({ ...prev, [name]: !prev[name] }));
  }

  function selectChar(weightName: string, char: string) {
    onProjectChange({ ...project, activeWeight: weightName, activeChar: char });
  }

  function handleAddWeight(def: WeightDef) {
    onProjectChange({
      ...project,
      weights: {
        ...project.weights,
        [def.name]: { def, glyphs: {}, kerningPairs: {} },
      },
      activeWeight: def.name,
      activeChar: null,
    });
    setExpandedWeights((prev) => ({ ...prev, [def.name]: true }));
  }

  return (
    <>
      <div className="panel-left">
        <div className="panel-left-scroll">
          {Object.entries(project.weights).map(([weightName, weight]) => {
            const isOpen = expandedWeights[weightName] ?? false;
            return (
              <div key={weightName} className="weight-group">
                <div
                  className={`weight-group-header${project.activeWeight === weightName ? " active" : ""}`}
                  onClick={() => toggleWeight(weightName)}
                  role="button"
                  aria-expanded={isOpen}
                >
                  <LabelText>{weightName} ({weight.def.value})</LabelText>
                  <ChevronDownIcon
                    className={`weight-group-chevron${isOpen ? " open" : ""}`}
                    size="16px"
                  />
                </div>

                {isOpen && (
                  <div className="char-grid" style={{ marginTop: 4 }}>
                    {CHAR_SET.map((char) => {
                      const hasGlyph = !!weight.glyphs[char]?.svgPathData;
                      const isSelected =
                        project.activeWeight === weightName &&
                        project.activeChar === char;
                      return (
                        <button
                          key={char}
                          type="button"
                          className={`char-tile${hasGlyph ? " has-glyph" : ""}${isSelected ? " selected" : ""}`}
                          onClick={() => selectChar(weightName, char)}
                          title={
                            char === " "
                              ? "Space (U+0020)"
                              : `${char} (U+${char.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")})`
                          }
                        >
                          <BodyText>{char === " " ? "⎵" : char}</BodyText>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="panel-left-footer">
          <Button
            variant={ButtonVariant.primary}
            onClick={() => setAddWeightOpen(true)}
          >
            Add Weight
          </Button>
          <Button
            variant={ButtonVariant.secondary}
            onClick={() => setMetaOpen(true)}
          >
            Font Metadata
          </Button>
        </div>
      </div>

      <AddWeightModal
        open={addWeightOpen}
        onOpenChange={setAddWeightOpen}
        existingNames={Object.keys(project.weights)}
        onAdd={handleAddWeight}
      />

      <FontMetadataModal
        open={metaOpen}
        onOpenChange={setMetaOpen}
        metadata={project.metadata}
        onSave={(metadata) =>
          onProjectChange({
            ...project,
            metadata,
            familyName: metadata.familyName,
          })
        }
      />
    </>
  );
}
