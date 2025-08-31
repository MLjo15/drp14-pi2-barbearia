// --- Imports Gerais ---
import Header from './components/Header.jsx';
import Section from './components/Section.jsx';
import Footer from './components/Footer.jsx';
import './styles/main.css';

// Importe o componente Button do Mantine
import { Button } from '@mantine/core';

// --- Função Principal ---
function App() {
  return (
    <>
      <Header />
      <main>
        <Section 
          id="sobre" 
          title="Sobre Nós" 
          content="Nossa história, nossa paixão e o compromisso com a arte da barbearia."
        />
        <Section 
          id="servicos" 
          title="Nossos Serviços" 
          content="Oferecemos os melhores cortes clássicos e barboterapia relaxante."
        >
         {/* O botão foi movido para dentro da seção de serviços */}
          <Button variant="filled" color="green" size="lg" style={{ marginTop: '15px' }}>
            Agende Seu Horário!
          </Button>
        </Section>
        <Section 
          id="galeria" 
          title="Galeria" 
          content="Confira nossos trabalhos incríveis!"
        />
        <Section 
          id="contato" 
          title="Entre em Contato" 
          content="Agende seu horário conosco!"
        />
      </main>
      <Footer />
    </>
  );
}

export default App;