/**
 * @file src/components/Footer.jsx
 * @description Componente de rodapé reutilizável para a aplicação.
 * Exibe informações de contato, links de redes sociais e o aviso de direitos autorais.
 */

/**
 * Componente funcional Footer.
 * Renderiza a seção de rodapé padrão do site, contendo informações sobre a barbearia,
 * detalhes de contato e links para redes sociais.
 *
 * @returns {JSX.Element} O elemento JSX que representa o rodapé do site.
 */
function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-content">
          {/* Seção de Identidade da Barbearia */}
          <div className="footer-section">
            <h4>Barbearia Corte Certo</h4>
            <p>A arte do corte clássico com um toque de modernidade.</p>
          </div>
          
          {/* Seção de Contato */}
          <div className="footer-section">
            <h4>Contato</h4>
            <p>Endereço: Av. Faria Lima, 99999<br />São paulo - SP</p>
            <p>Telefone: (11) 98765-4321</p>
            <p>Email: contato@cortecertobarbers.com</p>
          </div>

          {/* Seção de Redes Sociais */}
          <div className="footer-section">
            <h4>Siga-nos</h4>
            <div className="social-links">
              {/* Links externos abrem em nova aba por segurança e usabilidade */}
              <a href="https://instagram.com/cortecertobarbearia" target="_blank" rel="noopener noreferrer">Instagram</a>
              <a href="https://facebook.com/cortecertobarbearia" target="_blank" rel="noopener noreferrer">Facebook</a>
              <a href="https://wa.me/5511987654321" target="_blank" rel="noopener noreferrer">WhatsApp</a>
            </div>
          </div>
        </div>

        {/* Seção Inferior do Rodapé com Direitos Autorais */}
        <div className="footer-bottom">
          <p>&copy; 2025 Barbearia Corte Certo. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;