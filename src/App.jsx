import React, { useState, useEffect, useMemo } from 'react'
import Header from './components/Header'
import NewsCard from './components/NewsCard'
import MarketsWidget from './components/MarketsWidget'

// ==========================================
// MÓDULOS DE PROCESAMIENTO ESTÁTICO GLOBAL
// (Izar fuera del componente evita ReferenceErrors y recreaciones de memoria)
// ==========================================

const calculateOverlap = (textA, textB) => {
    if (!textA || !textB) return 0;
    const stops = new Set(['el','la','los','las','un','una','y','o','en','de','a','ante','con','para','por','como','que','del','al','se','su','lo','es','unos','unas','más','muy','sin','sobre','tras']);
    const wordsA = textA.toLowerCase().replace(/[^\wáéíóúüñ]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !stops.has(w));
    const wordsB = textB.toLowerCase().replace(/[^\wáéíóúüñ]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !stops.has(w));
    if (wordsA.length === 0 || wordsB.length === 0) return 0;
    let matches = 0;
    for (const w of wordsA) { if (wordsB.includes(w)) matches++; }
    return matches / Math.min(wordsA.length, wordsB.length);
}

const filterDuplicates = (newsArray) => {
    let unique = [];
    for (let article of newsArray) {
        let isDuplicate = false;
        for (let existing of unique) {
            const titleSimilarity = calculateOverlap(article.title, existing.title);
            const summarySimilarity = calculateOverlap(article.summary.substring(0, 120), existing.summary.substring(0, 120));
            if (titleSimilarity >= 0.45 || summarySimilarity >= 0.45) { 
                isDuplicate = true; break;
            }
        }
        if (!isDuplicate) unique.push(article);
    }
    return unique;
}

const stabilizeImages = (newsArray) => {
  let result = [];
  for (let current of newsArray) {
      let cloned = { ...current };
      if (result.length > 0 && cloned.imageUrl && result[result.length - 1].imageUrl === cloned.imageUrl) {
          cloned.imageUrl = null;
      }
      result.push(cloned);
  }
  return result;
};

