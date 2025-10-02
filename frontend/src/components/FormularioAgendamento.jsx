import React, { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';
import { TextInput, Button, Select, Loader, Notification, Popover } from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';

// Componente do formulário de agendamento
export default function FormularioAgendamento({ isOpen, onClose }) {
  /* -----------------------
     STATES / ESTADOS
     ----------------------- */
  const [formData, setFormData] = useState({
    barbearia_id: '',
    data: '', // YYYY-MM-DD (string)
    hora: '',
    servico: '',
    nome: '',
    email: '',
    telefone: ''
  });

  const [barbearias, setBarbearias] = useState([]);      // lista de barbearias
  const [slots, setSlots] = useState([]);                // horários disponíveis (select)
  const [workingDays, setWorkingDays] = useState(new Set()); // dias em que a barbearia funciona (0..6)
  const [selectedDateObj, setSelectedDateObj] = useState(null); // Date nativo (NORMALIZADO para meia-noite local)
  const [isSlotsLoading, setIsSlotsLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [popoverOpened, setPopoverOpened] = useState(false); // controla abrir/fechar do calendário

  dayjs.locale('pt-br');

  /* -----------------------
     FUNÇÕES AUXILIARES
     ----------------------- */

  // Atualiza o formData
  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  // Converte qualquer input (Date | Dayjs | string ISO) para um Date local com hora = 00:00 (meia-noite local)
  // Isso evita deslocamento por fuso horário que causava "dia anterior" ao renderizar.
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

  /* -----------------------
     EFEITOS: CARREGAR BARBEARIAS (montagem)
     ----------------------- */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/barbearias');
        const j = await res.json();
        if (j.success) setBarbearias(j.barbearias || []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const barbeariasData = useMemo(() => barbearias.map(b => ({ value: b.id, label: b.nome })), [barbearias]);

  /* -----------------------
     EFEITO: QUANDO TROCA DE BARBEARIA, CARREGAR HORÁRIOS DE FUNCIONAMENTO
     -> popula workingDays (conjunto com números 0..6)
     ----------------------- */
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

  /* -----------------------
     EFEITO: CARREGAR HORÁRIOS DISPONÍVEIS PARA A DATA SELECIONADA
     - Usa formData.data (YYYY-MM-DD) para chamar a API
     - Antes de chamar, valida se o dia faz parte de workingDays (se houver)
     ----------------------- */
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

  /* -----------------------
     SUBMISSÃO DO FORMULÁRIO
     (mantido como antes; não altera o problema do DatePicker)
     ----------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); setError(null);
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
      setFormData({ barbearia_id: '', data: '', hora: '', servico: '', nome: '', email: '', telefone: '' });
      if (onClose) onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || String(err));
    } finally {
      setIsLoading(false);
    }
  };

  /* -----------------------
     RENDER (JSX)
     - DatePicker com:
       * firstDayOfWeek=1 (segunda)
       * weekdayFormat="ddd" (vai gerar 'seg', 'ter'... com locale pt-br -> vamos uppercase via CSS)
       * renderDay: cria o conteúdo interno com classes que o CSS estilizará
     ----------------------- */
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
                    // converte para meia-noite local e usa esse Date como value
                    const local = toLocalMidnight(value);
                    if (!local) return;

                    setSelectedDateObj(local);
                    // salva string YYYY-MM-DD (sem horário) no form
                    handleChange('data', dayjs(local).format('YYYY-MM-DD'));
                    setPopoverOpened(false);
                  }}
                  size="sm"
                  hideOutsideDates
                  // excludeDate executa com cada célula (d pode ser Date ou Dayjs)
                  excludeDate={(d) => {
                    const n = toLocalMidnight(d);
                    if (!n) return false;
                    // se workingDays vazio -> permitir todos
                    if (!workingDays || workingDays.size === 0) return false;
                    return !workingDays.has(n.getDay()); // true => excluído (disabled)
                  }}
                  // Renderiza o conteúdo do dia (retornamos uma div com classes para CSS)
                  renderDay={(d) => {
                    const n = toLocalMidnight(d);
                    if (!n) return null;

                    // disponibilidade
                    const isAvailable = workingDays.size === 0 || workingDays.has(n.getDay());
                    const isSelected = selectedDateObj && dayjs(selectedDateObj).isSame(dayjs(n), 'day');

                    return (
                      // A classe interna será estilizada pelo CSS que eu forneci abaixo.
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
          <TextInput label="Telefone" type="tel" value={formData.telefone} onChange={(e) => handleChange('telefone', e.target.value)} required />

          <Button variant="filled" color="green" size="lg" type="submit" style={{ marginTop: '20px' }} fullWidth disabled={isLoading}>
            {isLoading ? <Loader size="sm" color="white" /> : 'Confirmar Agendamento'}
          </Button>
        </form>
      </div>
    </Modal>
  );
}
