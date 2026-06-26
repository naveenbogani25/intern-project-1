// =============================================================
// React Entry Point
// This file renders our main App component into the HTML page
// =============================================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Find the <div id="root"> in index.html and render our React app there
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
