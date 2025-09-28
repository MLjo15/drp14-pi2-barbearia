import React, { useEffect, useState, useCallback } from "react";
import { TextInput, Button, Select, Notification, Loader, Stack } from "@mantine/core";
import { DatePicker } from "@mantine/dates"; 
import { supabase } from "../supabaseClient";
import "dayjs/locale/pt-br"; 

// A URL base para suas Edge Functions
const API_BASE = import.meta.env.VITE_API_BASE; 

const FormularioAgendamento = ({ onClose }) => {
  const [barbearias, setBarbearias] = useState([]);
  const [selectedShop, setSelectedShop] = useState("");
  const [clienteNome, setClienteNome] = useState("");
  const [clienteEmail, setClienteEmail] = useState("");
  const [servico, setServico] = useState("");
  
  // Data e Horários
  const [data, setData] = useState(null);
  const [horarios, setHorarios] = useState([]);
  const [selectedHora, setSelectedHora] = useState("");
  
  // Estados de UI
  const [loadingShops, setLoadingShops] = useState(true); // NOVO: Carregamento inicial de lojas
  const [loadingSlots, setLoadingSlots] = useState(false); // Carregamento de slots
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // 1. Carrega barbearias
  useEffect(() => {
    const fetchShops = async () => {
      setLoadingShops(true);
      setErrorMsg("");
      const { data, error } = await supabase
        .from("barbearias")
        .select("id, nome");
      
      if (error) {
        setErrorMsg("Erro ao carregar lista de barbearias.");
      } else {
        setBarbearias(data.map((s) => ({ value: s.id, label: s.nome })));
      }
      setLoadingShops(false);
    };
    fetchShops();
  }, []);

  // 2. Carrega horários disponíveis ao mudar Loja ou Data (Chama a Edge Function)
  const fetchHorarios = useCallback(async () => {
    if (!selectedShop || !(data instanceof Date) || isNaN(data.getTime())) {
        setHorarios([]);
        return;
    }

    setLoadingSlots(true);
    setErrorMsg("");
    setSelectedHora("");
    
    const formattedDate = data.toISOString().split('T')[0];
    
    try {
        const response = await fetch(`${API_BASE}/horarios-disponiveis?shopId=${selectedShop}&date=${formattedDate}`);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Erro ao buscar horários.");
        }
        
        const slots = await response.json();
        setHorarios(slots.map(h => ({ value: h, label: h })));

    } catch (e) {
        setErrorMsg(e.message || "Erro desconhecido ao carregar horários.");
    } finally {
        setLoadingSlots(false);
    }
  }, [selectedShop, data]);

  useEffect(() => {
    fetchHorarios();
  }, [fetchHorarios]);

  // 3. Submissão do Agendamento
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadingSlots(true); // Reutiliza o estado de loading para o envio
    setErrorMsg("");
    setSuccessMsg("");

    // ... (restante da validação e lógica de envio) ...
    if (!selectedShop || !data || !selectedHora || !clienteEmail || !clienteNome || !servico) {
        setErrorMsg("Por favor, preencha todos os campos obrigatórios.");
        setLoadingSlots(false);
        return;
    }
    
    const formattedDate = data.toISOString().split('T')[0];
    const fullDateTime = `${formattedDate}T${selectedHora}:00`; 
    
    const payload = {
      shopId: selectedShop,
      clienteNome,
      clienteEmail,
      servico,
      dataHora: fullDateTime,
    };

    try {
        const response = await fetch(`${API_BASE}/agendar-gcal`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Falha ao agendar. Tente novamente.");
        }

        setSuccessMsg("🎉 Horário agendado com sucesso! Verifique seu e-mail.");

    } catch (e) {
        setErrorMsg(e.message || "Ocorreu um erro inesperado.");
    } finally {
        setLoadingSlots(false);
    }
  };

  // 4. Renderização do Conteúdo
  let content;

  if (loadingShops) {
    // Estado de Carregamento Inicial
    content = (
      <div className="form-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
        <Loader size="lg" color="green" />
        <h3 style={{ color: 'white', marginTop: '20px' }}>Carregando dados das barbearias...</h3>
      </div>
    );
  } else if (barbearias.length === 0) {
    // Estado de Lista Vazia (Mensagem que você queria)
    content = (
      <div className="form-container">
        <h2>Agendar Horário</h2>
        <Notification title="Nenhuma Barbearia Encontrada" color="yellow" style={{ marginTop: 20 }}>
          Desculpe, não há nenhuma barbearia registrada no momento.
          Por favor, tente novamente mais tarde.
        </Notification>
        <Button variant="outline" color="gray" fullWidth mt="xl" onClick={onClose}>
          Fechar
        </Button>
      </div>
    );
  } else {
    // Estado de Formulário (Normal)
    content = (
      <div className="form-container"> 
        <h2>Agendar Horário</h2>
        
        {errorMsg && (
          <Notification title="Erro" color="red" onClose={() => setErrorMsg("")} style={{ marginTop: 10 }}>
            {errorMsg}
          </Notification>
        )}
        {successMsg && (
          <Notification title="Sucesso!" color="green" onClose={() => setSuccessMsg("")} style={{ marginTop: 10 }}>
            {successMsg}
          </Notification>
        )}

        <form onSubmit={handleSubmit}>
          <Stack spacing="md"> 
            <TextInput
              label="Nome"
              placeholder="Seu nome completo"
              value={clienteNome}
              onChange={(e) => setClienteNome(e.target.value)}
              required
            />
            <TextInput
              label="Email"
              placeholder="seu-email@exemplo.com"
              value={clienteEmail}
              onChange={(e) => setClienteEmail(e.target.value)}
              type="email"
              required
            />
            <TextInput
              label="Serviço"
              placeholder="Ex: Corte e Barba"
              value={servico}
              onChange={(e) => setServico(e.target.value)}
              required
            />

            <Select
              label="Barbearia"
              data={barbearias}
              value={selectedShop}
              onChange={setSelectedShop}
              placeholder="Selecione a Barbearia"
              required
            />
            
            <DatePicker
              label="Data"
              value={data}
              onChange={setData}
              minDate={new Date()} 
              locale="pt-br" 
              placeholder="Selecione a Data"
              required
            />

            {/* Slot de Horários */}
            {loadingSlots ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#fff', marginTop: '15px' }}>
                <Loader size="sm" color="white" />
                <span>Carregando horários...</span>
              </div>
            ) : (
              <Select
                label="Horário"
                data={horarios}
                value={selectedHora}
                onChange={setSelectedHora}
                placeholder={selectedShop && data ? "Escolha um horário" : "Selecione a Barbearia e a Data primeiro"}
                required
                disabled={horarios.length === 0}
              />
            )}

            <Button type="submit" fullWidth mt="xl" color="green" size="lg" disabled={loadingSlots}>
              {loadingSlots ? <Loader size="sm" color="white" /> : "Confirmar Agendamento"}
            </Button>
          </Stack>
        </form>
      </div>
    );
  }
  
  return content;
};

export default FormularioAgendamento;