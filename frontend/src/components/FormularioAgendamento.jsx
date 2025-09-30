import React, { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';
import { TextInput, Button, Select, Loader, Notification, Popover } from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';

export default function FormularioAgendamento({ isOpen, onClose }) {
  const [formData, setFormData] = useState({ barbearia_id: '', data: '', hora: '', servico: '', nome: '', email: '', telefone: '' });
  const [barbearias, setBarbearias] = useState([]);
  const [slots, setSlots] = useState([]);
  const [workingDays, setWorkingDays] = useState(new Set());
  const [selectedDateObj, setSelectedDateObj] = useState(null);
  const [isSlotsLoading, setIsSlotsLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  dayjs.locale('pt-br');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/barbearias');
        const j = await res.json();
        if (j.success) setBarbearias(j.barbearias || []);
      } catch (e) { console.error(e); }
    })();
  }, []);

  const barbeariasData = useMemo(() => barbearias.map(b => ({ value: b.id, label: b.nome })), [barbearias]);

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  useEffect(() => {
    const id = formData.barbearia_id;
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/barbearias/${id}`);
        const j = await res.json();
        if (j.success) {
          const horarios = Array.isArray(j.horarios) ? j.horarios : [];
          setWorkingDays(new Set(horarios.map(h => Number(h.dia_semana)).filter(n => !Number.isNaN(n))));
          setBarbearias(prev => prev.map(b => b.id === id ? { ...b, intervalo: j.barbearia?.intervalo } : b));
          setSelectedDateObj(null);
          handleChange('data', '');
          setSlots([]);
        }
      } catch (e) { console.error(e); }
    })();
  }, [formData.barbearia_id]);

  useEffect(() => {
    const id = formData.barbearia_id;
    const date = formData.data;
    if (!id || !date) return;
    if (workingDays && workingDays.size > 0) {
      const day = new Date(date + 'T00:00:00').getDay();
      if (!workingDays.has(day)) { setSlots([]); return; }
    }
    setIsSlotsLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/barbearias/${id}/availability?date=${date}`);
        const j = await res.json();
        console.log('[availability] response', id, date, j);
        if (j.success) setSlots(j.slots.map(s => ({ value: s.start, label: new Date(s.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), end: s.end })));
        else setSlots([]);
        if (j.success && Array.isArray(j.slots) && j.slots.length === 0) {
          setError('Nenhum horário disponível para a data selecionada.');
        }
      } catch (e) { console.error(e); setSlots([]); } finally { setIsSlotsLoading(false); }
    })();
  }, [formData.barbearia_id, formData.data, workingDays]);

  const normalizeToDate = (d) => {
    if (!d) return null;
    if (typeof d.getDay === 'function') return d;
    if (typeof d.toDate === 'function') return d.toDate();
    if (typeof d.toISOString === 'function') return new Date(d.toISOString());
    try { return new Date(d); } catch { return null; }
  };

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

      const res = await fetch('/api/agendamento', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shop_id: formData.barbearia_id, cliente_nome: formData.nome, cliente_email: formData.email, cliente_telefone: formData.telefone, servico: formData.servico, data_hora_inicio: dataHoraInicio, data_hora_fim: dataHoraFim }) });
      if (res.status === 409) throw new Error('Horário já reservado');
      const j = await res.json(); if (!res.ok) throw new Error(j.error || 'Erro servidor');
      setSuccess(true);
      setFormData({ barbearia_id: '', data: '', hora: '', servico: '', nome: '', email: '', telefone: '' });
      if (onClose) onClose();
    } catch (err) { console.error(err); setError(err.message || String(err)); } finally { setIsLoading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="form-container">
        <h2>Agende seu Horário</h2>
        {error && <Notification color="red" onClose={() => setError(null)}>{error}</Notification>}
        {success && <Notification color="green" onClose={() => setSuccess(false)}>Agendamento realizado com sucesso!</Notification>}

        <form onSubmit={handleSubmit}>
          <Select label="Escolha a Barbearia" placeholder="Selecione a barbearia" data={barbeariasData} value={formData.barbearia_id} onChange={(v) => handleChange('barbearia_id', v)} required />

          <div style={{ marginBottom: 10 }}>
            <Popover width={620} position="bottom" withArrow withinPortal offset={22}>
              <Popover.Target>
                <div>
                  <TextInput label="Data" placeholder="Selecione a data" value={selectedDateObj ? dayjs(selectedDateObj).format('DD/MM/YYYY') : ''} readOnly className="fc-datepicker-input" required />
                </div>
              </Popover.Target>
                <Popover.Dropdown className="fc-datepicker-dropdown fc-datepicker-popup--spacious" sx={{ marginTop: 8 }}>
                <DatePicker locale="pt-br" __staticSelector="mantine-DatePicker" value={selectedDateObj} onChange={(value) => {
                  const native = normalizeToDate(value); if (!native) return; const day = native.getDay(); if (workingDays && workingDays.size > 0 && !workingDays.has(day)) { setError('Barbearia fechada neste dia. Escolha outra data.'); return; } setError(null); setSelectedDateObj(native); handleChange('data', dayjs(native).format('YYYY-MM-DD'));
                }} size="sm" hideOutsideDates excludeDate={(d) => { if (!workingDays || workingDays.size === 0) return false; const n = normalizeToDate(d); if (!n) return false; return !workingDays.has(n.getDay()); }} />
              </Popover.Dropdown>
            </Popover>
          </div>

          <Select label="Horário Disponível" placeholder={isSlotsLoading ? 'Carregando...' : 'Selecione um horário'} data={slots} value={formData.hora} onChange={(v) => handleChange('hora', v)} required />
          <Select label="Serviço" data={['Corte de Cabelo', 'Barba', 'Corte e Barba', 'Outro']} value={formData.servico} onChange={(v) => handleChange('servico', v)} required />
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
