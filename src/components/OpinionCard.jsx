import React, { useState, useEffect } from 'react';

const OpinionCard = ({ article, API_BASE, onSelect }) => {
    const [userVote, setUserVote] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(`opinion_vote_${article.id}`);
            return saved ? Number(saved) : null;
        }
        return null;
    });

    const [localVotesCount, setLocalVotesCount] = useState(article.userVotesCount || 0);
    const [localVotesSum, setLocalVotesSum] = useState(article.userVotesSum || 0);

    const handleVote = async (score) => {
        let scoreDelta = 0;
        let countDelta = 0;
        let newVoteState = null;

        if (userVote === score) {
            // UNVOTE
            scoreDelta = -score;
            countDelta = -1;
            newVoteState = null;
        } else if (userVote !== null) {
            // CHANGE VOTE
            scoreDelta = score - userVote;
            countDelta = 0;
            newVoteState = score;
        } else {
            // NEW VOTE
            scoreDelta = score;
            countDelta = 1;
            newVoteState = score;
        }

        const newSum = localVotesSum + scoreDelta;
        const newCount = localVotesCount + countDelta;
        
        setLocalVotesSum(newSum);
        setLocalVotesCount(Math.max(0, newCount));
        setUserVote(newVoteState);
        
        if (typeof window !== 'undefined') {
            if (newVoteState === null) {
                localStorage.removeItem(`opinion_vote_${article.id}`);
            } else {
                localStorage.setItem(`opinion_vote_${article.id}`, newVoteState);
            }
        }

        fetch(`${API_BASE}/api/news/${article.id}/action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'vote', score: scoreDelta, deltaCount: countDelta })
        }).catch(e => console.error("Vote action failed:", e));
    };

    const handleShare = (e) => {
        e.stopPropagation();
        const urlToShare = `${window.location.origin}/?article=${article.id}`;
        if (navigator.share) {
            navigator.share({ title: article.title, url: urlToShare }).catch(console.error);
        } else {
            navigator.clipboard.writeText(urlToShare);
            alert("Link copiado al portapapeles");
        }
    };

    const handleCardClick = () => {
        if (onSelect) onSelect(article);
    };

    const displayDate = article.createdAt 
        ? new Date(article.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
        : article.date;

    return (
        <div className="opinion-card" onClick={handleCardClick} style={{ cursor: onSelect ? 'pointer' : 'default' }}>
            <h4>{article.title}</h4>
            <span className="opinion-alias">Por: {article.copete || "Anónimo"} &bull; {displayDate}</span>
            <p className="opinion-body">"{article.summary}"</p>
            
            <div className="opinion-footer">
                <div className="opinion-voting">
                    <button className={`vote-btn up ${userVote === 100 ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); handleVote(100); }}>
                        👍 <span>{Math.floor(localVotesSum / 100)}</span>
                    </button>
                    <button className={`vote-btn down ${userVote === 0 ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); handleVote(0); }}>
                        👎 <span>{localVotesCount - Math.floor(localVotesSum / 100)}</span>
                    </button>
                </div>
                <button className="opinion-share-btn icon-only" onClick={handleShare} aria-label="Compartir">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="18" cy="5" r="3"></circle>
                        <circle cx="6" cy="12" r="3"></circle>
                        <circle cx="18" cy="19" r="3"></circle>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default OpinionCard;
