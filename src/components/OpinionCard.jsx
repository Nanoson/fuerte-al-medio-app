import React, { useState } from 'react';

const OpinionCard = ({ article, API_BASE }) => {
    const [localVotesCount, setLocalVotesCount] = useState(article.userVotesCount || 0);
    const [localVotesSum, setLocalVotesSum] = useState(article.userVotesSum || 0);
    const [userVote, setUserVote] = useState(null);

    const handleVote = async (score) => {
        let isChange = false;
        let scoreDelta = score;

        if (userVote !== null) {
            if (userVote === score) return;
            isChange = true;
            scoreDelta = score - userVote;
        }

        const newSum = localVotesSum + scoreDelta;
        const newCount = isChange ? localVotesCount : localVotesCount + 1;
        setLocalVotesSum(newSum);
        setLocalVotesCount(newCount);
        setUserVote(score);

        fetch(`${API_BASE}/api/news/${article.id}/action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'vote', score: scoreDelta, isChange })
        }).catch(e => console.error("Vote action failed:", e));
    };

    const handleShare = () => {
        const urlToShare = `${window.location.origin}/?article=${article.id}`;
        if (navigator.share) {
            navigator.share({ title: article.title, url: urlToShare }).catch(console.error);
        } else {
            navigator.clipboard.writeText(urlToShare);
            alert("Link copiado al portapapeles");
        }
    };

    const displayDate = article.createdAt 
        ? new Date(article.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
        : article.date;

    return (
        <div className="opinion-card">
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
