import { BodyText, Button, ButtonVariant } from "@dooph-software/design-system";
import { useState } from "react";
import { createInitialProject } from "../store";
import type { Project } from "../types";
import ExportModal from "./ExportModal";

type Props = {
  project: Project;
  onProjectChange: (p: Project) => void;
};

export default function TopBar({ project, onProjectChange }: Props) {
  const [exportOpen, setExportOpen] = useState(false);

  async function handleOpenProject() {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [
          {
            description: "Font Project (.json)",
            accept: { "application/json": [".json"] },
          },
        ],
        multiple: false,
      });
      const file = await handle.getFile();
      const text = await file.text();
      const parsed = JSON.parse(text) as Project;
      onProjectChange({
        ...createInitialProject(),
        ...parsed,
      });
    } catch (err) {
      if ((err as DOMException)?.name !== "AbortError") {
        alert(
          "Could not open project: " +
            (err instanceof Error ? err.message : String(err)),
        );
      }
    }
  }

  return (
    <header className="shrink-0 flex items-center justify-between pl-md pr-sm py-sm border-b border-border bg-page-surface gap-sm">
      <div className="flex items-center gap-sm">
        <img
          src="/wordmark-dark.svg"
          alt="dooph Font Foundry"
          className="h-4 w-auto block dark:hidden"
        />
        <img
          src="/wordmark-light.svg"
          alt="dooph Font Foundry"
          className="h-4 w-auto hidden dark:block"
        />
      </div>

      <BodyText>{project.metadata.familyName}</BodyText>

      <div className="flex items-center gap-xs">
        <Button variant={ButtonVariant.secondary} onClick={handleOpenProject}>
          Open Project
        </Button>
        <Button
          variant={ButtonVariant.brand}
          onClick={() => setExportOpen(true)}
        >
          Export
        </Button>
      </div>

      <ExportModal
        open={exportOpen}
        onOpenChange={setExportOpen}
        project={project}
        onSave={() => {}}
      />
    </header>
  );
}
