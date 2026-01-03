import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { setupMonitoring } from './utils/monitoringSetup';
import { TranslationProvider } from './contexts/TranslationContext';

// Initialize monitoring (optional - will gracefully handle missing services)
setupMonitoring();

// Get the root element
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found. Make sure there is a <div id="root"></div> in your HTML.');
}

// Create React root and render the app
const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <TranslationProvider>
      <App />
    </TranslationProvider>
  </React.StrictMode>
);

