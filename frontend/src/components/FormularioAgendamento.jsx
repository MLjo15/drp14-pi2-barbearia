// src/components/FormularioAgendamento.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { TextInput, Button, Select, Loader, Notification } from '@mantine/core';
import { supabase } from '../supabaseClient'; 

const FormularioAgendamento = ({ onClose }) => {
  const [formData, setFormData] = useState({
    barbearia_id: '',
    data: '',
    hora: '',
    servico: '',
    nome: '',
    email: '',
    telefone: ''
  });
  const [barbearias, setBarbearias] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const slotsDisponiveis = ['09:00', '10:30', '12:00', '14:00', '15:30', '17:00'];

  useEffect(() => {
    const fetchBarbearias = async () => {
      const { data, error } = await supabase
        .from('barbearias')
        .select('id, nome')
        .eq('gcal_auth_status', 'conectado');
      
      if (error) {
        setError("Não foi possível carregar a lista de barbearias.");
      } else {
        setBarbearias(data);
      }
    };
    fetchBarbearias();
  }, []);

  const barbeariasData = useMemo(
    () => barbearias.map(b => ({ value: b.id, label: b.nome })), 
    [barbearias]
  );

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getOrCreateClient = async (nome, email, telefone) => {
    // Placeholder: aqui você poderia buscar ou criar cliente no Supabase
    return 'cliente-id-temp';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const clienteId = await getOrCreateClient(formData.nome, formData.email, formData.telefone);
      const dataHoraInicio = `${formData.data}T${formData.hora}:00-03:00`;
      const dataHoraFim = `${formData.data}T${formData.hora}:00-03:00`; // ajuste futuro para duração

      const response = await fetch("http://localhost:5173/agendamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barbearia_id: formData.barbearia_id,
          cliente_nome: formData.nome,
          cliente_email: formData.email,
          cliente_telefone: formData.telefone,
          servico: formData.servico,
          data_hora_inicio: dataHoraInicio,
          data_hora_fim: dataHoraFim,
        }),
      });

      if (response.status === 409) {
        // Horário já agendado
        throw new Error("Horário já agendado. Escolha outro horário.");
      }

      if (!response.ok) {
        throw new Error("Erro ao agendar no servidor.");
      }

      setSuccess(true);
      setFormData({
        barbearia_id: '',
        data: '',
        hora: '',
        servico: '',
        nome: '',
        email: '',
        telefone: ''
      });

      if (onClose) onClose();

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Agende seu Horário</h2>

      {error && <Notification color="red" onClose={() => setError(null)}>{error}</Notification>}
      {success && <Notification color="green" onClose={() => setSuccess(false)}>Agendamento realizado com sucesso!</Notification>}

      <form onSubmit={handleSubmit}>
        <Select
          label="Escolha a Barbearia"
          placeholder="Selecione a barbearia"
          data={barbeariasData}
          value={formData.barbearia_id}
          onChange={(value) => handleChange('barbearia_id', value)}
          required
        />

        <TextInput 
          label="Data" 
          type="date" 
          value={formData.data} 
          onChange={(e) => handleChange('data', e.target.value)} 
          required 
        />
        
        <Select
          label="Horário Disponível"
          placeholder="Selecione um horário"
          data={slotsDisponiveis}
          value={formData.hora}
          onChange={(value) => handleChange('hora', value)}
          required
        />
        
        <Select
          label="Serviço"
          data={['Corte de Cabelo', 'Barba', 'Corte e Barba', 'Outro']}
          value={formData.servico}
          onChange={(value) => handleChange('servico', value)}
          required
          withinPortal={true} 
        />

        <TextInput label="Nome Completo" value={formData.nome} onChange={(e) => handleChange('nome', e.target.value)} required />
        <TextInput label="Email" type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} required />
        <TextInput label="Telefone" type="tel" value={formData.telefone} onChange={(e) => handleChange('telefone', e.target.value)} required />
        
        <Button 
          variant="filled" 
          color="green" 
          size="lg" 
          type="submit" 
          style={{ marginTop: '20px' }} 
          fullWidth
          disabled={isLoading}
        >
          {isLoading ? <Loader size="sm" color="white" /> : 'Confirmar Agendamento'}
        </Button>
      </form>
    </div>
  );
};

export default FormularioAgendamento;
