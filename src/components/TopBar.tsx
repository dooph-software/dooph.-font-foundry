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
    <header className="app-topbar">
      <div className="app-topbar-left">
        <picture>
          <source
            srcSet="/wordmark-dark.svg"
            media="(prefers-color-scheme: dark)"
          />
          <img
            src="/wordmark-light.svg"
            alt="dooph Font Foundry"
            className="app-topbar-logo"
          />
        </picture>
      </div>

      <BodyText>{project.metadata.familyName}</BodyText>

      <div className="app-topbar-right">
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
