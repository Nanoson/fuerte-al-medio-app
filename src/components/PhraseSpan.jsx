import React, { useState } from 'react';
import '../styles/PhraseSpan.css';

export default function PhraseSpan({
  highlightId,
  text,
  thumbsUp = 0,
  thumbsDown = 0,
  hasUserVoted = null,
  onVote,
  onCommentClick,
  onScroll
}) {
  const [isHovering, setIsHovering] = useState(false);

  const handleVote = (type) => {
    if (onVote) {
      onVote(type);
    }
  };

  const handleCommentClick = () => {
    if (onCommentClick) {
      onCommentClick();
    }
  };

  return (
    <span
      className={`phrase-span ${hasUserVoted ? `voted-${hasUserVoted}` : ''}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {text}

      {isHovering && (
        <div className="phrase-tooltip">
          <div className="phrase-reactions">
            <button
              className={`reaction-btn thumbsup ${hasUserVoted === 'thumbsup' ? 'active' : ''}`}
              onClick={() => handleVote('thumbsup')}
              title="Me gusta"
            >
              👍 {thumbsUp > 0 ? thumbsUp : ''}
            </button>
            <button
              className={`reaction-btn thumbsdown ${hasUserVoted === 'thumbsdown' ? 'active' : ''}`}
              onClick={() => handleVote('thumbsdown')}
              title="No me gusta"
            >
              👎 {thumbsDown > 0 ? thumbsDown : ''}
            </button>
            {(thumbsUp > 0 || thumbsDown > 0) && (
              <button
                className="reaction-btn comment-btn"
                onClick={handleCommentClick}
                title="Ver comentarios"
              >
                💬 {thumbsUp + thumbsDown > 0 ? 'Ver más' : 'Comentar'}
              </button>
            )}
          </div>
        </div>
      )}
    </span>
  );
}
