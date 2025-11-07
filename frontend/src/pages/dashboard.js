/**
 * @file frontend/src/pages/dashboard.js
 * @description Página do painel de controle da barbearia.
 * Esta página é responsável por exibir uma mensagem de boas-vindas e,
 * principalmente, por processar o status de autenticação do Google Calendar
 * retornado via URL após o fluxo OAuth.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

/**
 * Componente funcional DashboardPage.
 * Exibe o painel de controle e gerencia notificações de autenticação do Google.
 *
 * @returns {JSX.Element} O elemento JSX que representa a página do painel.
 */
export default function DashboardPage() {
  const router = useRouter();

  /**
   * Efeito que verifica os parâmetros da URL para exibir notificações de autenticação do Google.
   * É executado quando o router está pronto e os parâmetros da query mudam.
   */
  useEffect(() => {
    // Garante que o código só rode quando os parâmetros da URL estiverem prontos.
    if (!router.isReady) return;

    const { google_auth_status, message } = router.query;

    // Se o parâmetro `google_auth_status` existir na URL, exibe uma notificação.
    if (google_auth_status) {
      if (google_auth_status === 'success') {
        toast.success('Sua agenda do Google foi vinculada com sucesso!');
      } 
      else if (google_auth_status === 'error') {
        const errorMessage = message ? decodeURIComponent(message) : 'Ocorreu um erro inesperado.';
        toast.error(`Falha na vinculação: ${errorMessage}`);
      }

      // Limpa os parâmetros da URL para que a notificação não apareça novamente ao recarregar a página.
      router.replace('/dashboard', undefined, { shallow: true });
    }
  }, [router.isReady, router.query, router]);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem', textAlign: 'center' }}>
      <h1>Painel de Controle da Barbearia</h1>
      <p>Bem-vindo de volta!</p>
      <p>Aqui você poderá gerenciar seus agendamentos e configurações.</p>
    </div>
  );
}
