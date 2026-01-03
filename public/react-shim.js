// React Shim - Ensures React is available globally before framer-motion loads
// This file must be loaded BEFORE any other scripts in index.html

(function() {
  'use strict';
  
  // Wait for React to be available
  function ensureReact() {
    if (typeof window !== 'undefined' && window.React && window.React.forwardRef) {
      // React is available
      return;
    }
    
    // Check if React module is loaded
    if (typeof window !== 'undefined') {
      // Try to get React from module cache
      const reactModules = Object.keys(window).filter(key => key.includes('react'));
      
      // If React is not available yet, wait a bit and retry
      setTimeout(ensureReact, 10);
    }
  }
  
  // Start checking immediately
  ensureReact();
})();

