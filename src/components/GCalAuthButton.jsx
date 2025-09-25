// src/components/GCalAuthButton.jsx
import React from 'react';
import { Button } from '@mantine/core';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI;
const GOOGLE_SCOPES = [
    'https://www.googleapis.com/auth/calendar.events', 
    'https://www.googleapis.com/auth/calendar.readonly'
].join(' ');

const AUTH_URL = `https://accounts.google.com/o/oauth2/v2/auth?` +
  `client_id=${GOOGLE_CLIENT_ID}&` +
  `redirect_uri=${GOOGLE_REDIRECT_URI}&` +
  `response_type=code&` +
  `scope=${GOOGLE_SCOPES}&` +
  `access_type=offline&` + 
  `prompt=consent`;        

const GCalAuthButton = ({ barbeariaId }) => {
  const handleAuthClick = () => {
    if (!barbeariaId) {
        alert("Erro: A barbearia precisa ser cadastrada primeiro.");
        return;
    }
    
    const finalAuthUrl = `${AUTH_URL}&state=${barbeariaId}`;
    window.location.href = finalAuthUrl; // Redireciona para o Google
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