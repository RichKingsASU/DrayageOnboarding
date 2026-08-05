/**
 * File: main.tsx
 * Purpose: Mounts the React application into the Vite-provided DOM root.
 * Dependencies: React, ReactDOM, App, and global Tailwind CSS styles.
 * Maintainer note: Assumes index.html exposes an element with id="root".
 */
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
