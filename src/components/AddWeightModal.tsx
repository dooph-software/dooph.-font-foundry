import {
  Button,
  ButtonText,
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
} from "@dooph-software/design-system";
import { useState } from "react";
import { WEIGHT_PRESETS } from "../store";
import type { WeightDef } from "../types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingNames: string[];
  onAdd: (def: WeightDef) => void;
};

export default function AddWeightModal({
  open,
  onOpenChange,
  existingNames,
  onAdd,
}: Props) {
  const [name, setName] = useState("");
  const [value, setValue] = useState("");

  function applyPreset(preset: { name: string; value: number }) {
    setName(preset.name);
    setValue(String(preset.value));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    const numValue = parseInt(value, 10);

    if (!trimmedName) return alert("Weight name is required.");
    if (existingNames.includes(trimmedName))
      return alert(`"${trimmedName}" already exists.`);
    if (isNaN(numValue) || numValue < 100 || numValue > 900) {
      return alert("Weight value must be between 100 and 900.");
    }

    onAdd({ name: trimmedName, value: numValue });
    setName("");
    setValue("");
    onOpenChange(false);
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalPortal>
        <ModalOverlay />
        <ModalContent className="min-w-[600px]">
          <div className="p-md">
            <ModalTitle>Add Weight</ModalTitle>
            <ModalDescription className="sr-only">
              Add a new font weight to the project by selecting a preset or
              entering a name and value.
            </ModalDescription>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-md">
            <div className="flex flex-col gap-xs px-md">
              <LabelText>Presets</LabelText>
              <div className="flex flex-wrap gap-[6px]">
                {WEIGHT_PRESETS.map((p) => (
                  <Button
                    variant={ButtonVariant.secondary}
                    onClick={() => applyPreset(p)}
                  >
                    <ButtonText>{p.name}</ButtonText>
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-xs px-md">
              <label htmlFor="weight-name">
                <LabelText>Weight Name</LabelText>
              </label>
              <Input
                id="weight-name"
                placeholder="e.g. Bold"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-xs px-md">
              <label htmlFor="weight-value">
                <LabelText>Weight Value (100–900)</LabelText>
              </label>
              <Input
                id="weight-value"
                type="number"
                min={100}
                max={900}
                step={100}
                placeholder="e.g. 700"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-xs mt-sm p-rg border-t border-border">
              <ModalClose asChild>
                <Button type="button" variant={ButtonVariant.ghost}>
                  Cancel
                </Button>
              </ModalClose>
              <Button type="submit" variant={ButtonVariant.primary}>
                Add Weight
              </Button>
            </div>
          </form>
        </ModalContent>
      </ModalPortal>
    </Modal>
  );
}