function App() {
  const [activeCategory, setActiveCategory] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [news, setNews] = useState([])
  const [selectedArticle, setSelectedArticle] = useState(null)

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const fetchNews = () => {
    fetch(`${API_BASE}/api/news`)
      .then(r => r.json())
      .then(data => {
        if(data && data.length > 0) {
            setNews(data);
            if (selectedArticle) {
                const freshArticle = data.find(a => String(a.id) === String(selectedArticle.id));
                if (freshArticle) setSelectedArticle(freshArticle);
            }
        }
      })
      .catch(e => console.log("Backend API desconectado.", e));
  };

  useEffect(() => {
    fetchNews();
  }, [])

  useEffect(() => {
    if (selectedArticle) {
       window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [selectedArticle]);

  // NATIVE HTML5 BROWSER HISTORY: Sincronizar Flechas Atrás/Adelante
  useEffect(() => {
    const handlePopState = (event) => {
       const state = event.state;
       if (state) {
           setActiveCategory(state.activeCategory || null);
           setSelectedArticle(state.selectedArticle || null);
       } else {
           setActiveCategory(null);
           setSelectedArticle(null);
       }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Controladores de Estado Enlazados al Historial
  const handleCategorySelect = (cat) => {
    setActiveCategory(cat);
    setSelectedArticle(null);
    window.history.pushState({ activeCategory: cat, selectedArticle: null }, '', `/?cat=${encodeURIComponent(cat)}`);
  }

  const handleSelectArticle = (art) => {
    setSelectedArticle(art);
    window.history.pushState({ activeCategory, selectedArticle: art }, '', `/?article=${art.id}`);
  }

  const handleSearch = (q) => {
    setSearchQuery(q);
    if(q !== '') {
        setSelectedArticle(null);
        window.history.replaceState({ activeCategory, selectedArticle: null }, '', `/?search=${encodeURIComponent(q)}`);
    }
  }

  const handleHomeClick = () => {
    setActiveCategory(null);
    setSelectedArticle(null);
    setSearchQuery('');
    window.history.pushState({ activeCategory: null, selectedArticle: null }, '', '/');
  }

  const searchResults = useMemo(() => {
    if (!searchQuery) return news;
    const term = searchQuery.toLowerCase();
    return news.filter(article => article.title.toLowerCase().includes(term) || article.summary.toLowerCase().includes(term));
  }, [news, searchQuery]);

  const filteredByCategory = useMemo(() => {
    return activeCategory 
      ? searchResults.filter(a => a.category === activeCategory || (activeCategory === 'Economía y Negocios' && a.category === 'Economía'))
      : searchResults;
  }, [searchResults, activeCategory]);

  // Mega-bloque de Procesamiento Costoso: Memoizado para no bloquear la UI al abrir una nota
  const { destacadasNews, otrasNews, sortedNews } = useMemo(() => {
      // 1. Lógica de Clasificación Jerárquica: Prioridad Absoluta al Día Actual, luego Nivel de Cobertura
      const rawSortedNews = [...filteredByCategory].sort((a, b) => {
        const timeA = new Date((a.updatedAt || '').replace(' ', 'T') + 'Z').getTime() || Date.now();
        const timeB = new Date((b.updatedAt || '').replace(' ', 'T') + 'Z').getTime() || Date.now();
        const dayA = Math.floor(timeA / (1000 * 60 * 60 * 24));
        const dayB = Math.floor(timeB / (1000 * 60 * 60 * 24));
        if (dayA !== dayB) return dayB - dayA; 
        return (Number(b.importanceScore) || 1) - (Number(a.importanceScore) || 1);
      });

      const uniqueSortedNews = filterDuplicates(rawSortedNews);

      const todayDateStr = new Date().toLocaleDateString('es-AR');
      const rawDestacadasNews = activeCategory ? [] : uniqueSortedNews.filter(a => a.date === todayDateStr && (Number(a.importanceScore) || 1) >= 2).slice(0, 20);
      const outDestacadas = stabilizeImages(rawDestacadasNews);
      
      const rawOtrasNews = activeCategory ? [] : uniqueSortedNews.filter(a => activeCategory ? false : !rawDestacadasNews.includes(a));
      const outOtras = stabilizeImages(rawOtrasNews);

      return { destacadasNews: outDestacadas, otrasNews: outOtras, sortedNews: uniqueSortedNews };
  }, [filteredByCategory, activeCategory]);

  const renderFeed = () => {
    const isForeign = (cat) => ['Internacional', 'Deportes', 'Espectáculos', 'Mercados'].includes(cat);

    // Separación geográfica previa a la partición asimétrica
    const locals = sortedNews.filter(a => !isForeign(a.category));
    const foreigners = sortedNews.filter(a => isForeign(a.category));

    // Balanceo Independiente: Extraer aprox 7-8 de cada lado para emparejar la altura vertical del divisor final.
    const localTop = locals.slice(0, 8);
    const foreignTop = foreigners.slice(0, 8);

    const localRest = locals.slice(8);
    const foreignRest = foreigners.slice(8);

    if (activeCategory) {
       return (
         <>
           <h2 className="feed-header">Sección: {activeCategory}</h2>
           <div className="news-grid" style={{marginBottom: '4rem'}}>
             {stabilizeImages(sortedNews).map((article, idx) => (
               <NewsCard key={article.id} article={article} onSelect={handleSelectArticle} isHero={idx === 0} onCategorySelect={handleCategorySelect} onUpdate={fetchNews} />
             ))}
           </div>
         </>
       );
    }

    if (searchQuery) {
       return (
         <>
           <h2 className="feed-header">Resultados de búsqueda</h2>
           <div className="news-grid" style={{marginBottom: '4rem'}}>
             {stabilizeImages(sortedNews).map((article, idx) => (
               <NewsCard key={article.id} article={article} onSelect={handleSelectArticle} isHero={idx === 0} onCategorySelect={handleCategorySelect} onUpdate={fetchNews} />
             ))}
           </div>
         </>
       );
    }

    return (
      <>
        <h2 className="feed-header">Noticias Destacadas</h2>
        <div className="dual-layout" style={{marginBottom: '4rem'}}>
            <div className="feed-column main-column">
                {stabilizeImages(localTop).map((article, idx) => (
                   <NewsCard key={article.id} article={article} onSelect={handleSelectArticle} isHero={idx === 0} onCategorySelect={handleCategorySelect} onUpdate={fetchNews} />
                ))}
            </div>
            
            <div className="feed-column side-column">
                {stabilizeImages(foreignTop).map((article, idx) => (
                   <NewsCard key={article.id} article={article} onSelect={handleSelectArticle} isHero={false} onCategorySelect={handleCategorySelect} onUpdate={fetchNews} />
                ))}
            </div>
        </div>

        {theRest.length > 0 && (
            <>
               <h2 className="feed-header">Otras Noticias</h2>
               <div className="dual-layout" style={{marginBottom: '4rem'}}>
                   <div className="feed-column main-column">
                       {stabilizeImages(localRest).map(article => (
                          <NewsCard key={article.id} article={article} onSelect={handleSelectArticle} isHero={false} onCategorySelect={handleCategorySelect} onUpdate={fetchNews} />
                       ))}
                   </div>
                   
                   <div className="feed-column side-column">
                       {stabilizeImages(foreignRest).map(article => (
                          <NewsCard key={article.id} article={article} onSelect={handleSelectArticle} isHero={false} onCategorySelect={handleCategorySelect} onUpdate={fetchNews} />
                       ))}
                   </div>
               </div>
            </>
        )}
      </>
    );
  };

  const renderSingleArticle = () => {
    const otherNews = news.filter(a => String(a.id) !== String(selectedArticle.id)).slice(0, 6);
    
    return (
      <div className="single-view-container" style={{animation: "fadeIn 0.3s ease"}}>
         <button onClick={handleHomeClick} style={{background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: 'bold', marginBottom: '2rem', fontSize: '1.05rem', padding: 0}}>
           ← Volver al Menú Principal
         </button>
         
         <NewsCard article={selectedArticle} isFullView={true} onCategorySelect={handleCategorySelect} onUpdate={fetchNews} />
         
         {/* Botón Inferior para volver cómodo al menú */}
         <div style={{marginTop: '3.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'center'}}>
           <button onClick={handleHomeClick} style={{background: 'var(--text-main)', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', padding: '1rem 2rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}}>
             ← Volver a Noticias
           </button>
         </div>

         <div style={{marginTop: "5rem", paddingTop: "2.5rem", borderTop: "4px solid var(--text-main)"}}>
          <h3 className="feed-header" style={{fontSize: "1.6rem", borderBottom: 'none', marginBottom: '1rem'}}>Mantente Informado</h3>
          <div className="news-grid">
            {otherNews.map(article => (
              <NewsCard key={article.id} article={article} onSelect={handleSelectArticle} onCategorySelect={handleCategorySelect} onUpdate={fetchNews} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      <Header 
        activeCategory={activeCategory} 
        setActiveCategory={handleCategorySelect}
        onHome={handleHomeClick}
      />
      
      {!selectedArticle && (
        <div className="search-container">
          <input 
            type="text" 
            className="search-input" 
            placeholder="🔍 Buscar en Fuerte al Medio..." 
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      )}
      
      <main className="content">
        {selectedArticle ? renderSingleArticle() : (
            <>
                {activeCategory === 'Mercados' && <MarketsWidget />}
                {(!activeCategory || activeCategory !== 'Mercados' || filteredByCategory.length > 0) ? renderFeed() : null}
            </>
        )}
      </main>
    </div>
  )
}

export default App
