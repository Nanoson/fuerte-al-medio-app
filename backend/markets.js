const yf = require('yahoo-finance2');
const axios = require('axios');

let yahooFinance = yf.default ? yf.default : yf;
if (typeof yahooFinance === 'function') {
    yahooFinance = new yahooFinance({ suppressNotices: ['yahooSurvey'] });
}

let cachedMarkets = null;
let lastFetchTime = 0;

const fetchMarkets = async () => {
    // Cache for 10 minutes (600,000 ms)
    if (cachedMarkets && (Date.now() - lastFetchTime < 600000)) {
        return cachedMarkets;
    }
    
    try {
        const symbols = [
            // Indices
            { id: '^GSPC', name: 'S&P 500', category: 'indices' },
            { id: '^IXIC', name: 'NASDAQ', category: 'indices' },
            { id: '^DJI', name: 'Dow Jones', category: 'indices' },
            { id: '^FTSE', name: 'FTSE 100', category: 'indices' },
            { id: '^N225', name: 'Nikkei 225', category: 'indices' },
            // Bonds & Rates
            { id: '^TNX', name: 'US 10-Yr Yield', category: 'bonds' },
            { id: '^TYX', name: 'US 30-Yr Yield', category: 'bonds' },
            { id: '^IRX', name: 'US 13-Wk Bill', category: 'bonds' },
            // Currencies
            { id: 'EURUSD=X', name: 'EUR / USD', category: 'currencies' },
            { id: 'GBPUSD=X', name: 'GBP / USD', category: 'currencies' },
            { id: 'JPY=X', name: 'USD / JPY', category: 'currencies' },
            // Commodities
            { id: 'GC=F', name: 'Oro', category: 'commodities' },
            { id: 'CL=F', name: 'Petróleo WTI', category: 'commodities' },
            { id: 'BZ=F', name: 'Petróleo Brent', category: 'commodities' },
            { id: 'BTC-USD', name: 'Bitcoin', category: 'commodities' },
            // Top Securities
            { id: 'AAPL', name: 'Apple Inc.', category: 'securities' },
            { id: 'MSFT', name: 'Microsoft', category: 'securities' },
            { id: 'NVDA', name: 'NVIDIA', category: 'securities' },
            { id: 'TSLA', name: 'Tesla', category: 'securities' },
            // LatAm & Arg ADRs
            { id: '^MERV', name: 'MERVAL', category: 'latam' },
            { id: 'YPF', name: 'YPF (ADR)', category: 'latam' },
            { id: 'GGAL', name: 'Grupo Galicia (ADR)', category: 'latam' },
            { id: 'PAM', name: 'Pampa Energía (ADR)', category: 'latam' },
            { id: 'EWZ', name: 'MSCI Brazil (ETF)', category: 'latam' }
        ];

        const quotes = await Promise.all(symbols.map(s => yahooFinance.quote(s.id).catch(e => null)));
        
        let globalMarkets = [];
        symbols.forEach((s, idx) => {
            if (quotes[idx]) {
                globalMarkets.push({
                    symbol: s.name,
                    category: s.category,
                    price: quotes[idx].regularMarketPrice,
                    change: quotes[idx].regularMarketChangePercent
                });
            }
        });

        let dolares = [];
        try {
            const dolarRes = await axios.get('https://dolarapi.com/v1/dolares');
            dolares = dolarRes.data;
        } catch(e) { console.error("💥 DolarAPI falló", e.message); }

        cachedMarkets = {
            global: globalMarkets,
            dolar: dolares.map(d => ({
                name: d.nombre,
                compra: d.compra,
                venta: d.venta,
                fecha: d.fechaActualizacion
            }))
        };
        lastFetchTime = Date.now();
        console.log(`📈 Bloomberg Terminal: ${globalMarkets.length} activos de Wall Street capturados y cacheados.`);
        return cachedMarkets;
    } catch(err) {
        console.error("Error obteniendo mercados globales:", err.message);
        return cachedMarkets || { global: [], dolar: [] };
    }
}

module.exports = { fetchMarkets };
