const fs = require('fs');
const path = require('path');

function test() {
    try {
        console.log("Starting local quote fallback simulation...");
        
        // 1. 讀取 index.json
        const indexPath = path.resolve(__dirname, '../../index.json');
        console.log("Reading index.json from:", indexPath);
        if (!fs.existsSync(indexPath)) {
            console.error("index.json does not exist at path!");
            return;
        }
        const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
        const latestDate = indexData.latest_daily_tw_market_margin || indexData.latest_liar_update || '2026-05-19';
        console.log("latestDate derived:", latestDate);
        
        // 2. 讀取 daily JSON
        const dailyPath = path.resolve(__dirname, `../../daily/tw/${latestDate}.json`);
        console.log("Reading daily JSON from:", dailyPath);
        if (!fs.existsSync(dailyPath)) {
            console.error(`daily JSON does not exist at path: ${dailyPath}`);
            return;
        }
        const dailyData = JSON.parse(fs.readFileSync(dailyPath, 'utf8'));
        console.log("dailyData stocks count:", dailyData?.stocks?.length);
        
        // 3. 讀取 meta
        const metaPath = path.resolve(__dirname, '../../meta/stocks.json');
        console.log("Reading stocks meta from:", metaPath);
        let stocksMeta = {};
        if (fs.existsSync(metaPath)) {
            stocksMeta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
            console.log("stocksMeta loaded, keys count:", Object.keys(stocksMeta).length);
        } else {
            console.warn("stocks.json does not exist");
        }
        
        // 4. 模擬映射
        const symbols = ['0050', '00949', '00951'];
        const symbolSet = new Set(symbols.map(s => s.split('.')[0]));
        console.log("Target symbolSet:", symbolSet);
        
        const quotes = {};
        if (dailyData && Array.isArray(dailyData.stocks)) {
            dailyData.stocks.forEach(s => {
                if (symbolSet.has(s.id)) {
                    const c = s.c || 0;
                    const pct = s.pct || 0;
                    const refPrice = pct !== -100 ? (c / (1 + (pct / 100))) : c;
                    quotes[s.id] = {
                        price: c,
                        referencePrice: refPrice,
                        change: c - refPrice,
                        changePercent: pct,
                        name: stocksMeta[s.id] || s.id
                    };
                    console.log(`Matched stock ${s.id}:`, quotes[s.id]);
                }
            });
        }
        
        console.log("Final matched quotes:", quotes);
    } catch (err) {
        console.error("Error during simulation:", err);
    }
}

test();
