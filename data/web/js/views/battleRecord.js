import { db } from '../db.js';

/**
 * Battle Record View
 * 負責計算並顯示已結算盈虧、勝率與總獲利金額
 */
export const BattleRecord = {
    async init() {
        const viewContainer = document.getElementById('view-performance');
        if (!viewContainer) return;

        viewContainer.innerHTML = `
            <div class="flex flex-col space-y-6">
                <!-- Summary Stats -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="bg-white dark:bg-[#161b22] p-4 md:p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-300">
                        <p class="text-gray-500 text-xs mb-1">已結算總盈虧</p>
                        <h3 class="text-xl md:text-2xl font-mono font-bold" id="settled-total-pnl">--</h3>
                    </div>
                    <div class="bg-white dark:bg-[#161b22] p-4 md:p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-300">
                        <p class="text-gray-500 text-xs mb-1">勝率</p>
                        <h3 class="text-xl md:text-2xl font-mono font-bold text-blue-400" id="settled-win-rate">--</h3>
                    </div>
                    <div class="bg-white dark:bg-[#161b22] p-4 md:p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-300">
                        <p class="text-gray-500 text-xs mb-1">總獲利次數</p>
                        <h3 class="text-xl md:text-2xl font-mono font-bold text-red-400" id="settled-win-count">--</h3>
                    </div>
                    <div class="bg-white dark:bg-[#161b22] p-4 md:p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-300">
                        <p class="text-gray-500 text-xs mb-1">總虧損次數</p>
                        <h3 class="text-xl md:text-2xl font-mono font-bold text-green-400" id="settled-loss-count">--</h3>
                    </div>
                </div>

                <!-- Settled Table -->
                <div class="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm transition-colors duration-300">
                    <div class="p-4 border-b border-gray-100 dark:border-gray-800">
                        <h3 class="font-bold text-gray-900 dark:text-white">結算紀錄</h3>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left">
                            <thead class="bg-gray-50/50 dark:bg-gray-900/50 text-gray-400 dark:text-gray-500 text-[10px] md:text-xs uppercase">
                                <tr>
                                    <th class="px-3 md:px-6 py-4">代碼/名稱</th>
                                    <th class="px-3 md:px-6 py-4 hidden sm:table-cell">結算日期</th>
                                    <th class="px-3 md:px-6 py-4 text-right hidden sm:table-cell">股數</th>
                                    <th class="px-3 md:px-6 py-4 text-right">賣出價</th>
                                    <th class="px-3 md:px-6 py-4 text-right hidden sm:table-cell">平均成本</th>
                                    <th class="px-3 md:px-6 py-4 text-right">盈虧</th>
                                    <th class="px-3 md:px-6 py-4 text-right">報酬率</th>
                                </tr>
                            </thead>
                            <tbody id="settled-body" class="divide-y divide-gray-100 dark:divide-gray-800 font-mono text-sm">
                                <tr>
                                    <td colspan="7" class="px-3 md:px-6 py-10 text-center text-gray-500">
                                        尚無結算資料
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        await this.render();
    },

    async render() {
        const trades = await db.getAllTrades();
        const settledRecords = this.calculateSettled(trades);
        
        const settledBody = document.getElementById('settled-body');
        if (!settledBody) return;

        settledBody.innerHTML = '';

        if (settledRecords.length === 0) {
            settledBody.innerHTML = '<tr><td colspan="7" class="px-3 md:px-6 py-10 text-center text-gray-500">尚無結算資料</td></tr>';
            return;
        }

        let totalPnl = 0;
        let winCount = 0;
        let lossCount = 0;

        // 按日期倒序顯示
        settledRecords.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(rec => {
            totalPnl += rec.pnl;
            if (rec.pnl > 0) winCount++;
            else if (rec.pnl < 0) lossCount++;

            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-800/30 transition-colors';
            row.innerHTML = `
                <td class="px-3 md:px-6 py-4">
                    <div class="font-bold text-white">${rec.symbol}</div>
                    <div class="text-[10px] text-gray-500 truncate max-w-[100px]">${rec.name || ''}</div>
                </td>
                <td class="px-3 md:px-6 py-4 text-gray-400 text-xs hidden sm:table-cell">
                    ${rec.date}
                </td>
                <td class="px-3 md:px-6 py-4 text-right hidden sm:table-cell">
                    ${this.formatNumber(rec.shares, 0)}
                </td>
                <td class="px-3 md:px-6 py-4 text-right">
                    ${this.formatNumber(rec.price)}
                </td>
                <td class="px-3 md:px-6 py-4 text-right text-gray-400 hidden sm:table-cell">
                    ${this.formatNumber(rec.avgCost)}
                </td>
                <td class="px-3 md:px-6 py-4 text-right ${rec.pnl >= 0 ? 'text-red-500' : 'text-green-500'} font-bold">
                    ${rec.pnl >= 0 ? '+' : ''}${this.formatNumber(rec.pnl, 0)}
                </td>
                <td class="px-3 md:px-6 py-4 text-right ${rec.pnl >= 0 ? 'text-red-500' : 'text-green-500'} text-xs">
                    ${rec.roi.toFixed(2)}%
                </td>
            `;
            settledBody.appendChild(row);
        });

        const winRate = (winCount + lossCount) > 0 ? (winCount / (winCount + lossCount) * 100) : 0;

        const totalPnlEl = document.getElementById('settled-total-pnl');
        totalPnlEl.textContent = `${totalPnl >= 0 ? '+' : ''}${this.formatNumber(totalPnl, 0)}`;
        totalPnlEl.className = `text-2xl font-mono font-bold ${totalPnl >= 0 ? 'text-red-500' : 'text-green-500'}`;
        
        document.getElementById('settled-win-rate').textContent = `${winRate.toFixed(1)}%`;
        document.getElementById('settled-win-count').textContent = winCount;
        document.getElementById('settled-loss-count').textContent = lossCount;
    },

    /**
     * 計算已結算的交易紀錄 (以賣出為基準)
     */
    calculateSettled(trades) {
        const settled = [];
        const holdings = {};

        // 排序交易紀錄，確保按日期處理
        const sortedTrades = [...trades].sort((a, b) => {
            const dateA = new Date(a.date || a.timestamp || a.tradeDate);
            const dateB = new Date(b.date || b.timestamp || b.tradeDate);
            return dateA - dateB;
        });

        sortedTrades.forEach(t => {
            const sym = t.symbol || t.stock_id || t.stockId;
            if (!sym) return;

            if (!holdings[sym]) {
                holdings[sym] = {
                    shares: 0,
                    totalCost: 0,
                    name: t.name || t.stockName || ''
                };
            }

            const rawSide = (t.side || t.type || '').trim().toLowerCase();
            const qty = parseFloat(t.quantity || t.shares || 0);
            const price = parseFloat(t.price || 0);

            // 支援多種字眼
            const isBuy = ['買入', '買進', 'buy'].includes(rawSide);
            const isSell = ['賣出', 'sell'].includes(rawSide);

            if (isBuy) {
                holdings[sym].shares += qty;
                holdings[sym].totalCost += qty * price;
                if (!holdings[sym].name && (t.name || t.stockName)) {
                    holdings[sym].name = t.name || t.stockName;
                }
            } else if (isSell) {
                if (holdings[sym].shares > 0) {
                    const avgCostBefore = holdings[sym].totalCost / holdings[sym].shares;
                    const realisedPnl = (price - avgCostBefore) * qty;
                    const roi = (price - avgCostBefore) / avgCostBefore * 100;
                    
                    settled.push({
                        symbol: sym,
                        name: holdings[sym].name,
                        date: t.date || t.timestamp || t.tradeDate,
                        shares: qty,
                        price: price,
                        avgCost: avgCostBefore,
                        pnl: realisedPnl,
                        roi: roi
                    });

                    holdings[sym].shares -= qty;
                    // 賣出後按比例減少剩餘總成本
                    holdings[sym].totalCost = holdings[sym].shares * avgCostBefore;
                }
            }
        });

        return settled;
    },

    formatNumber(num, decimals = 2) {
        return new Intl.NumberFormat('zh-TW', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(num);
    }
};
