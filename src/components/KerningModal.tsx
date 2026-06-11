import {
  BodyText,
  Button,
  ButtonVariant,
  Input,
  LabelText,
  Modal,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalOverlay,
  ModalPortal,
  ModalTitle,
  cn,
} from "@dooph-software/design-system";
import { useState } from "react";
import { CHAR_SET } from "../store";
import type { WeightEntry } from "../types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeChar: string;
  weight: WeightEntry;
  onSave: (pair: string, value: number) => void;
};

export default function KerningModal({
  open,
  onOpenChange,
  activeChar,
  weight,
  onSave,
}: Props) {
  const [targetChar, setTargetChar] = useState<string | null>(null);
  const [kernValue, setKernValue] = useState("0");

  function handleCharClick(char: string) {
    setTargetChar(char);
    const existing = weight.kerningPairs[activeChar + char];
    setKernValue(String(existing ?? 0));
  }

  function handleSave() {
    if (!targetChar) return;
    const val = parseInt(kernValue, 10);
    if (isNaN(val)) return alert("Enter a valid integer.");
    onSave(activeChar + targetChar, val);
    onOpenChange(false);
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalPortal>
        <ModalOverlay />
        <ModalContent className="min-w-[600px] flex flex-col gap-sm">
          <div className="p-md flex flex-col gap-sm">
            <ModalTitle>Kerning — "{activeChar}"</ModalTitle>
            <ModalDescription className="text-primary">
              Set the kerning adjustment in font units between this character
              and a right-hand character.
            </ModalDescription>
          </div>

          <div className="flex flex-col gap-sm">
            <div className="flex flex-col gap-rg px-md">
              <LabelText>Select right character</LabelText>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(32px,1fr))] gap-1 max-h-[280px] overflow-y-auto border border-border rounded-standard p-sm">
                {CHAR_SET.map((char) => {
                  const targetSelected = targetChar === char;

                  return (
                    <button
                      key={char}
                      type="button"
                      className={cn(
                        "aspect-square flex items-center justify-center rounded-tight border border-transparent cursor-pointer text-text-secondary [transition:background_80ms] hover:bg-ghost-hover hover:text-text",
                        targetSelected &&
                          "bg-primary text-primary-fg border-primary hover:bg-primary-hover hover:text-primary-fg-hover",
                      )}
                      onClick={() => handleCharClick(char)}
                      title={char === " " ? "Space" : char}
                    >
                      <LabelText>{char === " " ? "⎵" : char}</LabelText>
                    </button>
                  );
                })}
              </div>
            </div>

            {targetChar !== null && (
              <div className="flex flex-col gap-xs px-md">
                <label htmlFor="kern-value">
                  <BodyText>
                    Kern value for{" "}
                    <strong>
                      "{activeChar}
                      {targetChar}"
                    </strong>{" "}
                    (font units, negative = tighter)
                  </BodyText>
                </label>
                <Input
                  id="kern-value"
                  type="number"
                  value={kernValue}
                  onChange={(e) => setKernValue(e.target.value)}
                />
              </div>
            )}

            <div className="flex justify-end gap-xs mt-sm p-rg border-t border-border">
              <ModalClose asChild>
                <Button variant={ButtonVariant.ghost}>Cancel</Button>
              </ModalClose>
              <Button
                variant={ButtonVariant.primary}
                onClick={handleSave}
                disabled={targetChar === null}
              >
                Save Pair
              </Button>
            </div>
          </div>
        </ModalContent>
      </ModalPortal>
    </Modal>
  );
}
