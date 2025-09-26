import React, { useState } from 'react';
import Header from './components/Header.jsx';
import Section from './components/Section.jsx';
import Footer from './components/Footer.jsx';
import Modal from './components/Modal.jsx';
import FormularioAgendamento from './components/FormularioAgendamento.jsx';
import FormularioCadastro from './components/FormularioCadastro.jsx';
import { Button } from '@mantine/core';

// Imagens
import sobreImage from './assets/02.jpg';
import servicosImage from './assets/03.png';
import contatoImage from './assets/01.jpg';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);

  const openModal = (content) => {
    setModalContent(content);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setModalContent(null);
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5173/auth/google";
  };

  return (
    <>
      <Header />
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
        />

        <Section
          id="contato"
          title="Cadastre sua Barbearia"
          content="Venha fazer parte do nosso time!"
          imageSrc={contatoImage}
        >
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <Button
              variant="filled"
              color="green"
              size="lg"
              onClick={() => openModal('cadastro')}
            >
              Cadastre-se
            </Button>
            <Button
              variant="outline"
              color="blue"
              size="lg"
              onClick={handleGoogleLogin}
            >
              Conectar com Google
            </Button>
          </div>
        </Section>
      </main>

      <Footer />

      <Modal isOpen={isModalOpen} onClose={closeModal}>
        {modalContent === 'agendamento' && <FormularioAgendamento onClose={closeModal} />}
        {modalContent === 'cadastro' && <FormularioCadastro onClose={closeModal} />}
      </Modal>
    </>
  );
}

export default App;
