import { api } from '../api.js';
import { db } from '../db.js';
import { CorporateActions } from '../corporateActions.js';

export const Dashboard = {
    async init() {
        const container = document.getElementById('view-dashboard');
        if (!container) return;

        container.innerHTML = `
            <div class="p-4 md:p-6 space-y-8 flex-1 overflow-y-auto no-scrollbar">
                <!-- Market Summary -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6" id="dashboard-market-stats">
                    <div class="bg-white dark:bg-[#161b22] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 animate-pulse">
                        <div class="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded mb-4"></div>
                        <div class="h-8 w-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
                    </div>
                    <div class="bg-white dark:bg-[#161b22] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 animate-pulse">
                        <div class="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded mb-4"></div>
                        <div class="h-8 w-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
                    </div>
                    <div class="bg-white dark:bg-[#161b22] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 animate-pulse">
                        <div class="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded mb-4"></div>
                        <div class="h-8 w-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
                    </div>
                </div>

                <!-- Main Grid -->
                <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <!-- Column 1 -->
                    <div class="space-y-8">
                        <!-- Quant Quick Look -->
                        <div class="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                            <div class="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                <h3 class="font-bold text-gray-900 dark:text-white flex items-center">
                                    <span class="mr-2">⚡</span> 量化模型快覽
                                </h3>
                                <button onclick="router.switchPage('trendHunter')" class="text-xs text-blue-500 font-bold hover:underline">查看詳情</button>
                            </div>
                            <div class="p-6 grid grid-cols-2 gap-4" id="dashboard-quant-summary">
                                <div class="text-center py-4 text-gray-500 text-sm">加載中...</div>
                            </div>
                        </div>

                        <!-- Risk Summary -->
                        <div class="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                            <div class="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                <h3 class="font-bold text-gray-900 dark:text-white flex items-center">
                                    <span class="mr-2">🛡️</span> 風險與回撤
                                </h3>
                                <button onclick="router.switchPage('assetRisk')" class="text-xs text-blue-500 font-bold hover:underline">風險分析</button>
                            </div>
                            <div class="p-6" id="dashboard-risk-summary">
                                <div class="text-center py-4 text-gray-500 text-sm">加載中...</div>
                            </div>
                        </div>
                    </div>

                    <!-- Column 2 -->
                    <div class="space-y-8">
                        <!-- Lying Detector -->
                        <div class="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                            <div class="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                <h3 class="font-bold text-gray-900 dark:text-white flex items-center">
                                    <span class="mr-2">🔥</span> 外資口是心非偵測
                                </h3>
                            </div>
                            <div class="p-5 space-y-4" id="dashboard-liar-summary">
                                <div class="text-center py-4 text-gray-500 text-sm">監控中...</div>
                            </div>
                        </div>

                        <!-- Dividend Overview -->
                        <div class="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                            <div class="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                <h3 class="font-bold text-gray-900 dark:text-white flex items-center">
                                    <span class="mr-2">💰</span> 預估配息總覽
                                </h3>
                                <button onclick="router.switchPage('assetRisk', '現金流')" class="text-xs text-blue-500 font-bold hover:underline">現金流</button>
                            </div>
                            <div class="p-6" id="dashboard-dividend-summary">
                                <div class="text-center py-4 text-gray-500 text-sm">計算中...</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        await this.render();
    },

    async render() {
        try {
            const [marketData, liarData, quantData, trades] = await Promise.all([
                api.fetchLocalJson('daily/tw_indices.json').catch(() => null),
                api.fetchLocalJson('daily/liar.json').catch(() => null),
                api.fetchLocalJson('quant/latest_portfolio.json').catch(() => null),
                db.getAllTrades().catch(() => [])
            ]);

            this.renderMarket(marketData);
            this.renderLiar(liarData);
            this.renderQuant(quantData);
            this.renderPortfolioSummary(trades);

        } catch (err) {
            console.error('Dashboard render failed:', err);
        }
    },

    renderMarket(data) {
        const container = document.getElementById('dashboard-market-stats');
        if (!container || !data) return;

        const taiex = data.indices?.find(i => i.symbol === 'TSE') || {};
        const changePct = parseFloat(taiex.change_percent || 0);
        
        container.innerHTML = `
            <div class="bg-white dark:bg-[#161b22] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div class="text-xs text-gray-500 mb-2 uppercase font-bold tracking-wider">台股加權指數</div>
                <div class="text-3xl font-mono font-bold text-gray-900 dark:text-white">${parseFloat(taiex.close || 0).toLocaleString()}</div>
                <div class="text-sm mt-1 ${changePct >= 0 ? 'text-red-500' : 'text-green-500'} font-bold">
                    ${changePct >= 0 ? '▲' : '▼'} ${Math.abs(changePct).toFixed(2)}%
                </div>
            </div>
            <div class="bg-white dark:bg-[#161b22] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div class="text-xs text-gray-500 mb-2 uppercase font-bold tracking-wider">今日成交量</div>
                <div class="text-3xl font-mono font-bold text-blue-500">${(parseFloat(data.total_turnover || 0) / 100000000).toFixed(1)} <span class="text-xs">億</span></div>
                <div class="text-sm text-gray-400 mt-1">Market Turnover</div>
            </div>
            <div class="bg-white dark:bg-[#161b22] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div class="text-xs text-gray-500 mb-2 uppercase font-bold tracking-wider">外資買賣超</div>
                <div class="text-3xl font-mono font-bold text-purple-500">${(parseFloat(data.foreign_net_buy || 0) / 100000000).toFixed(1)} <span class="text-xs">億</span></div>
                <div class="text-sm text-gray-400 mt-1">Institutional Flow</div>
            </div>
        `;
    },

    renderLiar(data) {
        const container = document.getElementById('dashboard-liar-summary');
        if (!container) return;

        if (!data || !data.data || data.data.length === 0) {
            container.innerHTML = `<div class="text-center py-4 text-gray-500 text-sm">目前無偵測到說謊事件。</div>`;
            return;
        }

        container.innerHTML = data.data.slice(0, 3).map(item => `
            <div class="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800 cursor-pointer hover:border-red-500/50 transition-all"
                 onclick="window.StockDetail.show('${item.stockId}')">
                <div class="flex justify-between items-center mb-1">
                    <span class="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold">${item.brokerName}</span>
                    <span class="text-xs font-mono font-bold text-gray-900 dark:text-white">${item.stockId}</span>
                </div>
                <div class="text-xs text-gray-700 dark:text-gray-300 line-clamp-1">${item.newsTitle}</div>
            </div>
        `).join('');
    },

    renderQuant(data) {
        const container = document.getElementById('dashboard-quant-summary');
        if (!container || !data) return;

        const isBull = data.regime === 'BULL' || data.regime === 'AGGRESSIVE';
        container.innerHTML = `
            <div class="text-center border-r border-gray-100 dark:border-gray-800">
                <div class="text-[10px] text-gray-500 mb-1">環境標籤</div>
                <div class="text-xl font-bold ${isBull ? 'text-red-500' : 'text-green-500'}">${data.regime || '--'}</div>
            </div>
            <div class="text-center">
                <div class="text-[10px] text-gray-500 mb-1">模型淨值</div>
                <div class="text-xl font-mono font-bold text-blue-500">${data.nav ? data.nav.toFixed(2) : '--'}</div>
            </div>
        `;
    },

    async renderPortfolioSummary(trades) {
        if (trades.length === 0) {
            document.getElementById('dashboard-dividend-summary').innerHTML = '<div class="text-center py-4 text-gray-500 text-sm">尚無持股數據</div>';
            document.getElementById('dashboard-risk-summary').innerHTML = '<div class="text-center py-4 text-gray-500 text-sm">尚無持股數據</div>';
            return;
        }

        const symbols = Array.from(new Set(trades.map(t => t.symbol || t.stock_id || t.stockId)));
        await CorporateActions.loadCorporateActions(symbols);
        const holdings = CorporateActions.recalculateHoldings(trades);
        const activeSymbols = Object.keys(holdings);

        // Calculate Dividend
        let estTotalDiv = 0;
        const currentYear = new Date().getFullYear().toString();
        activeSymbols.forEach(sym => {
            const h = holdings[sym];
            const actions = CorporateActions.getActions(sym);
            const thisYearActions = actions.filter(a => a.ex_date.startsWith(currentYear) && (a.type === 'DIVIDEND' || a.type === 'CASH_DIVIDEND'));
            let divPerShare = 0;
            if (thisYearActions.length > 0) {
                divPerShare = thisYearActions.reduce((sum, a) => sum + (a.cash_dividend || 0), 0);
            } else {
                // Use last year as fallback
                const lastYear = (parseInt(currentYear) - 1).toString();
                const lastYearActions = actions.filter(a => a.ex_date.startsWith(lastYear) && (a.type === 'DIVIDEND' || a.type === 'CASH_DIVIDEND'));
                divPerShare = lastYearActions.reduce((sum, a) => sum + (a.cash_dividend || 0), 0);
            }
            estTotalDiv += divPerShare * h.shares;
        });

        document.getElementById('dashboard-dividend-summary').innerHTML = `
            <div class="flex items-end space-x-2">
                <div class="text-4xl font-mono font-bold text-green-500">$${this.formatNumber(estTotalDiv, 0)}</div>
                <div class="text-xs text-gray-400 mb-2">/ 年預估</div>
            </div>
            <p class="text-xs text-gray-500 mt-2">基於當前持股數與歷史配息數據估計。</p>
        `;

        // Calculate Risk
        let totalMV = 0;
        const quotes = await api.fetchQuotes(activeSymbols).catch(() => ({}));
        activeSymbols.forEach(sym => {
            const h = holdings[sym];
            const q = quotes[sym] || {};
            totalMV += (q.price || (h.totalCost / h.shares)) * h.shares;
        });

        let peakMV = parseFloat(localStorage.getItem('twstock_peak_mv') || totalMV);
        if (totalMV > peakMV) peakMV = totalMV;
        const drawdown = peakMV > 0 ? (peakMV - totalMV) / peakMV : 0;

        document.getElementById('dashboard-risk-summary').innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <div>
                    <div class="text-xs text-gray-500 mb-1 uppercase font-bold">目前回撤</div>
                    <div class="text-3xl font-mono font-bold text-gray-900 dark:text-white">${(drawdown * 100).toFixed(2)}%</div>
                </div>
                <div class="text-right">
                    <div class="text-xs text-gray-500 mb-1 uppercase font-bold">歷史最高市值</div>
                    <div class="text-xl font-mono text-blue-500">$${this.formatNumber(peakMV, 0)}</div>
                </div>
            </div>
            <div class="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                <div class="bg-red-500 h-1.5 rounded-full" style="width: ${Math.min(100, drawdown * 400)}%"></div>
            </div>
        `;
    },

    formatNumber(num, decimals = 2) {
        return new Intl.NumberFormat('zh-TW', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(num);
    }
};

window.Dashboard = Dashboard;
