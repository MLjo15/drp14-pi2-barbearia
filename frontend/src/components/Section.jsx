// src/components/Section.jsx

const Section = ({ id, title, content, imageSrc, mediaComponent, reverseOrder, children }) => {
  const sectionClasses = `section ${reverseOrder ? 'reverse-order' : ''}`;

  return (
    <section id={id} className={sectionClasses}>
      <div className="container section-content">
        {/* Renderiza o componente de mídia ou a imagem, se fornecidos */}
        {(imageSrc || mediaComponent) && (
          <div className="section-image">
            {mediaComponent ? mediaComponent : <img src={imageSrc} alt={title} />}
          </div>
        )}

        {/* Conteúdo de texto e outros elementos */}
        <div className="section-text">
          <h2>{title}</h2>
          <p>{content}</p>
          {children} {/* Para renderizar o botão, se houver */}
        </div>
      </div>
    </section>
  );
};

export default Section;