// Conteúdo para: src/pages/dashboard.js

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Garante que o código só rode quando os parâmetros da URL estiverem prontos
    if (!router.isReady) {
      return;
    }

    const { google_auth_status, message } = router.query;

    // Se o parâmetro de status existir, mostra a notificação
    if (google_auth_status) {
      if (google_auth_status === 'success') {
        toast.success('Sua agenda do Google foi vinculada com sucesso!');
      } 
      else if (google_auth_status === 'error') {
        const errorMessage = message ? decodeURIComponent(message) : 'Ocorreu um erro inesperado.';
        toast.error(`Falha na vinculação: ${errorMessage}`);
      }

      // Limpa os parâmetros da URL para que a notificação não apareça novamente
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
