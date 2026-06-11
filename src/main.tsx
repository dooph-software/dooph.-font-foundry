import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@dooph-software/design-system/styles.css';
import './index.css';
import App from './App.tsx';

document.documentElement.classList.toggle(
  'dark',
  matchMedia('(prefers-color-scheme: dark)').matches,
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
