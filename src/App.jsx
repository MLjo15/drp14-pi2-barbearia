// --- Imports Gerais ---
import Header from './components/Header.jsx';
import Section from './components/Section.jsx';
import Footer from './components/Footer.jsx';
import './styles/main.css';

// Importe o componente Button do Mantine
import { Button } from '@mantine/core';

// --- Imagens ---
import sobreImage from './assets/02.jpg';
import servicosImage from './assets/03.png'; 
import contatoImage from './assets/01.jpg'; 

// --- Função Principal ---
function App() {
  return (
    <>
      <Header />
      <main>
        <Section
          id="sobre"
          title="Sobre Nós"
          content="Nossa história, nossa paixão e o compromisso com a arte da barbearia. Fundada em 2023, a Barbearia Corte Certo traz a tradição da barbearia clássica com um toque de modernidade e estilo."
          imageSrc={sobreImage} // Imagem à direita (padrão)
          // reverseOrder={false} (não precisa, pois é o padrão)
        />
        <Section
          id="servicos"
          title="Agendamentos" 
          content="Faça já seu agendamento em nossas barbearias parceiras."
          imageSrc={servicosImage} // Imagem à esquerda (invertida)
          reverseOrder={true}
        >
          {/* O botão ainda fica aqui, dentro do children da Section */}
          <Button variant="filled" color="green" size="lg" style={{ marginTop: '20px' }}>
            Agende Seu Horário!
          </Button>
        </Section>
        <Section
          id="galeria"
          title="Galeria"
          content="Confira nossos trabalhos incríveis! Navegue por nossa galeria e inspire-se com os cortes e estilos que criamos para nossos clientes. Qualidade e satisfação garantidas em cada detalhe."
          // Você pode adicionar uma galeria de imagens aqui em vez de apenas uma imagem de fundo
        />
          <Section 
          id="contato" 
          title="Cadastre sua Barbearia" 
          content="Venha fazer parte do nosso time!"
          imageSrc={contatoImage} // Imagem à direita (padrão)
          >
            <Button variant="filled" color="green" size="lg" style={{ marginTop: '5px' }}>
              Cadastre-se
            </Button>
          </Section>
      </main>
      <Footer />
    </>
  );
}

export default App;