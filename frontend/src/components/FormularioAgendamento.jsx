import React, { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';
import { TextInput, Button, Select, Loader, Notification, Popover } from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';

// Componente do formulário de agendamento
export default function FormularioAgendamento({ isOpen, onClose }) {
  // ----------------------------------------------------------------
  // ESTADOS (STATES)
  // Gerencia todos os dados do formulário, estados de carregamento,
  // erros e dados buscados da API.
  // ----------------------------------------------------------------

  // Armazena os dados preenchidos pelo usuário no formulário.
  const [formData, setFormData] = useState({
    barbearia_id: '',
    data: '', // Formato: YYYY-MM-DD (string)
    hora: '',
    servico: '',
    nome: '',
    email: '',
    telefone: ''
  });
  // Armazena a lista de barbearias buscada da API.
  const [barbearias, setBarbearias] = useState([]);
  // Armazena os horários (slots) disponíveis para a data selecionada.
  const [slots, setSlots] = useState([]);
  // Armazena os dias da semana em que a barbearia funciona (0=Domingo, 1=Segunda, etc.).
  const [workingDays, setWorkingDays] = useState(new Set());
  // Armazena o objeto Date nativo da data selecionada, normalizado para meia-noite local.
  const [selectedDateObj, setSelectedDateObj] = useState(null);
  // Controla o loader do seletor de horários.
  const [isSlotsLoading, setIsSlotsLoading] = useState(false);
  // Controla o estado de carregamento do botão de submissão do formulário.
  const [isLoading, setIsLoading] = useState(false);
  // Controla o loader inicial de carregamento das barbearias.
  const [isBarbeariasLoading, setIsBarbeariasLoading] = useState(true);
  // Armazena mensagens de erro para exibição.
  const [error, setError] = useState(null);
  // Controla a exibição da notificação de sucesso.
  const [success, setSuccess] = useState(false);
  // Controla a visibilidade do popover do calendário (DatePicker).
  const [popoverOpened, setPopoverOpened] = useState(false);

  dayjs.locale('pt-br');

  // --- FUNÇÕES AUXILIARES ---

  // Atualiza o estado `formData` de forma genérica para todos os campos.
  // Inclui uma formatação especial para o campo de telefone.
  const handleChange = (field, value) => {
    if (field === 'telefone') {
      // Permite apenas números e formata o telefone
      const digitsOnly = value.replace(/\D/g, '');
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

  // Normaliza qualquer formato de data (Date, Dayjs, string ISO) para um objeto Date local,
  // sempre à meia-noite. Isso evita problemas de fuso horário que podem alterar o dia.
  const toLocalMidnight = (input) => {
    if (!input) return null;

    // Se for Dayjs (possui $d) -> usar $d
    if (input && typeof input.$d !== 'undefined') {
      const dt = input.$d;
      return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
    }

    // Se for Date nativo
    if (input instanceof Date) {
      return new Date(input.getFullYear(), input.getMonth(), input.getDate());
    }

    // Se tiver toDate (ex.: algumas libs)
    if (typeof input.toDate === 'function') {
      const dt = input.toDate();
      return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
    }

    // String (esperamos 'YYYY-MM-DD' ou ISO) -> parse com dayjs para maior previsibilidade
    try {
      const parsed = dayjs(String(input));
      if (parsed && parsed.isValid && parsed.isValid()) {
        const d = parsed.toDate();
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
      }
    } catch (e) {
      // fallback
    }

    // Último recurso: new Date(...) e ajustar localmente
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

  // Efeito para buscar a lista de barbearias quando o componente é montado.
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

  // Efeito para verificar o status da autenticação do Google na URL.
  // Este hook será executado uma vez quando o componente for montado.
  useEffect(() => {
    // Usa a API nativa do navegador para ler os parâmetros da URL.
    const params = new URLSearchParams(window.location.search);
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

      // Limpa a URL para que a notificação não apareça novamente ao recarregar a página.
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []); // O array vazio [] garante que este efeito rode apenas uma vez.

  // Memoiza a formatação dos dados das barbearias para o componente Select.
  const barbeariasData = useMemo(() => barbearias.map(b => ({ value: b.id, label: b.nome })), [barbearias]);

  // Efeito para buscar os dias de funcionamento da barbearia selecionada.
  // É acionado sempre que `formData.barbearia_id` muda.
  useEffect(() => {
    const id = formData.barbearia_id;
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/barbearias/${id}`);
        const j = await res.json();
        if (j.success) {
          const horarios = Array.isArray(j.horarios) ? j.horarios : [];
          // API: esperamos que j.horarios contenha objetos com dia_semana (0..6)
          const newWorkingDays = new Set(horarios.map(h => Number(h.dia_semana)).filter(n => !Number.isNaN(n)));
          setWorkingDays(newWorkingDays);

          // Resetar data, hora e slots ao mudar de barbearia
          setSelectedDateObj(null);
          setFormData(prev => ({ ...prev, data: '', hora: null }));
          setSlots([]);
        }
      } catch (e) { console.error(e); }
    })();
  }, [formData.barbearia_id]);

  // Efeito para buscar os horários (slots) disponíveis para uma data específica.
  // É acionado quando a barbearia ou a data no formulário mudam.
  // Valida se o dia selecionado é um dia de funcionamento antes de fazer a requisição.
  useEffect(() => {
    const id = formData.barbearia_id;
    const dateStr = formData.data;
    if (!id || !dateStr) return;

    // calcula o weekday local a partir da string YYYY-MM-DD
    const dayNum = dayjs(dateStr, 'YYYY-MM-DD').day(); // 0..6 local

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
              value: s.start,
              label: new Date(s.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              end: s.end
            }))
          );
        } else {
          setSlots([]);
        }

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

  // Efeito para lidar com a submissão bem-sucedida.
  // Mostra a notificação de sucesso e, após 3 segundos, fecha o modal
  // e reseta o estado do formulário.
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(false); // Limpa a notificação
        setFormData({ barbearia_id: '', data: '', hora: '', servico: '', nome: '', email: '', telefone: '' }); // Limpa o formulário
        if (onClose) onClose(); // Fecha o modal
      }, 3000); // 3 segundos

      return () => clearTimeout(timer); // Limpa o timer se o componente for desmontado
    }
  }, [success, onClose]);

  // Função para lidar com a submissão do formulário.
  // Valida o e-mail, monta o payload e envia para a API de agendamento.
  // Trata os casos de sucesso e erro.
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

      if (res.status === 409) throw new Error('Horário já reservado');
      const j = await res.json(); if (!res.ok) throw new Error(j.error || 'Erro servidor');

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

        {isBarbeariasLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
            <Loader />
          </div>
        ) : barbearias.length === 0 ? (
          <Notification color="yellow" title="Nenhuma barbearia disponível" disallowClose>
            No momento, não há barbearias cadastradas para agendamento. Por favor, volte mais tarde.
          </Notification>
        ) : (
          <>
            {error && <Notification color="red" onClose={() => setError(null)}>{error}</Notification>}
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
                    <DatePicker
                      locale="pt-br"
                      firstDayOfWeek={1}
                      weekdayFormat="ddd"
                      value={selectedDateObj}
                      onChange={(value) => {
                        const local = toLocalMidnight(value);
                        if (!local) return;
                        setSelectedDateObj(local);
                        handleChange('data', dayjs(local).format('YYYY-MM-DD'));
                        setPopoverOpened(false);
                      }}
                      size="sm"
                      hideOutsideDates
                      minDate={new Date()}
                      excludeDate={(d) => {
                        const n = toLocalMidnight(d);
                        if (!n) return false;
                        if (!workingDays || workingDays.size === 0) return false;
                        return !workingDays.has(n.getDay());
                      }}
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
