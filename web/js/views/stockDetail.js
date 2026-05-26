/**
 * Stock Detail Workstation Module
 * Handles the 12-tab analysis view for a specific stock
 */
import { api } from '../api.js';
import { charts } from '../charts.js';
import { db } from '../db.js';
import { CorporateActions } from '../corporateActions.js';

export const StockDetail = {
    currentSymbol: null,
    currentTab: 'K線',
    tabs: ['走勢', 'K線', '健檢', '盤面', '基本', '營收', '獲利', '股利', '大股東', '明細'],

    async show(symbol) {
        this.currentSymbol = symbol;
        const overlay = document.getElementById('stock-detail');
        if (!overlay) return;

        overlay.classList.remove('hidden');
        
        let liarData = null;
        try { liarData = await api.fetchLiarData(); } catch(e) { console.warn("fetchLiarData failed:", e); }
        this.renderLiarWarning(liarData);

        this.renderTabs();
        this.switchTab(this.currentTab);
        
        const detailSymbolEl = document.getElementById('detail-symbol');
        if (detailSymbolEl) detailSymbolEl.textContent = symbol;

        this.updateFavoriteUI();
        
        const toggleBtn = document.getElementById('toggle-favorite-btn');
        if (toggleBtn) {
            const newBtn = toggleBtn.cloneNode(true);
            toggleBtn.parentNode.replaceChild(newBtn, toggleBtn);
            newBtn.addEventListener('click', () => {
                if (window.Favorites) {
                    window.Favorites.toggleFavorite(this.currentSymbol);
                    this.updateFavoriteUI();
                }
            });
        }
    },

    updateFavoriteUI() {
        const toggleBtn = document.getElementById('toggle-favorite-btn');
        if (!toggleBtn || !window.Favorites) return;
        if (window.Favorites.isFavorite(this.currentSymbol)) {
            toggleBtn.classList.add('text-red-500'); toggleBtn.classList.remove('text-gray-300');
        } else {
            toggleBtn.classList.remove('text-red-500'); toggleBtn.classList.add('text-gray-300');
        }
    },

    renderLiarWarning(data) {
        let warningContainer = document.getElementById('liar-warning-container');
        if (!warningContainer) {
            warningContainer = document.createElement('div');
            warningContainer.id = 'liar-warning-container';
            const header = document.querySelector('#stock-detail header');
            if (header) header.after(warningContainer);
        }

        const liar = data?.data?.find(item => item.stockId === this.currentSymbol);
        if (liar) {
            const isLie = liar.honestyStatus === 'LIE';
            const isHonest = liar.honestyStatus === 'HONEST';
            const isUpgrade = liar.sentiment === 'bullish';
            
            const statusMap = {
                'LIE': { label: '說謊警告', color: 'bg-red-500', icon: '🚨' },
                'HONEST': { label: '誠實認證', color: 'bg-green-500', icon: '✅' },
                'PENDING': { label: '追蹤中', color: 'bg-orange-500', icon: '🕒' }
            };
            const s = statusMap[liar.honestyStatus] || statusMap['PENDING'];

            warningContainer.innerHTML = `
                <div class="m-4 p-4 ${isLie ? 'bg-red-500/10 border-red-500/20' : (isHonest ? 'bg-green-500/10 border-green-500/20' : 'bg-orange-500/10 border-orange-500/20')} border rounded-xl flex items-center shadow-sm transition-all">
                    <div class="w-10 h-10 ${s.color} rounded-full flex items-center justify-center mr-4 flex-none shadow-md">
                        <span class="text-white text-lg font-bold">${s.icon}</span>
                    </div>
                    <div class="flex-1">
                        <div class="flex justify-between items-center mb-1">
                            <h4 class="${isLie ? 'text-red-500' : (isHonest ? 'text-green-500' : 'text-orange-500')} font-bold text-sm">${s.label}：外資分析師操作監控</h4>
                            ${isLie ? `<span class="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded font-bold">說謊指數: ${liar.lyingScore}</span>` : ''}
                        </div>
                        <p class="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                            <span class="font-bold">${liar.brokerName}</span> 於 ${liar.date} ${isUpgrade ? '看多' : '看空'}本股
                            ${liar.targetPrice > 0 ? `至 <span class="font-bold ${isUpgrade ? 'text-red-500' : 'text-green-500'}">${liar.targetPrice}</span> 元` : ''}，
                            追蹤 ${liar.daysTracked} 天以來，分點累積進出 <span class="font-bold ${liar.cumulativeVolume >= 0 ? 'text-red-500' : 'text-green-500'}">${Math.round(liar.cumulativeVolume)}</span> 張。
                            ${isLie ? '<br/><span class="text-[10px] text-red-400 font-bold">⚠️ 警告：目前操作方向與喊話完全相反！</span>' : ''}
                        </p>
                    </div>
                </div>
            `;
        } else { warningContainer.innerHTML = ''; }
    },

    renderTabs() {
        let tabContainer = document.getElementById('detail-tabs');
        if (!tabContainer) {
            tabContainer = document.createElement('div');
            tabContainer.id = 'detail-tabs';
            tabContainer.className = 'flex overflow-x-auto border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0f1115] no-scrollbar';
            const warning = document.getElementById('liar-warning-container');
            if (warning) warning.after(tabContainer); else document.querySelector('#stock-detail header').after(tabContainer);
        }

        tabContainer.innerHTML = this.tabs.map(tab => `
            <button class="flex-none px-6 py-3 text-sm font-medium transition-colors ${this.currentTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}"
                    onclick="window.StockDetail.switchTab('${tab}')">${tab}</button>
        `).join('');
    },

    async switchTab(tab) {
        this.currentTab = tab;
        this.renderTabs();
        const contentContainer = document.querySelector('#stock-detail .flex-1');
        contentContainer.innerHTML = '<div class="flex items-center justify-center h-full"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>';

        try {
            switch (tab) {
                case '走勢':
                case 'K線': await this.renderKLineTab(contentContainer); break;
                case '健檢': await this.renderHealthTab(contentContainer); break;
                case '盤面': await this.renderMarketTab(contentContainer); break;
                case '基本': await this.renderFundamentalTab(contentContainer); break;
                case '營收': await this.renderRevenueTab(contentContainer); break;
                case '獲利': await this.renderProfitTab(contentContainer); break;
                case '股利': await this.renderDividendTab(contentContainer); break;
                case '大股東': await this.renderShareholderTab(contentContainer); break;
                case '明細': await this.renderTradesTab(contentContainer); break;
                default: contentContainer.innerHTML = `<div class="flex items-center justify-center h-full text-gray-500">${tab} 模組開發中...</div>`;
            }
        } catch (err) { contentContainer.innerHTML = `<div class="flex items-center justify-center h-full text-red-500">載入失敗: ${err.message}</div>`; }
    },

    async renderKLineTab(container) {
        container.innerHTML = `<div class="flex-1 flex flex-col h-full overflow-hidden">
            <div id="detail-chart-container" class="w-full h-[320px] md:h-[400px]"></div>
            <div class="flex-1 border-t border-gray-100 dark:border-gray-800 mt-2 p-4 overflow-y-auto no-scrollbar">
                <h4 class="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">最近交易紀錄</h4>
                <div id="detail-quick-trades" class="space-y-2"><div class="text-center py-4 text-gray-500 text-xs">載入中...</div></div>
            </div>
        </div>`;
        
        charts.init('detail-chart-container');
        const [chartData, structureData, trades] = await Promise.all([
            api.fetchChart(this.currentSymbol).catch(() => null),
            api.fetchStructure(this.currentSymbol).catch(() => null),
            db.getAllTrades().catch(() => [])
        ]);
        
        if (chartData) charts.renderKLine(this.currentSymbol, chartData, trades, structureData);
        else document.getElementById('detail-chart-container').innerHTML = `<div class="flex items-center justify-center h-full text-gray-500 text-sm font-bold">暫無 K 線歷史數據</div>`;

        const quickTradesContainer = document.getElementById('detail-quick-trades');
        if (quickTradesContainer) {
            const relevant = trades.filter(t => (t.symbol || t.stock_id || t.stockId || '').split('.')[0] === this.currentSymbol.split('.')[0])
                                 .sort((a, b) => new Date(b.date || b.timestamp) - new Date(a.date || a.timestamp));
            quickTradesContainer.innerHTML = relevant.map(t => {
                const isBuy = (t.side || t.type || '').toLowerCase().includes('buy') || (t.side || t.type || '').includes('買');
                return `<div class="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                    <div class="flex items-center space-x-3">
                        <span class="text-[10px] px-1.5 py-0.5 rounded font-bold ${isBuy ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}">${isBuy ? '買' : '賣'}</span>
                        <span class="text-xs font-mono text-gray-500">${this.parseDate(t.date || t.timestamp)}</span>
                    </div>
                    <div class="text-right">
                        <div class="text-xs font-bold dark:text-white">${this.formatValue(t.shares || t.quantity, 0)} 股</div>
                        <div class="text-[10px] text-gray-400">$${this.formatValue(t.price)}</div>
                    </div>
                </div>`;
            }).join('') || '<div class="text-center py-4 text-gray-500 text-xs">尚無交易紀錄</div>';
        }
    },

    async renderHealthTab(container) {
        const data = await api.fetchHealthData(this.currentSymbol);
        if (!data) { container.innerHTML = `<div class="p-8 text-center text-gray-500">暫無健檢數據</div>`; return; }
        
        // 🚀 修正欄位映射 (health_score, signal)
        const score = data.health_score || data.score || 0;
        const status = data.signal || data.health_status || '未知';
        const risk = data.risk_level || (score > 100 ? '低風險' : '中高風險');
        const advice = data.advice || (score > 100 ? '偏多操作' : '觀望為宜');
        const summary = data.ai_summary || `本股健康得分為 ${score}，目前信號為 ${status}。主要支撐見 ${data.main_force?.cost || '--'}。`;

        const scoreColor = score >= 100 ? 'text-green-500 border-green-500' : 'text-yellow-500 border-yellow-500';
        container.innerHTML = `<div class="p-4 space-y-6">
            <div class="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div class="w-32 h-32 rounded-full border-8 ${scoreColor} flex flex-col items-center justify-center bg-white dark:bg-[#0f1115]">
                    <span class="text-4xl font-bold">${score}</span><span class="text-xs text-gray-500">健康分</span>
                </div>
                <div class="flex-1 ml-6 space-y-3">
                    <div class="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg w-fit"><span class="text-green-500">💚</span><span class="text-sm text-gray-500">健康度:</span><span class="text-sm font-bold text-green-500">${status}</span></div>
                    <div class="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg w-fit"><span class="text-yellow-500">⚠️</span><span class="text-sm text-gray-500">風險度:</span><span class="text-sm font-bold text-yellow-500">${risk}</span></div>
                    <div class="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg w-fit"><span class="text-orange-500">⚡</span><span class="text-sm text-gray-500">操作建議:</span><span class="text-sm font-bold text-orange-500">${advice}</span></div>
                </div>
            </div>
            <div class="bg-purple-50 dark:bg-purple-900/10 rounded-2xl p-6 border border-purple-100 dark:border-purple-800/30">
                <h3 class="text-lg font-bold text-purple-700 dark:text-purple-400 mb-4 flex items-center"><span class="mr-2">✨</span> AI 持股健檢</h3>
                <p class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">${summary}</p>
            </div>
        </div>`;
    },

    async renderMarketTab(container) {
        // 🚀 從 api.fetchQuotes 獲取真實報價數據來填充盤面
        const quoteMap = await api.fetchQuotes([this.currentSymbol]);
        const q = quoteMap[this.currentSymbol] || {};
        
        container.innerHTML = `<div class="p-4 space-y-6">
            <h3 class="text-orange-500 font-bold flex items-center mb-4"><span class="mr-2">⏱️</span> 即時盤面指標</h3>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div class="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col items-center">
                    <span class="text-xs text-gray-500 mb-1">成交價</span><span class="text-lg font-bold ${parseFloat(q.changePercent) >= 0 ? 'text-red-500' : 'text-green-500'}">${this.formatValue(q.price)}</span>
                </div>
                <div class="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col items-center">
                    <span class="text-xs text-gray-500 mb-1">今日漲跌</span><span class="text-lg font-bold ${parseFloat(q.changePercent) >= 0 ? 'text-red-500' : 'text-green-500'}">${q.changePercent}%</span>
                </div>
                <div class="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col items-center">
                    <span class="text-xs text-gray-500 mb-1">數據源</span><span class="text-[10px] font-bold text-blue-400">${q.source || 'OFFLINE'}</span>
                </div>
            </div>
            <div class="p-4 bg-blue-50/30 dark:bg-blue-900/5 rounded-xl border border-blue-100 dark:border-blue-800/20">
                <p class="text-xs text-gray-500">提示：更詳細的即時內外盤、振幅與即時分價圖僅在盤中交易時段透過 Fugle API 完整呈現。</p>
            </div>
        </div>`;
    },

    async renderRevenueTab(container) {
        const data = await api.fetchFinancials(this.currentSymbol, 'monthly');
        if (!data || !data.data) { container.innerHTML = `<div class="p-8 text-center text-gray-500">暫無營收數據</div>`; return; }
        container.innerHTML = `<div class="p-4 space-y-4 flex-1 overflow-y-auto no-scrollbar pb-12">
            <h3 class="text-lg font-bold">營收分析 - ${this.currentSymbol}</h3>
            <div id="revenue-chart" class="w-full h-48 bg-white dark:bg-gray-900 rounded-2xl border p-2"></div>
            <div class="overflow-x-auto bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                <table class="w-full text-xs text-left"><thead class="bg-gray-50 dark:bg-gray-800 text-gray-500"><tr><th class="px-4 py-3">月份</th><th class="px-4 py-3 text-right">營收</th><th class="px-4 py-3 text-right">YoY</th></tr></thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-800">${data.data.map(item => `<tr><td class="px-4 py-3">${item.period}</td><td class="px-4 py-3 text-right font-bold">${this.formatValue(item.value, 0)}</td><td class="px-4 py-3 text-right ${parseFloat(item.yoy) >= 0 ? 'text-red-500' : 'text-green-500'}">${item.yoy}%</td></tr>`).join('')}</tbody></table>
            </div>
        </div>`;
        setTimeout(() => {
            const chart = echarts.init(document.getElementById('revenue-chart'), document.documentElement.classList.contains('dark') ? 'dark' : null);
            const sorted = [...data.data].sort((a, b) => a.date.localeCompare(b.date));
            chart.setOption({ backgroundColor: 'transparent', grid: { top: 20, bottom: 70, left: 50, right: 40 }, tooltip: { trigger: 'axis' }, xAxis: { type: 'category', data: sorted.map(d => d.period), axisLabel: { rotate: 35, fontSize: 10, margin: 15 } }, yAxis: [{ type: 'value', name: '營收', splitLine: { show: false } }, { type: 'value', name: 'YoY', axisLabel: { formatter: '{value}%' } }], series: [{ name: '營收', type: 'bar', data: sorted.map(d => d.value), itemStyle: { color: '#3b82f6' } }, { name: 'YoY', type: 'line', yAxisIndex: 1, data: sorted.map(d => d.yoy), itemStyle: { color: '#ef4444' } }] });
        }, 100);
    },

    async renderProfitTab(container) {
        const data = await api.fetchFinancials(this.currentSymbol, 'quarterly');
        if (!data || !data.data) { container.innerHTML = `<div class="p-8 text-center text-gray-500">暫無獲利數據</div>`; return; }
        container.innerHTML = `<div class="p-4 space-y-6 flex-1 overflow-y-auto no-scrollbar pb-12">
            <h3 class="text-lg font-bold">獲利分析 - ${this.currentSymbol}</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="space-y-2"><h4 class="text-[10px] font-bold text-blue-500">EPS</h4><div id="eps-chart" class="w-full h-40 bg-white dark:bg-gray-900 rounded-2xl border p-2"></div></div>
                <div class="space-y-2"><h4 class="text-[10px] font-bold text-green-500">Margins</h4><div id="margins-chart" class="w-full h-40 bg-white dark:bg-gray-900 rounded-2xl border p-2"></div></div>
                <div class="space-y-2"><h4 class="text-[10px] font-bold text-orange-500">ROE/ROA</h4><div id="returns-chart" class="w-full h-40 bg-white dark:bg-gray-900 rounded-2xl border p-2"></div></div>
            </div>
            <div class="overflow-x-auto bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800"><table class="w-full text-xs text-left"><thead class="bg-gray-50 dark:bg-gray-800 text-gray-500"><tr><th class="px-4 py-3">季度</th><th class="px-4 py-3 text-right">EPS</th><th class="px-4 py-3 text-right">毛利率</th><th class="px-4 py-3 text-right">ROE</th></tr></thead><tbody class="divide-y divide-gray-100 dark:divide-gray-800">${data.data.map(item => `<tr><td class="px-4 py-3">${item.period}</td><td class="px-4 py-3 text-right font-bold">${this.formatValue(item.value)}</td><td class="px-4 py-3 text-right">${item.gm}%</td><td class="px-4 py-3 text-right text-orange-500">${item.roe}%</td></tr>`).join('')}</tbody></table></div>
        </div>`;
        setTimeout(() => {
            const isDark = document.documentElement.classList.contains('dark');
            const sorted = [...data.data].sort((a, b) => a.date.localeCompare(b.date));
            const common = { backgroundColor: 'transparent', grid: { top: 20, bottom: 65, left: 35, right: 5 }, tooltip: { trigger: 'axis' }, xAxis: { type: 'category', data: sorted.map(d => d.period), axisLabel: { fontSize: 8, rotate: 35, margin: 12 } } };
            const epsC = echarts.init(document.getElementById('eps-chart'), isDark ? 'dark' : null); epsC.setOption({ ...common, series: [{ name: 'EPS', type: 'bar', data: sorted.map(d => d.value), itemStyle: { color: '#3b82f6' } }], yAxis: { type: 'value', splitLine: { show: false } } });
            const margC = echarts.init(document.getElementById('margins-chart'), isDark ? 'dark' : null); margC.setOption({ ...common, legend: { data: ['毛利', '營益', '淨利'], bottom: 0, textStyle: { fontSize: 8 } }, series: [{ name: '毛利', type: 'line', data: sorted.map(d => d.gm), smooth: true }, { name: '營益', type: 'line', data: sorted.map(d => d.om), smooth: true }, { name: '淨利', type: 'line', data: sorted.map(d => d.nm), smooth: true }], yAxis: { type: 'value' } });
            const retC = echarts.init(document.getElementById('returns-chart'), isDark ? 'dark' : null); retC.setOption({ ...common, legend: { data: ['ROE', 'ROA'], bottom: 0, textStyle: { fontSize: 8 } }, series: [{ name: 'ROE', type: 'line', data: sorted.map(d => d.roe), smooth: true }, { name: 'ROA', type: 'line', data: sorted.map(d => d.roa), smooth: true }], yAxis: { type: 'value' } });
        }, 100);
    },

    async renderDividendTab(container) {
        const data = await api.fetchFinancials(this.currentSymbol, 'dividends');
        if (!data || !data.data) { container.innerHTML = `<div class="p-8 text-center text-gray-500">暫無股利數據</div>`; return; }
        container.innerHTML = `<div class="p-4 space-y-4 flex-1 overflow-y-auto no-scrollbar pb-12">
            <h3 class="text-lg font-bold">股利政策 - ${this.currentSymbol}</h3>
            <div id="dividend-chart" class="w-full h-48 bg-white dark:bg-gray-900 rounded-2xl border p-2"></div>
            <div class="overflow-x-auto bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800"><table class="w-full text-xs text-left"><thead class="bg-gray-50 dark:bg-gray-800 text-gray-500"><tr><th class="px-4 py-3">除息日</th><th class="px-4 py-3 text-right">現金</th><th class="px-4 py-3 text-right">合計</th></tr></thead><tbody class="divide-y divide-gray-100 dark:divide-gray-800">${data.data.map(item => `<tr><td class="px-4 py-3">${item.date}</td><td class="px-4 py-3 text-right">${this.formatValue(item.cash)}</td><td class="px-4 py-3 text-right font-bold text-blue-500">${this.formatValue(item.value)}</td></tr>`).join('')}</tbody></table></div>
        </div>`;
        setTimeout(() => {
            const chart = echarts.init(document.getElementById('dividend-chart'), document.documentElement.classList.contains('dark') ? 'dark' : null);
            const sorted = [...data.data].sort((a, b) => a.date.localeCompare(b.date));
            chart.setOption({ backgroundColor: 'transparent', grid: { top: 20, bottom: 70, left: 40, right: 20 }, tooltip: { trigger: 'axis' }, xAxis: { type: 'category', data: sorted.map(d => d.date), axisLabel: { rotate: 45, fontSize: 9, margin: 15 } }, yAxis: { type: 'value' }, series: [{ name: '股利', type: 'bar', data: sorted.map(d => d.value), itemStyle: { color: '#3b82f6' } }] });
        }, 100);
    },

    async renderShareholderTab(container) {
        const [data, chartData] = await Promise.all([api.fetchShareholders(this.currentSymbol), api.fetchChart(this.currentSymbol).catch(() => null)]);
        if (!data) { container.innerHTML = `<div class="p-8 text-center text-gray-500">暫無大股東數據</div>`; return; }
        
        container.innerHTML = `<div class="p-4 flex flex-col h-full space-y-4 overflow-y-auto no-scrollbar pb-12">
            <h3 class="text-lg font-bold">股權分佈 - ${this.currentSymbol}</h3>
            <div id="shareholder-chart" class="w-full h-56 bg-white dark:bg-gray-900 rounded-2xl border p-2"></div>
            <div class="grid grid-cols-2 gap-3 pb-8">${(data.recent || []).slice(0, 4).map(item => `<div class="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700"><div class="text-[10px] text-gray-500 mb-1">${item.date}</div><div class="flex justify-between items-end"><div><div class="text-base font-bold">${item.percentage}%</div><div class="text-[9px] text-gray-400">大股東持股</div></div><div class="text-xs ${parseFloat(item.diff) >= 0 ? 'text-red-500' : 'text-green-500'}">${parseFloat(item.diff) > 0 ? '▲' : '▼'} ${Math.abs(item.diff)}%</div></div></div>`).join('')}</div>
        </div>`;

        setTimeout(() => {
            const chartDom = document.getElementById('shareholder-chart');
            if (!chartDom) return;
            const chart = echarts.init(chartDom, document.documentElement.classList.contains('dark') ? 'dark' : null);
            
            // 🚀 v2.2.3: 極致強健的日期解析器 (解決 NaN/Invalid Date 崩潰問題)
            const parseToDate = (dateStr) => {
                if (!dateStr) return null;
                try {
                    if (dateStr.includes('-W')) {
                        const parts = dateStr.split('-W');
                        if (parts.length === 2) {
                            const y = parseInt(parts[0]), w = parseInt(parts[1]);
                            const d = new Date(y, 0, 1 + (w - 1) * 7);
                            const day = d.getDay();
                            d.setDate(d.getDate() + (5 - day)); // 推算週五
                            return isNaN(d.getTime()) ? null : d;
                        }
                    }
                    const d = new Date(dateStr);
                    return isNaN(d.getTime()) ? null : d;
                } catch(e) { return null; }
            };

            // 1. 過濾並排序
            const rawItems = (data.recent || []).filter(item => item.date && item.percentage !== undefined);
            const sorted = rawItems.sort((a, b) => {
                const da = parseToDate(a.date), db = parseToDate(b.date);
                if (!da || !db) return 0;
                return da - db;
            });
            
            if (sorted.length === 0) {
                chartDom.innerHTML = `<div class="flex items-center justify-center h-full text-gray-500 text-xs">數據格式異常</div>`;
                return;
            }

            const priceMap = {}; 
            if (chartData && (chartData.timestamp || chartData.timestamps)) { 
                const tsList = chartData.timestamp || chartData.timestamps;
                const clList = chartData.close || [];
                tsList.forEach((ts, idx) => { 
                    try {
                        const iso = new Date(ts * 1000).toISOString().split('T')[0];
                        priceMap[iso] = clList[idx]; 
                    } catch(e) {}
                }); 
            }

            const lineData = sorted.map(d => {
                const targetDate = parseToDate(d.date);
                if (!targetDate) return null;
                
                const targetISO = targetDate.toISOString().split('T')[0];
                if (priceMap[targetISO]) return priceMap[targetISO];
                
                // 擴大搜索範圍至前後 10 天
                const t = targetDate.getTime();
                let closestPrice = null, minDiff = Infinity;
                Object.keys(priceMap).forEach(pd => {
                    const diff = Math.abs(new Date(pd).getTime() - t);
                    if (diff < minDiff && diff <= 86400000 * 10) {
                        minDiff = diff; closestPrice = priceMap[pd];
                    }
                });
                return closestPrice;
            });

            chart.setOption({ 
                backgroundColor: 'transparent', 
                grid: { top: 40, bottom: 80, left: 45, right: 45 }, 
                tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } }, 
                legend: { data: ['持股 %', '股價'], bottom: 5, textStyle: { fontSize: 10 } }, 
                xAxis: { 
                    type: 'category', 
                    data: sorted.map(d => d.date), 
                    axisLabel: { 
                        rotate: 35, 
                        fontSize: 9, 
                        margin: 15, 
                        interval: sorted.length > 15 ? 'auto' : 0 
                    } 
                }, 
                yAxis: [
                    { type: 'value', name: '持股 %', scale: true, position: 'left', splitLine: { show: false }, axisLabel: { fontSize: 9 } }, 
                    { type: 'value', name: '股價', scale: true, position: 'right', splitLine: { lineStyle: { type: 'dashed', opacity: 0.1 } }, axisLabel: { fontSize: 9 } }
                ], 
                series: [
                    { name: '持股 %', type: 'bar', data: sorted.map(d => d.percentage), itemStyle: { color: '#3b82f6', borderRadius: [3, 3, 0, 0] }, barWidth: sorted.length > 20 ? '50%' : '30%' }, 
                    { name: '股價', type: 'line', yAxisIndex: 1, data: lineData, smooth: true, symbol: 'circle', symbolSize: 3, itemStyle: { color: '#ef4444' }, lineStyle: { width: 2 } }
                ] 
            });
            window.addEventListener('resize', () => chart.resize());
        }, 150);
    },

    parseDate(rawDate) {
        if (!rawDate) return '未知日期';
        const s = String(rawDate);
        if (s.length === 8 && /^\d+$/.test(s)) return `${s.substring(0, 4)}/${s.substring(4, 6)}/${s.substring(6, 8)}`;
        if (typeof rawDate === 'number' && rawDate > 1000000000) { const d = new Date(rawDate < 10000000000 ? rawDate * 1000 : rawDate); return d.toLocaleDateString('zh-TW'); }
        const d = new Date(rawDate); return isNaN(d.getTime()) ? s : d.toLocaleDateString('zh-TW');
    },

    async renderTradesTab(container) {
        try {
            const trades = await db.getAllTrades();
            await CorporateActions.loadCorporateActions([this.currentSymbol]);
            const timeline = CorporateActions.buildTransactionTimeline(trades, this.currentSymbol);
            if (timeline.length === 0) { container.innerHTML = `<div class="p-8 text-center text-gray-500">尚無交易紀錄。</div>`; return; }
            timeline.sort((a, b) => b.date.localeCompare(a.date));
            container.innerHTML = `<div class="p-4 flex-1 overflow-y-auto no-scrollbar pb-20"><div class="space-y-4">
                ${timeline.map(item => {
                    if (item.type === 'TRADE') {
                        const side = (item.data.side || item.data.type || '未知').replace('SIDE_', '');
                        const qty = item.data.quantity || item.data.shares || 0;
                        const price = item.data.price || 0;
                        return `<div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800"><div><div class="text-[10px] text-gray-500">${this.parseDate(item.date)}</div><div class="text-sm font-bold ${side.includes('買') || side.includes('BUY') ? 'text-red-500' : 'text-green-500'}">${side}</div></div><div class="text-right"><div class="text-sm font-bold dark:text-white">${this.formatValue(qty, 0)} 股</div><div class="text-xs text-gray-400">$${this.formatValue(price)}</div></div></div>`;
                    } else {
                        return `<div class="p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-dashed border-blue-200 dark:border-blue-800/50"><div class="text-[10px] text-gray-500">${this.parseDate(item.date)}</div><div class="text-xs font-bold text-blue-600 dark:text-blue-400">企業行為：${item.data.type || '股利/拆分'}</div></div>`;
                    }
                }).join('')}
            </div></div>`;
        } catch(err) { container.innerHTML = `<div class="p-8 text-center text-red-500">載入失敗: ${err.message}</div>`; }
    },

    async renderFundamentalTab(container) {
        const [stockInfo, quarterly, quoteMap, etfSnapshot] = await Promise.all([
            api.getStockInfo(this.currentSymbol),
            api.fetchFinancials(this.currentSymbol, 'quarterly'),
            api.fetchQuotes([this.currentSymbol]),
            api.fetchETFHoldings()
        ]);

        const isETF = stockInfo?.official_sector === 'ETF' || stockInfo?.industry === 'ETF';
        if (isETF && etfSnapshot?.[this.currentSymbol]) {
            this.renderETFComposition(container, etfSnapshot[this.currentSymbol]);
            return;
        }

        const price = quoteMap[this.currentSymbol]?.price || 0;
        const sorted = (quarterly?.data || []).sort((a, b) => b.date.localeCompare(a.date));
        const last4 = sorted.slice(0, 4);
        const trailingEPS = last4.reduce((s, q) => s + (q.eps || 0), 0);
        const per = price > 0 && trailingEPS > 0 ? (price / trailingEPS).toFixed(2) : '--';
        const latest = sorted[0] || {};
        const themes = stockInfo?.themes || [];
        const sector = stockInfo?.official_sector || stockInfo?.industry || '--';
        const subIndustry = stockInfo?.sub_industry || '--';

        container.innerHTML = `
            <div class="p-4 space-y-6 flex-1 overflow-y-auto no-scrollbar pb-12">
                <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
                    <h3 class="text-lg font-bold mb-4">${stockInfo?.name || this.currentSymbol}</h3>
                    <div class="grid grid-cols-2 gap-3 text-sm">
                        <div><span class="text-gray-500">產業</span><br><span class="font-bold">${sector}</span></div>
                        <div><span class="text-gray-500">次產業</span><br><span class="font-bold">${subIndustry}</span></div>
                    </div>
                    ${themes.length > 0 ? `
                    <div class="mt-4">
                        <span class="text-xs text-gray-500">主題標籤</span>
                        <div class="flex flex-wrap gap-1.5 mt-1">
                            ${themes.map(t => `<span class="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold">${t}</span>`).join('')}
                        </div>
                    </div>` : ''}
                </div>

                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div class="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                        <div class="text-[10px] text-gray-500 mb-1">本益比 (PER)</div>
                        <div class="text-xl font-bold ${per !== '--' ? 'text-blue-500' : 'text-gray-400'}">${per}x</div>
                    </div>
                    <div class="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                        <div class="text-[10px] text-gray-500 mb-1">每股盈餘 (EPS)</div>
                        <div class="text-xl font-bold">${this.formatValue(latest.eps)}</div>
                        <div class="text-[10px] ${latest.yoy >= 0 ? 'text-red-500' : 'text-green-500'}">YoY ${latest.yoy != null ? `${latest.yoy}%` : '--'}</div>
                    </div>
                    <div class="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                        <div class="text-[10px] text-gray-500 mb-1">ROE</div>
                        <div class="text-xl font-bold text-orange-500">${latest.roe != null ? `${latest.roe}%` : '--'}</div>
                    </div>
                    <div class="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                        <div class="text-[10px] text-gray-500 mb-1">毛利率</div>
                        <div class="text-xl font-bold text-green-500">${latest.gm != null ? `${latest.gm}%` : '--'}</div>
                    </div>
                </div>

                ${quarterly?.data ? `
                <div class="overflow-x-auto bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                    <table class="w-full text-xs text-left">
                        <thead class="bg-gray-50 dark:bg-gray-800 text-gray-500">
                            <tr>
                                <th class="px-4 py-3">季度</th>
                                <th class="px-4 py-3 text-right">EPS</th>
                                <th class="px-4 py-3 text-right">毛利率</th>
                                <th class="px-4 py-3 text-right">營益率</th>
                                <th class="px-4 py-3 text-right">淨利率</th>
                                <th class="px-4 py-3 text-right">ROE</th>
                                <th class="px-4 py-3 text-right">ROA</th>
                                <th class="px-4 py-3 text-right">YoY</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                            ${sorted.slice(0, 8).map(item => `
                            <tr>
                                <td class="px-4 py-3 font-medium">${item.period}</td>
                                <td class="px-4 py-3 text-right font-bold">${this.formatValue(item.eps)}</td>
                                <td class="px-4 py-3 text-right">${item.gm != null ? item.gm + '%' : '--'}</td>
                                <td class="px-4 py-3 text-right">${item.om != null ? item.om + '%' : '--'}</td>
                                <td class="px-4 py-3 text-right">${item.nm != null ? item.nm + '%' : '--'}</td>
                                <td class="px-4 py-3 text-right text-orange-500">${item.roe != null ? item.roe + '%' : '--'}</td>
                                <td class="px-4 py-3 text-right">${item.roa != null ? item.roa + '%' : '--'}</td>
                                <td class="px-4 py-3 text-right ${item.yoy >= 0 ? 'text-red-500' : 'text-green-500'}">${item.yoy != null ? item.yoy + '%' : '--'}</td>
                            </tr>`).join('')}
                        </tbody>
                    </table>
                </div>` : '<div class="p-8 text-center text-gray-500">暫無財務數據</div>'}
            </div>`;
    },

    renderETFComposition(container, etfData) {
        const holdings = [...etfData.holdings].sort((a, b) => b.weight - a.weight);
        const top10 = holdings.slice(0, 10);
        const others = holdings.slice(10);
        const othersWeight = others.reduce((s, h) => s + (h.weight || 0), 0);

        container.innerHTML = `
            <div class="p-4 space-y-4 flex-1 overflow-y-auto no-scrollbar pb-12">
                <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
                    <h3 class="text-lg font-bold">${etfData.name}</h3>
                    <div class="flex items-center space-x-3 mt-2">
                        <span class="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-bold">${etfData.category || '--'}</span>
                        <span class="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">${etfData.data_mode === 'full_holdings' ? '完整揭露' : '前幾大持股'}</span>
                    </div>
                </div>

                <div id="etf-pie-chart" class="w-full h-64 bg-white dark:bg-gray-900 rounded-2xl border p-2"></div>

                <div class="overflow-x-auto bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                    <table class="w-full text-xs text-left">
                        <thead class="bg-gray-50 dark:bg-gray-800 text-gray-500">
                            <tr>
                                <th class="px-4 py-3">#</th>
                                <th class="px-4 py-3">代碼</th>
                                <th class="px-4 py-3">名稱</th>
                                <th class="px-4 py-3 text-right">權重</th>
                                <th class="px-4 py-3">佔比</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                            ${holdings.map((h, i) => `
                            <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <td class="px-4 py-3 text-gray-400">${i + 1}</td>
                                <td class="px-4 py-3 font-bold font-mono">${h.stock_id}</td>
                                <td class="px-4 py-3">${h.stock_name}</td>
                                <td class="px-4 py-3 text-right font-bold">${h.weight.toFixed(2)}%</td>
                                <td class="px-4 py-3">
                                    <div class="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                        <div class="bg-blue-500 rounded-full h-1.5" style="width: ${Math.min(h.weight * 3, 100)}%"></div>
                                    </div>
                                </td>
                            </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;

        setTimeout(() => {
            const chartDom = document.getElementById('etf-pie-chart');
            if (!chartDom) return;
            const chart = echarts.init(chartDom, document.documentElement.classList.contains('dark') ? 'dark' : null);
            const pieData = top10.map(h => ({ name: h.stock_name, value: h.weight }));
            if (othersWeight > 0) pieData.push({ name: '其他', value: othersWeight });
            chart.setOption({
                backgroundColor: 'transparent',
                tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
                series: [{ type: 'pie', radius: ['30%', '60%'], center: ['50%', '50%'], data: pieData, label: { fontSize: 10, formatter: '{b}\n{d}%' }, itemStyle: { borderRadius: 4 } }]
            });
            window.addEventListener('resize', () => chart.resize());
        }, 100);
    },

    formatValue(val, decimals = 2) {
        if (val === undefined || val === null || isNaN(val)) return '--';
        return new Intl.NumberFormat('zh-TW', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(val);
    }
};

window.StockDetail = StockDetail;
