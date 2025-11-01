import React, { useState } from "react";
import { TextInput, Button, Loader, Notification, NumberInput, Select } from "@mantine/core";
import Modal from "./Modal";
import GCalAuthButton from "./GCalAuthButton";

const FormularioCadastro = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    nome: "",
    proprietario: "",
    email: "",
    telefone: "",
    endereco: "",
    intervalo: 30,
    fuso_horario: 'America/Sao_Paulo'
  });
  // daysOpen will hold strings '0'..'6' for selected weekdays
  const [daysOpen, setDaysOpen] = useState(['1','2','3','4','5']);
  const [defaultOpenTime, setDefaultOpenTime] = useState('09:00');
  const [defaultCloseTime, setDefaultCloseTime] = useState('17:00');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [newBarbeariaId, setNewBarbeariaId] = useState(null);

  const handleChange = (field, value) => {
    if (field === 'telefone') {
      // Permite apenas números e formata o telefone
      const digitsOnly = String(value).replace(/\D/g, '');
      let formatted = digitsOnly;
      if (digitsOnly.length > 2) {
        formatted = `(${digitsOnly.substring(0, 2)}) ${digitsOnly.substring(2, 7)}`;
      }
      if (digitsOnly.length > 7) {
        formatted = `(${digitsOnly.substring(0, 2)}) ${digitsOnly.substring(2, 7)}-${digitsOnly.substring(7, 11)}`;
      }
      setFormData(prev => ({ ...prev, [field]: formatted }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Por favor, insira um endereço de e-mail válido.");
      setIsLoading(false);
      return;
    }

    try {
      // build horarios from selected days using default times
      const payloadHorarios = daysOpen.map(d => ({
        dia_semana: Number(d),
        hora_abertura: defaultOpenTime + ':00',
        hora_fechamento: defaultCloseTime + ':00',
        intervalo_minutos: formData.intervalo
      }));

      const res = await fetch('/api/barbearias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: formData.nome,
          proprietario: formData.proprietario,
          email: formData.email,
          telefone: formData.telefone,
          endereco: formData.endereco,
          intervalo: formData.intervalo,
          fuso_horario: formData.fuso_horario,
          horarios: payloadHorarios,
        }),
      });

      // Read raw text first to avoid attempting to read body twice
      const raw = await res.text();
      let json;
      try {
        json = raw ? JSON.parse(raw) : {};
      } catch (parseErr) {
        throw new Error(`Resposta inesperada do servidor: ${raw || 'sem conteúdo'}`);
      }

      setIsLoading(false);
      if (!json.success) {
        setError(json.error || 'Erro ao cadastrar barbearia');
        return;
      }

      setSuccess(true);
      setNewBarbeariaId(json.barbearia.id || json.barbearia);
    } catch (err) {
      setIsLoading(false);
      setError(err.message || 'Erro ao cadastrar barbearia');
    }
  };

  const handleGoogleConnect = () => {
    if (!newBarbeariaId) {
      alert("⚠️ Cadastre a barbearia primeiro!");
      return;
    }
    window.location.href = `/api/auth/google?shop_id=${newBarbeariaId}`;
  };

  if (!isOpen) return null;

  if (success && newBarbeariaId) {
    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className="form-container">
          <h2>Cadastro Concluído!</h2>
          <Notification title="Próximo Passo" color="green" style={{ marginBottom: 15 }}>
            Barbearia cadastrada. Agora, conecte seu Google Calendar.
          </Notification>
          <GCalAuthButton barbeariaId={newBarbeariaId} />
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="form-container">
        <h2>Cadastre sua Barbearia (Passo 1)</h2>

        {error && <Notification color="red" onClose={() => setError(null)}>{error}</Notification>}

        <form onSubmit={handleSubmit}>
          <TextInput label="Nome da Barbearia" name="nome" value={formData.nome} onChange={(e) => handleChange('nome', e.target.value)} required />
          <TextInput label="Nome do Proprietário" name="proprietario" value={formData.proprietario} onChange={(e) => handleChange('proprietario', e.target.value)} required />
          <TextInput label="Telefone" type="tel" name="telefone" placeholder="(xx) xxxxx-xxxx" value={formData.telefone} onChange={(e) => handleChange('telefone', e.target.value)} required maxLength={15} />
          <TextInput label="Email" type="email" name="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} required />
          <TextInput label="Endereço Completo" name="endereco" value={formData.endereco} onChange={(e) => handleChange('endereco', e.target.value)} required />

          <Select label="Fuso horário" data={[{ value: 'America/Sao_Paulo', label: 'São Paulo' }, { value: 'America/Manaus', label: 'Manaus' }, { value: 'America/New_York', label: 'Nova York' }, { value: 'Europe/Lisbon', label: 'Lisboa' }]} value={formData.fuso_horario} onChange={(val) => setFormData(prev => ({ ...prev, fuso_horario: val }))} />

          <div style={{ marginTop: 12 }}>
            <h4 style={{ color: '#fff', marginBottom: 8 }}>Dias de Funcionamento (marque os dias)</h4>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
              {[
                { v: '0', label: 'Dom' },
                { v: '1', label: 'Seg' },
                { v: '2', label: 'Ter' },
                { v: '3', label: 'Qua' },
                { v: '4', label: 'Qui' },
                { v: '5', label: 'Sex' },
                { v: '6', label: 'Sáb' },
              ].map(d => (
                <Button
                  key={d.v}
                  variant={daysOpen.includes(d.v) ? 'filled' : 'outline'}
                  color={daysOpen.includes(d.v) ? 'green' : 'gray'}
                  onClick={() => setDaysOpen(prev => prev.includes(d.v) ? prev.filter(x => x !== d.v) : [...prev, d.v])}
                >
                  {d.label}
                </Button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ color: '#fff', fontSize: 12 }}>Hora abertura padrão</label>
                <input type="time" value={defaultOpenTime} onChange={(e) => setDefaultOpenTime(e.target.value)} style={{ width: 140, padding: '6px', borderRadius: 4 }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ color: '#fff', fontSize: 12 }}>Hora fechamento padrão</label>
                <input type="time" value={defaultCloseTime} onChange={(e) => setDefaultCloseTime(e.target.value)} style={{ width: 140, padding: '6px', borderRadius: 4 }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ color: '#fff', fontSize: 12 }}>Intervalo (min)</label>
                <NumberInput value={formData.intervalo} onChange={(val) => setFormData(prev => ({ ...prev, intervalo: val }))} min={15} step={15} style={{ width: 120 }} />
              </div>
            </div>
          </div>

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
    </Modal>
  );
};

export default FormularioCadastro;
