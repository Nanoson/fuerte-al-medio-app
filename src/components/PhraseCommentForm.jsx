import React, { useState } from 'react';
import '../styles/PhraseCommentForm.css';

export default function PhraseCommentForm({
  highlightId,
  highlightText = '',
  onCommentSubmitted,
  parentCommentId = null,
  isReply = false
}) {
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!text.trim()) {
      setError('El comentario no puede estar vacío');
      return;
    }

    if (text.length > 280) {
      setError('El comentario no puede exceder 280 caracteres');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/phrases/${highlightId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || 'Anónimo',
          text: text.trim(),
          parent_comment_id: parentCommentId || null
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al guardar el comentario');
      }

      const newComment = await response.json();
      setName('');
      setText('');

      if (onCommentSubmitted) {
        onCommentSubmitted(newComment);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className={`phrase-comment-form ${isReply ? 'form-reply' : 'form-main'}`} onSubmit={handleSubmit}>
      {!isReply && highlightText && (
        <div className="highlight-context">
          <strong>Sobre:</strong> <em>"{highlightText}"</em>
        </div>
      )}

      <div className="form-group">
        <input
          type="text"
          placeholder="Tu nombre (opcional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          className="form-input name-input"
        />
      </div>

      <div className="form-group">
        <textarea
          placeholder="Escribe tu comentario... (máx 280 caracteres)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={280}
          rows={isReply ? 2 : 3}
          className="form-textarea"
        />
        <div className="char-count">
          {text.length}/280
        </div>
      </div>

      {error && <div className="error-message">❌ {error}</div>}

      <div className="form-actions">
        <button type="submit" disabled={isLoading || !text.trim()} className="btn-submit">
          {isLoading ? 'Enviando...' : 'Enviar comentario'}
        </button>
      </div>
    </form>
  );
}
