import React, { useState, useEffect, useRef } from 'react';
import { authors } from '../data/authors.js';
import AuthorAvatar from './AuthorAvatar';

const renderBoldText = (text) => {
    if (!text) return null;
    return text.split(/(\*\*.*?\*\*)/g).map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} style={{fontWeight: 800, color: 'var(--text-main)', opacity: '0.95'}}>{part.slice(2, -2)}</strong>;
        }
        return part;
    });
};

const NewsCard = ({ article, isFullView, onSelect, isHero, isCompact, onCategorySelect, onUpdate, onAuthorSelect }) => {
  const [votesCount, setVotesCount] = useState(Number(article.userVotesCount) || 0);
  const [votesSum, setVotesSum] = useState(Number(article.userVotesSum) || 0);
  const [previousVote, setPreviousVote] = useState(() => {
      if (typeof window !== 'undefined') {
          const saved = localStorage.getItem(`civic_vote_${article.id}`);
          return saved ? Number(saved) : null;
      }
      return null;
  });
  const [hasVoted, setHasVoted] = useState(previousVote !== null);
  const [scoreInput, setScoreInput] = useState(previousVote !== null ? previousVote : 0);
  const donutRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  useEffect(() => {
      setVotesCount(Number(article.userVotesCount) || 0);
      setVotesSum(Number(article.userVotesSum) || 0);
  }, [article.userVotesCount, article.userVotesSum]);

  // Telemetría de Tiempo de Lectura y Vistas
  useEffect(() => {
      if (!isFullView) return; // Solo rastrear en vista expandida
      
      const startTime = Date.now();
      let isTracking = true;

      return () => {
          if (isTracking) {
              const timeSpent = Math.floor((Date.now() - startTime) / 1000);
              // Pings a DB solo si leyó más de 2 segundos
              if (timeSpent > 2) {
                  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
                  fetch(`${API_BASE}/api/track`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ type: 'article_view', articleId: article.id, timeSpent })
                  }).catch(err => console.error("Telemetry failed:", err));
              }
          }
      };
  }, [isFullView, article.id]);

  const [comments, setComments] = useState(article.comments || []);
  const [nameInput, setNameInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);

  // Lógica Matemática del Barómetro Circular (SVG)
  const avgScore = votesCount > 0 ? Math.round(votesSum / votesCount) : null;
  
  const renderRadialGauge = () => {
      if (avgScore === null) {
          return (
              <div style={{display: 'flex', alignItems: 'center', gap: '0.8rem', background: 'var(--bg-color)', padding: '0.6rem 1.2rem', borderRadius: '30px', border: '1px solid var(--border-color)'}}>
                  <span style={{fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)'}}>Objetividad:</span>
                  <span style={{fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)'}}>Sin Votos</span>
              </div>
          );
      }
      
      const conicColors = `#ea4335 0%, #fbbc04 50%, #34a853 100%`;
      const finalNumberColor = `hsl(${Math.max(0, Math.min(120, avgScore * 1.2))}, 85%, 42%)`;

      return (
          <div style={{display: 'flex', alignItems: 'center', gap: '0.8rem', background: 'var(--bg-color)', padding: '0.4rem 1.2rem', borderRadius: '30px', border: '1px solid var(--border-color)'}}>
              <div style={{
                  position: 'relative', width: '50px', height: '50px', borderRadius: '50%',
                  background: `conic-gradient(from 0deg, ${conicColors})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                  <div style={{
                      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '50%',
                      background: `conic-gradient(transparent ${avgScore}%, var(--border-color) ${avgScore}%)`
                  }}></div>
                  
                  <div style={{
                      width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-color)',
                      position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1rem', fontWeight: 900, color: finalNumberColor
                  }}>
                      {avgScore}%
                  </div>
              </div>
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
                  <span style={{fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                      OBJETIVIDAD
                  </span>
                  <span style={{fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '0.1rem'}}>
                      {avgScore !== null ? `(${votesCount} votos cívicos)` : 'Sin Ponderar'}
                  </span>
              </div>
          </div>
      );
  };

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const getScoreFromEvent = (e) => {
      if (!donutRef.current) return scoreInput;
      const rect = donutRef.current.getBoundingClientRect();
      const clientX = e.clientX !== undefined ? Math.max(e.clientX, e.touches?.[0]?.clientX || 0) : e.touches[0].clientX;
      const clientY = e.clientY !== undefined ? Math.max(e.clientY, e.touches?.[0]?.clientY || 0) : e.touches[0].clientY;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      
      let angle = Math.atan2(clientY - cy, clientX - cx) * 180 / Math.PI;
      let adjusted = angle + 90; // Shift: Top becomes 0
      if (adjusted < 0) adjusted += 360;
      
      // Magnetic snapping near the extreme ends
      if (adjusted > 355) return 100;
      if (adjusted < 5) return 0; // Means UNVOTE.
      
      return Math.round((adjusted / 360) * 100);
  };

  const onPointerDown = (e) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      setIsDragging(true);
      setScoreInput(getScoreFromEvent(e));
      setShowConfetti(false);
  };

  const onPointerMove = (e) => {
      if (!isDragging) return;
      setScoreInput(getScoreFromEvent(e));
  };

  const onPointerUp = async (e) => {
      if (!isDragging) return;
      e.currentTarget.releasePointerCapture(e.pointerId);
      setIsDragging(false);
      
      let finalScore = scoreInput;
      let scoreDelta = 0;
      let countDelta = 0;

      if (finalScore === 0) {
          // UNVOTE
          if (!hasVoted) return;
          
          scoreDelta = -previousVote;
          countDelta = -1;
          
          setPreviousVote(null);
          setHasVoted(false);
          if (typeof window !== 'undefined') localStorage.removeItem(`civic_vote_${article.id}`);
      } else {
          // VOTE / UPDATE
          finalScore = Math.max(1, finalScore);
          setScoreInput(finalScore);

          scoreDelta = hasVoted ? (finalScore - previousVote) : finalScore;
          if (hasVoted && scoreDelta === 0) return;
          
          countDelta = hasVoted ? 0 : 1;
          
          setPreviousVote(finalScore);
          setHasVoted(true);
          setShowConfetti(true);
          if (typeof window !== 'undefined') localStorage.setItem(`civic_vote_${article.id}`, finalScore);
      }

      setVotesCount(Math.max(0, votesCount + countDelta));
      setVotesSum(votesSum + scoreDelta);

      try {
          await fetch(`${API_BASE}/api/news/${article.id}/action`, { 
              method: 'POST', 
              headers: {'Content-Type': 'application/json'}, 
              body: JSON.stringify({type: 'vote', score: Number(scoreDelta), deltaCount: countDelta}) 
          });
          if (onUpdate) onUpdate();
      } catch(e) {}
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
        if (onUpdate) onUpdate();
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
  const handleShare = async (e) => {
      e.stopPropagation();
      const shareUrl = `${window.location.origin}/?article=${article.id}`;
      // Fallback nativo: intentar disparar el modal de OS, sino copiar a portapapeles
      if (navigator.share) {
          try {
              await navigator.share({
                  title: article.title,
                  text: (article.copete || article.Copete || 'Lee esta nota en Fuerte Al Medio'),
                  url: shareUrl,
              });
          } catch (err) {
              console.log('User canceled share or error:', err);
          }
      } else {
          try {
              await navigator.clipboard.writeText(shareUrl);
              alert("¡Enlace copiado al portapapeles!\nYa podés pegarlo en WhatsApp o Telegram.");
          } catch (err) {
              console.error('Failed to copy fallback: ', err);
          }
      }
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
            
            <div className="source-tooltip-container">
                <span style={{fontSize: '0.85rem', color: '#16a34a', fontWeight: 800, background: '#dcfce7', padding: '0.2rem 0.6rem', borderRadius: '12px'}}>
                    ⚡ {article.importanceScore || 1} {article.importanceScore === 1 ? 'Fuente' : 'Fuentes'}
                </span>
                <div className="tooltip-text">
                    {article.sources && Array.isArray(article.sources) && article.sources.length > 0 
                        ? article.sources.map(s => s.name || s.domain).join(' • ') 
                        : 'Recopilación en progreso...'}
                </div>
            </div>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '0.8rem'}}>
           <button 
             onClick={handleShare}
             style={{display: 'flex', alignItems: 'center', justifyContent: 'center', width: '42px', height: '42px', borderRadius: '50%', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 5px rgba(0,0,0,0.05)'}}
             title="Compartir Artículo"
           >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                 <circle cx="18" cy="5" r="3"></circle>
                 <circle cx="6" cy="12" r="3"></circle>
                 <circle cx="18" cy="19" r="3"></circle>
                 <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                 <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
              </svg>
           </button>
           {renderRadialGauge()}
        </div>
      </div>
      
      <h2 
        className="article-title" 
        onClick={() => !isFullView && onSelect && onSelect(article)} 
        style={{cursor: !isFullView ? 'pointer' : 'text', fontSize: isHero || isFullView ? '2.2rem' : '', color: isHero || isFullView ? 'var(--text-main)' : '', lineHeight: '1.2', marginBottom: '1.2rem'}}
      >
        {article.title}
      </h2>

      {/* 3. FIRMA DEL AUTOR (BYLINE) */}
      {(() => {
          const authorData = authors.find(a => a.id === article.authorId) || authors.find(a => a.id === 'cuesta_pol');
          return (
              <div 
                  onClick={(e) => { e.stopPropagation(); if (onAuthorSelect) onAuthorSelect(authorData.id); }}
                  style={{display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.2rem', cursor: onAuthorSelect ? 'pointer' : 'default', width: 'max-content'}}
              >
                  <div style={{width: '28px', height: '28px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'hidden', flexShrink: 0}}>
                      <AuthorAvatar authorId={authorData.id} size={26} />
                  </div>
                  <span style={{fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 600}}>
                      Por <span style={{textDecoration: 'underline', textDecorationColor: 'var(--accent)', color: 'var(--text-main)'}}>{authorData.name}</span>
                  </span>
              </div>
          );
      })()}

      {/* 4. EL COPETE */}
      {(article.copete || article.Copete) && !isCompact && (
         <p 
            onClick={() => onSelect && onSelect(article)}
            style={{fontSize: isHero || isFullView ? '1.25rem' : '1.05rem', fontWeight: 600, color: 'var(--text-main)', opacity: '0.85', marginBottom: '1.5rem', lineHeight: '1.5', cursor: !isFullView ? 'pointer' : 'text'}}
         >
             {renderBoldText(article.copete || article.Copete)}
         </p>
      )}

      {/* 2. PORTADA HD (Baja debajo del copete) */}
      {article.imageUrl && !isCompact && (
          <div style={{marginBottom: '1.5rem'}}>
              <div 
                onClick={() => !isFullView && onSelect && onSelect(article)} 
                style={{width: '100%', height: isHero || isFullView ? '450px' : '220px', overflow: 'hidden', borderRadius: '8px', cursor: !isFullView ? 'pointer' : 'default', background: '#f5f5f5', marginBottom: (article.imagecaption || article.imageCaption) ? '0.6rem' : '0'}}
              >
                  <img src={article.imageUrl} alt={article.title} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
              </div>
              {(article.imagecaption || article.imageCaption) && (
                  <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                      <span style={{display: 'block', maxWidth: '85%', fontSize: '0.86rem', color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'right', borderRight: '3px solid var(--accent)', paddingRight: '0.6rem', lineHeight: '1.4'}}>
                          {article.imagecaption || article.imageCaption}
                      </span>
                  </div>
              )}
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
          {/* CUERPO PRINCIPAL CON BURBUJAS DE BULLET POINTS */}
          <div style={{marginTop: '2.5rem', paddingBottom: '1.5rem'}}>
              {(() => {
                  const paragraphs = article.summary.replace(/\\n/g, '\n').split(/\n+/).filter(p => p.trim() !== '');
                  let elements = [];
                  let currentBullets = [];

                  const renderBulletGroup = (bullets, keyIndex) => (
                      <div key={`bullet-group-${keyIndex}`} style={{
                          background: 'var(--card-bg)', border: '1px solid var(--accent)', borderRadius: '12px',
                          padding: '1.5rem', margin: '2rem 0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
                      }}>
                          <div style={{marginBottom: '1.2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.8rem'}}>
                              <div style={{display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem'}}>
                                  <svg width="26" height="20" viewBox="0 0 32 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <rect x="2" y="2" width="28" height="17" rx="2" ry="2" />
                                      <path d="M12 23h8" />
                                      <path d="M16 19v4" />
                                      <text x="16" y="14" textAnchor="middle" fontSize="10.5" fontWeight="900" fontFamily="sans-serif" fill="var(--accent)" strokeWidth="0">VAR</text>
                                  </svg>
                                  <span style={{fontSize: '0.95rem', color: 'var(--accent)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', paddingTop: '2px'}}>El VAR de Fuerte Al Medio</span>
                              </div>
                              <span style={{display: 'block', fontSize: '0.85rem', color: 'var(--accent)', fontStyle: 'italic', fontWeight: 600, opacity: 0.85}}>Un resumen objetivo y neutral de este artículo.</span>
                          </div>
                          <ul style={{listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                              {bullets.map((b, i) => (
                                  <li key={`b-${i}`} style={{display: 'flex', gap: '1rem', alignItems: 'flex-start'}}>
                                      <span style={{color: 'var(--accent)', fontSize: '1.2rem', lineHeight: '1.5'}}>•</span>
                                      <span style={{fontSize: '1.15rem', lineHeight: '1.6', color: 'var(--text-main)', fontWeight: 500}}>
                                          {renderBoldText(b.replace(/^[-•]\s*/, ''))}
                                      </span>
                                  </li>
                              ))}
                          </ul>
                      </div>
                  );

                  for (let idx = 0; idx < paragraphs.length; idx++) {
                      const paragraph = paragraphs[idx];
                      const isBullet = paragraph.trim().startsWith('-') || paragraph.trim().startsWith('•');
                      
                      if (isBullet) {
                          currentBullets.push(paragraph);
                      } else {
                          if (currentBullets.length > 0) {
                              elements.push(renderBulletGroup(currentBullets, idx));
                              currentBullets = [];
                          }
                          elements.push(
                              <p key={idx} className="article-summary" style={{
                                  fontSize: '1.25rem', lineHeight: '1.9', color: 'var(--text-main)', marginBottom: '1.8rem'
                              }}>
                                  {renderBoldText(paragraph)}
                              </p>
                          );
                      }
                  }
                  
                  if (currentBullets.length > 0) {
                      elements.push(renderBulletGroup(currentBullets, 'end'));
                  }

                  // Fase 78: Cita formal y directa para ecosistema Tech/Cripto
                  if (article.category === 'Tecnología' && article.sources && article.sources.length > 0) {
                      const primarySource = article.sources[0];
                      elements.push(
                          <p key="tech-source-link" style={{fontSize: '1.05rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '2rem', padding: '1rem', background: 'rgba(128,128,128,0.05)', borderRadius: '6px', borderLeft: '3px solid var(--text-secondary)'}}>
                              Fuente: <a href={primarySource.url} target="_blank" rel="noreferrer" style={{color: 'var(--accent)', textDecoration: 'underline'}}>{primarySource.name}</a>
                          </p>
                      );
                  }

                  return elements;
              })()}
          </div>
          
          <div className="article-conflict" style={{backgroundColor: 'rgba(128,128,128,0.03)', borderLeft: '4px solid var(--text-main)', margin: '2.5rem 0', padding: '1.5rem'}}>
            <span className="conflict-label" style={{color: 'var(--text-main)', fontSize: '0.85rem'}}>Divergencias Editoriales Detectadas por IA:</span>
            <p style={{fontSize: '1.1rem'}}>{article.conflictPoints}</p>
          </div>

              <div className="sources-container" style={{marginTop: '0.5rem', paddingBottom: '0.5rem'}}>
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
          <div className="action-bar" style={{borderTop: '2px solid var(--border-color)', paddingTop: '2.5rem', marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem', alignItems: 'center'}}>
            <h4 style={{fontFamily: 'var(--font-display)', fontSize: '1.4rem', margin: 0, color: 'var(--text-main)', textAlign: 'center'}}>Auditoría Cívica P2P</h4>
            
            <style>{`
                @keyframes obj_burst_out {
                    0% { transform: rotate(var(--angle)) translateY(-30px) scale(0.5); opacity: 1; }
                    100% { transform: rotate(var(--angle)) translateY(-100px) scale(1.2); opacity: 0; }
                }
            `}</style>
            
            {(() => {
                const size = 220;
                // Fase 49: El color de Base es Gris si está inmaculado (Pristine). Al tocarlo, nace de Rojo (0) a Verde (100).
                const isPristine = !hasVoted && !isDragging;
                const activeColor = `hsl(${scoreInput * 1.2}, 75%, 45%)`;
                const color = isPristine ? '#cbd5e1' : activeColor;
                
                const radius = size / 2 - 20;
                const circumference = 2 * Math.PI * radius;
                const fillOffset = circumference - (scoreInput / 100) * circumference;
                
                // Track geometry for Thumb/Notch location exactly at the arc tip
                const thumbAngle = (scoreInput / 100) * 360;
                const thumbX = size/2 + radius * Math.sin(thumbAngle * Math.PI / 180);
                const thumbY = size/2 - radius * Math.cos(thumbAngle * Math.PI / 180);

                return (
                    <div 
                        ref={donutRef}
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                        onPointerCancel={onPointerUp}
                        style={{position: 'relative', width: size, height: size, touchAction: 'none', cursor: isDragging ? 'grabbing' : 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '1rem 0 0 0'}}
                    >
                        <svg width={size} height={size} style={{position: 'absolute'}}>
                            {/* Riel Fondo Espacio Gris */}
                            <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth="24" />
                            {/* Arco de Progreso de Color */}
                            <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth="24" strokeDasharray={circumference} strokeDashoffset={fillOffset} strokeLinecap="round" style={{transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: isDragging ? 'none' : 'stroke-dashoffset 0.1s ease-out, stroke 0.2s ease-out'}} />
                            {/* Muesca (Thumb) Táctil */}
                            <circle cx={thumbX} cy={thumbY} r={14} fill="#ffffff" stroke={color} strokeWidth="6" style={{transition: isDragging ? 'none' : 'cx 0.1s ease-out, cy 0.1s ease-out, stroke 0.2s ease-out', filter: 'drop-shadow(0px 3px 5px rgba(0,0,0,0.25))'}} />
                        </svg>
                        
                        <div style={{zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none'}}>
                            <span style={{fontSize: '3.5rem', fontWeight: 900, color: isPristine ? '#94a3b8' : color, fontFamily: 'var(--font-display)', lineHeight: 1}}>{scoreInput}%</span>
                            <span style={{fontSize: '0.85rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '0.4rem'}}>
                                {scoreInput > 65 ? 'Objetiva' : scoreInput < 35 ? 'Sesgada' : 'Neutral'}
                            </span>
                        </div>
                        
                        {/* EFECTO CONFETTI */}
                        {showConfetti && Array.from({length: 12}).map((_, i) => (
                            <div key={i} style={{
                                position: 'absolute', top: '50%', left: '50%', width: '12px', height: '12px', 
                                borderRadius: '50%', background: activeColor, pointerEvents: 'none',
                                '--angle': `${i * 30}deg`,
                                animation: 'obj_burst_out 0.6s cubic-bezier(0.1, 0.8, 0.3, 1) forwards'
                            }} />
                        ))}
                    </div>
                );
            })()}

            <span style={{fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 600, fontStyle: 'italic', marginBottom: '1.5rem'}}>Girá el termómetro para calificar la objetividad de la noticia</span>

            {hasVoted && !isDragging && (
                <span style={{fontSize: '0.95rem', color: `hsl(${scoreInput * 1.2}, 75%, 45%)`, fontWeight: 800, marginTop: '-0.5rem', animation: 'fadeIn 0.3s'}}>✓ Tu escrutinio fue sincronizado en el consenso.</span>
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
