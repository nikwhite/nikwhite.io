import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PhotoBrowser } from '../src/components/photoBrowser';

const App = () => {
  return (
    <div style={{ padding: '8px 16px 16px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Photos</h1>
      <PhotoBrowser />
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} else {
  console.error('Container element not found.');
}