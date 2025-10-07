import React, { useState } from 'react';
import Header from './components/Header.jsx';
import Section from './components/Section.jsx';
import Footer from './components/Footer.jsx';
import FormularioAgendamento from './components/FormularioAgendamento.jsx';
import FormularioCadastro from './components/FormularioCadastro.jsx'
import { Button, Image } from '@mantine/core';
import '@mantine/carousel/styles.css';
import { Carousel } from '@mantine/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { useRef } from 'react';

// Imagens
import sobreImage from './assets/02.jpg';
import servicosImage from './assets/03.png';
import contatoImage from './assets/01.jpg';
import galeria04 from './assets/04.png';
import galeria05 from './assets/05.png';
import galeria06 from './assets/06.png';
import galeria07 from './assets/07.png';
import galeria08 from './assets/08.png';
import galeria09 from './assets/09.png';
import galeria10 from './assets/10.png';

function App() {
  // Estado para controlar se algum modal está aberto.
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Estado para determinar qual modal ('agendamento' or 'cadastro') deve ser renderizado.
  const [modalContent, setModalContent] = useState(null);

  // Função para abrir um modal específico.
  const openModal = (content) => {
    setModalContent(content);
    setIsModalOpen(true);
  };

  // Função para fechar o modal atualmente aberto.
  const closeModal = () => {
    setIsModalOpen(false);
    setModalContent(null);
  };

  // Configuração do plugin de autoplay para o carrossel.
  const autoplay = useRef(Autoplay({ delay: 2000 }));
  const galleryImages = [
    galeria04,
    galeria05,
    galeria06,
    galeria07,
    galeria08,
    galeria09,
    galeria10,
  ];

  // Mapeia as imagens para os slides do carrossel.
  const slides = galleryImages.map((url) => (
    <Carousel.Slide key={url}>
      <Image src={url} alt="Foto da galeria da barbearia" className="gallery-carousel-image" />
    </Carousel.Slide>
  )); // Corrigido: Fechado com '));' em vez de '};'

  return (
    <>
      {/* O Header contém os botões que chamam `openModal` para abrir os formulários. */}
      <Header onAgendamentoClick={() => openModal('agendamento')} onCadastroClick={() => openModal('cadastro')} />
      <main>
        <Section
          id="sobre"
          title="Sobre Nós"
          content="Nossa história, nossa paixão e o compromisso com a arte da barbearia. Fundada em 2023, a Barbearia Corte Certo traz a tradição da barbearia clássica com um toque de modernidade e estilo."
          imageSrc={sobreImage}
        />

        <Section
          id="servicos"
          title="Agendamentos"
          content="Faça já seu agendamento em nossas barbearias parceiras."
          imageSrc={servicosImage}
          reverseOrder={true}
        >
          <Button
            variant="filled"
            color="green"
            size="lg"
            style={{ marginTop: '20px' }}
            onClick={() => openModal('agendamento')}
          >
            Agende Seu Horário!
          </Button>
        </Section>

        <Section
          id="galeria"
          title="Galeria"
          content="Confira nossos trabalhos incríveis! Navegue por nossa galeria e inspire-se com os cortes e estilos que criamos para nossos clientes. Qualidade e satisfação garantidas em cada detalhe."
          mediaComponent={
            <Carousel
              height={400}
              slideSize={{ base: '100%', sm: '100%', md: '100%' }}
              slideGap={{ base: 0, sm: 'md' }}
              loop
              align="start"
              plugins={[autoplay.current]}
              onMouseEnter={autoplay.current.stop}
              onMouseLeave={autoplay.current.reset}
              className="gallery-carousel"
              withControls={false}
              withIndicators={false}
            >
              {slides}
            </Carousel>
          }
        />

        <Section
          id="contato"
          title="Cadastre sua Barbearia"
          content="Venha fazer parte do nosso time!"
          imageSrc={contatoImage}
          reverseOrder={true}
        >
          <Button
            variant="filled"
            color="green"
            size="lg"
            onClick={() => openModal('cadastro')}
          >
            Cadastre-se
          </Button>
        </Section>
      </main>

      <Footer />

      {/* Renderização condicional dos modais com base no estado `modalContent`. */}
      {modalContent === 'agendamento' && (
        <FormularioAgendamento isOpen={isModalOpen} onClose={closeModal} />
      )}
      {modalContent === 'cadastro' && (
        <FormularioCadastro isOpen={isModalOpen} onClose={closeModal} />
      )}
    </>
  );
}

export default App;
