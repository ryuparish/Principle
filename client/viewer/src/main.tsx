import React from 'react';
import ReactDOM from 'react-dom/client';
import StandaloneViewer from './StandaloneViewer';

// Data injected by server
declare global {
  interface Window {
    CONCEPT_MAP_DATA: any;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StandaloneViewer />
  </React.StrictMode>
);
