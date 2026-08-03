import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Self-hosted fonts (Hebrew subset). Headings: David Libre; body: Assistant.
import '@fontsource/david-libre/hebrew-400.css';
import '@fontsource-variable/assistant';

import './styles/index.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
