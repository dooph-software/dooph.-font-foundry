import { useState } from 'react';
import { ToastProvider, TooltipProvider } from '@dooph-software/design-system';
import type { Project } from './types';
import { createInitialProject } from './store';
import TopBar from './components/TopBar';
import LeftPanel from './components/LeftPanel';
import RightPanel from './components/RightPanel';

export default function App() {
  const [project, setProject] = useState<Project>(createInitialProject);

  return (
    <TooltipProvider>
    <ToastProvider>
      <div className="flex flex-col h-full overflow-hidden">
        <TopBar project={project} onProjectChange={setProject} />
        <div className="flex-1 flex overflow-hidden min-h-0">
          <LeftPanel project={project} onProjectChange={setProject} />
          <RightPanel project={project} onProjectChange={setProject} />
        </div>
      </div>
    </ToastProvider>
    </TooltipProvider>
  );
}
