import React, { useState, useEffect } from 'react';

const Header = ({ activeCategory, setActiveCategory, onHome }) => {
  const [weather, setWeather] = useState({ temp: '--', condition: '' });

  useEffect(() => {
     // Obteniendo clima neutro de Buenos Aires
     fetch('https://api.open-meteo.com/v1/forecast?latitude=-34.6131&longitude=-58.3772&current=temperature_2m,weather_code')
     .then(r => r.json())
     .then(data => {
         if (data && data.current) {
             setWeather({ temp: Math.round(data.current.temperature_2m), condition: '°C' });
         }
     }).catch(e => console.log('Weather unavailable'));
  }, []);

  const rawDate = new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const displayDate = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);

  const categories = [
    'Política', 
    'Economía y Negocios', 
    'Internacional',
    'Espectáculos', 
    'Deportes', 
    'Mercados'
  ];

  return (
    <header className="site-header">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: '0.8rem', marginBottom: '1.5rem'}}>
          <span style={{fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600}}>{displayDate}</span>
          <span style={{fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600}}>📍 Buenos Aires | ⛅ {weather.temp}{weather.condition}</span>
      </div>

      <h1 className="brand-name" onClick={onHome} style={{cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        Fuerte al Medi
        <svg width="0.75em" height="0.75em" viewBox="0 0 100 100" style={{display: 'inline-block', verticalAlign: 'middle', marginLeft: '2px'}}>
            <defs>
                <linearGradient id="brandGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ea4335" />
                    <stop offset="50%" stopColor="#fbbc04" />
                    <stop offset="100%" stopColor="#34a853" />
                </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#e5e7eb" strokeWidth="15" />
            <circle cx="50" cy="50" r="40" fill="transparent" stroke="url(#brandGrad)" strokeWidth="15" strokeDasharray="251.2" strokeLinecap="round" transform="rotate(-90 50 50)" />
        </svg>
      </h1>
      <p className="tagline" onClick={onHome} style={{cursor: 'pointer'}}>NO HACEMOS PERIODISMO.</p>
      
      <nav className="nav-menu">
        <span 
          className={`nav-item ${activeCategory === null ? 'active' : ''}`}
          onClick={onHome}
        >
          Portada
        </span>
        {categories.map(cat => (
          <span 
            key={cat} 
            className={`nav-item ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </span>
        ))}
      </nav>
    </header>
  );
};

export default Header;
