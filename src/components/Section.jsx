// src/components/Section.jsx

const Section = ({ id, title, content, imageSrc, reverseOrder, children }) => {
  const sectionClasses = `section ${reverseOrder ? 'reverse-order' : ''}`;

  return (
    <section id={id} className={sectionClasses}>
      <div className="container section-content">
        {/* Renderiza a imagem se imageSrc for fornecido */}
        {imageSrc && (
          <div className="section-image">
            <img src={imageSrc} alt={title} />
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