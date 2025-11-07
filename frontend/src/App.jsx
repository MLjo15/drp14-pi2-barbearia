/**
 * @file src/App.jsx
 * @description Componente principal da aplicação React.
 * Gerencia a estrutura geral da página, a navegação, a exibição de seções
 * e o controle dos modais de agendamento e cadastro.
 */

import React, { useState, useRef } from 'react';
// Importações de componentes
import Header from './components/Header.jsx';
import Section from './components/Section.jsx';
import Footer from './components/Footer.jsx';
import FormularioAgendamento from './components/FormularioAgendamento.jsx';
import FormularioCadastro from './components/FormularioCadastro.jsx'
import { Button, Image } from '@mantine/core';
import '@mantine/carousel/styles.css';
import { Carousel } from '@mantine/carousel';
import Autoplay from 'embla-carousel-autoplay';

// Importações de imagens para as seções e galeria
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

/**
 * Componente funcional App.
 * Este é o componente raiz da aplicação, responsável por renderizar o layout principal,
 * incluindo o cabeçalho, as seções de conteúdo, o rodapé e os modais.
 *
 * @returns {JSX.Element} O elemento JSX que representa a aplicação completa.
 */
function App() {
  // ----------------------------------------------------------------
  // ESTADOS (STATES)
  // Gerencia a visibilidade dos modais e qual conteúdo deve ser exibido.
  // ----------------------------------------------------------------

  /** @type {[boolean, function]} Estado para controlar se o modal está aberto ou fechado. */
  const [isModalOpen, setIsModalOpen] = useState(false);
  /** @type {[string|null, function]} Estado para determinar qual formulário deve ser exibido no modal ('agendamento' ou 'cadastro'). */
  const [modalContent, setModalContent] = useState(null);

  // ----------------------------------------------------------------
  // FUNÇÕES AUXILIARES E MANIPULADORES (HANDLERS)
  // ----------------------------------------------------------------

  /**
   * Abre o modal e define qual conteúdo (formulário) deve ser exibido.
   * @param {'agendamento' | 'cadastro'} content - O tipo de formulário a ser exibido no modal.
   */
  const openModal = (content) => {
    setModalContent(content);
    setIsModalOpen(true);
  };

  /**
   * Fecha o modal e reseta o conteúdo exibido.
   */
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

  /**
   * Mapeia as URLs das imagens da galeria para componentes `Carousel.Slide` do Mantine.
   * Cada slide exibe uma imagem da galeria.
   * @type {JSX.Element[]}
   */
  const slides = galleryImages.map((url) => (
    <Carousel.Slide key={url}>
      <Image src={url} alt="Foto da galeria da barbearia" className="gallery-carousel-image" />
    </Carousel.Slide>
  ));

  return (
    <>
      {/* Componente Header: Contém a navegação e botões para abrir os modais. */}
      <Header onAgendamentoClick={() => openModal('agendamento')} onCadastroClick={() => openModal('cadastro')} />
      <main>
        <Section
          id="sobre"
          title="Sobre Nós"
          content="Nossa história, nossa paixão e o compromisso com a arte da barbearia tradicional com um toque de tecnologia. Fundada em 2025, a Barbearia Corte Certo traz o conceito de acessibilidade digital, conectando clientes às melhores barbearias."
          imageSrc={sobreImage}
        />

        {/* Seção de Agendamentos: Inclui um botão que abre o modal de agendamento. */}
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

        {/* Seção de Galeria: Exibe um carrossel de imagens. */}
        <Section
          id="galeria"
          title="Galeria"
          content="Confira esses trabalhos incríveis! Navegue por nossa galeria e inspire-se com os cortes e estilos. Qualidade e satisfação garantidas em cada detalhe."
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

        {/* Seção de Cadastro: Inclui um botão que abre o modal de cadastro de barbearia. */}
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

      {/* Renderização condicional dos modais: Apenas um modal é renderizado por vez, baseado em `modalContent`. */}
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
