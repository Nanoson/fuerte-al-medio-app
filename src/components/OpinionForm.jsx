import React, { useState } from 'react';

const OpinionForm = ({ onPublished }) => {
    const [expanded, setExpanded] = useState(false);
    const [alias, setAlias] = useState('');
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if(!alias || !title || !body) return alert('Completa todos los campos');
        if(body.trim().length < 15) return alert('La nota debe tener al menos 15 caracteres para publicarse');
        if(body.length > 1200) return alert('El máximo es 1200 caracteres');
        
        setIsSubmitting(true);
        try {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const res = await fetch(`${API_BASE}/api/opinions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ alias, title, body })
            });
            if(res.ok) {
                setAlias(''); setTitle(''); setBody('');
                setExpanded(false);
                if(onPublished) onPublished();
            } else {
                const err = await res.json();
                alert(err.error || 'Error al publicar');
            }
        } catch(e) {
            console.error(e);
            alert('Falla de red');
        } finally {
            setIsSubmitting(false);
        }
    };

    if(!expanded) {
        return (
            <div className="opinion-form-collapsed" onClick={() => setExpanded(true)}>
                <h3>¡Publicá tu opinión!</h3>
                <p>Toca aquí para desplegar el formulario y expresarte libremente.</p>
            </div>
        )
    }

    return (
        <div className="opinion-form-expanded">
            <h3>Publicá tu opinión</h3>
            <button className="close-btn" onClick={() => setExpanded(false)}>✕</button>
            <form onSubmit={handleSubmit}>
                <input type="text" placeholder="Nombre / Alias *" value={alias} onChange={e=>setAlias(e.target.value)} maxLength={50} required />
                <input type="text" placeholder="Título de tu nota *" value={title} onChange={e=>setTitle(e.target.value)} maxLength={100} required />
                <div className="textarea-wrapper">
                    <textarea placeholder="Cuerpo de la nota (min 15 - max 1200 caracteres) *" value={body} onChange={e=>setBody(e.target.value)} minLength={15} maxLength={1200} required rows={7}></textarea>
                    <span className="char-count">{body.length}/1200</span>
                </div>
                <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Publicando...' : 'Publicar Nota'}</button>
            </form>
        </div>
    );
};

export default OpinionForm;
