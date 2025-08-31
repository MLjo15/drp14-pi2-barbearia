// src/components/Section.jsx

const Section = ({ id, title, content, children }) => {
  return (
    <section id={id} className="section">
      <div className="container">
        <h2>{title}</h2>
        <p>{content}</p>
        {children}
      </div>
    </section>
  );
};

export default Section;