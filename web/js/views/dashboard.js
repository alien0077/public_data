import { api } from '../api.js';
import { db } from '../db.js';
import { CorporateActions } from '../corporateActions.js';

export const Dashboard = {
    async init() {
        console.log('Dashboard: Initializing UI structure...');
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
        console.log('Dashboard: Starting render data fetch...');
        let indexData = null;
        try {
            indexData = await api.fetchLocalJson('index.json');
        } catch (e) {
            console.warn('Dashboard: Could not fetch index.json');
        }

        const latestMargin = indexData?.latest_daily_tw_market_margin || '2026-05-20';
        // 🚀 v2.15.2: 使用帶有 ^ 的標準 Yahoo 代碼，確保即時與備援一致
        const indexSymbols = ['IX0001', 'IX0043', '^DJI', '^IXIC', '^GSPC', '^SOX', 'TSM']; 
        
        try {
            // Split into independent promises to avoid one failure blocking all
            const quotesPromise = api.fetchQuotes(indexSymbols).catch(err => { console.error('Dashboard: fetchQuotes failed', err); return {}; });
            const marginPromise = api.fetchLocalJson(`daily/tw_market_margin/${latestMargin}.json`).catch(() => null);
            const liarPromise = api.fetchLocalJson('daily/liar.json').catch(() => null);
            const quantPromise = api.fetchLocalJson('quant/latest_portfolio.json').catch(() => null);
            const tradesPromise = db.getAllTrades().catch(() => []);

            const [quotes, marginData, liarData, quantData, trades] = await Promise.all([
                quotesPromise, marginPromise, liarPromise, quantPromise, tradesPromise
            ]);

            console.log('Dashboard: Data receive check', { 
                hasQuotes: Object.keys(quotes).length > 0, 
                hasMargin: !!marginData, 
                hasLiar: !!liarData, 
                hasQuant: !!quantData 
            });

            this.renderMarket(quotes, marginData);
            this.renderLiar(liarData);
            this.renderQuant(quantData);
            this.renderPortfolioSummary(trades);

        } catch (err) {
            console.error('Dashboard: Top-level render error', err);
        }
    },

    getMarketSession(market) {
        const now = new Date();
        const hour = now.getHours();
        const min = now.getMinutes();
        const timeVal = hour * 100 + min;

        if (market === 'TW') {
            if (timeVal < 830) return { label: '未開盤', color: 'bg-gray-500' };
            if (timeVal < 900) return { label: '盤前', color: 'bg-orange-500' };
            if (timeVal < 1335) return { label: '盤中', color: 'bg-red-500 animate-pulse' };
            if (timeVal < 1430) return { label: '盤後', color: 'bg-blue-500' };
            return { label: '休市', color: 'bg-gray-700' };
        } else {
            // US simplified logic
            if (timeVal >= 2130 || timeVal < 400) return { label: '盤中', color: 'bg-red-500 animate-pulse' };
            if (timeVal >= 1600 && timeVal < 2130) return { label: '盤前', color: 'bg-orange-500' };
            if (timeVal >= 400 && timeVal < 800) return { label: '盤後', color: 'bg-blue-500' };
            return { label: '休市', color: 'bg-gray-700' };
        }
    },

    renderMarket(quotes, marginData) {
        console.log('Dashboard: Executing renderMarket...');
        const container = document.getElementById('dashboard-market-stats');
        if (!container) return;

        const twSession = this.getMarketSession('TW');
        const usSession = this.getMarketSession('US');

        const formatIdx = (val) => {
            const num = parseFloat(val);
            return isNaN(num) || num === 0 ? '--' : num.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1});
        };
        const getPctColor = (pct) => parseFloat(pct || 0) >= 0 ? 'text-red-500' : 'text-green-500';

        const getItem = (sym) => {
            const clean = sym.replace('^', '').toUpperCase();
            const res = quotes[sym] || 
                        quotes['^' + clean] || 
                        quotes[clean] || 
                        (clean === 'IX0001' ? (quotes['TSE'] || quotes['^TWII'] || quotes['TWII']) : null) ||
                        (clean === 'IX0043' ? (quotes['OTC'] || quotes['^TWOII'] || quotes['TWOII']) : null) ||
                        { price: 0, changePercent: 0, source: 'N/A', date: '--' };
            return res;
        };

        const tse = getItem('IX0001');
        const otc = getItem('IX0043');
        const dji = getItem('DJI');
        const nasdaq = getItem('IXIC');
        const sp500 = getItem('GSPC');
        const sox = getItem('SOX');
        const tsm = getItem('TSM');

        const getDateBadge = (item) => {
            if (item.source === 'REALTIME' || item.source === 'REALTIME_CHART') return '<span class="ml-1 animate-pulse text-blue-500">📡</span>';
            if (item.date && item.date !== '--') return `<span class="ml-1 text-[8px] bg-gray-100 dark:bg-gray-800 text-gray-400 px-1 rounded">${item.date.substring(5)}</span>`;
            return '';
        };

        const formatPct = (val) => {
            const num = parseFloat(val);
            if (isNaN(num)) return '0.00';
            return (num >= 0 ? '+' : '') + num.toFixed(2);
        };

        container.innerHTML = `
            <div class="bg-white dark:bg-[#161b22] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden">
                <div class="flex justify-between items-center mb-4">
                    <span class="text-xs font-bold text-gray-400 uppercase tracking-widest font-sans">台股市場</span>
                    <span class="px-2 py-0.5 rounded text-[10px] text-white font-bold ${twSession.color}">${twSession.label}</span>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <div class="text-[9px] text-gray-500 mb-0.5 flex items-center truncate">加權 ${getDateBadge(tse)}</div>
                        <div class="text-xl font-mono font-bold text-gray-900 dark:text-white">${formatIdx(tse.price)}</div>
                        <div class="${getPctColor(tse.changePercent)} font-mono font-bold text-xs">${formatPct(tse.changePercent)}%</div>
                    </div>
                    <div>
                        <div class="text-[9px] text-gray-500 mb-0.5 flex items-center truncate">櫃買 ${getDateBadge(otc)}</div>
                        <div class="text-xl font-mono font-bold text-gray-900 dark:text-white">${formatIdx(otc.price)}</div>
                        <div class="${getPctColor(otc.changePercent)} font-mono font-bold text-xs">${formatPct(otc.changePercent)}%</div>
                    </div>
                </div>
                <div class="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <span class="text-[10px] text-gray-400 font-bold">市場融資餘額</span>
                    <span class="text-xs font-mono font-bold text-blue-500">${((marginData?.stocks?.[0]?.total_margin_balance || 0) / 100000000).toFixed(0)} 億</span>
                </div>
            </div>

            <div class="bg-white dark:bg-[#161b22] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm relative lg:col-span-2">
                <div class="flex justify-between items-center mb-4">
                    <span class="text-xs font-bold text-gray-400 uppercase tracking-widest font-sans">美股與半導體監控</span>
                    <span class="px-2 py-0.5 rounded text-[10px] text-white font-bold ${usSession.color}">${usSession.label}</span>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div class="p-1 min-w-0">
                        <div class="text-[9px] text-gray-500 mb-0.5 flex items-center truncate">道瓊 ${getDateBadge(dji)}</div>
                        <div class="text-base font-mono font-bold text-gray-900 dark:text-white">${formatIdx(dji.price)}</div>
                        <div class="${getPctColor(dji.changePercent)} text-[10px] font-mono font-bold">${formatPct(dji.changePercent)}%</div>
                    </div>
                    <div class="p-1 min-w-0">
                        <div class="text-[9px] text-gray-500 mb-0.5 flex items-center truncate">標普 ${getDateBadge(sp500)}</div>
                        <div class="text-base font-mono font-bold text-gray-900 dark:text-white">${formatIdx(sp500.price)}</div>
                        <div class="${getPctColor(sp500.changePercent)} text-[10px] font-mono font-bold">${formatPct(sp500.changePercent)}%</div>
                    </div>
                    <div class="p-1 min-w-0">
                        <div class="text-[9px] text-gray-500 mb-0.5 flex items-center truncate">納指 ${getDateBadge(nasdaq)}</div>
                        <div class="text-base font-mono font-bold text-gray-900 dark:text-white">${formatIdx(nasdaq.price)}</div>
                        <div class="${getPctColor(nasdaq.changePercent)} text-[10px] font-mono font-bold">${formatPct(nasdaq.changePercent)}%</div>
                    </div>
                    <div class="bg-blue-500/5 p-1.5 rounded-xl border border-blue-500/10 min-w-0">
                        <div class="text-[10px] text-blue-600 font-bold mb-1 flex items-center text-xs">費半 ${getDateBadge(sox)}</div>
                        <div class="text-base font-mono font-bold text-gray-900 dark:text-white">${formatIdx(sox.price)}</div>
                        <div class="${getPctColor(sox.changePercent)} text-[10px] font-mono font-bold">${formatPct(sox.changePercent)}%</div>
                    </div>
                    <div class="bg-red-500/5 p-1.5 rounded-xl border border-red-500/10 min-w-0">
                        <div class="text-[10px] text-red-600 font-bold mb-1 flex items-center text-xs">台積 ADR ${getDateBadge(tsm)}</div>
                        <div class="text-base font-mono font-bold text-gray-900 dark:text-white">${formatIdx(tsm.price)}</div>
                        <div class="${getPctColor(tsm.changePercent)} text-[10px] font-mono font-bold">${formatPct(tsm.changePercent)}%</div>
                    </div>
                </div>
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
        if (!container) return;
        const isBull = data?.regime === 'BULL' || data?.regime === 'AGGRESSIVE';
        container.innerHTML = `
            <div class="text-center border-r border-gray-100 dark:border-gray-800">
                <div class="text-[10px] text-gray-500 mb-1">環境標籤</div>
                <div class="text-xl font-bold ${isBull ? 'text-red-500' : 'text-green-500'}">${data?.regime || '--'}</div>
            </div>
            <div class="text-center">
                <div class="text-[10px] text-gray-500 mb-1">模型淨值</div>
                <div class="text-xl font-mono font-bold text-blue-500">${data?.nav ? data.nav.toFixed(2) : '--'}</div>
            </div>
        `;
    },

    async renderPortfolioSummary(trades) {
        const divEl = document.getElementById('dashboard-dividend-summary');
        const riskEl = document.getElementById('dashboard-risk-summary');
        if (!trades || trades.length === 0) {
            if (divEl) divEl.innerHTML = '<div class="text-center py-4 text-gray-500 text-sm">尚無持股數據</div>';
            if (riskEl) riskEl.innerHTML = '<div class="text-center py-4 text-gray-500 text-sm">尚無持股數據</div>';
            return;
        }

        const symbols = Array.from(new Set(trades.map(t => t.symbol || t.stock_id || t.stockId)));
        await CorporateActions.loadCorporateActions(symbols);
        const holdings = CorporateActions.recalculateHoldings(trades);
        const activeSymbols = Object.keys(holdings).filter(sym => holdings[sym].shares > 0.001);

        let estTotalDiv = 0;
        const currentYear = new Date().getFullYear().toString();
        activeSymbols.forEach(sym => {
            const h = holdings[sym];
            const actions = CorporateActions.getActions(sym);
            const thisYearActions = actions.filter(a => a.ex_date.startsWith(currentYear) && (a.type === 'DIVIDEND' || a.type === 'CASH_DIVIDEND'));
            const divPerShare = thisYearActions.length > 0 ? thisYearActions.reduce((sum, a) => sum + (a.cash_dividend || 0), 0) : 
                actions.filter(a => a.ex_date.startsWith((parseInt(currentYear)-1).toString()) && (a.type === 'DIVIDEND' || a.type === 'CASH_DIVIDEND')).reduce((sum, a) => sum + (a.cash_dividend || 0), 0);
            estTotalDiv += divPerShare * h.shares;
        });

        if (divEl) divEl.innerHTML = `
            <div class="flex items-end space-x-2">
                <div class="text-4xl font-mono font-bold text-green-500">$${this.formatNumber(estTotalDiv, 0)}</div>
                <div class="text-xs text-gray-400 mb-2">/ 年預估</div>
            </div>
        `;

        let totalMV = 0;
        const quotes = await api.fetchQuotes(activeSymbols).catch(() => ({}));
        activeSymbols.forEach(sym => {
            const h = holdings[sym];
            totalMV += (quotes[sym]?.price || (h.totalCost / h.shares)) * h.shares;
        });

        let peakMV = parseFloat(localStorage.getItem('twstock_peak_mv') || totalMV);
        if (totalMV > peakMV) { peakMV = totalMV; localStorage.setItem('twstock_peak_mv', peakMV.toString()); }
        const drawdown = peakMV > 0 ? (peakMV - totalMV) / peakMV : 0;

        if (riskEl) riskEl.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <div>
                    <div class="text-xs text-gray-500 mb-1 uppercase font-bold">目前回撤</div>
                    <div class="text-3xl font-mono font-bold text-gray-900 dark:text-white">${(drawdown * 100).toFixed(2)}%</div>
                </div>
                <div class="text-right">
                    <div class="text-xs text-gray-500 mb-1 uppercase font-bold">歷史最高</div>
                    <div class="text-xl font-mono text-blue-500">$${this.formatNumber(peakMV, 0)}</div>
                </div>
            </div>
            <div class="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5"><div class="bg-red-500 h-1.5 rounded-full" style="width: ${Math.min(100, drawdown * 400)}%"></div></div>
        `;
    },

    formatNumber(num, decimals = 2) {
        return new Intl.NumberFormat('zh-TW', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(num);
    }
};

window.Dashboard = Dashboard;
