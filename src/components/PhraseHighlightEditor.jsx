import React, { useState } from 'react';
import '../styles/PhraseHighlightEditor.css';

export default function PhraseHighlightEditor({
  articleId,
  summary = '',
  existingHighlights = [],
  onPhrasesUpdated,
  readOnly = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [selectedRange, setSelectedRange] = useState(null);
  const [authorNote, setAuthorNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Detectar texto seleccionado
  const handleTextSelection = () => {
    if (readOnly) return;

    const selection = window.getSelection();
    const text = selection.toString().trim();

    if (text.length > 0) {
      // Obtener el índice del texto dentro del summary
      const range = selection.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(document.querySelector('.article-summary') || document.body);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      const start = preCaretRange.toString().length - text.length;
      const end = start + text.length;

      setSelectedText(text);
      setSelectedRange({ start, end });
      setIsOpen(true);
    }
  };

  const handleSaveHighlight = async () => {
    if (!selectedRange || !selectedText) {
      setError('No text selected');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/phrases/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article_id: articleId,
          phrase_text: selectedText,
          start_index: selectedRange.start,
          end_index: selectedRange.end,
          author_note: authorNote || null
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error saving highlight');
      }

      // Reset form
      setSelectedText('');
      setSelectedRange(null);
      setAuthorNote('');
      setIsOpen(false);

      if (onPhrasesUpdated) {
        onPhrasesUpdated();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteHighlight = async (highlightId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este highlighting?')) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/phrases/${highlightId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error deleting highlight');
      }

      if (onPhrasesUpdated) {
        onPhrasesUpdated();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    setSelectedText('');
    setSelectedRange(null);
    setAuthorNote('');
    setError('');
  };

  if (readOnly && existingHighlights.length === 0) {
    return null;
  }

  return (
    <div className="phrase-highlight-editor">
      {!readOnly && (
        <div className="editor-header">
          <button
            className="editor-toggle-btn"
            onClick={() => setIsOpen(!isOpen)}
            title="Marcar frases para comentarios"
          >
            ✏️ {isOpen ? 'Cerrar' : 'Marcar frases'}
          </button>
          <p className="editor-hint">
            {isOpen ? 'Selecciona texto en el artículo para marcar una frase' : 'Haz clic para marcar frases clave'}
          </p>
        </div>
      )}

      {isOpen && !readOnly && (
        <div className="editor-panel">
          <div className="selected-preview">
            <strong>Texto seleccionado:</strong>
            <p>{selectedText || '(Ninguno)'}</p>
          </div>

          <div className="author-note-input">
            <label>Nota del autor (opcional):</label>
            <input
              type="text"
              placeholder="Ej: Dato importante, reflexión clave..."
              value={authorNote}
              onChange={(e) => setAuthorNote(e.target.value)}
              maxLength={200}
            />
            <small>{authorNote.length}/200</small>
          </div>

          {error && <div className="error-message">❌ {error}</div>}

          <div className="editor-actions">
            <button
              className="btn-save"
              onClick={handleSaveHighlight}
              disabled={!selectedText || isLoading || existingHighlights.length >= 2}
            >
              {isLoading ? 'Guardando...' : 'Guardar highlighting'}
            </button>
            <button className="btn-cancel" onClick={handleCancel}>
              Cancelar
            </button>
          </div>

          {existingHighlights.length >= 2 && (
            <p className="limit-warning">⚠️ Máximo 2 frases por artículo</p>
          )}
        </div>
      )}

      {existingHighlights.length > 0 && (
        <div className="highlights-list">
          <h4>Frases marcadas ({existingHighlights.length}/2):</h4>
          <ul>
            {existingHighlights.map((h) => (
              <li key={h.id} className="highlight-item">
                <div className="highlight-text">
                  <strong>"{h.phrase_text}"</strong>
                  {h.author_note && <p className="author-note">{h.author_note}</p>}
                </div>
                {!readOnly && (
                  <button
                    className="btn-delete"
                    onClick={() => handleDeleteHighlight(h.id)}
                    disabled={isLoading}
                  >
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Contenedor invisible que captura selecciones */}
      <div onMouseUp={handleTextSelection} style={{ display: 'none' }} />
    </div>
  );
}
