import { db } from '../db.js';
import { CorporateActions } from '../corporateActions.js';

/**
 * Battle Record View
 * 負責計算並顯示已結算盈虧、勝率與總獲利金額
 */
export const BattleRecord = {
    async init() {
        const viewContainer = document.getElementById('view-performance');
        if (!viewContainer) return;

        viewContainer.innerHTML = `
            <div class="flex flex-col space-y-6 flex-1 overflow-y-auto p-4 md:p-6 no-scrollbar">
                <!-- Summary Stats -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="bg-white dark:bg-[#161b22] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <p class="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-2">已結算總盈虧 (含股利)</p>
                        <h3 class="text-3xl font-mono font-bold" id="settled-total-pnl">--</h3>
                    </div>
                    <div class="bg-white dark:bg-[#161b22] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <p class="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-2">累計獲利次數</p>
                        <h3 class="text-3xl font-mono font-bold text-red-500" id="settled-win-count">--</h3>
                    </div>
                    <div class="bg-white dark:bg-[#161b22] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <p class="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-2">累計股利收入</p>
                        <h3 class="text-3xl font-mono font-bold text-blue-500" id="settled-total-dividend">--</h3>
                    </div>
                    <div class="bg-white dark:bg-[#161b22] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <p class="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-2">平均勝率</p>
                        <h3 class="text-3xl font-mono font-bold text-purple-500" id="settled-win-rate">--</h3>
                    </div>
                </div>

                <!-- Settled Groups -->
                <div class="space-y-4" id="settled-groups-container">
                    <div class="text-center py-12 text-gray-500">數據分析中...</div>
                </div>
            </div>
        `;

        await this.render();
    },

    async render() {
        const trades = await db.getAllTrades();
        if (!trades || trades.length === 0) {
            document.getElementById('settled-groups-container').innerHTML = `<div class="text-center py-12 text-gray-500">尚無交易紀錄</div>`;
            return;
        }

        const symbols = Array.from(new Set(trades.map(t => t.symbol || t.stock_id || t.stockId)));
        await CorporateActions.loadCorporateActions(symbols);
        const holdings = CorporateActions.recalculateHoldings(trades);

        // Group trades by symbol to find settled ones
        const symbolGroups = {};
        trades.forEach(t => {
            const sym = t.symbol || t.stock_id || t.stockId;
            if (!symbolGroups[sym]) symbolGroups[sym] = [];
            symbolGroups[sym].push(t);
        });

        let totalRealizedPNL = 0;
        let totalDividend = 0;
        let winCount = 0;
        let totalSettledCount = 0;

        const results = [];
        Object.keys(symbolGroups).forEach(sym => {
            const h = holdings[sym] || { realizedPNL: 0, totalDividend: 0, shares: 0 };
            const pnl = h.realizedPNL;
            const div = h.totalDividend;
            const totalResult = pnl + div;

            // 只有有過 realizedPNL 或 totalDividend 的才算入戰績 (代表有賣出過或領過息)
            if (Math.abs(pnl) > 0.1 || div > 0) {
                totalRealizedPNL += pnl;
                totalDividend += div;
                totalSettledCount++;
                if (totalResult > 0) winCount++;

                results.push({
                    symbol: sym,
                    name: symbolGroups[sym][0].name || symbolGroups[sym][0].stockName || '',
                    pnl: pnl,
                    dividend: div,
                    total: totalResult,
                    tradesCount: symbolGroups[sym].length
                });
            }
        });

        results.sort((a, b) => b.total - a.total);

        // Update Summary
        const totalPnlEl = document.getElementById('settled-total-pnl');
        const grandTotal = totalRealizedPNL + totalDividend;
        totalPnlEl.textContent = `$${this.formatNumber(grandTotal, 0)}`;
        totalPnlEl.className = `text-3xl font-mono font-bold ${grandTotal >= 0 ? 'text-red-500' : 'text-green-500'}`;

        document.getElementById('settled-win-count').textContent = winCount;
        document.getElementById('settled-total-dividend').textContent = `$${this.formatNumber(totalDividend, 0)}`;
        document.getElementById('settled-win-rate').textContent = totalSettledCount > 0 ? `${(winCount/totalSettledCount*100).toFixed(1)}%` : '0%';

        // Render Groups
        const container = document.getElementById('settled-groups-container');
        container.innerHTML = results.map(r => `
            <div class="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm hover:border-blue-500/50 transition-all cursor-pointer" 
                 onclick="window.StockDetail.show('${r.symbol}')">
                <div class="p-5 flex justify-between items-center">
                    <div class="flex items-center space-x-4">
                        <div class="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center font-bold text-blue-500">
                            ${r.symbol.substring(0,2)}
                        </div>
                        <div>
                            <div class="font-bold text-gray-900 dark:text-white">${r.symbol}</div>
                            <div class="text-xs text-gray-500">${r.name}</div>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-lg font-mono font-bold ${r.total >= 0 ? 'text-red-500' : 'text-green-500'}">
                            ${r.total >= 0 ? '+' : ''}${this.formatNumber(r.total, 0)}
                        </div>
                        <div class="text-[10px] text-gray-400 font-mono">價差: ${this.formatNumber(r.pnl, 0)} | 股利: ${this.formatNumber(r.dividend, 0)}</div>
                    </div>
                </div>
            </div>
        `).join('') || `<div class="text-center py-12 text-gray-500">當前尚無已結算的交易紀錄。</div>`;
    },

    formatNumber(num, decimals = 2) {
        return new Intl.NumberFormat('zh-TW', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(num);
    }
};

