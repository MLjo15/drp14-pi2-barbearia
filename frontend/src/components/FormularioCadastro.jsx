import React, { useState } from "react";
import { TextInput, Button, Select, Loader, Notification } from "@mantine/core";
import { supabase } from "../supabaseClient";
import GCalAuthButton from "./GCalAuthButton"; // Assumindo que você tem este componente

const FormularioCadastro = ({ onClose }) => {
  const [formData, setFormData] = useState({
    nome: "",
    proprietario: "",
    telefone: "",
    email: "",
    endereco: "",
    intervalo: "30",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [newBarbeariaId, setNewBarbeariaId] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSelectChange = (value) => setFormData((p) => ({ ...p, intervalo: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("barbearias")
        .insert([
          {
            nome: formData.nome,
            proprietario: formData.proprietario,
            email: formData.email,
            telefone: formData.telefone,
            endereco: formData.endereco,
            // Certifica-se de que o intervalo é inserido como número
            intervalo: parseInt(formData.intervalo, 10), 
          },
        ])
        .select("id")
        .single();

      if (error) throw error;

      setSuccess(true);
      setNewBarbeariaId(data.id);
    } catch (err) {
      setError(err.message || "Erro ao cadastrar");
    } finally {
      setIsLoading(false);
    }
  };

  // -----------------------------------------------------------
  // RENDERIZAÇÃO PÓS-SUCESSO
  // -----------------------------------------------------------
  if (success && newBarbeariaId) {
    return (
      <div className="form-container">
        <h2>Cadastro Concluído!</h2>
        <Notification title="Próximo Passo" color="green" style={{ marginBottom: 15 }}>
          Barbearia cadastrada. Agora, conecte seu Google Calendar.
        </Notification>
        <div className="modal-buttons">
          <GCalAuthButton barbeariaId={newBarbeariaId} />
          <Button variant="subtle" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    );
  }
  
  // -----------------------------------------------------------
  // RENDERIZAÇÃO DO FORMULÁRIO PRINCIPAL
  // -----------------------------------------------------------
  return (
    <div className="form-container">
      <h2>Cadastre sua Barbearia</h2>
      {error && <Notification color="red">{error}</Notification>}
      <form onSubmit={handleSubmit}>
        <TextInput label="Nome da Barbearia" name="nome" value={formData.nome} onChange={handleChange} required />
        <TextInput label="Nome do Proprietário" name="proprietario" value={formData.proprietario} onChange={handleChange} required />
        <TextInput label="Telefone" name="telefone" value={formData.telefone} onChange={handleChange} required />
        <TextInput label="Email" name="email" value={formData.email} onChange={handleChange} required />
        <TextInput label="Endereço" name="endereco" value={formData.endereco} onChange={handleChange} required />

        <Select
          label="Intervalo (minutos)"
          data={[
            { value: "15", label: "15 minutos" },
            { value: "30", label: "30 minutos" },
            { value: "45", label: "45 minutos" },
            { value: "60", label: "60 minutos" },
          ]}
          value={formData.intervalo}
          onChange={handleSelectChange}
          placeholder="Selecione um intervalo"
          required
        />

        <Button type="submit" fullWidth disabled={isLoading}>
          {isLoading ? <Loader size="sm" /> : "Registrar Barbearia"}
        </Button>
      </form>
    </div>
  );
};

export default FormularioCadastro;