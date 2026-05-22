import { db } from '../db.js';

/**
 * Transaction View
 * 負責手動新增交易紀錄
 */
export const Transaction = {
    async init() {
        const viewContainer = document.getElementById('view-addTrade');
        if (!viewContainer) return;

        viewContainer.innerHTML = `
            <div class="max-w-2xl mx-auto py-4">
                <div class="bg-white dark:bg-[#161b22] p-8 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg transition-colors duration-300">
                    <h3 class="text-xl font-bold mb-6 text-gray-900 dark:text-white">手動新增交易紀錄</h3>
                    
                    <form id="add-trade-form" class="space-y-4">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs text-gray-500 mb-1 uppercase tracking-wider font-bold">股票代號</label>
                                <input type="text" id="trade-symbol" required placeholder="例如: 2330" 
                                    class="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 outline-none focus:border-blue-500 transition-colors text-gray-900 dark:text-white">
                            </div>
                            <div>
                                <label class="block text-xs text-gray-500 mb-1 uppercase tracking-wider font-bold">股票名稱</label>
                                <input type="text" id="trade-name" placeholder="例如: 台積電" 
                                    class="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 outline-none focus:border-blue-500 transition-colors text-gray-900 dark:text-white">
                            </div>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs text-gray-500 mb-1 uppercase tracking-wider font-bold">交易日期</label>
                                <input type="date" id="trade-date" required
                                    class="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 outline-none focus:border-blue-500 transition-colors text-gray-900 dark:text-white">
                            </div>
                            <div>
                                <label class="block text-xs text-gray-500 mb-1 uppercase tracking-wider font-bold">交易類別</label>
                                <select id="trade-side" required
                                    class="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 outline-none focus:border-blue-500 transition-colors text-gray-900 dark:text-white">
                                    <option value="buy">買進</option>
                                    <option value="sell">賣出</option>
                                </select>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs text-gray-500 mb-1 uppercase tracking-wider font-bold">成交價格</label>
                                <input type="number" step="0.01" id="trade-price" required placeholder="0.00"
                                    class="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 outline-none focus:border-blue-500 transition-colors font-mono text-gray-900 dark:text-white">
                            </div>
                            <div>
                                <label class="block text-xs text-gray-500 mb-1 uppercase tracking-wider font-bold">成交股數</label>
                                <input type="number" id="trade-quantity" required placeholder="1000"
                                    class="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 outline-none focus:border-blue-500 transition-colors font-mono text-gray-900 dark:text-white">
                            </div>
                        </div>

                        <div class="pt-4">
                            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg active:scale-95 transition-all">
                                儲存交易紀錄
                            </button>
                        </div>
                    </form>
                </div>
                
                <!-- Recent Additions -->
                <div class="mt-8 bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm transition-colors duration-300">
                    <div class="p-4 border-b border-gray-100 dark:border-gray-800">
                        <h3 class="font-bold text-gray-900 dark:text-white">最近新增</h3>
                    </div>
                    <div id="recent-trades" class="p-4 space-y-2">
                        <!-- Recent trades will show here -->
                        <div class="text-center text-gray-500 text-sm py-4">尚無最近新增紀錄</div>
                    </div>
                </div>
            </div>
        `;

        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('trade-date').value = today;

        // Form Submit Handler
        const form = document.getElementById('add-trade-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const trade = {
                symbol: document.getElementById('trade-symbol').value.trim(),
                name: document.getElementById('trade-name').value.trim(),
                date: document.getElementById('trade-date').value,
                side: document.getElementById('trade-side').value,
                price: parseFloat(document.getElementById('trade-price').value),
                quantity: parseFloat(document.getElementById('trade-quantity').value),
                timestamp: Date.now()
            };

            try {
                await db.saveTrades([trade]);
                alert('交易紀錄儲存成功！');
                form.reset();
                document.getElementById('trade-date').value = today;
                await this.updateRecentTrades();
                
                // 觸發重新加載持股 (app.js 會監聽)
                window.dispatchEvent(new CustomEvent('twstock:data-changed'));
            } catch (err) {
                alert('儲存失敗：' + err);
            }
        });

        await this.updateRecentTrades();
    },

    async updateRecentTrades() {
        const trades = await db.getAllTrades();
        const recentTradesEl = document.getElementById('recent-trades');
        if (!recentTradesEl) return;

        // 按 timestamp 倒序排列，取前 5 筆
        const recent = trades
            .filter(t => t.timestamp)
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 5);

        if (recent.length === 0) {
            recentTradesEl.innerHTML = '<div class="text-center text-gray-500 text-sm py-4">尚無最近新增紀錄</div>';
            return;
        }

        recentTradesEl.innerHTML = recent.map(t => `
            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-800/50">
                <div>
                    <div class="font-bold font-mono text-sm text-gray-900 dark:text-white">
                        ${t.symbol} <span class="text-gray-500 font-normal ml-1">${t.name || ''}</span>
                    </div>
                    <div class="text-[10px] text-gray-400">${t.date}</div>
                </div>
                <div class="text-right font-mono">
                    <div class="${(t.side === 'buy' || t.side === '買進' || t.side === '買入') ? 'text-red-500' : 'text-green-500'} font-bold text-xs uppercase">
                        ${t.side === 'buy' ? '買進' : (t.side === 'sell' ? '賣出' : t.side)}
                    </div>
                    <div class="text-xs text-gray-600 dark:text-gray-300">${t.price} x ${t.quantity}</div>
                </div>
            </div>
        `).join('');
    }
};
