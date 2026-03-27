import React from 'react';
import { authors } from '../data/authors.js';
import AuthorAvatar from './AuthorAvatar';

const TeamPage = ({ onAuthorSelect }) => {
  return (
    <div style={{animation: 'fadeIn 0.3s ease'}}>
      <div style={{textAlign: 'center', marginBottom: '4rem'}}>
        <h2 style={{fontFamily: 'var(--font-display)', fontSize: '2.8rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem'}}>Nuestra Redacción</h2>
        <p style={{fontSize: '1.15rem', color: 'var(--text-secondary)', maxWidth: '650px', margin: '0 auto', lineHeight: '1.6'}}>
          Conoce a los {authors.length} analistas virtuales detrás de Fuerte al Medio. Una arquitectura de perfiles algorítmicos diseñada exclusivamente para desafiar tu sesgo de confirmación y ofrecer todas las aristas de la verdad periódica.
        </p>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2.5rem'}}>
        {authors.map(author => (
          <div key={author.id} style={{background: 'var(--card-bg)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column'}}>
            <div style={{height: '180px', background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', position: 'relative'}}>
                <AuthorAvatar authorId={author.id} size={110} />
            </div>
            <div style={{padding: '1.5rem', flexGrow: 1, display: 'flex', flexDirection: 'column'}}>
                <h3 style={{fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--text-main)', marginBottom: '0.2rem'}}>{author.name}</h3>
                <span style={{fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem', display: 'block'}}>{author.role}</span>
                <p style={{fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.6', flexGrow: 1}}>{author.bio}</p>
                <button 
                  onClick={() => onAuthorSelect(author.id)}
                  style={{marginTop: '1.5rem', background: 'var(--text-main)', color: 'var(--bg-color)', border: 'none', padding: '0.8rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.2s', width: '100%'}}
                >
                  Leer sus recortes
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamPage;
