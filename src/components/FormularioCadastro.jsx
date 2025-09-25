// src/components/FormularioCadastro.jsx
import React, { useState } from 'react';
import { TextInput, Button, Loader, Notification } from '@mantine/core';
import { supabase } from '../supabaseClient';
import GCalAuthButton from './GCalAuthButton'; 

const FormularioCadastro = ({ onClose }) => {
  const [formData, setFormData] = useState({ /* ... */ });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [newBarbeariaId, setNewBarbeariaId] = useState(null); 

  const handleChange = (e) => { /* ... */ };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    // ... lógica para inserir no Supabase ...
    const { data, error: supabaseError } = await supabase
      .from('barbearias')
      .insert([
        {
          nome: formData.nome,
          proprietario: formData.proprietario,
          email: formData.email,
          telefone: formData.telefone,
          endereco: formData.endereco,
        },
      ])
      .select('id')
      .single();

    setIsLoading(false);

    if (supabaseError) {
      setError(supabaseError.code === '23505' ? 'Este e-mail já está cadastrado.' : supabaseError.message);
      return;
    }

    setSuccess(true);
    setNewBarbeariaId(data.id); 
  };

  if (success && newBarbeariaId) {
    return (
      <div className="form-container">
        <h2>Cadastro Concluído!</h2>
        <Notification title="Próximo Passo" color="green" style={{ marginBottom: 15 }}>
          Barbearia cadastrada. Agora, conecte seu Google Calendar.
        </Notification>
        <GCalAuthButton barbeariaId={newBarbeariaId} />
        <Button variant="subtle" onClick={onClose} style={{ marginTop: '15px' }}>
            Fechar
        </Button>
      </div>
    );
  }

  return (
    <div className="form-container">
      <h2>Cadastre sua Barbearia (Passo 1)</h2>
      {/* ... Renderização do formulário ... */}
      <form onSubmit={handleSubmit}>
        <TextInput label="Nome da Barbearia" name="nome" value={formData.nome} onChange={handleChange} required />
        <TextInput label="Nome do Proprietário" name="proprietario" value={formData.proprietario} onChange={handleChange} required />
        <TextInput label="Telefone" type="tel" name="telefone" value={formData.telefone} onChange={handleChange} required />
        <TextInput label="Email" type="email" name="email" value={formData.email} onChange={handleChange} required />
        <TextInput label="Endereço Completo" name="endereco" value={formData.endereco} onChange={handleChange} required />
        
        <Button 
          variant="filled" 
          color="green" 
          size="lg" 
          type="submit" 
          style={{ marginTop: '20px' }} 
          fullWidth
          disabled={isLoading}
        >
          {isLoading ? <Loader size="sm" color="white" /> : 'Registrar Barbearia'}
        </Button>
      </form>
    </div>
  );
};

export default FormularioCadastro;