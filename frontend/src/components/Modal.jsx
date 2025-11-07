/**
 * @file src/components/Modal.jsx
 * @description Um componente de modal genérico e reutilizável.
 * Ele fornece a estrutura básica de um modal, incluindo um overlay (fundo escurecido)
 * e um contêiner para o conteúdo.
 */

import React from "react";
import "../styles/main.css";

/**
 * Componente Modal.
 * Renderiza uma janela modal sobre o conteúdo da página.
 *
 * @param {object} props - As propriedades do componente.
 * @param {boolean} props.isOpen - Controla se o modal está visível ou não.
 * @param {() => void} props.onClose - Função a ser chamada quando o modal deve ser fechado (pelo botão de fechar ou clicando no overlay).
 * @param {React.ReactNode} props.children - O conteúdo a ser renderizado dentro do modal.
 * @returns {JSX.Element|null} O elemento JSX do modal ou `null` se `isOpen` for falso.
 */
const Modal = ({ isOpen, onClose, children }) => {
  // Se o modal não estiver aberto, não renderiza nada.
  if (!isOpen) return null;

  return (
    // O overlay cobre a tela inteira e fecha o modal ao ser clicado.
    <div className="modal-overlay" onClick={onClose}>
      {/* O conteúdo do modal. O `e.stopPropagation()` impede que o clique dentro do modal se propague para o overlay, evitando que ele feche acidentalmente. */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Botão para fechar o modal. */}
        <button className="modal-close-btn" onClick={onClose}>&times;</button>
        {children}
      </div>
    </div>
  );
};

export default Modal;
