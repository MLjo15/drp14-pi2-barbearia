// src/components/Header.jsx

function Header({ onAgendamentoClick, onCadastroClick }) {

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
        <h1>Barbearia Corte Certo</h1>
        <nav>
          <ul>
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