// src/components/Modal.jsx
import React from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@mantine/core';

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-content">
        <Button
          className="modal-close-btn"
          variant="subtle"
          color="red"
          onClick={onClose}
        >
          &times;
        </Button>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
