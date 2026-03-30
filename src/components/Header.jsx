import React, { useState, useEffect } from 'react';

const Header = ({ activeCategory, setActiveCategory, onHome, isDarkMode, setIsDarkMode }) => {
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
      <div className="header-top-bar">
          <span className="header-meta-text">{displayDate}</span>
          <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
              <span className="header-meta-text">📍 Buenos Aires | ⛅ {weather.temp}{weather.condition}</span>
              <button 
                  onClick={() => setIsDarkMode(!isDarkMode)} 
                  title={isDarkMode ? "Activar Modo Diurno" : "Activar Modo Nocturno"}
                  style={{
                    background: 'var(--card-bg)', 
                    color: 'var(--text-main)',
                    border: '1px solid var(--border-color)', 
                    borderRadius: '20px', 
                    cursor: 'pointer', 
                    fontSize: '1.1rem', 
                    padding: '0.2rem 0.6rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}
              >
                  {isDarkMode ? '☀️' : '🌙'}
              </button>
          </div>
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
        
        <span 
          className={`nav-item ${activeCategory === 'NUESTRO EQUIPO' ? 'active' : ''}`}
          onClick={() => setActiveCategory('NUESTRO EQUIPO')}
          style={{
             marginLeft: '1rem',
             background: activeCategory === 'NUESTRO EQUIPO' ? 'var(--text-main)' : 'transparent',
             color: activeCategory === 'NUESTRO EQUIPO' ? 'var(--bg-color)' : 'var(--text-main)',
             border: '1.5px solid var(--text-main)',
             borderRadius: '20px',
             padding: '0.2rem 0.8rem',
             fontWeight: 800,
             fontSize: '0.85rem',
             display: 'flex',
             alignItems: 'center',
             gap: '0.4rem',
             transition: 'all 0.2s'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{marginBottom: '-1px'}}>
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
          NUESTRO EQUIPO
        </span>
      </nav>
    </header>
  );
};

export default Header;
