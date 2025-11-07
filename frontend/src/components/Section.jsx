/**
 * @file src/components/Section.jsx
 * @description Componente reutilizável para criar seções de conteúdo na página.
 * Permite exibir um título, texto, uma imagem ou um componente de mídia,
 * e pode inverter a ordem da imagem/mídia e do texto.
 */

/**
 * Componente Section.
 * Renderiza uma seção de conteúdo com um título, texto, e opcionalmente uma imagem
 * ou um componente de mídia. A ordem da mídia e do texto pode ser invertida.
 *
 * @param {object} props - As propriedades do componente.
 * @param {string} props.id - O ID da seção, usado para navegação e identificação.
 * @param {string} props.title - O título principal da seção.
 * @param {string} props.content - O conteúdo textual da seção.
 * @param {string} [props.imageSrc] - O caminho da imagem a ser exibida na seção.
 * @param {React.ReactNode} [props.mediaComponent] - Um componente React para ser exibido no lugar da imagem (ex: carrossel).
 * @param {boolean} [props.reverseOrder=false] - Se `true`, inverte a ordem da mídia e do texto.
 * @param {React.ReactNode} [props.children] - Conteúdo adicional a ser renderizado dentro da área de texto da seção (ex: botões).
 * @returns {JSX.Element} O elemento JSX que representa a seção.
 */
const Section = ({ id, title, content, imageSrc, mediaComponent, reverseOrder, children }) => {
  // Define as classes CSS da seção, adicionando 'reverse-order' se a propriedade for verdadeira.
  const sectionClasses = `section ${reverseOrder ? 'reverse-order' : ''}`;

  return (
    <section id={id} className={sectionClasses}>
      <div className="container section-content">
        {/* Bloco de mídia: renderiza o `mediaComponent` se fornecido, caso contrário, renderiza a `imageSrc`. */}
        {(imageSrc || mediaComponent) && (
          <div className="section-image">
            {mediaComponent ? mediaComponent : <img src={imageSrc} alt={title} />}
          </div>
        )}

        {/* Bloco de texto: contém o título, o conteúdo textual e quaisquer elementos filhos. */}
        <div className="section-text">
          <h2>{title}</h2>
          <p>{content}</p>
          {children} {/* Renderiza elementos filhos, como botões de ação. */}
        </div>
      </div>
    </section>
  );
};

export default Section;