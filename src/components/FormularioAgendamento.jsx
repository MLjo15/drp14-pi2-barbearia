// src/components/FormularioAgendamento.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { TextInput, Button, Select, Loader, Notification } from '@mantine/core';
import { supabase } from '../supabaseClient'; 

const FormularioAgendamento = ({ onClose }) => {
  // ... seus estados ...
  const [formData, setFormData] = useState({ /* ... */ });
  const [barbearias, setBarbearias] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Slots Simples - **NA VIDA REAL**, viriam do seu SERVIDOR/Backend.
  const slotsDisponiveis = ['09:00', '10:30', '12:00', '14:00', '15:30', '17:00'];

  // EFEITO: Carregar a lista de barbearias **CONECTADAS** ao GCal
  useEffect(() => {
    const fetchBarbearias = async () => {
      // Filtra apenas as que têm o status 'conectado'
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

  const barbeariasData = useMemo(() => 
    barbearias.map(b => ({ value: b.id, label: b.nome })), 
    [barbearias]
  );

  // ... funções handleChange e getOrCreateClient (mantidas) ...

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    // ... validação e obtenção do clienteId ...

    try {
        const clienteId = await getOrCreateClient(formData.nome, formData.email, formData.telefone);
        const dataHoraAgendamento = `${formData.data}T${formData.hora}:00-03:00`;
        
        // ----------------------------------------------------------------------
        // AQUI ESTÁ O PONTO CRÍTICO: CHAMA O SEU SERVIDOR/BACKEND
        // ----------------------------------------------------------------------
        
        // Na prática, você faria um POST para sua função serverless com todos os dados:
        /* const response = await fetch('/api/agendar-gcal', {
            method: 'POST',
            body: JSON.stringify({ 
                barbearia_id: formData.barbearia_id, 
                cliente_id: clienteId, 
                servico: formData.servico, 
                data_hora: dataHoraAgendamento,
                cliente_email: formData.email
            })
        });
        
        if (!response.ok) { throw new Error('Erro ao agendar no servidor.'); }
        
        // O servidor, após sucesso no Google Calendar, deve inserir no Supabase.
        */

        // TEMPORÁRIO: Inserção direta no Supabase (apenas para testar o fluxo de dados)
        const { error: agendamentoError } = await supabase
            .from('agendamentos')
            .insert([{
                barbearia_id: formData.barbearia_id, 
                cliente_id: clienteId,
                servico: formData.servico,
                data_hora: dataHoraAgendamento,
            }]);
            
        if (agendamentoError) { throw new Error(`Erro ao registrar: ${agendamentoError.message}`); }
        // FIM DO TEMPORÁRIO

        setSuccess(true);
        // ... limpar formulário e fechar modal ...

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
      {/* ... Exibição de Erros/Sucesso ... */}
      
      <form onSubmit={handleSubmit}>
        <Select
          label="Escolha a Barbearia"
          placeholder="Selecione a barbearia"
          data={barbeariasData}
          value={formData.barbearia_id}
          onChange={(value) => handleChange('barbearia_id', value)}
          required
        />

        <TextInput label="Data" type="date" name="data" value={formData.data} onChange={(e) => handleChange('data', e.target.value)} required />
        
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

        {/* Dados do Cliente */}
        <TextInput label="Nome Completo" name="nome" value={formData.nome} onChange={(e) => handleChange('nome', e.target.value)} required />
        <TextInput label="Email" type="email" name="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} required />
        <TextInput label="Telefone" type="tel" name="telefone" value={formData.telefone} onChange={(e) => handleChange('telefone', e.target.value)} required />
        
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