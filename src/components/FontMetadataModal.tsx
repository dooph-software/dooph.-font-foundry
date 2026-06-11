import {
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
} from "@dooph-software/design-system";
import { useEffect, useState } from "react";
import type { FontMetadata } from "../types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metadata: FontMetadata;
  onSave: (metadata: FontMetadata) => void;
};

export default function FontMetadataModal({
  open,
  onOpenChange,
  metadata,
  onSave,
}: Props) {
  const [form, setForm] = useState<FontMetadata>(metadata);

  useEffect(() => {
    if (open) setForm(metadata);
  }, [open, metadata]);

  function set<K extends keyof FontMetadata>(key: K, val: FontMetadata[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({ ...form, familyName: form.familyName.trim() || "My Font" });
    onOpenChange(false);
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalPortal>
        <ModalOverlay />
        <ModalContent className="modal-narrow">
          <div className="modal-padded">
            <ModalTitle>Font Metadata</ModalTitle>
            <ModalDescription className="sr-only">
              Configure the OpenType name table fields for your font family.
            </ModalDescription>
          </div>

          <form onSubmit={handleSubmit} className="modal-body">
            <div className="modal-field">
              <label htmlFor="meta-family">
                <LabelText>Family Name</LabelText>
              </label>
              <Input
                id="meta-family"
                value={form.familyName}
                onChange={(e) => set("familyName", e.target.value)}
              />
            </div>

            <div className="modal-field">
              <label htmlFor="meta-copyright">
                <LabelText>Copyright (nameID 0)</LabelText>
              </label>
              <textarea
                id="meta-copyright"
                placeholder="Portions derived from [Font Name] by [Author], licensed under [LICENSE]. Modifications by [You]."
                value={form.copyright}
                onChange={(e) => set("copyright", e.target.value)}
              />
            </div>

            <div className="modal-field">
              <label htmlFor="meta-license">
                <LabelText>License (nameID 13)</LabelText>
              </label>
              <textarea
                id="meta-license"
                placeholder="This Font Software is licensed under the SIL Open Font License, Version 1.1."
                value={form.licenseDescription}
                onChange={(e) => set("licenseDescription", e.target.value)}
              />
            </div>

            <div className="modal-field">
              <label htmlFor="meta-license-url">
                <LabelText>License URL (nameID 14)</LabelText>
              </label>
              <Input
                id="meta-license-url"
                placeholder="https://openfontlicense.org"
                value={form.licenseURL}
                onChange={(e) => set("licenseURL", e.target.value)}
              />
            </div>

            <div className="modal-field">
              <label htmlFor="meta-version">
                <LabelText>Version</LabelText>
              </label>
              <Input
                id="meta-version"
                placeholder="Version 1.0"
                value={form.version}
                onChange={(e) => set("version", e.target.value)}
              />
            </div>

            <div className="modal-footer">
              <ModalClose asChild>
                <Button type="button" variant={ButtonVariant.ghost}>
                  Cancel
                </Button>
              </ModalClose>
              <Button type="submit" variant={ButtonVariant.primary}>
                Save
              </Button>
            </div>
          </form>
        </ModalContent>
      </ModalPortal>
    </Modal>
  );
}
