const axios = require('axios');
axios.get('http://localhost:3001/api/markets')
    .then(r => {
        console.log("MARKETS API SUCCESS. GLOBAL ITEMS:", r.data.global.length);
        console.log("MARKETS API SUCCESS. DOLAR ITEMS:", r.data.dolar.length);
    })
    .catch(e => console.error("API ERROR:", e.message));
