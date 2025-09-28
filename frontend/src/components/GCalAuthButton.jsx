// frontend/src/components/GCalAuthButton.jsx
import React from "react";

const GCalAuthButton = ({ barbeariaId }) => {
  const onConnect = () => {
    const url = `${import.meta.env.VITE_API_BASE}/auth/google/shop?shop_id=${barbeariaId}`;
    // abre em nova aba para o fluxo OAuth
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <button type="button" onClick={onConnect} className="btn">
      Conectar Google Calendar
    </button>
  );
};

export default GCalAuthButton;
