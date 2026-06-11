import {
  BodyText,
  Button,
  ButtonVariant,
  LabelText,
  Modal,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalOverlay,
  ModalPortal,
  ModalTitle,
} from "@dooph-software/design-system";
import { exportAllWeights } from "../fontExport";
import type { Project } from "../types";

const PROJECT_FILE_NAME = "fontproj.json";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  onSave: () => void;
};

export default function ExportModal({
  open,
  onOpenChange,
  project,
  onSave,
}: Props) {
  function handleExportOTF() {
    try {
      exportAllWeights(project);
    } catch (err) {
      alert(
        "Export failed: " + (err instanceof Error ? err.message : String(err)),
      );
    }
    onOpenChange(false);
  }

  async function handleSaveProgress() {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: `${project.familyName.replace(/\s+/g, "_")}.${PROJECT_FILE_NAME}`,
        types: [
          {
            description: "Font Project",
            accept: { "application/json": [`.${PROJECT_FILE_NAME}`] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(JSON.stringify(project, null, 2));
      await writable.close();
      onSave();
    } catch (err) {
      if ((err as DOMException)?.name !== "AbortError") {
        alert(
          "Save failed: " + (err instanceof Error ? err.message : String(err)),
        );
      }
    }
    onOpenChange(false);
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalPortal>
        <ModalOverlay />
        <ModalContent>
          <div className="modal-padded">
            <ModalTitle>Export</ModalTitle>
            <ModalDescription className="sr-only">
              Choose how to export your font project.
            </ModalDescription>
          </div>

          <div className="modal-body">
            <button className="export-option" onClick={handleExportOTF}>
              <div className="export-option-text">
                <LabelText as="div" className="export-option-title">
                  Export OTF
                </LabelText>
                <BodyText as="div" className="export-option-desc">
                  Download one .otf file per weight using the current glyph
                  data.
                </BodyText>
              </div>
            </button>

            <button className="export-option" onClick={handleSaveProgress}>
              <div className="export-option-text">
                <LabelText as="div" className="export-option-title">
                  Save Progress
                </LabelText>
                <BodyText as="div" className="export-option-desc">
                  Save the full project to a .{PROJECT_FILE_NAME} file to
                  continue later.
                </BodyText>
              </div>
            </button>

            <div className="modal-footer">
              <ModalClose asChild>
                <Button variant={ButtonVariant.ghost}>Cancel</Button>
              </ModalClose>
            </div>
          </div>
        </ModalContent>
      </ModalPortal>
    </Modal>
  );
}
