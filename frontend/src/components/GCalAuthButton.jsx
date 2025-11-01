import React, { useEffect, useRef } from "react";
import { Button } from "@mantine/core";
import { notifications } from "@mantine/notifications";

const GCalAuthButton = ({ barbeariaId }) => {
  const popupRef = useRef(null);

  useEffect(() => {
    // Handler para mensagens postMessage do popup
    const handleMessage = (event) => {
      // ALTERE este origin para o que for o FRONTEND_URL em produção
      const allowedOrigin = (import.meta.env.VITE_APP_ORIGIN || window.location.origin);
      if (event.origin !== allowedOrigin) {
        // rejeita mensagens de origens não esperadas
        return;
      }
      const data = event.data || {};
      if (data.type === "google-auth") {
        if (data.success) {
          notifications.show({ title: "Sucesso", message: "Google Calendar conectado.", color: "green" });
        } else {
          notifications.show({ title: "Erro", message: data.error || "Falha ao conectar Google.", color: "red" });
        }
      }
    };

    window.addEventListener("message", handleMessage);

    // fallback: se o backend redirecionou para frontend e gravou resultado no localStorage
    try {
      const raw = localStorage.getItem("google_auth_result");
      if (raw) {
        const payload = JSON.parse(raw);
        localStorage.removeItem("google_auth_result");
        if (payload.success) {
          notifications.show({ title: "Sucesso", message: "Google Calendar conectado.", color: "green" });
        } else {
          notifications.show({ title: "Erro", message: payload.error || "Falha ao conectar Google.", color: "red" });
        }
      }
    } catch (e) {
      // ignore
    }

    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleAuthClick = () => {
    if (!barbeariaId) {
      notifications.show({ title: "Erro", message: "Cadastre a barbearia antes de conectar o Google.", color: "red" });
      return;
    }

    // popup size + position
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    // Abre popup (importante: target name diferente cada vez evita reuso)
    const popup = window.open(
      `/api/auth/google?shop_id=${barbeariaId}`,
      `GoogleAuthPopup_${Date.now()}`,
      `width=${width},height=${height},left=${left},top=${top}`
    );

    if (!popup) {
      notifications.show({ title: "Erro", message: "Bloqueador de popups impediu abrir a janela. Permita popups e tente novamente.", color: "red" });
      return;
    }

    popupRef.current = popup;
    popup.focus();
  };

  return (
    <Button variant="outline" color="red" onClick={handleAuthClick} fullWidth style={{ marginTop: 15 }}>
      Conectar Google Calendar (Passo 2)
    </Button>
  );
};

export default GCalAuthButton;
