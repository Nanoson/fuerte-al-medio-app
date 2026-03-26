const yf = require('yahoo-finance2');
async function test() {
    try {
        let y = yf.default ? yf.default : yf;
        if (typeof y === 'function') {
            y = new y();
        }
        let res = await y.quote('AAPL');
        console.log("SUCCESS AAPL:", res.regularMarketPrice);
    } catch(e) {
        console.log("ERR1:", e.message);
    }
}
test();
