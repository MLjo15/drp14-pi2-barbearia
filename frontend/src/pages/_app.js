/**
 * @file frontend/src/pages/_app.js
 * @description Componente raiz da aplicação Next.js.
 * Este arquivo é responsável por inicializar as páginas, aplicar layouts globais,
 * e injetar componentes globais como o sistema de notificações (Toaster).
 * Ele envolve todos os componentes de página da aplicação.
 */

import { Toaster } from 'react-hot-toast';
import '../styles/globals.css'; // Importa estilos CSS globais que se aplicam a toda a aplicação.

/**
 * Componente funcional MyApp.
 * Este componente envolve todos os componentes de página da sua aplicação Next.js.
 * É o lugar ideal para adicionar layouts globais, provedores de contexto e componentes
 * que devem estar presentes em todas as páginas, como o sistema de notificações.
 *
 * @param {object} props - As propriedades do componente.
 * @param {React.ComponentType} props.Component - O componente da página atual a ser renderizado.
 * @param {object} props.pageProps - As propriedades iniciais para a página atual, obtidas via `getStaticProps` ou `getServerSideProps`.
 * @returns {JSX.Element} O elemento JSX que representa a aplicação com o layout global.
 */
function MyApp({ Component, pageProps }) {
  return (
    <>
      {/* O componente Toaster do 'react-hot-toast' renderiza notificações em qualquer lugar da aplicação. */}
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
      
      {/* Renderiza o componente da página atual, passando suas propriedades. */}
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
