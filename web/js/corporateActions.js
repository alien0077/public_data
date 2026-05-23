/**
 * Corporate Actions Engine for TWStockTracker Web - High Precision YTD v2
 */
import { api } from './api.js';

export const CorporateActions = {
    _cache: {}, 
    _yearsLoaded: new Set(),

    async loadCorporateActions(symbols = []) {
        const years = [2020, 2021, 2022, 2023, 2024, 2025, 2026];
        for (const year of years) {
            if (this._yearsLoaded.has(year)) continue;
            try {
                const data = await api.fetchLocalJson('meta/actions/' + year + '.json');
                if (data && data.stocks) {
                    data.stocks.forEach(action => {
                        const sid = String(action.stock_id);
                        if (!this._cache[sid]) this._cache[sid] = [];
                        this._cache[sid].push(action);
                    });
                }
                this._yearsLoaded.add(year);
            } catch (err) { console.warn('Failed year ' + year, err); }
        }
        Object.keys(this._cache).forEach(sid => {
            this._cache[sid].sort((a, b) => (a.ex_date || '').localeCompare(b.ex_date || ''));
        });
    },

    getActions(symbol) { return this._cache[String(symbol)] || []; },

    recalculateHoldings(trades, includeClosed = true, ytdRef = null) {
        if (!Array.isArray(trades)) return { yearlyStats: {} };
        const holdings = {};
        const yearlyStats = {}; // year -> { realizedPNL, dividend, ytdRealizedPNL }
        const ensureYearly = (year) => { if (!yearlyStats[year]) yearlyStats[year] = { realizedPNL: 0, dividend: 0, ytdRealizedPNL: 0 }; };

        let allEvents = [];
        trades.filter(t => t).forEach(t => {
            allEvents.push({ type: 'TRADE', date: t.date || t.timestamp || t.tradeDate || t.trade_date || '1970-01-01', data: t });
        });
        
        const symbols = Array.from(new Set(trades.map(t => String(t.symbol || t.stock_id || t.stockId))));
        symbols.forEach(sid => {
            this.getActions(sid).forEach(a => {
                allEvents.push({ type: 'ACTION', date: a.ex_date, data: a, symbol: sid });
            });
        });

        allEvents.sort((a, b) => a.date.localeCompare(b.date) || (a.type === 'TRADE' ? -1 : 1));

        const yearStart = '2026-01-01';

        allEvents.forEach(evt => {
            const sid = evt.symbol || evt.data.symbol || evt.data.stock_id || evt.data.stockId;
            if (!sid) return;

            if (!holdings[sid]) {
                holdings[sid] = { symbol: sid, name: evt.data.name || evt.data.stockName || '', shares: 0, totalCost: 0, ytdBasis: 0, realizedPNL: 0, totalDividend: 0, _ytdSnapshotted: false };
            }
            const h = holdings[sid];
            
            // 🚀 v2.23.2: Ensure name is updated if it was initialized empty by an ACTION
            if (!h.name && (evt.data.name || evt.data.stockName)) {
                h.name = evt.data.name || evt.data.stockName;
            }

            const date = evt.date;
            const year = date.substring(0, 4);
            ensureYearly(year);

            if (date >= yearStart && !h._ytdSnapshotted) {
                if (h.shares > 0 && ytdRef && ytdRef[sid]) h.ytdBasis = h.shares * ytdRef[sid];
                else h.ytdBasis = h.totalCost;
                h._ytdSnapshotted = true;
            }

            if (evt.type === 'TRADE') {
                const t = evt.data;
                const side = String(t.side || t.type || '').toUpperCase();
                const qty = Math.abs(parseFloat(t.quantity || t.shares || 0));
                const price = parseFloat(t.price || 0);
                const fee = parseFloat(t.fee || 0);
                const tax = parseFloat(t.tax || 0);
                if (!Number.isFinite(qty) || !Number.isFinite(price)) return;

                if (side.includes('BUY') || side.includes('買')) {
                    h.shares += qty;
                    h.totalCost += (qty * price) + fee;
                    if (date >= yearStart) h.ytdBasis += (qty * price) + fee;
                } else if (side.includes('SELL') || side.includes('賣')) {
                    if (h.shares > 0.0001) {
                        const avgCost = h.totalCost / h.shares;
                        const avgYtd = h.ytdBasis / h.shares;
                        const sellVal = (qty * price) - fee - tax;
                        
                        const pnl = sellVal - (qty * avgCost);
                        h.realizedPNL += pnl;
                        yearlyStats[year].realizedPNL += pnl;
                        
                        // 🚀 v2.23.1: Track YTD portion of realized P&L
                        const ytdPnl = sellVal - (qty * avgYtd);
                        yearlyStats[year].ytdRealizedPNL += ytdPnl;

                        h.totalCost = Math.max(0, h.totalCost - (qty * avgCost));
                        h.ytdBasis = Math.max(0, h.ytdBasis - (qty * avgYtd));
                        h.shares = Math.max(0, h.shares - qty);
                    }
                }
            } else {
                if (h.shares > 0) {
                    const a = evt.data, aType = (a.type || '').toUpperCase();
                    if (aType.includes('DIVIDEND')) {
                        const gain = h.shares * (a.cash_dividend || 0);
                        h.totalDividend += gain;
                        if (date >= yearStart) yearlyStats[year].dividend += gain;
                        if (a.stock_dividend > 0) h.shares *= (1.0 + a.stock_dividend / 10.0);
                    } else if (aType.includes('REDUCTION')) {
                        h.shares *= (1.0 - (a.capital_reduction || 0));
                    } else if (aType.includes('SPLIT')) {
                        h.shares *= (a.split_ratio || 1.0);
                    }
                }
            }
            if (!Number.isFinite(h.shares)) h.shares = 0;
            if (!Number.isFinite(h.totalCost)) h.totalCost = 0;
            if (!Number.isFinite(h.ytdBasis)) h.ytdBasis = 0;
        });

        Object.keys(holdings).forEach(sid => {
            const h = holdings[sid];
            if (!h._ytdSnapshotted && h.shares > 0) {
                if (ytdRef && ytdRef[sid]) h.ytdBasis = h.shares * ytdRef[sid];
                else h.ytdBasis = h.totalCost;
                h._ytdSnapshotted = true;
            }
        });

        holdings.yearlyStats = yearlyStats;
        return includeClosed ? holdings : Object.fromEntries(Object.entries(holdings).filter(([k,v]) => k==='yearlyStats' || v.shares > 0.001));
    },

    buildTransactionTimeline(trades, sym) {
        const actions = this.getActions(sym);
        const timeline = trades.filter(t => String(t.symbol || t.stock_id || t.stockId || '').split('.')[0] === String(sym).split('.')[0])
                               .map(t => ({ type: 'TRADE', date: t.date || t.timestamp || t.tradeDate || t.trade_date || '1970-01-01', data: t }));
        actions.forEach(a => timeline.push({ type: 'ACTION', date: a.ex_date, data: a }));
        return timeline.sort((a, b) => b.date.localeCompare(a.date) || (a.type === 'TRADE' ? 1 : -1));
    }
};

window.CorporateActions = CorporateActions;
