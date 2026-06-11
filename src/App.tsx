import { useState } from 'react';
import type { Project } from './types';
import { createInitialProject } from './store';
import TopBar from './components/TopBar';
import LeftPanel from './components/LeftPanel';
import RightPanel from './components/RightPanel';

export default function App() {
  const [project, setProject] = useState<Project>(createInitialProject);

  return (
    <div className="app-root">
      <TopBar project={project} onProjectChange={setProject} />
      <div className="app-main">
        <LeftPanel project={project} onProjectChange={setProject} />
        <RightPanel project={project} onProjectChange={setProject} />
      </div>
    </div>
  );
}
