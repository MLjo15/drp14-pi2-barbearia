import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx';

// --- Biblioteca de Objetos Mantine ---
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import './styles/main.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MantineProvider>
      <App />
    </MantineProvider>
  </StrictMode>,
);