import React from 'react';

const renderBoldText = (text) => {
    if (!text) return null;
    return text.split(/(\*\*.*?\*\*)/g).map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} style={{fontWeight: 800, color: 'var(--text-main)', opacity: '0.95'}}>{part.slice(2, -2)}</strong>;
        }
        return part;
    });
};

const CortitaCard = ({ article, onSelect }) => {
  return (
    <div className="cortita-card" onClick={() => onSelect && onSelect(article)}>
      <h4 className="cortita-title">{article.title}</h4>
      <p className="cortita-summary">{renderBoldText(article.summary)}</p>
      <span className="cortita-link">
        Leer nota completa
      </span>
    </div>
  );
};

export default CortitaCard;
