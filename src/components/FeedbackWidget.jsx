import React, { useState } from 'react';

const FeedbackWidget = ({ currentContextId = null, currentContextTitle = null }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [name, setName] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;
        
        setStatus('loading');
        try {
            await fetch(`${API_BASE}/api/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contextId: currentContextId || 'general',
                    userName: name || 'Anónimo',
                    message
                })
            });
            setStatus('success');
            setTimeout(() => {
                setIsOpen(false);
                setMessage('');
                setStatus('idle');
            }, 3000);
        } catch (error) {
            console.error("Feedback error", error);
            setStatus('idle');
        }
    };

    const isArticle = !!currentContextId;
    const placeholderText = isArticle 
        ? "Comentanos qué te pareció esta nota. ¿Notaste algún sesgo? ¿Qué otras fuentes te gustaría que incluyamos como motor de información para este tema?" 
        : "¿Qué te gustaría ver en Fuerte al Medio? Recomendanos nuevas secciones, portales para raspar, o mejorías en la interfaz.";

    return (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999 }}>
            
            {/* El Globo Flotante Primario (Ahora con Texto Explícito) */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    height: '50px', padding: '0 20px', borderRadius: '25px', background: 'var(--bg-color)', 
                    color: 'var(--text-main)', border: '1px solid var(--border-color)', cursor: 'pointer', boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s', gap: '8px',
                    fontFamily: 'var(--font-display)', fontWeight: 'bold', fontSize: '1rem',
                    transform: isOpen ? 'scale(0.95)' : 'scale(1)'
                }}
            >
                {isOpen ? (
                    <>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        Cerrar
                    </>
                ) : (
                    <>
                        <span style={{fontSize: '1.2rem'}}>💡</span>
                        Danos Feedback
                    </>
                )}
            </button>

            {/* El Modal de Carga Interactiva */}
            {isOpen && (
                <div style={{
                    position: 'absolute', bottom: '80px', right: '0', width: '380px', maxWidth: '85vw',
                    background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.12)', padding: '1.5rem',
                    animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)', transformOrigin: 'bottom right'
                }}>
                    {status === 'success' ? (
                        <div style={{textAlign: 'center', padding: '2rem 1rem'}}>
                            <div style={{fontSize: '3rem', marginBottom: '1rem'}}>🤝</div>
                            <h3 style={{fontFamily: 'var(--font-display)', color: 'var(--text-main)', fontSize: '1.4rem'}}>¡Mensaje Encriptado!</h3>
                            <p style={{color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.5rem'}}>Tu reporte fue enviado a la central analítica. Gracias por construir el diario del futuro.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                            <div>
                                <h3 style={{fontFamily: 'var(--font-display)', color: 'var(--text-main)', fontSize: '1.25rem', marginBottom: '0.2rem'}}>
                                    {isArticle ? 'Auditoría de Artículo' : 'Buzón de Sugerencias'}
                                </h3>
                                <p style={{color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.4'}}>
                                    {isArticle ? `Estás reportando sobre: "${currentContextTitle?.substring(0,40)}..."` : 'Toda sugerencia moldea nuestro algoritmo.'}
                                </p>
                            </div>

                            <input 
                                type="text" 
                                placeholder="Tu Alias / Nombre (Opcional)" 
                                value={name} onChange={e => setName(e.target.value)}
                                style={{
                                    padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)',
                                    background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '0.95rem', fontFamily: 'var(--font-body)', outline: 'none'
                                }}
                            />
                            
                            <textarea 
                                required
                                placeholder={placeholderText}
                                value={message} onChange={e => setMessage(e.target.value)}
                                style={{
                                    padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', resize: 'none',
                                    background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '0.95rem', minHeight: '120px', fontFamily: 'var(--font-body)', outline: 'none'
                                }}
                            />

                            <button 
                                type="submit" 
                                disabled={status === 'loading' || !message.trim()}
                                style={{
                                    padding: '0.9rem', borderRadius: '8px', background: 'var(--accent)', color: '#fff', border: 'none',
                                    fontWeight: 700, cursor: message.trim() ? 'pointer' : 'not-allowed', opacity: message.trim() ? 1 : 0.6, fontSize: '1rem'
                                }}
                            >
                                {status === 'loading' ? 'Transmitiendo...' : 'Enviar Reporte Analítico'}
                            </button>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
};

export default FeedbackWidget;
