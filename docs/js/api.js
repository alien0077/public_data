/**
 * API Module for TWStockTracker Web
 */

const API_BASE = 'https://alienstocks.alien0077.workers.dev/api';

export const api = {
    getSecret() {
        return sessionStorage.getItem('twstock_secret');
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

        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers
        });

        if (!response.ok) {
            if (response.status === 401) {
                sessionStorage.removeItem('twstock_secret');
                window.location.reload();
            }
            throw new Error(`API Error: ${response.status}`);
        }

        return response.json();
    },

    async fetchQuotes(symbols) {
        if (!symbols || symbols.length === 0) return {};
        
        // 自動補齊後綴
        const formattedSymbols = symbols.map(s => {
            if (/^\d+$/.test(s)) {
                return s.length === 4 ? `${s}.TW` : `${s}.TWO`;
            }
            return s;
        });

        const query = formattedSymbols.join(',');
        const data = await this.fetchWithAuth(`/quote?symbols=${query}`);
        
        // 映射回原始代號
        const quotes = {};
        if (data.quoteResponse && data.quoteResponse.result) {
            data.quoteResponse.result.forEach(q => {
                const rawSym = q.symbol.split('.')[0];
                quotes[rawSym] = {
                    price: q.regularMarketPrice,
                    referencePrice: q.regularMarketPreviousClose,
                    change: q.regularMarketChange,
                    changePercent: q.regularMarketChangePercent,
                    name: q.shortName
                };
            });
        }
        return quotes;
    },

    /**
     * Fetch K-line data for a symbol
     * @param {string} symbol 
     */
    async fetchChart(symbol) {
        // 自動補齊台灣股票後綴
        let fullSymbol = symbol;
        if (/^\d+$/.test(symbol)) {
            fullSymbol = symbol.length === 4 ? `${symbol}.TW` : `${symbol}.TWO`;
        }
        
        const data = await this.fetchWithAuth(`/chart?symbol=${fullSymbol}&range=1mo&interval=1d`);
        
        // 修正 Yahoo Finance 嵌套結構解析
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
    },

    /**
     * Fetch SMC structure data
     */
    async fetchStructure(symbol) {
        // Remove .TW or .TWO for local data mapping
        const rawSym = symbol.split('.')[0];
        try {
            // Assuming the worker or server can serve these JSON files
            // For now, we simulate by fetching from the known path
            const response = await fetch(`data/structure/daily/${rawSym}.json`);
            if (!response.ok) return null;
            return await response.json();
        } catch (err) {
            return null;
        }
    },

    /**
     * Fetch financial data (Revenue, Earnings, Dividends)
     */
    async fetchFinancials(symbol, type = 'quarterly') {
        const rawSym = symbol.split('.')[0];
        try {
            const response = await fetch(`data/${type}/${rawSym}.json`);
            if (!response.ok) return null;
            return await response.json();
        } catch (err) {
            return null;
        }
    },

    /**
     * Fetch shareholder data
     */
    async fetchShareholders(symbol) {
        const rawSym = symbol.split('.')[0];
        try {
            const response = await fetch(`data/weekly/shareholders/${rawSym}.json`);
            if (!response.ok) return null;
            return await response.json();
        } catch (err) {
            return null;
        }
    },

    /**
     * Fetch Foreign Liar Detection data
     */
    async fetchLiarData() {
        try {
            const response = await fetch(`data/daily/liar.json`);
            if (!response.ok) return null;
            return await response.json();
        } catch (err) {
            return null;
        }
    }
};
