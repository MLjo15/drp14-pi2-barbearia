import React, { useState } from 'react';
import { Button, Notification } from '@mantine/core';

// Nota: O BASE_URL agora é passado via props do FormularioCadastro

const GCalAuthButton = ({ barbeariaId, baseUrl }) => {
  const [authError, setAuthError] = useState(null);

  const handleAuthClick = () => {
    if (!barbeariaId || !baseUrl) {
      console.error("Erro: shop_id ou BASE_URL ausente.");
      setAuthError("Erro interno: A barbearia precisa ser cadastrada e a URL do servidor configurada.");
      return;
    }
    
    setAuthError(null);
    
    // Constrói a URL usando o BASE_URL passado do ambiente
    // use 'state' param to pass the id through the oauth flow
    window.location.href = `${baseUrl}/api/auth/google?shop_id=${barbeariaId}`;
  };

  return (
    <>
      {authError && (
        <Notification color="red" title="Erro de Conexão" onClose={() => setAuthError(null)} style={{ marginBottom: 15 }}>
          {authError}
        </Notification>
      )}
      <Button 
        variant="filled" 
        color="blue" 
        onClick={handleAuthClick} 
        style={{ marginTop: '15px' }}
        fullWidth
      >
        Conectar Google Calendar (Passo 2)
      </Button>
    </>
  );
};

export default GCalAuthButton;
