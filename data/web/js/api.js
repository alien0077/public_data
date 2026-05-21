/**
 * API Module for TWStockTracker Web
 */

const API_BASE = 'https://alienstocks.alien0077.workers.dev/api';

export const api = {
    getSecret() {
        return localStorage.getItem('twstock_secret');
    },

    _stocksMetaCache: null,

    async getStocksMeta() {
        if (!this._stocksMetaCache) {
            try {
                this._stocksMetaCache = await this.fetchLocalJson('meta/stocks.json');
            } catch(e) {
                console.warn("Failed to load stocks meta", e);
                this._stocksMetaCache = { stocks: [] };
            }
        }
        return this._stocksMetaCache;
    },

    async formatSymbol(s) {
        if (!/^\d+$/.test(s)) return s;
        const meta = await this.getStocksMeta();
        const stockInfo = meta.stocks?.find(item => item.symbol === s);
        if (stockInfo) {
            const market = (stockInfo.market || '').toUpperCase();
            return (market === 'TPEX' || market === 'TWO' || market === 'OTC') ? `${s}.TWO` : `${s}.TW`;
        }
        // Fallback length check
        return s.length === 4 ? `${s}.TW` : `${s}.TWO`;
    },

    /**
     * 🚀 v2.2.0: 自動偵測環境，支援本地 ../data/ 回源與雲端 GitHub Pages 回源
     */
    getDataUrl(path) {
        const isLocal = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' || 
                        window.location.protocol === 'file:';
        if (isLocal) {
            return `../${path}`;
        } else {
            return `../${path}`;
        }
    },

    /**
     * 🚀 v3.0.0: 多路徑回源輪詢，確保不論 document root 與線上線下，皆能成功讀取 JSON 數據。
     */
    async fetchLocalJson(path) {
        const isLocal = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' || 
                        window.location.protocol === 'file:';
        
        const candidates = [];
        if (isLocal) {
            candidates.push(`../${path}`);
            candidates.push(`../../${path}`);
            candidates.push(`../../../${path}`);
        } else {
            candidates.push(`../${path}`);
            candidates.push(`https://alien0077.github.io/Public_Data/data/${path}`);
        }
        
        // candidates.push(`https://raw.githubusercontent.com/alien0077/Public_Data/main/data/${path}`);
        // candidates.push(`https://alien0077.github.io/Public_Data/data/${path}`);

        let lastErr = null;
        for (const url of candidates) {
            try {
                const isExternal = url.startsWith('http') && !url.includes('localhost') && !url.includes('127.0.0.1');
                const timeoutMs = isExternal ? 1500 : 3000;

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

                try {
                    const res = await fetch(url, { signal: controller.signal });
                    clearTimeout(timeoutId);
                    if (res.ok) {
                        return await res.json();
                    }
                } catch (fetchErr) {
                    clearTimeout(timeoutId);
                    throw fetchErr;
                }
            } catch (e) {
                lastErr = e;
            }
        }
        throw new Error(`Failed to fetch local JSON [${path}] from all candidates. Last error: ${lastErr?.message}`);
    },

    async fetchWithAuth(endpoint, options = {}) {
        const secret = this.getSecret();
        if (!secret) {
            throw new Error('Unauthorized');
        }

        const headers = {
            ...options.headers,
            'Authorization': `Bearer ${secret}`
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                ...options,
                headers,
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                if (response.status === 401) {
                    const isLocal = window.location.hostname === 'localhost' || 
                                    window.location.hostname === '127.0.0.1' || 
                                    window.location.protocol === 'file:';
                    if (isLocal && secret === 'local_dev_bypass') {
                        throw new Error(`API Error: ${response.status}`);
                    }
                    localStorage.removeItem('twstock_secret');
                    window.location.reload();
                }
                throw new Error(`API Error: ${response.status}`);
            }

            return response.json();
        } catch (err) {
            clearTimeout(timeoutId);
            throw err;
        }
    },

    async fetchQuotes(symbols) {
        if (!symbols || symbols.length === 0) return {};
        
        // 🚀 v2.13.5: 將內部代碼映射為 Yahoo Finance 格式以供 Worker 抓取即時報價
        const apiMapping = {
            'IX0001': '^TWII',  // 台股加權
            'IX0043': '^TWOII', // 櫃買指數
            'DJI': '^DJI',
            'IXIC': '^IXIC',
            'GSPC': '^GSPC',
            'SOX': '^SOX'
        };

        const formattedSymbols = await Promise.all(symbols.map(async s => {
            const clean = s.replace('^', '');
            const mapped = apiMapping[clean] || s;
            return await this.formatSymbol(mapped);
        }));

        const query = formattedSymbols.join(',');
        console.log(`fetchQuotes: Requesting API for [${query}]`);
        
        let quotes = {};
        let fetchFailed = false;
        let originalError = null;
        try {
            const data = await this.fetchWithAuth(`/quote?symbols=${query}`);
            if (data.quoteResponse && data.quoteResponse.result) {
                data.quoteResponse.result.forEach(q => {
                    const rawSym = q.symbol;
                    // 反向映射回原始請求代碼
                    let targetKey = rawSym;
                    Object.entries(apiMapping).forEach(([key, val]) => {
                        if (val === rawSym || val.replace('^', '') === rawSym) targetKey = key;
                    });
                    
                    quotes[targetKey] = {
                        price: q.regularMarketPrice,
                        referencePrice: q.regularMarketPreviousClose,
                        change: q.regularMarketChange,
                        changePercent: q.regularMarketChangePercent,
                        name: q.shortName,
                        source: 'REALTIME'
                    };
                });
            }
        } catch (err) {
            console.warn(`Worker API fetchQuotes failed, trying local fallbacks...`, err);
            fetchFailed = true;
            originalError = err;
        }

        // 🚀 v2.13.5: 強化盤中判定與備援邏輯
        const missingSymbols = symbols.filter(s => !quotes[s]);
        if (missingSymbols.length > 0) {
            console.log(`fetchQuotes: Missing ${missingSymbols.length} quotes [${missingSymbols.join(',')}]. Checking if market is open...`);
            
            const symbolsToFallback = missingSymbols.filter(s => {
                const isOpen = this.isMarketOpen(s);
                if (isOpen) {
                    console.log(`Strict Policy: Skipping fallback for ${s} during OPEN market hours.`);
                }
                return !isOpen;
            });

            if (symbolsToFallback.length > 0) {
                console.log(`fetchQuotes: Attempting multi-path fallback for [${symbolsToFallback.join(',')}]...`);
                try {
                    const indexData = await this.fetchLocalJson('index.json');
                    const latestTW = indexData.latest_daily_tw || '2026-05-20';
                    const latestIndices = indexData.latest_daily_tw_indices || '2026-05-19';
                    const latestUS = indexData.latest_daily_us || '2026-05-19';

                    const fallbackSet = new Set(symbolsToFallback);
                    
                    // 1. Try TW Indices
                    try {
                        const twIdxData = await this.fetchLocalJson(`daily/tw_indices/${latestIndices}.json`);
                        (twIdxData.stocks || twIdxData.data || []).forEach(s => {
                            const sid = s.id || s.symbol;
                            if (fallbackSet.has(sid) || (sid === 'IX0001' && fallbackSet.has('TSE')) || (sid === 'IX0043' && fallbackSet.has('OTC'))) {
                                const targetKey = fallbackSet.has(sid) ? sid : (sid === 'IX0001' ? 'TSE' : 'OTC');
                                quotes[targetKey] = { price: s.c, referencePrice: s.c / (1 + (s.pct/100)), changePercent: s.pct, name: sid, source: 'EOD_JSON' };
                                fallbackSet.delete(targetKey);
                            }
                        });
                    } catch(e) {}

                    // 2. Try US Data
                    try {
                        const usData = await this.fetchLocalJson(`daily/us/${latestUS}.json`);
                        (usData.stocks || []).forEach(s => {
                            const sid = s.id?.replace('^', '');
                            if (fallbackSet.has(sid) || fallbackSet.has('^' + sid)) {
                                const targetKey = fallbackSet.has(sid) ? sid : '^' + sid;
                                quotes[targetKey] = { price: s.c, referencePrice: s.c / (1 + (s.pct/100)), changePercent: s.pct, name: sid, source: 'EOD_JSON' };
                                fallbackSet.delete(targetKey);
                            }
                        });
                    } catch(e) {}

                    // 3. Try standard TW Data (Stocks)
                    if (fallbackSet.size > 0) {
                        try {
                            const dailyData = await this.fetchLocalJson(`daily/tw/${latestTW}.json`);
                            (dailyData.stocks || []).forEach(s => {
                                const sid = s.id || s.symbol;
                                if (fallbackSet.has(sid)) {
                                    quotes[sid] = { price: s.c, referencePrice: s.c / (1 + (s.pct/100)), changePercent: s.pct, name: s.n || sid, source: 'EOD_JSON' };
                                }
                            });
                        } catch(e) {}
                    }
                } catch (fallbackErr) {
                    console.error(`Multi-path fallback failed:`, fallbackErr);
                }
            }
        }
        return quotes;
    },

    isMarketOpen(symbol) {
        // 使用台北時間進行判定
        const tpTimeStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Taipei', hour12: false });
        const match = tpTimeStr.match(/(\d+):(\d+):(\d+)/);
        if (!match) return false;
        
        const hour = parseInt(match[1]);
        const min = parseInt(match[2]);
        const timeVal = hour * 100 + min;
        
        const tpDate = new Date(tpTimeStr);
        const day = tpDate.getDay();
        if (day === 0 || day === 6) return false;

        const cleanSym = symbol.replace('^', '');
        const isTW = cleanSym.includes('.TW') || cleanSym.includes('.TWO') || cleanSym.startsWith('IX') || ['TSE', 'OTC', 'TWII', 'TWOII'].includes(cleanSym);
        
        if (isTW) {
            return timeVal >= 900 && timeVal <= 1335;
        } else {
            return timeVal >= 2130 || timeVal < 400;
        }
    },

    async fetchChart(symbol) {
        let fullSymbol = await this.formatSymbol(symbol);
        
        try {
            const data = await this.fetchWithAuth(`/chart?symbol=${fullSymbol}&range=1mo&interval=1d`);
            if (data.chart && data.chart.result && data.chart.result[0]) {
                const res = data.chart.result[0];
                const indicators = res.indicators.quote[0];
                return {
                    timestamp: res.timestamp,
                    open: indicators.open,
                    high: indicators.high,
                    low: indicators.low,
                    close: indicators.close,
                    volume: indicators.volume
                };
            }
            return data;
        } catch (err) {
            console.warn(`Worker API fetchChart failed for ${symbol}, trying local fallback...`, err);
            const rawSym = symbol.split('.')[0];
            try {
                const localData = await this.fetchLocalJson(`charts/${rawSym}.json`);
                console.log(`Successfully loaded fallback chart for ${symbol}`);
                return localData;
            } catch (fallbackErr) {
                console.error(`Local fallback chart also failed for ${symbol}:`, fallbackErr);
            }
            throw err;
        }
    },

    async fetchStructure(symbol) {
        const rawSym = symbol.split('.')[0];
        try {
            return await this.fetchLocalJson(`structure/daily/${rawSym}.json`);
        } catch (err) {
            return null;
        }
    },

    async fetchFinancials(symbol, type = 'quarterly') {
        const rawSym = symbol.split('.')[0];
        try {
            return await this.fetchLocalJson(`${type}/${rawSym}.json`);
        } catch (err) {
            return null;
        }
    },

    async fetchHealthData(symbol) {
        // TODO: Replace with real data source when available
        return {
            score: 150,
            health_status: '健康',
            risk_level: '中風險',
            advice: 'REDUCE',
            profit_progress: {
                current: 10,
                target: 25,
                stop_loss: -10
            },
            ai_summary: '籌碼面偏多，技術面短期過熱，建議部分獲利了結。'
        };
    },

    async fetchIntradayMarket(symbol) {
        // TODO: Replace with real Fugle API call or JSON when available
        return {
            metrics: {
                outer_ratio: 39.1,
                amplitude: 2.86,
                trades_count: 14000,
                latest_volume: 5188,
                turnover: 147.2
            },
            price_volume: [
                { price: 246, volume: 864, outer_vol: 500, inner_vol: 364 },
                { price: 245, volume: 1039, outer_vol: 400, inner_vol: 639 },
                { price: 244, volume: 3088, outer_vol: 1500, inner_vol: 1588 },
                { price: 243, volume: 4407, outer_vol: 2400, inner_vol: 2007 },
                { price: 242, volume: 6216, outer_vol: 3000, inner_vol: 3216 },
                { price: 241, volume: 2000, outer_vol: 1000, inner_vol: 1000 }
            ]
        };
    },

    async fetchShareholders(symbol) {
        const rawSym = symbol.split('.')[0];
        try {
            return await this.fetchLocalJson(`weekly/shareholders/${rawSym}.json`);
        } catch (err) {
            console.warn(`Local weekly/shareholders/${rawSym}.json not found, constructing from weekly files...`);
            try {
                const indexData = await this.fetchLocalJson('index.json');
                const latestWeekly = indexData.latest_weekly || '2026-W20';
                
                const match = latestWeekly.match(/^(\d{4})-W(\d{2})$/);
                if (!match) return null;
                
                let year = parseInt(match[1]);
                let week = parseInt(match[2]);
                const weeksToFetch = [];
                
                for (let i = 0; i < 8; i++) {
                    weeksToFetch.push(`${year}-W${String(week).padStart(2, '0')}`);
                    week--;
                    if (week <= 0) {
                        year--;
                        week = 52;
                    }
                }
                
                const results = await Promise.all(
                    weeksToFetch.map(async (wk) => {
                        try {
                            const dailyList = await this.fetchLocalJson(`weekly/${wk}.json`);
                            const record = dailyList.find(r => r.id === rawSym);
                            if (record) {
                                const fridayDt = this.getFridayOfISOWeek(wk);
                                return {
                                    date: fridayDt,
                                    percentage: record.r400 || 0,
                                    price: record.price || 0
                                };
                            }
                        } catch(e) {}
                        return null;
                    })
                );
                
                const validRecords = results.filter(r => r !== null).sort((a, b) => new Date(b.date) - new Date(a.date));
                if (validRecords.length === 0) return null;
                
                const recent = [];
                for (let i = 0; i < validRecords.length; i++) {
                    let diff = 0.00;
                    if (i < validRecords.length - 1) {
                        diff = (validRecords[i].percentage - validRecords[i+1].percentage).toFixed(2);
                    }
                    recent.push({
                        date: validRecords[i].date,
                        percentage: validRecords[i].percentage,
                        diff: diff
                    });
                }
                return { recent };
            } catch (fallbackErr) {
                console.error("Failed to construct weekly shareholders info from weekly list", fallbackErr);
                return null;
            }
        }
    },

    getFridayOfISOWeek(weekStr) {
        const match = weekStr.match(/^(\d{4})-W(\d{2})$/);
        if (!match) return weekStr;
        const y = parseInt(match[1]);
        const w = parseInt(match[2]);
        const simple = new Date(y, 0, 4);
        const dayOfWeek = simple.getDay();
        const dayDiff = (dayOfWeek === 0 ? 7 : dayOfWeek) - 1;
        const firstMonday = new Date(simple.getTime() - dayDiff * 24 * 60 * 60 * 1000);
        const targetFriday = new Date(firstMonday.getTime() + ((w - 1) * 7 + 4) * 24 * 60 * 60 * 1000);
        return targetFriday.toISOString().split('T')[0];
    },

    async fetchLiarData() {
        try {
            return await this.fetchLocalJson(`daily/liar.json`);
        } catch (err) {
            return null;
        }
    }
};
