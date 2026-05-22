/**
 * Corporate Actions Engine for TWStockTracker Web
 * Ported from HoldingEngine.swift
 */

import { api } from './api.js';

export const CorporateActions = {
    _cache: {}, // symbol -> [actions]
    _yearsLoaded: new Set(),

    async loadCorporateActions(symbols = []) {
        const years = [2020, 2021, 2022, 2023, 2024, 2025, 2026];
        
        for (const year of years) {
            if (this._yearsLoaded.has(year)) continue;
            
            try {
                const data = await api.fetchLocalJson(`meta/actions/${year}.json`);
                if (data && data.stocks) {
                    data.stocks.forEach(action => {
                        const sid = action.stock_id;
                        if (!this._cache[sid]) this._cache[sid] = [];
                        this._cache[sid].push(action);
                    });
                }
                this._yearsLoaded.add(year);
            } catch (err) {
                console.warn(`Failed to load corporate actions for ${year}`, err);
            }
        }
        
        // Sort actions by ex_date for each stock
        Object.keys(this._cache).forEach(sid => {
            this._cache[sid].sort((a, b) => a.ex_date.localeCompare(b.ex_date));
        });
    },

    getActions(symbol) {
        return this._cache[symbol] || [];
    },

    recalculateHoldings(trades, includeClosed = true) {
        const holdings = {};
        const yearlyStats = {}; // year -> { realizedPNL, dividend }
        
        const ensureYearly = (year) => {
            if (!yearlyStats[year]) yearlyStats[year] = { realizedPNL: 0, dividend: 0 };
        };

        // Sort trades by date
        const sortedTrades = [...trades].sort((a, b) => {
            const dateA = a.date || a.timestamp || a.trade_date || a.tradeDate;
            const dateB = b.date || b.timestamp || b.trade_date || b.tradeDate;
            return new Date(dateA) - new Date(dateB);
        });

        sortedTrades.forEach(tx => {
            const sid = tx.symbol || tx.stock_id || tx.stockId;
            if (!sid) return;

            if (!holdings[sid]) {
                holdings[sid] = {
                    symbol: sid,
                    name: tx.name || tx.stockName || '',
                    shares: 0,
                    totalCost: 0,
                    realizedPNL: 0,
                    totalDividend: 0,
                    actionIndex: 0
                };
            }

            const h = holdings[sid];
            const actions = this.getActions(sid);
            const txDate = tx.date || tx.timestamp || tx.trade_date || tx.tradeDate;
            const txYear = new Date(txDate).getFullYear().toString();
            ensureYearly(txYear);

            // Process actions before this trade
            while (h.actionIndex < actions.length && actions[h.actionIndex].ex_date <= txDate) {
                const action = actions[h.actionIndex];
                const actionYear = action.ex_date.substring(0, 4);
                ensureYearly(actionYear);
                
                const divBefore = h.totalDividend;
                this._applyAction(h, action);
                const divGain = h.totalDividend - divBefore;
                if (divGain > 0) {
                    yearlyStats[actionYear].dividend += divGain;
                }
                h.actionIndex++;
            }

            // Process trade
            const type = (tx.side || tx.type || '').toUpperCase();
            const qty = parseFloat(tx.quantity || tx.shares || 0);
            const price = parseFloat(tx.price || 0);
            const fee = parseFloat(tx.fee || 0);
            const tax = parseFloat(tx.tax || 0);

            if (type === 'BUY' || type === '買入' || type === '買進' || type === 'BUYING') {
                h.shares += qty;
                h.totalCost += (qty * price) + fee;
            } else if (type === 'SELL' || type === '賣出' || type === 'SELLING') {
                if (h.shares > 0) {
                    const avgCost = h.totalCost / h.shares;
                    const sellValue = (qty * price) - fee - tax;
                    const pnlGain = sellValue - (qty * avgCost);
                    h.realizedPNL += pnlGain;
                    yearlyStats[txYear].realizedPNL += pnlGain;
                    h.totalCost -= (qty * avgCost);
                    h.shares -= qty;
                }
            }
        });

        // Process remaining actions
        Object.keys(holdings).forEach(sid => {
            const h = holdings[sid];
            const actions = this.getActions(sid);
            while (h.actionIndex < actions.length) {
                const action = actions[h.actionIndex];
                const actionYear = action.ex_date.substring(0, 4);
                ensureYearly(actionYear);

                const divBefore = h.totalDividend;
                this._applyAction(h, action);
                const divGain = h.totalDividend - divBefore;
                if (divGain > 0) {
                    yearlyStats[actionYear].dividend += divGain;
                }
                h.actionIndex++;
            }
        });

        if (includeClosed) {
            holdings.yearlyStats = yearlyStats;
            return holdings;
        }

        // Filter out empty holdings if explicitly requested
        const activeHoldings = { yearlyStats: yearlyStats };
        for (const sid in holdings) {
            if (sid === 'yearlyStats') continue;
            if (holdings[sid].shares > 0.001) {
                activeHoldings[sid] = holdings[sid];
            }
        }
        return activeHoldings;
    },

    _applyAction(h, action) {
        if (h.shares <= 0) return;

        const type = action.type.toUpperCase();
        if (type === 'DIVIDEND' || type === 'CASH_DIVIDEND') {
            h.totalDividend += h.shares * (action.cash_dividend || 0);
            if (action.stock_dividend > 0) {
                h.shares *= (1.0 + action.stock_dividend / 10.0);
            }
        } else if (type === 'REDUCTION' || type === 'CAPITAL_REDUCTION') {
            h.shares *= (1.0 - (action.capital_reduction || 0));
        } else if (type === 'SPLIT' || type === 'REVERSE_SPLIT') {
            h.shares *= (action.split_ratio || 1.0);
        }
    },

    buildTransactionTimeline(trades, symbol) {
        const actions = this.getActions(symbol);
        const symbolTrades = trades.filter(t => (t.symbol || t.stock_id || t.stockId) === symbol);
        
        const timeline = [];
        
        // Add trades
        symbolTrades.forEach(t => {
            timeline.push({
                type: 'TRADE',
                date: t.date || t.timestamp || t.trade_date || t.tradeDate,
                data: t
            });
        });
        
        // Add actions
        actions.forEach(a => {
            timeline.push({
                type: 'ACTION',
                date: a.ex_date,
                data: a
            });
        });
        
        // Sort by date, actions after trades if on same day
        timeline.sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return a.type === 'TRADE' ? -1 : 1;
        });
        
        return timeline;
    }
};

window.CorporateActions = CorporateActions;
