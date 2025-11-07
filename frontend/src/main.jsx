/**
 * @file src/main.jsx
 * @description Ponto de entrada principal da aplicação React (frontend).
 * Este arquivo é responsável por renderizar o componente raiz da aplicação (`App`)
 * no elemento DOM com o id 'root' e por envolver a aplicação com os provedores
 * necessários, como o MantineProvider para a biblioteca de componentes UI.
 */

import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

// --- Configuração da Biblioteca de Componentes Mantine ---
// O MantineProvider disponibiliza o tema, estilos e outras funcionalidades
// da biblioteca para todos os componentes filhos.
import { MantineProvider } from '@mantine/core';
// Importa os estilos CSS globais do Mantine.
import '@mantine/core/styles.css'; 
// Importa os estilos CSS personalizados da aplicação.
import './styles/main.css';

// Encontra o elemento 'root' no HTML onde a aplicação será montada.
const rootElement = document.getElementById('root');
// Cria a raiz de renderização do React.
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <MantineProvider>
      {/* O componente App e todos os seus filhos agora têm acesso ao contexto do Mantine. */}
      <App />
    </MantineProvider>
  </StrictMode>,
);