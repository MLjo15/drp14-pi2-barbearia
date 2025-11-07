/**
 * @file src/components/FormularioCadastro.jsx
 * @description Componente de formulário para o cadastro de uma nova barbearia.
 * Este formulário é apresentado em um modal e possui um fluxo de duas etapas:
 * 1. Preenchimento e envio dos dados da barbearia.
 * 2. Após o sucesso, apresenta um botão para conectar a conta do Google Calendar.
 */

import React, { useState } from "react";
import { TextInput, Button, Loader, Notification, NumberInput, Select } from "@mantine/core";
import Modal from "./Modal";
import GCalAuthButton from "./GCalAuthButton";

/**
 * Componente de formulário para cadastro de novas barbearias.
 * @param {{ isOpen: boolean, onClose: () => void }} props - Propriedades para controlar a visibilidade do modal.
 */
const FormularioCadastro = ({ isOpen, onClose }) => {
  // ----------------------------------------------------------------
  // ESTADOS (STATES)
  // Gerencia os dados do formulário, UI e fluxo de cadastro.
  // ----------------------------------------------------------------

  /** @type {[object, function]} Estado para os dados principais do formulário da barbearia. */
  const [formData, setFormData] = useState({
    nome: "",
    proprietario: "",
    email: "",
    telefone: "",
    endereco: "",
    intervalo: 30, // Intervalo padrão de 30 minutos entre agendamentos.
    fuso_horario: 'America/Sao_Paulo' // Fuso horário padrão.
  });

  /** @type {[string[], function]} Armazena os dias de funcionamento selecionados (ex: ['1', '2', '3'] para Seg, Ter, Qua). */
  const [daysOpen, setDaysOpen] = useState(['1','2','3','4','5']);
  /** @type {[string, function]} Hora de abertura padrão para os dias selecionados. */
  const [defaultOpenTime, setDefaultOpenTime] = useState('09:00');
  /** @type {[string, function]} Hora de fechamento padrão para os dias selecionados. */
  const [defaultCloseTime, setDefaultCloseTime] = useState('17:00');

  // Estados de controle da UI
  /** @type {[boolean, function]} Controla o estado de carregamento durante a submissão. */
  const [isLoading, setIsLoading] = useState(false);
  /** @type {[string|null, function]} Armazena mensagens de erro para exibição. */
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

  /**
   * Manipulador da submissão do formulário de cadastro.
   * Valida os dados, constrói o payload (incluindo os horários de funcionamento)
   * e envia para a API. Em caso de sucesso, atualiza a UI para a segunda etapa
   * (conexão com Google Calendar).
   */
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
      // Constrói o array de horários com base nos dias selecionados e nos horários padrão.
      const payloadHorarios = daysOpen.map(d => ({
        dia_semana: Number(d),
        hora_abertura: defaultOpenTime + ':00',
        hora_fechamento: defaultCloseTime + ':00',
        intervalo_minutos: formData.intervalo
      }));

      // Envia a requisição POST para a API para criar a nova barbearia.
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

      // Lê a resposta como texto bruto primeiro para evitar erro de "body already read"
      // e para lidar com respostas que podem não ser JSON válido.
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

      // Em caso de sucesso, armazena o ID da nova barbearia e avança para a próxima etapa.
      setSuccess(true);
      setNewBarbeariaId(json.barbearia.id || json.barbearia);
    } catch (err) {
      setIsLoading(false);
      setError(err.message || 'Erro ao cadastrar barbearia');
    }
  };

  /**
   * Função para iniciar o fluxo de autenticação do Google Calendar.
   * Redireciona o usuário para a rota de autenticação do backend, passando o ID da barbearia.
   */
  const handleGoogleConnect = () => {
    if (!newBarbeariaId) {
      alert("⚠️ Cadastre a barbearia primeiro!");
      return;
    }
    window.location.href = `/api/auth/google?shop_id=${newBarbeariaId}`;
  };

  if (!isOpen) return null;

  // --- RENDERIZAÇÃO DA ETAPA 2: SUCESSO E CONEXÃO COM GOOGLE ---
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

  // --- RENDERIZAÇÃO DA ETAPA 1: FORMULÁRIO DE CADASTRO ---
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="form-container">
        <h2>Cadastre sua Barbearia (Passo 1)</h2>

        {error && <Notification color="red" onClose={() => setError(null)}>{error}</Notification>}

        {/* Formulário principal */}
        <form onSubmit={handleSubmit}>
          <TextInput label="Nome da Barbearia" name="nome" value={formData.nome} onChange={(e) => handleChange('nome', e.target.value)} required />
          <TextInput label="Nome do Proprietário" name="proprietario" value={formData.proprietario} onChange={(e) => handleChange('proprietario', e.target.value)} required />
          <TextInput label="Telefone" type="tel" name="telefone" placeholder="(xx) xxxxx-xxxx" value={formData.telefone} onChange={(e) => handleChange('telefone', e.target.value)} required maxLength={15} />
          <TextInput label="Email" type="email" name="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} required />
          <TextInput label="Endereço Completo" name="endereco" value={formData.endereco} onChange={(e) => handleChange('endereco', e.target.value)} required />

          {/* Seletor de Fuso Horário */}
          <Select label="Fuso horário" data={[{ value: 'America/Sao_Paulo', label: 'São Paulo' }, { value: 'America/Manaus', label: 'Manaus' }, { value: 'America/New_York', label: 'Nova York' }, { value: 'Europe/Lisbon', label: 'Lisboa' }]} value={formData.fuso_horario} onChange={(val) => setFormData(prev => ({ ...prev, fuso_horario: val }))} />

          <div style={{ marginTop: 12 }}>
            {/* Seletor de Dias de Funcionamento */}
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
                  // Adiciona ou remove o dia da lista de dias abertos.
                  onClick={() => setDaysOpen(prev => prev.includes(d.v) ? prev.filter(x => x !== d.v) : [...prev, d.v])}
                >
                  {d.label}
                </Button>
              ))}
            </div>

            {/* Seletores de Horário e Intervalo */}
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

          {/* Botão de Submissão */}
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
