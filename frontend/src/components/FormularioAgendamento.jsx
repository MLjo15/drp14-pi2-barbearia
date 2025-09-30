import React, { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';
import { TextInput, Button, Select, Loader, Notification } from '@mantine/core';

const FormularioAgendamento = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    barbearia_id: '',
    data: '',
    hora: '',
    servico: '',
    nome: '',
    email: '',
    telefone: '',
  });
  const [barbearias, setBarbearias] = useState([]);
  const [slots, setSlots] = useState([]);
  const [isSlotsLoading, setIsSlotsLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const slotsDisponiveis = ['09:00', '10:30', '12:00', '14:00', '15:30', '17:00'];

  useEffect(() => {
    const fetchBarbearias = async () => {
      try {
        const res = await fetch('/api/barbearias');
        const json = await res.json();
        if (json.success) {
          // optionally filter by connected status if that field exists
          setBarbearias(json.barbearias);
        } else {
          setError('Não foi possível carregar a lista de barbearias.');
        }
      } catch (err) {
        console.error(err);
        setError('Não foi possível carregar a lista de barbearias.');
      }
    };
    fetchBarbearias();
  }, []);

  const barbeariasData = useMemo(() => barbearias.map(b => ({ value: b.id, label: b.nome })), [barbearias]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // when barbearia selected, fetch its details (intervalo) and clear slots
  useEffect(() => {
    const id = formData.barbearia_id;
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/barbearias/${id}`);
        const json = await res.json();
        if (json.success && json.barbearia) {
          // optionally store interval in local barbearias state
          setBarbearias(prev => prev.map(b => b.id === id ? { ...b, intervalo: json.barbearia.intervalo } : b));
          setSlots([]);
        }
      } catch (err) {
        console.error('Erro fetch barbearia:', err);
      }
    })();
  }, [formData.barbearia_id]);

  // when date or barbearia changes, fetch availability
  useEffect(() => {
    const id = formData.barbearia_id;
    const date = formData.data;
    if (!id || !date) return;
    setIsSlotsLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/barbearias/${id}/availability?date=${date}`);
        const json = await res.json();
        if (json.success) {
          // map slots to label/value for Mantine Select
          setSlots(json.slots.map(s => ({ value: s.start, label: new Date(s.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), end: s.end })));
        } else {
          setSlots([]);
        }
      } catch (err) {
        console.error('Erro fetch availability:', err);
        setSlots([]);
      } finally {
        setIsSlotsLoading(false);
      }
    })();
  }, [formData.barbearia_id, formData.data]);

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
    const dataHoraInicio = `${formData.data}T${formData.hora}:00`;

    // find selected barbearia to get intervalo (minutes)
    const selected = barbearias.find(b => String(b.id) === String(formData.barbearia_id)) || {};
    const intervalo = selected.intervalo || 30;

    const startDate = new Date(dataHoraInicio);
    const endDate = new Date(startDate.getTime() + intervalo * 60000);
    const dataHoraFim = endDate.toISOString();

      const response = await fetch("/api/agendamento", {
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

      let responseJson;
      try {
        responseJson = await response.json();
      } catch (parseErr) {
        const txt = await response.text();
        throw new Error(`Resposta inesperada do servidor: ${txt || 'sem conteúdo'}`);
      }

      if (!response.ok) {
        throw new Error(responseJson.error || 'Erro ao agendar no servidor.');
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
    <Modal isOpen={isOpen} onClose={onClose}>
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
            placeholder={isSlotsLoading ? 'Carregando...' : 'Selecione um horário'}
            data={slots}
            value={formData.hora}
            onChange={(value) => handleChange('hora', value)}
            required
            nothingFound={isSlotsLoading ? 'Carregando...' : 'Nenhum horário disponível'}
          />
          
          <Select
            label="Serviço"
            data={['Corte de Cabelo', 'Barba', 'Corte e Barba', 'Outro']}
            value={formData.servico}
            onChange={(value) => handleChange('servico', value)}
            required
            withinPortal={true} 
          />

          {/* duration is derived from the selected barbearia.intervalo; no manual input */}

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
    </Modal>
  );
};

export default FormularioAgendamento;
