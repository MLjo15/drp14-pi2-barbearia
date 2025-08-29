// src/components/Footer.jsx
import React from 'react';

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h4>Barbearia Corte Certo</h4>
            <p>A arte do corte clássico com um toque de modernidade.</p>
          </div>
          
          <div className="footer-section">
            <h4>Contato</h4>
            <p>Endereço: Rua Xispetecar, 157<br />São paulo - SP</p>
            <p>Telefone: (11) 98765-4321</p>
            <p>Email: contato@cortecertobarbers.com</p>
          </div>

          <div className="footer-section">
            <h4>Siga-nos</h4>
            <div className="social-links">
              <a href="https://instagram.com/cortecertobarbearia" target="_blank" rel="noopener noreferrer">Instagram</a>
              <a href="https://facebook.com/cortecertobarbearia" target="_blank" rel="noopener noreferrer">Facebook</a>
              <a href="https://wa.me/5511987654321" target="_blank" rel="noopener noreferrer">WhatsApp</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2025 Barbearia Corte Certo. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;