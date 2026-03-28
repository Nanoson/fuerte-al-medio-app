const Parser = require('rss-parser');
const axios = require('axios');
const cheerio = require('cheerio');
const parser = new Parser();

// Expansión a 24 Portales de alto tráfico en Argentina solicitados para el MVP Launch
const rssSources = [
    // ARGENTINA (Nacional)
    { name: 'Infobae', url: 'https://www.infobae.com/feed/', bias: 'Centro-Derecha', type: 'General' },
    { name: 'Clarín', url: 'https://www.clarin.com/rss/lo-ultimo/', bias: 'Derecha/Oposición', type: 'General' },
    { name: 'La Nación', url: 'https://ox.lanacion.com.ar/rss/titulares/', bias: 'Centro-Derecha/Conservador', type: 'General' },
    { name: 'TN', url: 'https://tn.com.ar/rss/', bias: 'Derecha', type: 'General' },
    { name: 'C5N', url: 'https://www.c5n.com/rss/portada.xml', bias: 'Izquierda/Kirchnerismo', type: 'General' },
    { name: 'Página/12', url: 'https://www.pagina12.com.ar/rss/portada.xml', bias: 'Izquierda/Kirchnerismo', type: 'General' },
    { name: 'Perfil', url: 'https://www.perfil.com/rss', bias: 'Centro', type: 'General' },
    { name: 'El Destape', url: 'https://www.eldestapeweb.com/rss', bias: 'Kirchnerismo', type: 'General' },
    { name: 'La Política Online', url: 'https://www.lapoliticaonline.com/rss/', bias: 'Pragmático/Oficialista', type: 'Política' },
    { name: 'Ámbito Financiero', url: 'https://www.ambito.com/rss/home.xml', bias: 'Económico', type: 'Economía' },
    { name: 'El Cronista', url: 'https://www.cronista.com/rss', bias: 'Empresarial', type: 'Economía' },
    { name: 'iProfesional', url: 'https://www.iprofesional.com/rss', bias: 'Financiero/Económico', type: 'Economía' },
    { name: 'Ciudad Magazine', url: 'https://www.ciudad.com.ar/rss', bias: 'Espectáculos', type: 'Espectáculos' },
    { name: 'Teleshow', url: 'https://www.infobae.com/teleshow/feed/', bias: 'Espectáculos', type: 'Espectáculos' },
    { name: 'Primicias Ya', url: 'https://www.primiciasya.com/rss', bias: 'Espectáculos', type: 'Espectáculos' },

    // INTERNACIONALES (Estados Unidos, Europa, LatAm)
    { name: 'The New York Times', url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', bias: 'Centro-Izquierda', category: 'Internacional' },
    { name: 'BBC Mundo', url: 'http://feeds.bbci.co.uk/mundo/rss.xml', bias: 'Centro', category: 'Internacional' },
    { name: 'El País (Uruguay)', url: 'https://www.elpais.com.uy/rss', bias: 'Centro-Derecha', category: 'Internacional' },
    { name: 'El País (España)', url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada', bias: 'Centro-Izquierda', category: 'Internacional' },
    { name: 'La Tercera (Chile)', url: 'https://www.latercera.com/arc/outboundfeeds/rss/?outputType=xml', bias: 'Centro-Derecha', category: 'Internacional' },
    
    // WALL STREET & FINANZAS GLOBALES
    { name: 'Yahoo Finance USA', url: 'https://finance.yahoo.com/news/rssindex', bias: 'Financiero', category: 'Economía' },
    { name: 'Financial Times', url: 'https://www.ft.com/rss/home/us', bias: 'Financiero', category: 'Internacional' }
];

const htmlSources = [
    // BIG 3 FRONT-PAGE SCANNERS (Determina si la nota está físicamente en la Home Principal del diario)
    { name: 'Infobae (Portada)', url: 'https://www.infobae.com/', bias: 'Centro-Derecha', type: 'General' },
    { name: 'Clarín (Portada)', url: 'https://www.clarin.com/', bias: 'Derecha/Oposición', type: 'General' },
    { name: 'La Nación (Portada)', url: 'https://www.lanacion.com.ar/', bias: 'Centro-Derecha/Conservador', type: 'General' },

    { name: 'Bloomberg Línea', url: 'https://www.bloomberglinea.com/latinoamerica/argentina/', bias: 'Mercados Globales', type: 'Economía' },
    { name: 'Olé', url: 'https://www.ole.com.ar/', bias: 'Deportes', type: 'Deportes' },
    { name: 'TyC Sports', url: 'https://www.tycsports.com/', bias: 'Deportes', type: 'Deportes' },
    { name: 'ESPN', url: 'https://www.espn.com.ar/', bias: 'Deportes', type: 'Deportes' },
    { name: 'TNT Sports', url: 'https://tntsports.com.ar/', bias: 'Deportes', type: 'Deportes' },
    { name: 'Doble Amarilla', url: 'https://dobleamarilla.com.ar/', bias: 'Deportes/Política', type: 'Deportes' },
    { name: 'El Gráfico', url: 'https://www.elgrafico.com.ar/', bias: 'Deportes Clásico', type: 'Deportes' },
    { name: 'A24', url: 'https://www.a24.com/', bias: 'Centro', type: 'General' }
];

async function fetchAllNews() {
    let allArticles = [];

    // RSS Fetching (Concurrencia Masiva)
    const rssPromises = rssSources.map(async (feedObj) => {
        try {
            let feed = await parser.parseURL(feedObj.url);
            let count = 0;
            const now = Date.now();
            const MAX_AGE_MS = 48 * 60 * 60 * 1000; // Ventana estricta de 48 horas
            
            for (let item of feed.items) {
                if (count >= 40) break;
                
                // Verificación de recency (Garantizar que no entren notas "zombies" de años atrás)
                let isRecent = false; // Postura Estricta: Si no tiene fecha, no confiamos en él
                if (item.isoDate || item.pubDate) {
                    const pubTime = new Date(item.isoDate || item.pubDate).getTime();
                    if (!isNaN(pubTime) && now - pubTime <= MAX_AGE_MS) {
                        isRecent = true;
                    }
                }

                // Extracción Nativa de Medios RSS (Evita errores 403 al intentar hacer scraping del DOM)
                let nativeImageUrl = null;
                if (item.enclosure && item.enclosure.url) nativeImageUrl = item.enclosure.url;
                else if (item['media:content'] && item['media:content']['$'] && item['media:content']['$'].url) nativeImageUrl = item['media:content']['$'].url;
                else if (item.image && item.image.url) nativeImageUrl = item.image.url;

                if (isRecent) {
                    allArticles.push({ title: item.title, link: item.link, source: feedObj.source || feedObj, imageUrl: nativeImageUrl });
                    count++;
                }
            }
            console.log(`✅ ${feedObj.name} [RSS]: ${count} links recientes extraídos.`);
        } catch (e) {
            console.error(`❌ ${feedObj.name} [RSS] Retención Temporal: ${e.message}`);
        }
    });

    await Promise.all(rssPromises);

    // HTML Fallback Parsing (Extractor Semántico Universal)
    const htmlPromises = htmlSources.map(async (srcObj) => {
        try {
            const { data } = await axios.get(srcObj.url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const $ = cheerio.load(data);
            let count = 0;
            
            // Selector Universal para cazar h1, h2, h3 dentro de <article> o grid
            $('h1 a, h2 a, h3 a, h4 a, article a').slice(0, 30).each((i, el) => {
                const title = $(el).text().trim();
                let link = $(el).attr('href');
                // Ignorar enlaces sueltos, botones o títulos diminutos
                if (title.length > 30 && link) {
                    // Completar paths relativos
                    if (link.startsWith('/')) link = new URL(link, srcObj.url).href; 
                    allArticles.push({ title, link, source: srcObj });
                    count++;
                }
            });
            console.log(`✅ ${srcObj.name} [HTML Spider]: ${count} links extraídos.`);
        } catch (e) {
            console.error(`❌ ${srcObj.name} [HTML Spider] Falló parseo: ${e.message}`);
        }
    });

    await Promise.all(htmlPromises);
    return allArticles;
}

async function scrapeArticleBody(url) {
    try {
        const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const $ = cheerio.load(data);
        
        let imageUrl = $('meta[property="og:image"]').attr('content') || null;

        // FASE 38: DEEP-DOM CHRONOLOGICAL SCANNER (Anti-Zombies)
        let articleDateStr = $('meta[property="article:published_time"]').attr('content') || 
                             $('time').attr('datetime') ||
                             $('meta[name="pubdate"]').attr('content') || 
                             $('meta[itemprop="datePublished"]').attr('content');
                             
        if (articleDateStr) {
            const pubTime = new Date(articleDateStr).getTime();
            const now = Date.now();
            const MAX_AGE_MS = 60 * 60 * 1000 * 48; // 48 horas
            if (!isNaN(pubTime) && (now - pubTime > MAX_AGE_MS)) {
                return { text: "", imageUrl: null, isZombie: true };
            }
        }

        // Limpiamos la mugre del HTML (Menús, Banners, Paywalls, Redes, Menús Flotantes)
        $('script, style, nav, header, footer, aside, .ad, .social, iframe, button').remove();
        
        let text = [];
        // Filtramos solo párrafos con volumen semántico
        $('p').each((i, el) => {
            const t = $(el).text().trim();
            if (t.length > 50) text.push(t);
        });
        
        return { text: text.slice(0, 15).join(' '), imageUrl }; 
    } catch (error) {
        return { text: "", imageUrl: null };
    }
}

module.exports = { fetchAllNews, scrapeArticleBody };
