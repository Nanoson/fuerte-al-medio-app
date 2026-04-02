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

    return (
        <div className="opinion-card">
            <h4>{article.title}</h4>
            <span className="opinion-alias">Por: {article.copete || "Anónimo"}</span>
            <p className="opinion-body">"{article.summary}"</p>
            
            <div className="opinion-footer">
                <div className="civic-rating compact">
                    <button className={userVote === 100 ? 'active' : ''} onClick={(e) => { e.stopPropagation(); handleVote(100); }}>👍</button>
                    <button className={userVote === 50 ? 'active' : ''} onClick={(e) => { e.stopPropagation(); handleVote(50); }}>😐</button>
                    <button className={userVote === 0 ? 'active' : ''} onClick={(e) => { e.stopPropagation(); handleVote(0); }}>👎</button>
                </div>
                <button className="opinion-share-btn" onClick={handleShare}>Compartir</button>
            </div>
        </div>
    );
};

export default OpinionCard;
