// --- Imports Gerais ---
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/main.css';

// --- Biblioteca de Objetos Mantine ---
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MantineProvider>
      <App />
    </MantineProvider>
  </React.StrictMode>,
);
