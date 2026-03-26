import React, { useEffect, useState } from 'react';

const MarketsWidget = () => {
    const [markets, setMarkets] = useState(null);
    const [loading, setLoading] = useState(true);

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    useEffect(() => {
        fetch(`${API_BASE}/api/markets`)
            .then(r => r.json())
            .then(data => {
                setMarkets(data);
                setLoading(false);
            })
            .catch(e => {
                console.error("Error cargando mercados", e);
                setLoading(false);
            });
    }, []);

    const [activeTab, setActiveTab] = useState('indices');

    if (loading) return <div style={{textAlign: 'center', padding: '5rem', fontSize: '1.2rem', color: '#666', fontFamily: 'var(--font-display)'}}>Operando conexión con Wall Street y DolarAPI...</div>;
    if (!markets || (!markets.global.length && !markets.dolar.length)) return <div style={{textAlign: 'center', padding: '5rem'}}>Mercado cerrado o sin conexión.</div>;

    const getChangeColor = (val) => val > 0 ? '#16a34a' : val < 0 ? '#dc2626' : '#6b7280';
    const formatPrice = (val, isDolar = false) => {
        if (!val) return '---';
        if (isDolar) return '$' + val;
        return Number(val).toLocaleString('en-US', {maximumFractionDigits: 2});
    }

    const tabs = [
        { id: 'indices', label: 'Índices Bursátiles' },
        { id: 'commodities', label: 'Materias Primas' },
        { id: 'currencies', label: 'Divisas y FX' },
        { id: 'bonds', label: 'Tasas y Bonos' },
        { id: 'securities', label: 'Acciones Líderes' },
        { id: 'latam', label: 'Argentina y LatAm' }
    ];

    const renderAssetGrid = (categoryFilter) => {
        const assets = markets.global.filter(g => g.category === categoryFilter);
        return (
            <div style={{
                display: 'flex', overflowX: 'auto', gap: '1rem', alignItems: 'center',
                scrollbarWidth: 'none', msOverflowStyle: 'none', padding: '0.5rem 0',
                WebkitOverflowScrolling: 'touch'
            }}>
                {/* Estilo Bloomberg: Píldoras negras con texto blanco/verde/rojo */}
                {assets.map((g, i) => (
                    <div key={i} style={{
                        background: '#111', color: '#fff', borderRadius: '6px', 
                        padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', 
                        gap: '0.8rem', whiteSpace: 'nowrap', boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        flexShrink: 0
                    }}>
                        <span style={{fontWeight: 700, fontSize: '0.85rem', color: '#e5e7eb'}}>{g.symbol}</span>
                        <span style={{fontSize: '1rem', fontWeight: 800}}>{formatPrice(g.price)}</span>
                        <span style={{fontSize: '0.85rem', fontWeight: 800, color: g.change > 0 ? '#4ade80' : g.change < 0 ? '#f87171' : '#9ca3af'}}>
                            {g.change > 0 ? '▲ ' : g.change < 0 ? '▼ ' : ''}{Math.abs(g.change || 0).toFixed(2)}%
                        </span>
                    </div>
                ))}
                
                {/* DOLAR ARGENTINO (DOLARAPI) INYECTADO EN LATAM TAB COMO PILLS */}
                {categoryFilter === 'latam' && markets.dolar && markets.dolar.length > 0 && markets.dolar.filter(d => ['Blue', 'Oficial', 'MEP', 'CCL', 'Tarjeta'].includes(d.name)).map((d, i) => (
                    <div key={`d-${i}`} style={{
                        background: '#064e3b', color: '#fff', borderRadius: '6px', 
                        padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', 
                        gap: '0.6rem', whiteSpace: 'nowrap', boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        flexShrink: 0
                    }}>
                        <span style={{fontWeight: 700, fontSize: '0.85rem', color: '#a7f3d0'}}>Dólar {d.name}</span>
                        <span style={{fontSize: '0.9rem', color: '#d1fae5'}}>C: <span style={{fontWeight: 800}}>{formatPrice(d.compra, true)}</span></span>
                        <span style={{fontSize: '0.9rem', color: '#34d399'}}>V: <span style={{fontWeight: 800}}>{formatPrice(d.venta, true)}</span></span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div style={{animation: 'fadeIn 0.4s ease', padding: '0.5rem 0', borderBottom: '2px solid #eaeaea', marginBottom: '2rem'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                <div style={{position: 'relative', flexShrink: 0}}>
                    <select 
                        value={activeTab} 
                        onChange={e => setActiveTab(e.target.value)}
                        style={{
                            appearance: 'none', WebkitAppearance: 'none', background: 'transparent', border: 'none',
                            fontSize: '1rem', fontWeight: 800, fontFamily: 'var(--font-display)',
                            cursor: 'pointer', paddingRight: '1.2rem', color: '#111', outline: 'none'
                        }}
                    >
                        {tabs.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                    <span style={{position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '0.7rem', color: '#111'}}>▼</span>
                </div>
                
                {/* Separador Vertical */}
                <div style={{width: '2px', height: '24px', background: '#e5e7eb', flexShrink: 0}}></div>
                
                {/* Ticker Flex Container */}
                <div className="markets-carousel" style={{flex: 1, overflow: 'hidden'}}>
                    {renderAssetGrid(activeTab)}
                </div>
            </div>
        </div>
    )
}

export default MarketsWidget;
