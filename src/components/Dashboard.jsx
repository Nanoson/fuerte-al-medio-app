import React, { useState, useEffect } from 'react';

const Dashboard = ({ onBack }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

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

            {/* KPI CARDS */}
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem'}}>
                <KpiCard label="Visitas Globales" value={data.metrics.views.toLocaleString()} color="#3b82f6" icon="👁️" />
                <KpiCard label="Tiempo Global de Lectura" value={formatTime(data.metrics.readTime)} color="#10b981" icon="⏳" />
                <KpiCard label="Votos Cívicos Emitidos" value={data.metrics.votes.toLocaleString()} color="#8b5cf6" icon="⚖️" />
                <KpiCard label="Comentarios Totales" value={data.metrics.comments.toLocaleString()} color="#f59e0b" icon="💬" />
                <KpiCard label="Alcance Algorítmico" value={`${data.metrics.articles} Notas`} color="#dc2626" icon="🗞️" />
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem'}}>
                {/* TOP ARTÍCULOS */}
                <div style={{background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem'}}>
                    <h3 style={{fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem'}}>
                        🔥 Artículos Más Consumidos
                    </h3>
                    {data.topArticles.map((art, idx) => (
                        <div key={idx} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem', gap: '1rem'}}>
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
                        <div key={idx} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem', gap: '1rem'}}>
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
        </div>
    );
};

const KpiCard = ({ label, value, color, icon }) => (
    <div style={{background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden'}}>
        <div style={{position: 'absolute', top: '-10px', right: '-10px', fontSize: '4rem', opacity: 0.1, transform: 'rotate(-10deg)'}}>{icon}</div>
        <span style={{fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem', zIndex: 1}}>{label}</span>
        <strong style={{fontSize: '2rem', fontFamily: 'var(--font-display)', color, zIndex: 1, lineHeight: 1}}>{value}</strong>
    </div>
);

export default Dashboard;
