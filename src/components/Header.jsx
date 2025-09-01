// src/components/Header.jsx

function Header() {

  const handleScroll = (e, targetId) => {
    e.preventDefault(); // Previne o comportamento padrão do link
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth', // Rolagem suave
        block: 'start'      // Alinha o topo do elemento com o topo da viewport
      });
    }
  };

  return (
    <header className="site-header">
      <div className="container">
        <h1>Barbearia Corte Certo</h1>
        <nav>
          <ul>
            {/* Agora cada link chama a função handleScroll */}
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