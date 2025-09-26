import React from 'react';
import { Button } from '@mantine/core';

// 1. **IMPORTAR** a instância do Supabase.
//    Ajuste o caminho se seu supabaseClient.js estiver em outro lugar.
import { supabase } from '../supabaseClient'; 

const GCalAuthButton = ({ barbeariaId }) => {

  const handleAuthClick = async () => { 
    if (!barbeariaId) {
      alert("Erro: A barbearia precisa ser cadastrada primeiro.");
      return;
    }

    // 2. **USAR O MÉTODO CORRETO**: signInWithOAuth.
    //    Este método inicia o fluxo de autenticação, redirecionando para o Supabase, que se comunica com o Google.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        
        // ESSENCIAL: Adicionar o escopo necessário para acessar o Google Calendar.
        // Este scope permite criar/modificar eventos.
        scopes: ['https://www.googleapis.com/auth/calendar.events'], 
        
        // Opcional: Para onde o Supabase deve redirecionar no final.
        // Usamos a porta 5173 e passamos o barbeariaId via query parameter.
        redirectTo: `http://localhost:5173/?barbeariaId=${barbeariaId}`, 
      }
    });

    if (error) {
      console.error('Erro ao iniciar o login com Google:', error.message);
      // O erro mais comum aqui é se as URLs do Google Cloud estiverem erradas.
      alert('Erro ao iniciar o login. Verifique o console e as configurações do Google Cloud/Supabase.');
    }
  };

  return (
    <Button 
      variant="outline" 
      color="red" 
      onClick={handleAuthClick} 
      style={{ marginTop: '15px' }}
      fullWidth
    >
      Conectar Google Calendar (Passo 2)
    </Button>
  );
};

export default GCalAuthButton;