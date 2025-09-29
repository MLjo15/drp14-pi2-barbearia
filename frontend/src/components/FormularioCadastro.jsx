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

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [newBarbeariaId, setNewBarbeariaId] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
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
          <Button variant="subtle" onClick={onClose} style={{ marginTop: '15px' }}>
            Fechar
          </Button>
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
          <TextInput label="Nome da Barbearia" name="nome" value={formData.nome} onChange={handleChange} required />
          <TextInput label="Nome do Proprietário" name="proprietario" value={formData.proprietario} onChange={handleChange} required />
          <TextInput label="Telefone" type="tel" name="telefone" value={formData.telefone} onChange={handleChange} required />
          <TextInput label="Email" type="email" name="email" value={formData.email} onChange={handleChange} required />
          <TextInput label="Endereço Completo" name="endereco" value={formData.endereco} onChange={handleChange} required />

          <NumberInput label="Intervalo (min)" name="intervalo" value={formData.intervalo} onChange={(val) => setFormData(prev => ({ ...prev, intervalo: val }))} min={15} step={15} />

          <Select label="Fuso horário" data={[{ value: 'America/Sao_Paulo', label: 'São Paulo' }, { value: 'America/Manaus', label: 'Manaus' }, { value: 'America/New_York', label: 'Nova York' }, { value: 'Europe/Lisbon', label: 'Lisboa' }]} value={formData.fuso_horario} onChange={(val) => setFormData(prev => ({ ...prev, fuso_horario: val }))} />

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
