/**
 * API Module for TWStockTracker Web - Ultra Resilience Version (V4.0)
 * Optimized for bypassing Yahoo Finance Quote blocks using Chart Metadata.
 */

const API_BASE = 'https://alienstocks.alien0077.workers.dev/api';

export const api = {
    getSecret() {
        return localStorage.getItem('twstock_secret');
    },

    _stocksMetaCache: null,
    _calendarCache: null,

    async getStocksMeta() {
        if (!this._stocksMetaCache) {
            try { this._stocksMetaCache = await this.fetchLocalJson('meta/stocks.json'); }
            catch(e) { this._stocksMetaCache = { stocks: [] }; }
        }
        return this._stocksMetaCache;
    },

    async getCalendar() {
        if (!this._calendarCache) {
            try { this._calendarCache = await this.fetchLocalJson('meta/calendar.json'); }
            catch(e) { this._calendarCache = null; }
        }
        return this._calendarCache;
    },

    async formatSymbol(s) {
        if (s.startsWith('^')) return s;
        
        // 🚀 v4.1.3: 移除純數字限制，支援含字母代碼 (如 00982A)
        const meta = await this.getStocksMeta();
        const stockInfo = meta.stocks?.find(item => item.symbol === s);
        
        if (stockInfo) {
            const market = (stockInfo.market || '').toUpperCase();
            // 優先參考 stocks.json 的市場分類
            return (market === 'TPEX' || market === 'TWO' || market === 'OTC') ? `${s}.TWO` : `${s}.TW`;
        }
        
        // 默認規則：若 Meta 查無，4碼預設 TWSE，其餘預設 TWSE (因主動式 ETF 為 6 碼)
        // 但若為純 6 碼數字且 Meta 查無，通常為 OTC
        if (/^\d{6}$/.test(s)) return `${s}.TWO`;
        return `${s}.TW`;
    },

    async fetchLocalJson(path) {
        const isLocal = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' || 
                        window.location.protocol === 'file:';
        const candidates = isLocal ? [`../${path}`, `../../${path}`, `../../../${path}`] : 
                                   [`../${path}`, `https://alien0077.github.io/Public_Data/data/${path}`];
        let lastErr = null;
        for (const url of candidates) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);
                const res = await fetch(url, { signal: controller.signal });
                clearTimeout(timeoutId);
                if (res.ok) return await res.json();
            } catch (e) { lastErr = e; }
        }
        throw new Error(`JSON [${path}] failure: ${lastErr?.message}`);
    },

    async fetchWithAuth(endpoint, options = {}) {
        const secret = this.getSecret();
        if (!secret) throw new Error('Unauthorized');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                ...options,
                headers: { ...options.headers, 'Authorization': `Bearer ${secret}` },
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                if (response.status === 401 && !['local_dev_bypass', 'test'].includes(secret)) {
                    localStorage.removeItem('twstock_secret');
                    window.location.reload();
                }
                throw new Error(`API ${response.status}`);
            }
            return response.json();
        } catch (err) { clearTimeout(timeoutId); throw err; }
    },

    /**
     * 🚀 v4.0.0: 究極調度引擎 - 強制 Chart-as-Price 繞過 Yahoo 封鎖
     */
    async fetchQuotes(symbols) {
        if (!symbols || symbols.length === 0) return {};
        
        const [calendar, indexData] = await Promise.all([this.getCalendar(), this.fetchLocalJson('index.json').catch(() => ({}))]);
        const quotes = {};
        const symbolsToFetchApi = [];
        const symbolsToFallback = [];

        for (const s of symbols) {
            const info = this.getMarketStatus(s, calendar);
            const latestKey = info.market === 'TW' ? 'latest_daily_tw' : 'latest_daily_us';
            const latestDateInJson = indexData[latestKey];
            
            // 只要本地非最新，或正值盤中，則嘗試抓即時
            if (latestDateInJson !== info.marketDate || (info.isTradingDay && info.session === '盤中')) {
                symbolsToFetchApi.push(s);
            } else {
                symbolsToFallback.push(s);
            }
        }

        const apiMapping = { 
            'IX0001': '^TWII', 'TSE': '^TWII',
            'IX0043': 'IX0043.TWO', 'OTC': 'IX0043.TWO', // 🚀 v2.15.8: 修正櫃買使用 IX0043.TWO 獲取正確數值 (~410)
            'DJI': '^DJI', 'IXIC': '^IXIC', 'GSPC': '^GSPC', 'SOX': '^SOX'
        };

        if (symbolsToFetchApi.length > 0) {
            console.log(`[Routing] Attempting REALTIME for: ${symbolsToFetchApi.join(',')}`);
            
            // Step 1: 嘗試批量 Quote API (雖然常被封鎖)
            try {
                const formatted = await Promise.all(symbolsToFetchApi.map(async s => await this.formatSymbol(apiMapping[s.replace('^', '').toUpperCase()] || s)));
                const data = await this.fetchWithAuth(`/quote?symbols=${formatted.join(',')}`);
                if (data.quoteResponse?.result) {
                    data.quoteResponse.result.forEach(q => {
                        const apiSym = q.symbol;
                        this._populateQuotes(quotes, apiSym, q.regularMarketPrice, q.regularMarketPreviousClose, q.regularMarketChangePercent, q.shortName, 'REALTIME', symbolsToFetchApi, apiMapping);
                    });
                }
            } catch (err) {
                console.warn("Quote API Blocked, initiating Chart-as-Price recovery...");
            }

            // Step 2: 🚀 Chart Recovery (破壁關鍵) - 針對仍缺失的股票
            const stillMissing = symbolsToFetchApi.filter(s => !quotes[s] || quotes[s].price === 0);
            if (stillMissing.length > 0) {
                console.log(`[Recovery] Fetching Charts for: ${stillMissing.join(',')}`);
                // 為了性能與穩定性，限制並行數量並使用短範圍 Chart
                try {
                    const recoveryResults = await Promise.all(stillMissing.map(async s => {
                        try {
                            const fullSym = await this.formatSymbol(apiMapping[s.replace('^', '').toUpperCase()] || s);
                            // 使用 1d/1m 獲取最新點數
                            const cData = await this.fetchWithAuth(`/chart?symbol=${fullSym}&range=1d&interval=1m`);
                            if (cData.chart?.result?.[0]?.meta) {
                                const m = cData.chart.result[0].meta;
                                return {
                                    apiSym: m.symbol,
                                    price: m.regularMarketPrice,
                                    ref: m.chartPreviousClose || m.previousClose,
                                    name: m.symbol
                                };
                            }
                        } catch(e) { return null; }
                        return null;
                    }));
                    
                    recoveryResults.forEach(r => {
                        if (r && r.price) {
                            const pct = ((r.price - r.ref) / r.ref * 100);
                            this._populateQuotes(quotes, r.apiSym, r.price, r.ref, pct, r.name, 'REALTIME_CHART', symbolsToFetchApi, apiMapping);
                        }
                    });
                } catch(reErr) { console.error("Recovery failed", reErr); }
            }
            
            // 將最後仍抓不到的，合併到 Fallback 列表
            symbolsToFallback.push(...symbolsToFetchApi.filter(s => !quotes[s]));
        }

        // Step 3: 執行 Local Fallback (盤後/休市)
        if (symbolsToFallback.length > 0) {
            console.log(`[Routing] Fallbacking for: ${symbolsToFallback.join(',')}`);
            try {
                const latestIndices = indexData.latest_daily_tw_indices || '2026-05-19';
                const latestUS = indexData.latest_daily_us || '2026-05-19';
                const latestTW = indexData.latest_daily_tw || '2026-05-20';
                const [twIdxData, usData, twData] = await Promise.all([
                    this.fetchLocalJson(`daily/tw_indices/${latestIndices}.json`).catch(() => ({})),
                    this.fetchLocalJson(`daily/us/${latestUS}.json`).catch(() => ({})),
                    this.fetchLocalJson(`daily/tw/${latestTW}.json`).catch(() => ({}))
                ]);
                const jsonMap = new Map();
                const register = (arr, date) => (arr || []).forEach(s => {
                    const item = { ...s, _dataDate: date };
                    if (s.id) jsonMap.set(String(s.id).toUpperCase(), item);
                    if (s.symbol) jsonMap.set(String(s.symbol).toUpperCase(), item);
                });
                register(twIdxData.stocks || twIdxData.data, latestIndices);
                register(usData.stocks, latestUS);
                register(twData.stocks, latestTW);

                symbolsToFallback.forEach(s => {
                    const cleanS = s.replace('^', '').toUpperCase();
                    const match = jsonMap.get(s.toUpperCase()) || jsonMap.get(cleanS) || jsonMap.get('^' + cleanS) ||
                                  (cleanS === 'TSE' || cleanS === 'IX0001' ? (jsonMap.get('IX0001') || jsonMap.get('TSE')) : null) ||
                                  (cleanS === 'OTC' || cleanS === 'IX0043' ? (jsonMap.get('IX0043') || jsonMap.get('OTC')) : null);
                    if (match) {
                        const quoteObj = {
                            price: match.c || match.close || 0,
                            referencePrice: (match.c || match.close) / (1 + ((match.pct || 0)/100)),
                            changePercent: match.pct || 0,
                            name: match.n || match.name || s,
                            source: 'EOD_JSON',
                            date: match._dataDate
                        };
                        quotes[s] = quoteObj;
                        if (cleanS === 'IX0001' || cleanS === 'TSE') { quotes['IX0001'] = quoteObj; quotes['TSE'] = quoteObj; }
                        if (cleanS === 'IX0043' || cleanS === 'OTC') { quotes['IX0043'] = quoteObj; quotes['OTC'] = quoteObj; }
                    }
                });
            } catch (e) { console.error('Local fallback error', e); }
        }
        return quotes;
    },

    // 助手：填充多重鍵值
    _populateQuotes(quotes, apiSym, price, ref, pct, name, source, symbolsToMatch, apiMapping) {
        const cleanApiSym = apiSym.replace('^', '').split('.')[0].toUpperCase();
        // 🚀 v2.15.6: 強制數值格式化，防止 UI 溢出
        const formattedPct = parseFloat(pct || 0).toFixed(2);
        
        const quoteObj = {
            price, 
            referencePrice: ref, 
            changePercent: formattedPct, 
            name, 
            source,
            date: new Date().toISOString().split('T')[0]
        };

        quotes[apiSym] = quoteObj;
        quotes[cleanApiSym] = quoteObj;

        // 映射特殊指數
        if (cleanApiSym === 'TWII') { quotes['IX0001'] = quoteObj; quotes['TSE'] = quoteObj; }
        if (cleanApiSym === 'TWOII') { quotes['IX0043'] = quoteObj; quotes['OTC'] = quoteObj; }
        if (cleanApiSym === 'SOX') quotes['SOX'] = quoteObj;

        // 匹配原始請求
        symbolsToMatch.forEach(s => {
            const cleanS = s.replace('^', '').toUpperCase();
            const mapped = (apiMapping[cleanS] || s).toUpperCase();
            if (mapped === apiSym.toUpperCase() || cleanS === cleanApiSym) {
                quotes[s] = quoteObj;
            }
        });
    },

    getMarketStatus(symbol, calendar) {
        const cleanSym = symbol.replace('^', '').toUpperCase();
        const twIndices = ['IX0001', 'IX0043', 'TSE', 'OTC', 'TWII', 'TWOII'];
        const isTW = twIndices.includes(cleanSym) || /^\d+$/.test(cleanSym) || cleanSym.includes('.TW') || cleanSym.includes('.TWO');
        const tz = isTW ? 'Asia/Taipei' : 'America/New_York';
        const zonedTime = new Date().toLocaleString('en-US', { timeZone: tz, hour12: false });
        const match = zonedTime.match(/(\d+)\/(\d+)\/(\d+), (\d+):(\d+):(\d+)/);
        if (!match) return { market: isTW ? 'TW' : 'US', isTradingDay: false, session: '休市', marketDate: '' };
        const month = match[1].padStart(2, '0'), day = match[2].padStart(2, '0'), year = match[3];
        const hour = parseInt(match[4]), min = parseInt(match[5]), dateStr = `${year}-${month}-${day}`, timeVal = hour * 100 + min;
        let isClosed = false;
        const calMeta = calendar?.meta?.years?.[year];
        if (calMeta) isClosed = (isTW ? (calMeta.tw || []) : (calMeta.us || [])).includes(dateStr);
        else { const d = new Date(zonedTime); if (d.getDay() === 0 || d.getDay() === 6) isClosed = true; }
        let session = '休市';
        if (!isClosed) {
            if (isTW) {
                if (timeVal < 830) session = '盤前';
                else if (timeVal <= 1335) session = '盤中';
                else if (timeVal <= 1430) session = '盤後';
            } else {
                if (timeVal < 930) session = '盤前';
                else if (timeVal <= 1600) session = '盤中';
                else if (timeVal <= 2000) session = '盤後';
            }
        }
        return { market: isTW ? 'TW' : 'US', marketDate: dateStr, isTradingDay: !isClosed, session };
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
    },

    async fetchStructure(symbol) { try { return await this.fetchLocalJson(`structure/daily/${symbol.split('.')[0]}.json`); } catch (err) { return null; } },
    async fetchFinancials(symbol, type = 'quarterly') { try { return await this.fetchLocalJson(`${type}/${symbol.split('.')[0]}.json`); } catch (err) { return null; } },
    async fetchHealthData(symbol) { return { score: 150, health_status: '健康', risk_level: '中風險', advice: 'HOLD', ai_summary: '籌碼偏多，建議續抱。' }; },
    async fetchIntradayMarket(symbol) { return { metrics: { outer_ratio: 39.1, amplitude: 2.86, trades_count: 14000, latest_volume: 5188, turnover: 147.2 }, price_volume: [{ price: 246, volume: 864, outer_vol: 500, inner_vol: 364 }] }; },
    async fetchShareholders(symbol) { try { return await this.fetchLocalJson(`weekly/shareholders/${symbol.split('.')[0]}.json`); } catch (err) { return null; } },
    async fetchLiarData() { try { return await this.fetchLocalJson(`daily/liar.json`); } catch (err) { return null; } }
};
