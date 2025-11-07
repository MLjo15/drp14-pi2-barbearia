/**
 * @file src/components/FormularioAgendamento.jsx
 * @description Componente de formulário para criar um novo agendamento.
 * Este componente é renderizado dentro de um modal e gerencia todo o fluxo de agendamento,
 * desde a seleção da barbearia até a submissão dos dados do cliente.
 */

import React, { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';
import { TextInput, Button, Select, Loader, Notification, Popover } from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br'; // Importa a localização para formatar datas em português.
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';

/**
 * Componente principal do formulário de agendamento.
 * @param {{ isOpen: boolean, onClose: () => void }} props - Propriedades para controlar a visibilidade do modal.
 */
export default function FormularioAgendamento({ isOpen, onClose }) {
  // ----------------------------------------------------------------
  // ESTADOS (STATES)
  // Gerencia todos os dados do formulário, estados de carregamento,
  // erros e dados buscados da API.
  // ----------------------------------------------------------------

  /** @type {[object, function]} Estado para os dados do formulário. */
  const [formData, setFormData] = useState({
    barbearia_id: '',
    data: '', // Formato 'YYYY-MM-DD' para consistência na API.
    hora: '',
    servico: '',
    nome: '',
    email: '',
    telefone: ''
  });

  /** @type {[Array, function]} Estado para a lista de barbearias vinda da API. */
  const [barbearias, setBarbearias] = useState([]);
  /** @type {[Array, function]} Estado para os horários (slots) disponíveis para a data selecionada. */
  const [slots, setSlots] = useState([]);
  /** @type {[Set<number>, function]} Estado para os dias da semana em que a barbearia funciona (0=Domingo, 1=Segunda, etc.). */
  const [workingDays, setWorkingDays] = useState(new Set());
  /** @type {[Date|null, function]} Estado para o objeto Date nativo da data selecionada, normalizado para meia-noite local. */
  const [selectedDateObj, setSelectedDateObj] = useState(null);

  // Estados de controle da UI (carregamento, erros, sucesso)
  /** @type {[boolean, function]} Controla o loader do seletor de horários. */
  const [isSlotsLoading, setIsSlotsLoading] = useState(false);
  /** @type {[boolean, function]} Controla o estado de carregamento do botão de submissão. */
  const [isLoading, setIsLoading] = useState(false);
  /** @type {[boolean, function]} Controla o loader inicial de carregamento das barbearias. */
  const [isBarbeariasLoading, setIsBarbeariasLoading] = useState(true);
  /** @type {[string|null, function]} Armazena mensagens de erro para exibição em notificações. */
  const [error, setError] = useState(null);
  /** @type {[boolean, function]} Controla a exibição da notificação de sucesso. */
  const [success, setSuccess] = useState(false);
  /** @type {[boolean, function]} Controla a visibilidade do popover do calendário (DatePicker). */
  const [popoverOpened, setPopoverOpened] = useState(false);

  // Define o locale do Day.js globalmente para este componente.
  dayjs.locale('pt-br');

  // ----------------------------------------------------------------
  // FUNÇÕES AUXILIARES E MANIPULADORES (HANDLERS)
  // ----------------------------------------------------------------

  /**
   * Manipulador genérico para atualizar o estado `formData`.
   * Inclui uma máscara de formatação para o campo de telefone.
   * @param {string} field - O nome do campo a ser atualizado.
   * @param {string} value - O novo valor do campo.
   */
  const handleChange = (field, value) => {
    if (field === 'telefone') {
      // Remove tudo que não for dígito.
      const digitsOnly = value.replace(/\D/g, '');
      let formatted = digitsOnly;
      // Aplica a máscara (XX) XXXXX-XXXX dinamicamente.
      if (digitsOnly.length > 2) {
        formatted = `(${digitsOnly.substring(0, 2)}) ${digitsOnly.substring(2, 7)}`;
      }
      if (digitsOnly.length > 7) {
        formatted = `(${digitsOnly.substring(0, 2)}) ${digitsOnly.substring(2, 7)}-${digitsOnly.substring(7, 11)}`;
      }
      setFormData(prev => ({ ...prev, [field]: formatted.substring(0, 15) })); // Limita o tamanho
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  /**
   * Normaliza qualquer formato de data (Date, Dayjs, string ISO) para um objeto Date local,
   * sempre à meia-noite (00:00:00). Isso é crucial para evitar bugs de fuso horário
   * que podem fazer com que a data mude de dia.
   * @param {Date|object|string|null} input - A data a ser normalizada.
   * @returns {Date|null} Um objeto Date normalizado ou null se a entrada for inválida.
   */
  const toLocalMidnight = (input) => {
    if (!input) return null;

    // Se for um objeto Dayjs (identificado pela propriedade $d), usa o Date nativo interno.
    if (input && typeof input.$d !== 'undefined') {
      const dt = input.$d;
      return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
    }

    // Se já for um objeto Date nativo.
    if (input instanceof Date) {
      return new Date(input.getFullYear(), input.getMonth(), input.getDate());
    }
    
    // Se for uma string (ex: 'YYYY-MM-DD' ou formato ISO), usa Day.js para um parse mais robusto.
    try {
      const parsed = dayjs(String(input));
      if (parsed && parsed.isValid && parsed.isValid()) {
        const d = parsed.toDate();
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
      }
    } catch (e) {
      // Ignora o erro e tenta o próximo método.
    }

    // Como último recurso, tenta o construtor `new Date` e normaliza.
    try {
      const d = new Date(input);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    } catch {
      return null;
    }
  };

  // ----------------------------------------------------------------
  // EFEITOS (EFFECTS)
  // ----------------------------------------------------------------

  /**
   * Efeito para buscar a lista de barbearias da API.
   * É executado apenas uma vez, quando o componente é montado.
   */
  useEffect(() => {
    setIsBarbeariasLoading(true);
    (async () => {
      try {
        const res = await fetch('/api/barbearias');
        const j = await res.json();
        if (j.success) setBarbearias(j.barbearias || []);
      } catch (e) {
        setError("Não foi possível carregar as barbearias. Tente novamente mais tarde.");
        console.error(e);
      } finally {
        setIsBarbeariasLoading(false);
      }
    })();
  }, []);

  /**
   * Efeito para verificar o status da autenticação do Google na URL.
   * Executado uma vez na montagem para mostrar notificações de sucesso ou falha
   * após o redirecionamento do OAuth do Google.
   */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // Procura pelo parâmetro 'google_auth_status' na URL.
    const googleAuthStatus = params.get('google_auth_status');

    if (googleAuthStatus) {
      if (googleAuthStatus === 'success') {
        notifications.show({
          title: 'Sucesso!',
          message: 'Sua agenda do Google Calendar foi vinculada com sucesso.',
          color: 'teal',
          icon: <IconCheck size={18} />,
          autoClose: 6000,
        });
      } else { // 'error' ou qualquer outro valor
        notifications.show({
          title: 'Falha na Vinculação',
          message: 'Não foi possível vincular sua agenda do Google Calendar. Tente novamente.',
          color: 'red',
          icon: <IconX size={18} />,
          autoClose: 8000,
        });
      }

      // Limpa os parâmetros da URL para que a notificação não apareça novamente ao recarregar.
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []); // O array vazio [] garante que este efeito rode apenas uma vez.

  /**
   * Memoiza a formatação dos dados das barbearias para o componente Select.
   * Isso evita que o array seja recalculado em cada renderização, otimizando a performance.
   * O cálculo só é refeito se a lista de `barbearias` mudar.
   */
  const barbeariasData = useMemo(() => barbearias.map(b => ({ value: b.id, label: b.nome })), [barbearias]);

  /**
   * Efeito para buscar os dias de funcionamento da barbearia selecionada.
   * É acionado sempre que `formData.barbearia_id` muda. Ao mudar de barbearia,
   * reseta a data e hora selecionadas.
   */
  useEffect(() => {
    const id = formData.barbearia_id;
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/barbearias/${id}`);
        const j = await res.json();
        if (j.success) {
          const horarios = Array.isArray(j.horarios) ? j.horarios : [];
          // Cria um Set com os dias da semana (números) em que a barbearia opera.
          const newWorkingDays = new Set(horarios.map(h => Number(h.dia_semana)).filter(n => !Number.isNaN(n)));
          setWorkingDays(newWorkingDays);

          // Reseta os campos dependentes para forçar o usuário a selecioná-los novamente.
          setSelectedDateObj(null);
          setFormData(prev => ({ ...prev, data: '', hora: null }));
          setSlots([]);
        }
      } catch (e) { console.error(e); }
    })();
  }, [formData.barbearia_id]);

  /**
   * Efeito para buscar os horários (slots) disponíveis para uma data específica.
   * É acionado quando a barbearia ou a data mudam.
   * Valida se o dia selecionado é um dia de funcionamento antes de fazer a requisição à API.
   */
  useEffect(() => {
    const id = formData.barbearia_id;
    const dateStr = formData.data;
    if (!id || !dateStr) return;

    // Calcula o dia da semana (0-6) a partir da string 'YYYY-MM-DD'.
    const dayNum = dayjs(dateStr, 'YYYY-MM-DD').day();

    // Se o dia selecionado não for um dia de funcionamento, não faz a busca.
    if (workingDays && workingDays.size > 0 && !workingDays.has(dayNum)) {
      setSlots([]);
      return;
    }

    setIsSlotsLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/barbearias/${id}/availability?date=${dateStr}`);
        const j = await res.json();
        if (j.success) {
          setSlots(
            j.slots.map(s => ({
              // O valor é o timestamp ISO, o label é a hora formatada para o usuário.
              value: s.start,
              label: new Date(s.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              end: s.end
            }))
          );
        } else {
          setSlots([]);
        }

        // Se a busca foi bem-sucedida mas não retornou slots, informa o usuário.
        if (j.success && Array.isArray(j.slots) && j.slots.length === 0) {
          setError('Nenhum horário disponível para a data selecionada.');
        }
      } catch (e) {
        console.error(e);
        setSlots([]);
      } finally {
        setIsSlotsLoading(false);
      }
    })();
  }, [formData.barbearia_id, formData.data, workingDays]);

  /**
   * Efeito para lidar com a submissão bem-sucedida.
   * Quando `success` se torna `true`, ele agenda o fechamento do modal e o reset do formulário
   * para após 3 segundos, dando tempo para o usuário ler a notificação de sucesso.
   */
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(false);
        // Reseta o formulário para o estado inicial.
        setFormData({ barbearia_id: '', data: '', hora: '', servico: '', nome: '', email: '', telefone: '' });
        if (onClose) onClose(); // Chama a função para fechar o modal.
      }, 3000);

      // Função de limpeza: se o componente for desmontado antes do timer, o timer é cancelado.
      return () => clearTimeout(timer);
    }
  }, [success, onClose]);

  /**
   * Manipulador da submissão do formulário.
   * Valida os dados, monta o payload e envia para a API de agendamento.
   * Trata os casos de sucesso, erro e conflito de horário (409).
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); setError(null);

    // Validação de Email simples com Regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Por favor, insira um endereço de e-mail válido.");
      setIsLoading(false);
      return;
    }

    try {
      const selectedSlot = slots.find(s => String(s.value) === String(formData.hora));
      let dataHoraInicio, dataHoraFim;

      if (selectedSlot) {
        dataHoraInicio = selectedSlot.value;
        // Usa o `end` do slot se disponível, senão calcula com base no intervalo da barbearia.
        dataHoraFim = selectedSlot.end || new Date(new Date(selectedSlot.value).getTime() + ((Number(barbearias.find(b => String(b.id) === String(formData.barbearia_id))?.intervalo) || 30) * 60000)).toISOString();
      } else {
        const interval = Number(barbearias.find(b => String(b.id) === String(formData.barbearia_id))?.intervalo) || 30;
        const built = `${formData.data}T${formData.hora}`;
        const start = new Date(built);
        dataHoraInicio = start.toISOString();
        dataHoraFim = new Date(start.getTime() + interval * 60000).toISOString();
      }

      const res = await fetch('/api/agendamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_id: formData.barbearia_id,
          cliente_nome: formData.nome,
          cliente_email: formData.email,
          cliente_telefone: formData.telefone,
          servico: formData.servico,
          data_hora_inicio: dataHoraInicio,
          data_hora_fim: dataHoraFim
        })
      });

      // Tratamento de erros específicos da resposta da API.
      if (res.status === 409) throw new Error('Horário já reservado');
      const j = await res.json(); if (!res.ok) throw new Error(j.error || 'Erro servidor');

      // Dispara o fluxo de sucesso.
      setSuccess(true);

    } catch (err) {
      console.error(err);
      setError(err.message || String(err));
    } finally {
      setIsLoading(false);
    }
  };

  // ----------------------------------------------------------------
  // RENDERIZAÇÃO DO COMPONENTE (JSX)
  // ----------------------------------------------------------------

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="form-container">
        <h2>Agende seu Horário</h2>

        {/* Renderização condicional durante o carregamento inicial das barbearias */}
        {isBarbeariasLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
            <Loader />
          </div>
        ) : barbearias.length === 0 ? (
          // Mensagem exibida se nenhuma barbearia for encontrada.
          <Notification color="yellow" title="Nenhuma barbearia disponível" disallowClose>
            No momento, não há barbearias cadastradas para agendamento. Por favor, volte mais tarde.
          </Notification>
        ) : (
          <>
            {error && <Notification color="red" onClose={() => setError(null)}>{error}</Notification>}
            {/* A notificação de sucesso não tem botão de fechar, pois some sozinha. */}
            {success && <Notification color="green" onClose={() => setSuccess(false)}>Agendamento realizado com sucesso!</Notification>}

            <form onSubmit={handleSubmit}>
              <Select
                label="Escolha a Barbearia"
                placeholder="Selecione a barbearia"
                data={barbeariasData}
                value={formData.barbearia_id}
                onChange={(v) => handleChange('barbearia_id', v)}
                required
                withCheckIcon={false}
              />

              {/* O DatePicker é controlado por um Popover para melhor posicionamento e controle. */}
              <div style={{ marginBottom: 10 }}>
                <Popover
                  width={520}
                  position="bottom"
                  withArrow
                  withinPortal
                  offset={8}
                  opened={popoverOpened}
                  onChange={setPopoverOpened}
                  closeOnClickOutside
                  closeOnEscape
                >
                  <Popover.Target>
                    {/* O TextInput age como o gatilho visual para o DatePicker. */}
                    <div>
                      <TextInput
                        label="Data"
                        placeholder="Selecione a data"
                        value={selectedDateObj ? dayjs(selectedDateObj).format('DD/MM/YYYY') : ''}
                        readOnly
                        className="fc-datepicker-input"
                        onClick={() => setPopoverOpened(o => !o)}
                        required
                      />
                    </div>
                  </Popover.Target>

                  <Popover.Dropdown className="fc-datepicker-dropdown" style={{ minWidth: 520 }}>
                    {/* Componente DatePicker do Mantine. */}
                    <DatePicker
                      locale="pt-br"
                      firstDayOfWeek={1}
                      weekdayFormat="ddd"
                      value={selectedDateObj}
                      onChange={(value) => {
                        const local = toLocalMidnight(value);
                        // Atualiza os estados e fecha o popover ao selecionar uma data.
                        if (!local) return;
                        setSelectedDateObj(local);
                        handleChange('data', dayjs(local).format('YYYY-MM-DD'));
                        setPopoverOpened(false);
                      }}
                      size="sm"
                      hideOutsideDates
                      minDate={new Date()}
                      // Desabilita datas que não são dias de funcionamento.
                      excludeDate={(d) => {
                        const n = toLocalMidnight(d);
                        if (!n) return false;
                        if (!workingDays || workingDays.size === 0) return false;
                        return !workingDays.has(n.getDay());
                      }}
                      // Renderização customizada para os dias no calendário.
                      renderDay={(d) => {
                        const n = toLocalMidnight(d);
                        if (!n) return null;
                        const isAvailable = workingDays.size === 0 || workingDays.has(n.getDay());
                        const isSelected = selectedDateObj && dayjs(selectedDateObj).isSame(dayjs(n), 'day');
                        return (
                          <div className={`fc-day ${isAvailable ? 'available' : 'disabled'} ${isSelected ? 'selected' : ''}`}>
                            {n.getDate()}
                          </div>
                        );
                      }}
                    />
                  </Popover.Dropdown>
                </Popover>
              </div>

              <Select
                label="Horário Disponível"
                placeholder={isSlotsLoading ? 'Carregando...' : 'Selecione um horário'}
                data={slots}
                value={formData.hora}
                onChange={(v) => handleChange('hora', v)}
                required
                withCheckIcon={false}
              />

              <Select
                label="Serviço"
                data={['Corte de Cabelo', 'Barba', 'Corte e Barba', 'Outro']}
                value={formData.servico}
                onChange={(v) => handleChange('servico', v)}
                required
                withCheckIcon={false}
              />

              <TextInput label="Nome Completo" value={formData.nome} onChange={(e) => handleChange('nome', e.target.value)} required />
              <TextInput label="Email" type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} required />
              <TextInput label="Telefone" type="tel" placeholder="(xx) xxxxx-xxxx" value={formData.telefone} onChange={(e) => handleChange('telefone', e.target.value)} required maxLength={15} />

              <Button variant="filled" color="green" size="lg" type="submit" style={{ marginTop: '20px' }} fullWidth disabled={isLoading}>
                {isLoading ? <Loader size="sm" color="white" /> : 'Confirmar Agendamento'}
              </Button>
            </form>
          </>
        )}
      </div>
    </Modal>
  );
}
