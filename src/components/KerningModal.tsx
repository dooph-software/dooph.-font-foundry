import { useState } from 'react';
import {
  Button,
  ButtonVariant,
  Modal,
  ModalPortal,
  ModalOverlay,
  ModalContent,
  ModalTitle,
  ModalDescription,
  ModalClose,
  Input,
  LabelText,
} from '@dooph-software/design-system';
import type { WeightEntry } from '../types';
import { CHAR_SET } from '../store';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeChar: string;
  weight: WeightEntry;
  onSave: (pair: string, value: number) => void;
};

export default function KerningModal({ open, onOpenChange, activeChar, weight, onSave }: Props) {
  const [targetChar, setTargetChar] = useState<string | null>(null);
  const [kernValue, setKernValue] = useState('0');

  function handleCharClick(char: string) {
    setTargetChar(char);
    const existing = weight.kerningPairs[activeChar + char];
    setKernValue(String(existing ?? 0));
  }

  function handleSave() {
    if (!targetChar) return;
    const val = parseInt(kernValue, 10);
    if (isNaN(val)) return alert('Enter a valid integer.');
    onSave(activeChar + targetChar, val);
    onOpenChange(false);
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalPortal>
        <ModalOverlay />
        <ModalContent className="modal-narrow">
          <div className="modal-padded">
            <ModalTitle>Kerning — "{activeChar}"</ModalTitle>
            <ModalDescription className="sr-only">
              Set the kerning adjustment in font units between this character and a right-hand character.
            </ModalDescription>
          </div>

          <div className="modal-body">
            <div className="modal-field">
              <LabelText>Select right character</LabelText>
              <div className="kern-char-grid">
                {CHAR_SET.map((char) => (
                  <button
                    key={char}
                    type="button"
                    className={`kern-char-tile${targetChar === char ? ' selected' : ''}`}
                    onClick={() => handleCharClick(char)}
                    title={char === ' ' ? 'Space' : char}
                  >
                    <LabelText>{char === ' ' ? '⎵' : char}</LabelText>
                  </button>
                ))}
              </div>
            </div>

            {targetChar !== null && (
              <div className="modal-field">
                <label htmlFor="kern-value">
                  <LabelText>Kern value for "{activeChar}{targetChar}" (font units, negative = tighter)</LabelText>
                </label>
                <Input
                  id="kern-value"
                  type="number"
                  value={kernValue}
                  onChange={(e) => setKernValue(e.target.value)}
                />
              </div>
            )}

            <div className="modal-footer">
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
