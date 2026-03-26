import React, { useState } from 'react';

const renderBoldText = (text) => {
    if (!text) return null;
    return text.split(/(\*\*.*?\*\*)/g).map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} style={{fontWeight: 800, color: '#111'}}>{part.slice(2, -2)}</strong>;
        }
        return part;
    });
};

const NewsCard = ({ article, isFullView, onSelect, isHero, isCompact, onCategorySelect }) => {
  const [votesCount, setVotesCount] = useState(Number(article.userVotesCount) || 0);
  const [votesSum, setVotesSum] = useState(Number(article.userVotesSum) || 0);
  const [hasVoted, setHasVoted] = useState(false);
  const [scoreInput, setScoreInput] = useState(50);
  
  const [comments, setComments] = useState(article.comments || []);
  const [nameInput, setNameInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);

  // Lógica Matemática del Barómetro Circular (SVG)
  const avgScore = votesCount > 0 ? Math.round(votesSum / votesCount) : null;
  
  const renderRadialGauge = () => {
      if (avgScore === null) {
          return (
              <div style={{display: 'flex', alignItems: 'center', gap: '0.8rem', background: '#f8f9fa', padding: '0.6rem 1.2rem', borderRadius: '30px', border: '1px solid #eaeaea'}}>
                  <span style={{fontSize: '0.85rem', fontWeight: 700, color: '#555'}}>Objetividad:</span>
                  <span style={{fontSize: '0.85rem', fontWeight: 700, color: '#999'}}>Sin Votos</span>
              </div>
          );
      }
      
      const conicColors = `#ea4335 0%, #fbbc04 50%, #34a853 100%`;
      const finalNumberColor = `hsl(${Math.max(0, Math.min(120, avgScore * 1.2))}, 85%, 42%)`;

      return (
          <div style={{display: 'flex', alignItems: 'center', gap: '0.8rem', background: '#f8f9fa', padding: '0.4rem 1.2rem', borderRadius: '30px', border: '1px solid #eaeaea'}}>
              <div style={{
                  position: 'relative', width: '50px', height: '50px', borderRadius: '50%',
                  background: `conic-gradient(from 0deg, ${conicColors})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                  <div style={{
                      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '50%',
                      background: `conic-gradient(transparent ${avgScore}%, #e5e7eb ${avgScore}%)`
                  }}></div>
                  
                  <div style={{
                      width: '40px', height: '40px', borderRadius: '50%', background: '#f8f9fa',
                      position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1rem', fontWeight: 900, color: finalNumberColor
                  }}>
                      {avgScore}%
                  </div>
              </div>
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
                  <span style={{fontSize: '0.85rem', fontWeight: 800, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                      OBJETIVIDAD
                  </span>
                  <span style={{fontSize: '0.68rem', fontWeight: 600, color: '#9ca3af', marginTop: '0.1rem'}}>
                      {avgScore !== null ? `(${votesCount} votos cívicos)` : 'Sin Ponderar'}
                  </span>
              </div>
          </div>
      );
  };

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const submitVote = async () => {
      if (hasVoted) return;
      setVotesCount(prev => prev + 1);
      setVotesSum(prev => prev + Number(scoreInput));
      setHasVoted(true);
      try {
          await fetch(`${API_BASE}/api/news/${article.id}/action`, { 
              method: 'POST', 
              headers: {'Content-Type': 'application/json'}, 
              body: JSON.stringify({type: 'vote', score: Number(scoreInput)}) 
          });
      } catch (e) {}
  };

  const submitComment = async () => {
    if (!textInput.trim() || textInput.length > 140) return;
    const author = nameInput.trim() || 'Lector';
    const newComm = { 
        id: Date.now().toString(),
        parentId: replyingTo,
        name: author, 
        text: textInput,
        date: new Date().toISOString()
    };
    
    setComments([...comments, newComm]);
    setTextInput('');
    setReplyingTo(null);

    try {
        await fetch(`${API_BASE}/api/news/${article.id}/action`, { 
            method: 'POST', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify({type: 'comment', commentObj: newComm}) 
        });
    } catch(e) {}
  };

  const renderCommentForm = (isReply = false) => (
      <div style={{display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: isReply ? '1.5rem' : '0', marginBottom: isReply ? '1.5rem' : '3rem', border: '1px solid ' + (isReply ? 'var(--accent)' : '#ddd'), padding: '1.5rem', borderRadius: '12px', background: isReply ? '#f4fbfd' : 'transparent', transition: 'all 0.3s', boxShadow: isReply ? '0 4px 12px rgba(37,99,235,0.1)' : 'none'}}>
          {isReply && (
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', borderBottom: '1px solid #dbeafe', paddingBottom: '0.5rem'}}>
                  <span style={{fontSize: '0.9rem', color: 'var(--accent)', fontWeight: 700}}>Respondiendo en el hilo...</span>
                  <button onClick={() => setReplyingTo(null)} style={{background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600}}>Cancelar X</button>
              </div>
          )}
          <input type="text" placeholder="Tu Nombre o Alias (Opcional)" value={nameInput} onChange={e => setNameInput(e.target.value)} style={{padding: '0.8rem', border: 'none', borderBottom: '1px solid #eee', background: 'transparent', outline: 'none', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '1.05rem'}}/>
          <textarea placeholder="Postula tu refutación (Máx 140 Caracteres)..." value={textInput} maxLength={140} onChange={e => setTextInput(e.target.value)} style={{padding: '0.8rem', border: 'none', resize: 'none', minHeight: '80px', background: 'transparent', outline: 'none', fontFamily: 'var(--font-body)', fontSize: '1.15rem'}}/>
          
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem'}}>
              <span style={{fontSize: '0.9rem', color: textInput.length >= 140 ? '#dc2626' : 'var(--text-secondary)', fontWeight: 700}}>{140 - textInput.length} caracteres restantes</span>
              <button onClick={submitComment} disabled={textInput.length === 0} style={{background: textInput.length > 0 ? 'var(--accent)' : '#ccc', color: '#fff', padding: '0.6rem 2rem', borderRadius: '20px', cursor: textInput.length > 0 ? 'pointer' : 'not-allowed', border: 'none', fontWeight: 700}}>
                  {isReply ? 'Responder' : 'Postear'}
              </button>
          </div>
      </div>
  );

  const renderComments = (parentId = null, depth = 0) => {
      const childComments = comments.filter(c => c.parentId == parentId);
      if (childComments.length === 0) return null;
      
      return (
          <ul style={{listStyle: 'none', margin: 0, padding: 0, paddingLeft: depth > 0 ? '2rem' : '0', borderLeft: depth > 0 ? '3px solid #f1f1f1' : 'none', marginTop: depth > 0 ? '1rem' : '0'}}>
              {childComments.map((c, i) => (
                  <li key={c.id || i} style={{fontSize: '1.05rem', marginBottom: '1.5rem', paddingBottom: depth === 0 ? '1.5rem' : '0', borderBottom: depth === 0 ? '1px solid #f1f1f1' : 'none', display: 'flex', flexDirection: 'column'}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem'}}>
                          <strong style={{color: 'var(--text-main)', fontSize: '0.95rem'}}>{c.name}</strong> 
                          <span style={{fontWeight: 400, opacity: 0.5, fontSize: '0.8rem'}}>· FuerteAlMedio</span>
                      </div>
                      
                      <span style={{color: 'var(--text-main)', lineHeight: '1.5'}}>{c.text}</span>
                      
                      <div style={{marginTop: '0.6rem'}}>
                          {replyingTo !== c.id && (
                              <button onClick={() => { setReplyingTo(c.id); setTextInput(''); }} style={{background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.85rem', padding: 0, fontWeight: 600}}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight:'4px'}}><polyline points="15 10 20 15 15 20"></polyline><path d="M4 4v7a4 4 0 0 0 4 4h12"></path></svg> 
                                  Responder
                              </button>
                          )}
                      </div>

                      {replyingTo === c.id && renderCommentForm(true)}
                      {renderComments(c.id, depth + 1)}
                  </li>
              ))}
          </ul>
      )
  };

  return (
    <article className={isFullView ? "article-full" : "article-card"} style={isFullView ? {border: 'none', padding: 0} : {}}>
      
      {/* 1. METADATA Y GRÁFICO CIRCULAR */}
      <div className="article-meta" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '0.8rem'}}>
            <span 
               className="category" 
               onClick={(e) => { e.stopPropagation(); if(onCategorySelect) onCategorySelect(article.category); }}
               style={{cursor: onCategorySelect ? 'pointer' : 'inherit'}}
            >
                {article.category}
            </span>
            <span style={{fontSize: '0.85rem', color: '#888', fontWeight: 600}}>{article.date || new Date().toLocaleDateString('es-AR')}</span>
            <span style={{fontSize: '0.85rem', color: '#16a34a', fontWeight: 800, background: '#dcfce7', padding: '0.2rem 0.6rem', borderRadius: '12px'}}>
                ⚡ {article.importanceScore || 1} {article.importanceScore === 1 ? 'Fuente' : 'Fuentes'}
            </span>
        </div>
        {renderRadialGauge()}
      </div>
      
      <h2 
        className="article-title" 
        onClick={() => !isFullView && onSelect && onSelect(article)} 
        style={{cursor: !isFullView ? 'pointer' : 'text', fontSize: isHero || isFullView ? '2.2rem' : '', color: isHero || isFullView ? 'var(--text-main)' : '', lineHeight: '1.2', marginBottom: '1.2rem'}}
      >
        {article.title}
      </h2>

      {/* 4. EL COPETE */}
      {(article.copete || article.Copete) && !isCompact && (
         <p 
            onClick={() => onSelect && onSelect(article)}
            style={{fontSize: isHero || isFullView ? '1.25rem' : '1.05rem', fontWeight: 600, color: '#333', marginBottom: '1.5rem', lineHeight: '1.5', cursor: !isFullView ? 'pointer' : 'text'}}
         >
             {renderBoldText(article.copete || article.Copete)}
         </p>
      )}

      {/* 2. PORTADA HD (Baja debajo del copete) */}
      {article.imageUrl && !isCompact && (
          <div 
            onClick={() => !isFullView && onSelect && onSelect(article)} 
            style={{width: '100%', height: isHero || isFullView ? '450px' : '220px', overflow: 'hidden', borderRadius: '8px', marginBottom: '1.5rem', cursor: !isFullView ? 'pointer' : 'default', background: '#f5f5f5'}}
          >
              <img src={article.imageUrl} alt={article.title} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          </div>
      )}
      
      {/* 5. VISTA DE PORTADA vs COMPLETA */}
      {!isFullView ? (
        !isCompact && (
          <p 
            className="article-summary" 
            onClick={() => onSelect && onSelect(article)}
            style={{ display: '-webkit-box', WebkitLineClamp: isHero ? 4 : 3, lineClamp: isHero ? 4 : 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', cursor: 'pointer', fontSize: isHero ? '1.15rem' : '1rem' }}
          >
            {renderBoldText(article.summary)}
          </p>
        )
      ) : (
        <div style={{animation: "fadeIn 0.3s ease"}}>
          {/* CUERPO PRINCIPAL ESCRITO EN PÁRRAFOS SEPARADOS Y BULLET POINTS */}
          <div style={{marginTop: '2.5rem', paddingBottom: '1.5rem'}}>
              {article.summary.replace(/\\n/g, '\n').split(/\n+/).filter(p => p.trim() !== '').map((paragraph, idx) => {
                  const isBullet = paragraph.trim().startsWith('-') || paragraph.trim().startsWith('•');
                  return (
                      <p key={idx} className="article-summary" style={{
                          fontSize: isBullet ? '1.15rem' : '1.25rem', 
                          lineHeight: '1.9', 
                          color: 'var(--text-main)', 
                          marginBottom: isBullet ? '0.8rem' : '1.8rem',
                          marginLeft: isBullet ? '2rem' : '0',
                          listStyleType: isBullet ? 'disc' : 'none',
                          display: isBullet ? 'list-item' : 'block'
                      }}>
                          {isBullet ? renderBoldText(paragraph.replace(/^[-•]\s*/, '')) : renderBoldText(paragraph)}
                      </p>
                  );
              })}
          </div>
          
          <div className="article-conflict" style={{backgroundColor: 'rgba(128,128,128,0.03)', borderLeft: '4px solid var(--text-main)', margin: '2.5rem 0', padding: '1.5rem'}}>
            <span className="conflict-label" style={{color: 'var(--text-main)', fontSize: '0.85rem'}}>Divergencias Editoriales Detectadas por IA:</span>
            <p style={{fontSize: '1.1rem'}}>{article.conflictPoints}</p>
          </div>

          <div className="sources-container" style={{marginBottom: '3.5rem'}}>
            <span className="source-label">Fuentes Trianguladas:</span>
            {article.sources && article.sources.map((src, idx) => (
              <a key={idx} href={src.url} target="_blank" rel="noreferrer" className="source-pill">
                {src.name} <span className="source-bias">({src.bias})</span>
              </a>
            ))}
          </div>

          {/* YOUTUBE IFRAME AUTOMÁTICO */}
          {article.youtubeQuery && (
              <div style={{marginTop: '3.5rem', marginBottom: '3.5rem'}}>
                  <h4 style={{fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: '1.5rem', color: 'var(--text-main)'}}>Archivo Audiovisual Relacionado:</h4>
                  <div style={{position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}}>
                      <iframe 
                          src={`https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(article.youtubeQuery)}`}
                          style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}}
                          frameBorder="0" 
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                          allowFullScreen
                      ></iframe>
                  </div>
              </div>
          )}

          {/* BARÓMETRO CÍVICO DE OBJETIVIDAD  */}
          <div className="action-bar" style={{borderTop: '2px solid var(--border-color)', paddingTop: '2.5rem', marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem', alignItems: 'flex-start'}}>
            <h4 style={{fontFamily: 'var(--font-display)', fontSize: '1.4rem', margin: 0, color: 'var(--text-main)'}}>Barómetro Interactivo de Objetividad</h4>
            
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '600px', background: '#f8f9fa', padding: '2rem 1.5rem', borderRadius: '12px'}}>
                {/* Visualizador de Porcentaje Dinámico */}
                <div style={{fontSize: '2.5rem', fontWeight: 800, color: `hsl(${scoreInput * 1.2}, 75%, 45%)`, marginBottom: '1rem', fontFamily: 'var(--font-display)', lineHeight: 1}}>
                    {scoreInput}%
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '1rem', width: '100%'}}>
                    <span style={{color: '#dc2626', fontWeight: 700, fontSize: '0.9rem', width: '80px', textAlign: 'right'}}>Tendencioso</span>
                    <input 
                        type="range" min="0" max="100" 
                        value={scoreInput} 
                        onChange={e => !hasVoted && setScoreInput(e.target.value)}
                        style={{flex: 1, accentColor: `hsl(${scoreInput * 1.2}, 75%, 45%)`, cursor: hasVoted ? 'default' : 'pointer', pointerEvents: hasVoted ? 'none' : 'auto', opacity: hasVoted ? 0.9 : 1}}
                    />
                    <span style={{color: '#16a34a', fontWeight: 700, fontSize: '0.9rem', width: '80px'}}>Objetivo</span>
                </div>
            </div>

            {!hasVoted ? (
                <button onClick={submitVote} style={{background: 'var(--text-main)', color: '#fff', border: 'none', padding: '0.8rem 2.5rem', borderRadius: '30px', cursor: 'pointer', fontWeight: 700, fontSize: '1.05rem', marginTop: '0.5rem'}}>
                    Emitir Voto de Ponderación
                </button>
            ) : (
                <span style={{fontSize: '1rem', color: `hsl(${scoreInput * 1.2}, 75%, 45%)`, fontWeight: 800, marginTop: '0.5rem'}}>✓ Tu porcentaje fue blindado e inyectado en la red.</span>
            )}
          </div>

          <div style={{padding: '2.5rem 0', borderTop: '2px solid var(--border-color)'}}>
              <h3 style={{fontFamily: 'var(--font-display)', marginBottom: '2rem', fontSize: '1.6rem'}}>Comentarios y Refutaciones ({comments.length})</h3>
              {!replyingTo && renderCommentForm(false)}
              {comments.length === 0 && <span style={{fontSize: '1.1rem', color: '#666', fontStyle: 'italic'}}>Nadie ha iniciado el debate todavía.</span>}
              <div style={{marginTop: '2rem'}}>
                {renderComments(null, 0)}
              </div>
          </div>
        </div>
      )}
    </article>
  );
};

export default NewsCard;
