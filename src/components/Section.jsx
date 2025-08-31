// src/components/Section.jsx

function Section({ id, title, content }) {
  return (
    <section id={id} className="section">
      <div className="container">
        <h2>{title}</h2>
        <p>{content}</p>
        {/* Adicionar mais conteúdo ou imagens aqui */}
      </div>
    </section>
  );
}

export default Section;