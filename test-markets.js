const yahooFinance = require('yahoo-finance2').default;
const axios = require('axios');

async function test() {
    try {
        console.log("Testing Yahoo Finance...");
        const sp500 = await yahooFinance.quote('^GSPC');
        console.log("S&P 500:", sp500.regularMarketPrice);
        
        console.log("Testing DolarAPI...");
        const dolarRes = await axios.get('https://dolarapi.com/v1/dolares');
        console.log("Dolar OK:", dolarRes.data.length, "tipos encontrados.");
    } catch (e) {
        console.error("DEBUG ERROR:", e);
    }
}
test();
