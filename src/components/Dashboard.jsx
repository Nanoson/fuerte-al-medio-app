import React, { useState, useEffect } from 'react';

const Dashboard = ({ onBack, onSelectArticle, onAuthorSelect }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeModal, setActiveModal] = useState(null);

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    useEffect(() => {
        fetch(`${API_BASE}/api/dashboard`)
            .then(res => res.json())
            .then(json => {
                setData(json);
                setLoading(false);
            })
            .catch(err => {
                console.error("Dashboard error:", err);
                setLoading(false);
            });
    }, [API_BASE]);

    const forceScrapingCycle = async () => {
        try {
            if (!window.confirm("⚠️ ¿Estás seguro? Esto despertará al servidor y consumirá tokens de tu API de Gemini.")) return;
            const res = await fetch(`${API_BASE}/api/force-scrape`);
            const jsonData = await res.json();
            alert(jsonData.message || "Señal enviada a la nube. El proceso demorará hasta 10 minutos.");
        } catch (err) {
            alert("Error de red: " + err.message);
        }
    };

    if(loading) return <div style={{padding: '5rem', textAlign: 'center', fontSize: '1.5rem'}}>Sincronizando con Servidor Analítico...</div>;
    if(!data) return <div style={{padding: '5rem', textAlign: 'center', fontSize: '1.5rem', color: 'red'}}>Error de conexión con Base de Datos.</div>;

    // Convertir segundos a formato legible
    const formatTime = (secs) => {
        if (!secs) return '0m';
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    return (
        <div style={{animation: 'fadeIn 0.3s ease', maxWidth: '1200px', margin: '0 auto'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
                <h1 style={{fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--text-main)', margin: 0}}>
                    Centro de Comando 📊
                </h1>
                <button onClick={onBack} style={{background: 'var(--border-color)', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, color: 'var(--text-main)'}}>
                    ← Volver a Portada
                </button>
            </div>

            {/* CONTROLES DEL SERVIDOR CLOUD (RENDER) */}
            <div style={{background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--accent)', marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                <h3 style={{fontSize: '1.2rem', margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>☁️ Arquitectura del Servidor</h3>
                <p style={{fontSize: '0.95rem', color: 'var(--text-secondary)', margin: 0}}>URL para configurar en Cron-job.org (Tu portal en la nube actual):</p>
                <code style={{background: '#f1f5f9', color: '#0f172a', padding: '0.8rem', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 600, userSelect: 'all'}}>
                    {API_BASE}/api/force-scrape
                </code>
                <button 
                    onClick={forceScrapingCycle} 
                    style={{background: 'var(--accent)', color: '#fff', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '8px', fontWeight: 700, width: 'max-content', cursor: 'pointer', marginTop: '0.5rem'}}
                >
                    ▶ Disparar Extracción Automática Manualmente
                </button>
            </div>

            {/* KPI CARDS */}
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem'}}>
                <KpiCard label="Visitas Globales" value={data.metrics.views.toLocaleString()} color="#3b82f6" icon="👁️" onClick={() => setActiveModal('views')} />
                <KpiCard label="Tiempo Global de Lectura" value={formatTime(data.metrics.readTime)} color="#10b981" icon="⏳" onClick={() => setActiveModal('time')} />
                <KpiCard label="Votos Cívicos Emitidos" value={data.metrics.votes.toLocaleString()} color="#8b5cf6" icon="⚖️" onClick={() => setActiveModal('votes')} />
                <KpiCard label="Comentarios Totales" value={data.metrics.comments.toLocaleString()} color="#f59e0b" icon="💬" onClick={() => setActiveModal('comments')} />
                <KpiCard label="Alcance Algorítmico" value={`${data.metrics.articles} Notas`} color="#dc2626" icon="🗞️" onClick={() => setActiveModal('articles')} />
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem'}}>
                {/* TOP ARTÍCULOS */}
                <div style={{background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem'}}>
                    <h3 style={{fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem'}}>
                        🔥 Artículos Más Consumidos
                    </h3>
                    {data.topArticles.map((art, idx) => (
                        <div key={idx} onClick={() => onSelectArticle && onSelectArticle(art.id)} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem', gap: '1rem', cursor: 'pointer', background: 'var(--card-bg)', transition: 'transform 0.1s'}}>
                            <span style={{flex: 1, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: '1.4'}}>{art.title}</span>
                            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end'}}>
                                <strong style={{color: 'var(--accent)', fontSize: '1.1rem'}}>{art.views}</strong>
                                <span style={{fontSize: '0.75rem', color: 'var(--text-secondary)'}}>Views</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* TOP AUTORES (SHADOW IDENTITIES) */}
                <div style={{background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem'}}>
                    <h3 style={{fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem'}}>
                        🕵️‍♂️ Periodistas Más Buscados
                    </h3>
                    {data.topAuthors.map((auth, idx) => (
                        <div key={idx} onClick={() => onAuthorSelect && onAuthorSelect(auth.target_id)} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem', gap: '1rem', cursor: 'pointer'}}>
                            <span style={{fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)'}}>🎙️ {auth.target_id.replace('_', ' ').toUpperCase()}</span>
                            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end'}}>
                                <strong style={{color: '#8b5cf6', fontSize: '1.1rem'}}>{auth.count}</strong>
                                <span style={{fontSize: '0.75rem', color: 'var(--text-secondary)'}}>Clicks de Perfil</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* BANDEJA DE FEEDBACK */}
            <div style={{background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', marginBottom: '4rem'}}>
                <h3 style={{fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem'}}>
                    📬 Buzón de la Comunidad (Feedback Reciente)
                </h3>
                {data.feedback.length === 0 ? (
                    <p style={{color: 'var(--text-secondary)', fontStyle: 'italic'}}>Aún no hay mensajes recibidos.</p>
                ) : (
                    data.feedback.map(fb => (
                        <div key={fb.id} style={{padding: '1rem', border: '1px solid #eaeaea', borderRadius: '8px', marginBottom: '1rem', background: '#fafafa'}}>
                            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                                <strong style={{color: 'var(--text-main)'}}>{fb.user_name}</strong>
                                <span style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>{new Date(fb.created_at).toLocaleString('es-AR')}</span>
                            </div>
                            <span style={{display: 'inline-block', fontSize: '0.75rem', background: fb.context_id === 'general' ? '#e5e7eb' : '#dbeafe', color: fb.context_id === 'general' ? '#4b5563' : '#1d4ed8', padding: '0.2rem 0.5rem', borderRadius: '4px', marginBottom: '0.8rem', fontWeight: 700}}>
                                Contexto: {fb.context_id === 'general' ? 'FEED GENERAL' : `NOTA ID: ${fb.context_id}`}
                            </span>
                            <p style={{fontSize: '1rem', color: '#333', lineHeight: '1.5', margin: 0}}>{fb.message}</p>
                        </div>
                    ))
                )}
            </div>

            {/* MODAL GLOBAL DINÁMICO */}
            {activeModal && (
                <div style={{position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem'}}>
                    <div style={{background: 'var(--bg-color)', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px', padding: '3rem', position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', animation: 'slideUp 0.3s ease'}}>
                        <button onClick={() => setActiveModal(null)} style={{position: 'absolute', top: '15px', right: '15px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', width: '35px', height: '35px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>×</button>
                        
                        {activeModal === 'views' && data.viewsByDay && (
                            <div>
                                <h2 style={{fontFamily:'var(--font-display)', marginBottom: '1rem', color: 'var(--text-main)'}}>Visitas Globales: Serie Histórica</h2>
                                <div style={{display: 'flex', alignItems:'flex-end', gap: '8px', height: '250px', marginTop: '3rem'}}>
                                    {data.viewsByDay.slice().reverse().map(d => (
                                        <div key={d.day} style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%'}}>
                                            <span style={{fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600}}>{d.total_views}</span>
                                            <div style={{width: '100%', background: 'linear-gradient(to top, #60a5fa, #3b82f6)', height: `${(d.total_views / Math.max(...data.viewsByDay.map(x => x.total_views))) * 100}%`, borderRadius: '6px 6px 0 0', marginTop: 'auto'}}></div>
                                            <span style={{fontSize: '0.7rem', marginTop: '0.8rem', color: 'var(--text-main)'}}>{new Date(d.day+"T00:00:00").getDate()}/{new Date(d.day+"T00:00:00").getMonth()+1}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeModal === 'time' && (
                            <div>
                                <h2 style={{fontFamily:'var(--font-display)', marginBottom: '1rem', color: 'var(--text-main)'}}>Métrica de Tiempo de Lectura</h2>
                                <p style={{fontSize: '1.15rem', lineHeight: '1.7', color: 'var(--text-secondary)'}}>
                                    Esta métrica representa el <strong>tiempo total acumulado</strong> que todos los usuarios reales han pasado leyendo notas en "Fuerte al Medio".
                                    <br/><br/>
                                    A diferencia de las métricas tradicionales de Google Analytics, Fuerte al Medio utiliza una interceptación de <code>IntersectionObserver</code> en React. 
                                    El reloj solo avanza cuando el texto de la nota se encuentra visible en la pantalla activa, pausan el contador instantáneamente si el lector cambia de pestaña, minimiza la ventana o scrollea lejos del texto principal.
                                </p>
                            </div>
                        )}

                        {activeModal === 'votes' && data.topVoted && (
                            <div>
                                <h2 style={{fontFamily:'var(--font-display)', marginBottom: '2rem', color: 'var(--text-main)'}}>Auditoría Cívica (Top 10 Periodístico)</h2>
                                <div style={{background: '#f8fafc', border: '1px solid #e2e8f0', padding: '2rem', borderRadius: '12px', textAlign: 'center', marginBottom: '2rem'}}>
                                    <span style={{fontSize: '1rem', color: '#475569', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '1px'}}>Promedio Global de Aprobación</span>
                                    <div style={{fontSize: '4.5rem', fontWeight: 800, color: data.metrics.avgVotePerc > 20 ? '#16a34a' : data.metrics.avgVotePerc < -20 ? '#dc2626' : '#8b5cf6', fontFamily: 'var(--font-display)'}}>
                                        {data.metrics.avgVotePerc > 0 ? '+' : ''}{data.metrics.avgVotePerc}%
                                    </div>
                                </div>
                                <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                                {data.topVoted.map(art => (
                                    <div key={art.id} onClick={() => { setActiveModal(null); onSelectArticle && onSelectArticle(art.id); }} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer'}}>
                                        <div style={{flex: 1, paddingRight: '1rem'}}>
                                            <span style={{fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', display: 'block'}}>{art.title}</span>
                                            <span style={{fontSize: '0.75rem', color: 'var(--accent)'}}>{art.category || 'General'}</span>
                                        </div>
                                        <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                                            <div style={{width: '60px', background: '#e2e8f0', height: '10px', borderRadius: '5px', overflow: 'hidden'}}>
                                                <div style={{width: `${Math.abs(art.objScore)}%`, height: '100%', background: art.objScore > 0 ? '#16a34a' : art.objScore < 0 ? '#dc2626' : '#8b5cf6'}}></div>
                                            </div>
                                            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '60px'}}>
                                                <strong style={{fontSize: '1.05rem', color: 'var(--text-main)'}}>{art.objScore > 0 ? '+' : ''}{art.objScore}%</strong>
                                                <span style={{fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600}}>{art.userVotesCount} votos</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                </div>
                            </div>
                        )}

                        {activeModal === 'comments' && data.topCommented && (
                            <div>
                                <h2 style={{fontFamily:'var(--font-display)', marginBottom: '1.5rem', color: 'var(--text-main)'}}>Top Tracción Social en Redes</h2>
                                <p style={{color: 'var(--text-secondary)', marginBottom: '2rem'}}>Artículos con mayor impacto y reacciones provenientes directamente de foros y redes sociales extractadas mediante Inteligencia Artificial.</p>
                                <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                                {data.topCommented.map(art => (
                                    <div key={art.id} onClick={() => { setActiveModal(null); onSelectArticle && onSelectArticle(art.id); }} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem 1rem', background: '#f8fafc', border: '1px solid #bfdbfe', borderRadius: '8px', cursor: 'pointer'}}>
                                        <span style={{fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', flex: 1, paddingRight: '1rem'}}>{art.title}</span>
                                        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#dbeafe', padding: '0.5rem 1rem', borderRadius: '8px'}}>
                                            <strong style={{color: '#1d4ed8', fontSize: '1.3rem'}}>{art.commentCount}</strong>
                                            <span style={{fontSize: '0.7rem', color: '#2563eb', fontWeight: 700, textTransform: 'uppercase'}}>Citas</span>
                                        </div>
                                    </div>
                                ))}
                                </div>
                            </div>
                        )}

                        {activeModal === 'articles' && data.articlesByDay && (
                            <div>
                                <h2 style={{fontFamily:'var(--font-display)', marginBottom: '1rem', color: 'var(--text-main)'}}>Alcance Algorítmico Diario</h2>
                                <div style={{display: 'flex', alignItems:'flex-end', gap: '8px', height: '250px', marginTop: '3rem'}}>
                                    {data.articlesByDay.slice().reverse().map(d => (
                                        <div key={d.day} style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%'}}>
                                            <span style={{fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600}}>{d.count}</span>
                                            <div style={{width: '100%', background: 'linear-gradient(to top, #fca5a5, #dc2626)', height: `${(d.count / Math.max(...data.articlesByDay.map(x => x.count))) * 100}%`, borderRadius: '6px 6px 0 0', marginTop: 'auto'}}></div>
                                            <span style={{fontSize: '0.7rem', marginTop: '0.8rem', color: 'var(--text-main)'}}>{new Date(d.day+"T00:00:00").getDate()}/{new Date(d.day+"T00:00:00").getMonth()+1}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const KpiCard = ({ label, value, color, icon, onClick }) => (
    <div onClick={onClick} style={{background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', cursor: onClick ? 'pointer' : 'default'}}>
        <div style={{position: 'absolute', top: '-10px', right: '-10px', fontSize: '4rem', opacity: 0.1, transform: 'rotate(-10deg)'}}>{icon}</div>
        <span style={{fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem', zIndex: 1}}>{label}</span>
        <strong style={{fontSize: '2rem', fontFamily: 'var(--font-display)', color, zIndex: 1, lineHeight: 1}}>{value}</strong>
    </div>
);

export default Dashboard;
