/**
 * @file src/components/GCalAuthButton.jsx
 * @description Um botão reutilizável que inicia o fluxo de autenticação do Google Calendar.
 * Este componente é responsável por redirecionar o proprietário da barbearia para a
 * tela de consentimento do Google, passando o ID da barbearia para o backend.
 */

import React from 'react';
import { Button } from '@mantine/core';

/**
 * Componente GCalAuthButton.
 * Renderiza um botão que, quando clicado, redireciona o usuário para a rota de autenticação
 * do Google no backend.
 *
 * @param {{ barbeariaId: string | number }} props - Propriedades do componente.
 * @param {string|number} props.barbeariaId - O ID da barbearia que está sendo conectada. Essencial para o backend associar os tokens do Google à barbearia correta.
 */
const GCalAuthButton = ({ barbeariaId }) => {
  /**
   * Manipulador de clique para o botão de autenticação.
   * Constrói a URL de autenticação do backend e redireciona o navegador do usuário para ela.
   */
  const handleAuthClick = () => {
    if (!barbeariaId) {
      alert("Erro: A barbearia precisa ser cadastrada primeiro.");
      return;
    }
    // Redireciona para a rota do backend que inicia o fluxo OAuth 2.0 com o Google.
    // O `shop_id` é passado como um parâmetro de query para que o backend saiba
    // a qual barbearia associar as credenciais do Google após a autenticação bem-sucedida.
    window.location.href = `${import.meta.env.VITE_API_BASE}/api/auth/google?shop_id=${barbeariaId}`;
  };

  return (
    <Button 
      variant="filled" 
      color="blue" 
      onClick={handleAuthClick} 
      style={{ marginTop: '15px' }}
      fullWidth
    >
      {/* Este texto indica que é a segunda e última etapa do processo de cadastro. */}
      Conectar Google Calendar (Passo 2)
    </Button>
  );
};

export default GCalAuthButton;
