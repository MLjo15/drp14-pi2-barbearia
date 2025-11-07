/**
 * @file src/components/Header.jsx
 * @description Componente de cabeçalho principal da aplicação.
 * Contém o título do site e a navegação principal com links para as seções da página.
 */

/**
 * Componente Header.
 * Renderiza o cabeçalho fixo do site, incluindo o nome da barbearia e os links de navegação
 * que permitem a rolagem suave (smooth scroll) para as seções correspondentes da página.
 *
 * @param {object} props - As propriedades do componente.
 * @param {() => void} props.onAgendamentoClick - Função para abrir o modal de agendamento.
 * @param {() => void} props.onCadastroClick - Função para abrir o modal de cadastro.
 * @returns {JSX.Element} O elemento JSX que representa o cabeçalho.
 */
function Header({ onAgendamentoClick, onCadastroClick }) {
  /**
   * Manipula o clique nos links de navegação para implementar a rolagem suave.
   * @param {React.MouseEvent<HTMLAnchorElement>} e - O evento de clique.
   * @param {string} targetId - O ID do elemento de destino para a rolagem.
   */
  const handleScroll = (e, targetId) => {
    e.preventDefault();
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <header className="site-header">
      <div className="container">
        {/* Título principal do site */}
        <h1>Barbearia Corte Certo</h1>
        {/* Navegação principal com links para as seções da página */}
        <nav>
          <ul>
            {/* Cada link utiliza o handleScroll para uma navegação suave dentro da página (SPA-like) */}
            <li><a href="#sobre" onClick={(e) => handleScroll(e, 'sobre')}>Sobre</a></li>
            <li><a href="#servicos" onClick={(e) => handleScroll(e, 'servicos')}>Agendamento</a></li>
            <li><a href="#galeria" onClick={(e) => handleScroll(e, 'galeria')}>Galeria</a></li>
            <li><a href="#contato" onClick={(e) => handleScroll(e, 'contato')}>Cadastre-se</a></li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

export default Header;