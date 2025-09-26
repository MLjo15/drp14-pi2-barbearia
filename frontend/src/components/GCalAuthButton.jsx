import React from 'react';
import { Button } from '@mantine/core';

const GCalAuthButton = ({ barbeariaId }) => {
  const handleAuthClick = () => {
    if (!barbeariaId) {
      alert("Erro: A barbearia precisa ser cadastrada primeiro.");
      return;
    }
    window.location.href = `http://localhost:5000/auth/google?state=${barbeariaId}`;
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
