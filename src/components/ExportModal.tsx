import {
  Button,
  ButtonVariant,
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
          <div className="p-md flex flex-col text-primary gap-xs">
            <ModalTitle>Export Font Project</ModalTitle>
            <ModalDescription>
              Save your font project to a file to continue later or export to a
              .otf file.
            </ModalDescription>
          </div>

          <div className="flex flex-col gap-md">
            <div className="flex flex-row px-md w-full gap-xs">
              <Button
                variant={ButtonVariant.secondary}
                onClick={handleExportOTF}
              >
                Export OTF
              </Button>
              <Button
                variant={ButtonVariant.secondary}
                onClick={handleSaveProgress}
              >
                Export project file
              </Button>
            </div>
            <div className="flex justify-end gap-xs mt-sm p-rg border-t border-border">
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
