/**
 * API Module for TWStockTracker Web - High Resilience Version
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
                this._stocksMetaCache = { stocks: [] };
            }
        }
        return this._stocksMetaCache;
    },

    async formatSymbol(s) {
        if (!/^\d+$/.test(s)) return s;
        if (s.startsWith('^')) return s;

        const meta = await this.getStocksMeta();
        const stockInfo = meta.stocks?.find(item => item.symbol === s);
        if (stockInfo) {
            const market = (stockInfo.market || '').toUpperCase();
            return (market === 'TPEX' || market === 'TWO' || market === 'OTC') ? `${s}.TWO` : `${s}.TW`;
        }
        return s.length === 4 ? `${s}.TW` : `${s}.TWO`;
    },

    async fetchLocalJson(path) {
        const isLocal = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' || 
                        window.location.protocol === 'file:';
        
        const candidates = [];
        if (isLocal) {
            candidates.push(`../${path}`, `../../${path}`, `../../../${path}`);
        } else {
            candidates.push(`../${path}`, `https://alien0077.github.io/Public_Data/data/${path}`);
        }

        let lastErr = null;
        for (const url of candidates) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);
                const res = await fetch(url, { signal: controller.signal });
                clearTimeout(timeoutId);
                if (res.ok) return await res.json();
            } catch (e) { lastErr = e; }
        }
        throw new Error(`Failed JSON [${path}]: ${lastErr?.message}`);
    },

    async fetchWithAuth(endpoint, options = {}) {
        const secret = this.getSecret();
        if (!secret) throw new Error('Unauthorized');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                ...options,
                headers: { ...options.headers, 'Authorization': `Bearer ${secret}` },
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                if (response.status === 401 && secret !== 'local_dev_bypass') {
                    localStorage.removeItem('twstock_secret');
                    window.location.reload();
                }
                throw new Error(`API ${response.status}`);
            }
            return response.json();
        } catch (err) {
            clearTimeout(timeoutId);
            throw err;
        }
    },

    async fetchQuotes(symbols) {
        if (!symbols || symbols.length === 0) return {};
        
        const apiMapping = {
            'IX0001': '^TWII', 'TSE': '^TWII',
            'IX0043': '^TWOII', 'OTC': '^TWOII',
            'DJI': '^DJI', 'IXIC': '^IXIC', 'GSPC': '^GSPC', 'SOX': '^SOX'
        };

        const formattedSymbols = await Promise.all(symbols.map(async s => {
            const clean = s.replace('^', '');
            return await this.formatSymbol(apiMapping[clean] || s);
        }));

        const query = formattedSymbols.join(',');
        const quotes = {};
        
        try {
            const data = await this.fetchWithAuth(`/quote?symbols=${query}`);
            if (data.quoteResponse?.result) {
                data.quoteResponse.result.forEach(q => {
                    const apiSym = q.symbol;
                    const cleanApiSym = apiSym.replace('^', '').split('.')[0];
                    
                    // 🚀 Defensive Mapping: Try to find which requested symbol matches this API result
                    symbols.forEach(s => {
                        const cleanS = s.replace('^', '').toUpperCase();
                        const mapped = (apiMapping[cleanS] || s).toUpperCase();
                        const cleanMapped = mapped.replace('^', '').split('.')[0];
                        const apiSymUpper = apiSym.toUpperCase();
                        const cleanApiSymUpper = cleanApiSym.toUpperCase();
                        
                        if (mapped === apiSymUpper || cleanMapped === cleanApiSymUpper || cleanS === cleanApiSymUpper) {
                            quotes[s] = {
                                price: q.regularMarketPrice,
                                referencePrice: q.regularMarketPreviousClose,
                                changePercent: q.regularMarketChangePercent,
                                name: q.shortName,
                                source: 'REALTIME'
                            };
                        }
                    });
                });
            }
        } catch (err) {
            console.warn(`Worker API failed, trying fallbacks...`);
        }

        // 🚀 Fallback Logic
        const missingSymbols = symbols.filter(s => !quotes[s] || quotes[s].price === 0);
        if (missingSymbols.length > 0) {
            const isBypass = this.getSecret() === 'local_dev_bypass';
            const symbolsToFallback = missingSymbols.filter(s => !this.isMarketOpen(s) || isBypass);

            if (symbolsToFallback.length > 0) {
                try {
                    const indexData = await this.fetchLocalJson('index.json');
                    const latestTW = indexData.latest_daily_tw || '2026-05-20';
                    const latestIndices = indexData.latest_daily_tw_indices || '2026-05-19';
                    const latestUS = indexData.latest_daily_us || '2026-05-19';

                    // Prepare lookup maps for faster matching
                    const twIdxData = await this.fetchLocalJson(`daily/tw_indices/${latestIndices}.json`).catch(() => ({}));
                    const usData = await this.fetchLocalJson(`daily/us/${latestUS}.json`).catch(() => ({}));
                    const twData = await this.fetchLocalJson(`daily/tw/${latestTW}.json`).catch(() => ({}));

                    const allJsonStocks = [
                        ...(twIdxData.stocks || twIdxData.data || []),
                        ...(usData.stocks || []),
                        ...(twData.stocks || [])
                    ];

                    const jsonMap = new Map();
                    allJsonStocks.forEach(s => {
                        if (s.id) jsonMap.set(String(s.id).toUpperCase(), s);
                        if (s.symbol) jsonMap.set(String(s.symbol).toUpperCase(), s);
                    });

                    symbolsToFallback.forEach(s => {
                        const cleanS = s.replace('^', '').toUpperCase();
                        // Also try mapping common names
                        const mappedClean = (apiMapping[cleanS] || '').replace('^', '').toUpperCase();
                        
                        const match = jsonMap.get(cleanS) || 
                                      jsonMap.get('^' + cleanS) || 
                                      jsonMap.get(mappedClean) || 
                                      jsonMap.get('^' + mappedClean) ||
                                      (cleanS === 'TSE' ? jsonMap.get('IX0001') : null) ||
                                      (cleanS === 'OTC' ? jsonMap.get('IX0043') : null) ||
                                      (cleanS === 'IX0001' ? jsonMap.get('TSE') : null) ||
                                      (cleanS === 'IX0043' ? jsonMap.get('OTC') : null);

                        if (match) {
                            quotes[s] = {
                                price: match.c || match.close || 0,
                                referencePrice: (match.c || match.close) / (1 + ((match.pct || 0)/100)),
                                changePercent: match.pct || 0,
                                name: match.n || match.name || s,
                                source: 'EOD_JSON'
                            };
                        }
                    });
                } catch (e) { console.error('Fallback critical failure', e); }
            }
        }
        return quotes;
    },

    isMarketOpen(symbol) {
        const tpTimeStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Taipei', hour12: false });
        const match = tpTimeStr.match(/(\d+):(\d+):(\d+)/);
        if (!match) return false;
        const hour = parseInt(match[1]), min = parseInt(match[2]), timeVal = hour * 100 + min;
        const tpDate = new Date(tpTimeStr);
        if (tpDate.getDay() === 0 || tpDate.getDay() === 6) return false;

        const cleanSym = symbol.replace('^', '').toUpperCase();
        const isTW = ['IX0001', 'IX0043', 'TSE', 'OTC', 'TWII', 'TWOII'].includes(cleanSym) || 
                     /^\d+$/.test(cleanSym) || cleanSym.includes('.TW') || cleanSym.includes('.TWO');
        
        return isTW ? (timeVal >= 900 && timeVal <= 1335) : (timeVal >= 2130 || timeVal < 400);
    },

    async fetchChart(symbol) {
        try {
            const fullSymbol = await this.formatSymbol(symbol);
            const data = await this.fetchWithAuth(`/chart?symbol=${fullSymbol}&range=1mo&interval=1d`);
            if (data.chart?.result?.[0]) {
                const res = data.chart.result[0], q = res.indicators.quote[0];
                return { timestamp: res.timestamp, open: q.open, high: q.high, low: q.low, close: q.close, volume: q.volume };
            }
            return data;
        } catch (err) {
            try { return await this.fetchLocalJson(`charts/${symbol.split('.')[0]}.json`); } catch(e) { throw err; }
        }
    }
};
