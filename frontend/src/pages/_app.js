// Conteúdo para: src/pages/_app.js

import { Toaster } from 'react-hot-toast';
import '../styles/globals.css'; // Verifique se este caminho está correto

function MyApp({ Component, pageProps }) {
  return (
    <>
      {/* Este componente renderiza as notificações em qualquer lugar da aplicação */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 5000,
          style: {
            fontSize: '16px',
            padding: '16px',
          },
        }}
      />
      
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
