import {
  BodyText,
  Button,
  ButtonSize,
  ButtonText,
  ButtonVariant,
  ChevronDownIcon,
  ChevronUpIcon,
  CloseCancelIcon,
  Modal,
  ModalClose,
  ModalContent,
  ModalOverlay,
  ModalPortal,
  ModalTitle,
  cn,
} from "@dooph-software/design-system";
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
  const [deleteWeightName, setDeleteWeightName] = useState<string | null>(null);
  const [expandedWeights, setExpandedWeights] = useState<
    Record<string, boolean>
  >(() => ({ [project.activeWeight]: true }));

  function toggleWeight(name: string) {
    setExpandedWeights((prev) => ({ ...prev, [name]: !prev[name] }));
  }

  function selectChar(weightName: string, char: string) {
    onProjectChange({ ...project, activeWeight: weightName, activeChar: char });
  }

  function handleDeleteWeight() {
    if (!deleteWeightName) return;
    const newWeights = { ...project.weights };
    delete newWeights[deleteWeightName];
    const remainingNames = Object.keys(newWeights);
    const switchingActive = deleteWeightName === project.activeWeight;
    onProjectChange({
      ...project,
      weights: newWeights,
      activeWeight: switchingActive
        ? (remainingNames[0] ?? project.activeWeight)
        : project.activeWeight,
      activeChar: switchingActive ? null : project.activeChar,
    });
    setDeleteWeightName(null);
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
      <div className="w-1/3 shrink-0 flex flex-col border-r border-border overflow-hidden bg-surface-page">
        <div className="flex-1 overflow-y-auto p-md">
          {Object.entries(project.weights).map(([weightName, weight]) => {
            const isOpen = expandedWeights[weightName] ?? false;
            return (
              <div key={weightName} className="mb-sm">
                <div
                  className="group flex items-center justify-between px-rg py-xs rounded-standard cursor-pointer select-none [transition:background_120ms] hover:bg-ghost-hover"
                  onClick={() => toggleWeight(weightName)}
                >
                  <ButtonText className="flex-1 w-full">
                    {weightName} ({weight.def.value})
                  </ButtonText>
                  <Button
                    variant={ButtonVariant.ghost}
                    size={ButtonSize.icon}
                    className="opacity-0 pointer-events-none transition-opacity duration-100 ml-auto group-hover:opacity-100 group-hover:pointer-events-auto"
                    aria-label={`Delete ${weightName}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteWeightName(weightName);
                    }}
                  >
                    <CloseCancelIcon />
                  </Button>
                  <div className="flex items-center justify-center size-button">
                    {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                  </div>
                </div>

                {isOpen && (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(36px,1fr))] gap-1 py-xs mt-1">
                    {CHAR_SET.map((char) => {
                      const isSelected =
                        project.activeWeight === weightName &&
                        project.activeChar === char;
                      return (
                        <button
                          key={char}
                          type="button"
                          className={cn(
                            "aspect-square flex items-center justify-center rounded-tight border border-border cursor-pointer text-text-secondary bg-surface [transition:background_80ms,border-color_80ms] relative",
                            isSelected
                              ? "bg-primary border-primary text-primary-fg"
                              : "hover:bg-ghost-hover hover:border-border-hover hover:text-text",
                          )}
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

        <div className="shrink-0 flex gap-xs py-sm px-md border-t border-border bg-page-surface">
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

      <Modal
        open={deleteWeightName !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteWeightName(null);
        }}
      >
        <ModalPortal>
          <ModalOverlay />
          <ModalContent className="min-w-[340px] max-w-[400px]">
            <div className="px-md pt-md">
              <ModalTitle>Delete {deleteWeightName} Weight</ModalTitle>
            </div>
            <div className="p-md">
              <BodyText>
                This will permanently remove the{" "}
                <strong>"{deleteWeightName}"</strong> weight and all its glyphs.
              </BodyText>
            </div>
            <div className="flex justify-end gap-xs mt-sm p-rg border-t border-border">
              <ModalClose asChild>
                <Button type="button" variant={ButtonVariant.secondary}>
                  Cancel
                </Button>
              </ModalClose>
              <Button
                type="button"
                variant={ButtonVariant.destructive}
                onClick={handleDeleteWeight}
              >
                Delete
              </Button>
            </div>
          </ModalContent>
        </ModalPortal>
      </Modal>
    </>
  );
}
