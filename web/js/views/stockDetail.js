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
    tabs: ['走勢', 'K線', '健檢', '盤面', '營收', '獲利', '股利', '大股東', '明細'], // 隱藏未開發的: '新聞', '基本', '圖表'

    async show(symbol) {
        this.currentSymbol = symbol;
        const overlay = document.getElementById('stock-detail');
        if (!overlay) return;

        overlay.classList.remove('hidden');
        
        // 抓取說謊偵測數據並渲染警告標籤
        let liarData = null;
        try {
            liarData = await api.fetchLiarData();
        } catch(e) {
            console.warn("fetchLiarData failed, using fallback:", e);
        }
        this.renderLiarWarning(liarData);

        this.renderTabs();
        this.switchTab(this.currentTab);
        
        // Update header info (might need to fetch quote if not available)
        const detailSymbolEl = document.getElementById('detail-symbol');
        if (detailSymbolEl) detailSymbolEl.textContent = symbol;

        this.updateFavoriteUI();
        
        // Bind favorite toggle (only once, avoid duplicate bindings)
        const toggleBtn = document.getElementById('toggle-favorite-btn');
        if (toggleBtn) {
            // Remove old listeners by cloning
            const newBtn = toggleBtn.cloneNode(true);
            toggleBtn.parentNode.replaceChild(newBtn, toggleBtn);
            
            newBtn.addEventListener('click', () => {
                if (window.Favorites) {
                    const result = window.Favorites.toggleFavorite(this.currentSymbol);
                    this.updateFavoriteUI();
                    // Optional: show small toast or alert
                    console.log(`Favorite toggled: ${result.action} in ${result.category}`);
                }
            });
        }
    },

    updateFavoriteUI() {
        const toggleBtn = document.getElementById('toggle-favorite-btn');
        if (!toggleBtn) return;
        
        if (window.Favorites && window.Favorites.isFavorite(this.currentSymbol)) {
            toggleBtn.classList.add('text-red-500');
            toggleBtn.classList.remove('text-gray-300');
        } else {
            toggleBtn.classList.remove('text-red-500');
            toggleBtn.classList.add('text-gray-300');
        }
    },

    renderLiarWarning(data) {
        let warningContainer = document.getElementById('liar-warning-container');
        if (!warningContainer) {
            warningContainer = document.createElement('div');
            warningContainer.id = 'liar-warning-container';
            const header = document.querySelector('#stock-detail header');
            header.after(warningContainer);
        }

        const liar = data?.data?.find(item => item.stockId === this.currentSymbol);
        if (liar) {
            warningContainer.innerHTML = `
                <div class="m-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center shadow-sm">
                    <div class="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center mr-4 flex-none">
                        <span class="text-white text-lg font-bold">!</span>
                    </div>
                    <div class="flex-1">
                        <div class="flex justify-between items-center mb-1">
                            <h4 class="text-red-500 font-bold text-sm">🚨 外資誠實度嚴重警告！</h4>
                            <span class="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded font-bold">說謊指數: ${liar.lyingScore}</span>
                        </div>
                        <p class="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                            ${liar.brokerName}喊多本股至 <span class="font-bold text-red-500">${liar.targetPrice}</span> 元，但近日分點私下狂${liar.netVolume < 0 ? '倒貨' : '吸籌'} <span class="font-bold text-blue-500">${Math.abs(liar.netVolume)}</span> 張！
                        </p>
                    </div>
                </div>
            `;
        } else {
            warningContainer.innerHTML = '';
        }
    },

    renderTabs() {
        const header = document.querySelector('#stock-detail header');
        const warning = document.getElementById('liar-warning-container');
        let tabContainer = document.getElementById('detail-tabs');
        
        if (!tabContainer) {
            tabContainer = document.createElement('div');
            tabContainer.id = 'detail-tabs';
            tabContainer.className = 'flex overflow-x-auto border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0f1115] no-scrollbar';
            
            // 如果有警告標籤，放在警告標籤後面，否則放在 header 後面
            if (warning) {
                warning.after(tabContainer);
            } else {
                header.after(tabContainer);
            }
        }

        tabContainer.innerHTML = this.tabs.map(tab => `
            <button class="flex-none px-6 py-3 text-sm font-medium transition-colors ${this.currentTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}"
                    onclick="window.StockDetail.switchTab('${tab}')">
                ${tab}
            </button>
        `).join('');
    },

    async switchTab(tab) {
        this.currentTab = tab;
        this.renderTabs();
        
        const contentContainer = document.querySelector('#stock-detail .flex-1');
        contentContainer.innerHTML = '<div class="flex items-center justify-center h-full"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>';

        try {
            switch (tab) {
                case 'K線':
                    await this.renderKLineTab(contentContainer);
                    break;
                case '健檢':
                    await this.renderHealthTab(contentContainer);
                    break;
                case '盤面':
                    await this.renderMarketTab(contentContainer);
                    break;
                case '營收':
                    await this.renderRevenueTab(contentContainer);
                    break;
                case '獲利':
                    await this.renderProfitTab(contentContainer);
                    break;
                case '股利':
                    await this.renderDividendTab(contentContainer);
                    break;
                case '大股東':
                    await this.renderShareholderTab(contentContainer);
                    break;
                case '明細':
                    await this.renderTradesTab(contentContainer);
                    break;
                default:
                    contentContainer.innerHTML = `<div class="flex items-center justify-center h-full text-gray-500">${tab} 模組開發中...</div>`;
            }
        } catch (err) {
            contentContainer.innerHTML = `<div class="flex items-center justify-center h-full text-red-500">載入失敗: ${err.message}</div>`;
        }
    },

    async renderRevenueTab(container) {
        const data = await api.fetchFinancials(this.currentSymbol, 'monthly');
        if (!data || !data.data || data.data.length === 0) {
            container.innerHTML = `<div class="p-8 text-center text-gray-500">暫無營收數據</div>`;
            return;
        }

        container.innerHTML = `
            <div class="p-4 space-y-8 flex-1 overflow-y-auto no-scrollbar pb-12">
                <h3 class="text-lg font-bold text-gray-900 dark:text-white">營收成長分析 - ${this.currentSymbol}</h3>
                <div class="space-y-3">
                    <h4 class="text-sm font-bold text-blue-500">每月營收與 YoY</h4>
                    <div id="revenue-chart" class="w-full h-64 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-2"></div>
                </div>
                <div class="space-y-3">
                    <h4 class="text-sm font-bold text-gray-400 uppercase">營收明細表格</h4>
                    <div class="overflow-x-auto bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                        <table class="w-full text-xs text-left">
                            <thead class="bg-gray-50 dark:bg-gray-800 text-gray-500">
                                <tr>
                                    <th class="px-4 py-3">月份</th>
                                    <th class="px-4 py-3 text-right">營收 (千元)</th>
                                    <th class="px-4 py-3 text-right">YoY</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                                ${data.data.map(item => `
                                    <tr>
                                        <td class="px-4 py-3 font-mono">${item.period}</td>
                                        <td class="px-4 py-3 text-right font-mono font-bold">${this.formatValue(item.value, 0)}</td>
                                        <td class="px-4 py-3 text-right font-mono ${parseFloat(item.yoy) >= 0 ? 'text-red-500' : 'text-green-500'}">
                                            ${item.yoy ? (parseFloat(item.yoy) > 0 ? '+' : '') + item.yoy + '%' : '--'}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        setTimeout(() => {
            const chartDom = document.getElementById('revenue-chart');
            if (!chartDom) return;
            const isDark = document.documentElement.classList.contains('dark');
            const myChart = echarts.init(chartDom, isDark ? 'dark' : null);
            const sorted = [...data.data].sort((a, b) => a.date.localeCompare(b.date));
            myChart.setOption({
                backgroundColor: 'transparent',
                grid: { top: 40, bottom: 40, left: 60, right: 50 },
                tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
                legend: { data: ['月營收', 'YoY %'], bottom: 0, textStyle: { fontSize: 10 } },
                xAxis: { type: 'category', data: sorted.map(d => d.period), axisLabel: { fontSize: 9 } },
                yAxis: [{ type: 'value', name: '營收', splitLine: { show: false } }, { type: 'value', name: 'YoY %', axisLabel: { formatter: '{value}%' } }],
                series: [
                    { name: '月營收', type: 'bar', data: sorted.map(d => d.value), itemStyle: { color: '#3b82f6', borderRadius: [2, 2, 0, 0] } },
                    { name: 'YoY %', type: 'line', yAxisIndex: 1, data: sorted.map(d => d.yoy), smooth: true, lineStyle: { color: '#ef4444', width: 2 }, itemStyle: { color: '#ef4444' } }
                ]
            });
            window.addEventListener('resize', () => myChart.resize());
        }, 100);
    },

    async renderDividendTab(container) {
        const data = await api.fetchFinancials(this.currentSymbol, 'dividends');
        if (!data || !data.data || data.data.length === 0) {
            container.innerHTML = `<div class="p-8 text-center text-gray-500">暫無股利數據</div>`;
            return;
        }

        container.innerHTML = `
            <div class="p-4 space-y-8 flex-1 overflow-y-auto no-scrollbar pb-12">
                <h3 class="text-lg font-bold text-gray-900 dark:text-white">股利政策分析 - ${this.currentSymbol}</h3>
                <div class="space-y-3">
                    <h4 class="text-sm font-bold text-orange-500">歷年除息記錄</h4>
                    <div id="dividend-chart" class="w-full h-64 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-2"></div>
                </div>
                <div class="space-y-3">
                    <h4 class="text-sm font-bold text-gray-400 uppercase">股利明細表格</h4>
                    <div class="overflow-x-auto bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                        <table class="w-full text-xs text-left">
                            <thead class="bg-gray-50 dark:bg-gray-800 text-gray-500">
                                <tr>
                                    <th class="px-4 py-3">除息日</th>
                                    <th class="px-4 py-3 text-right">現金股利</th>
                                    <th class="px-4 py-3 text-right">股票股利</th>
                                    <th class="px-4 py-3 text-right">合計</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                                ${data.data.map(item => `
                                    <tr>
                                        <td class="px-4 py-3 font-mono">${item.date}</td>
                                        <td class="px-4 py-3 text-right font-mono">${this.formatValue(item.cash)}</td>
                                        <td class="px-4 py-3 text-right font-mono">${this.formatValue(item.stock)}</td>
                                        <td class="px-4 py-3 text-right font-mono font-bold text-blue-500">${this.formatValue(item.value)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        setTimeout(() => {
            const chartDom = document.getElementById('dividend-chart');
            if (!chartDom) return;
            const isDark = document.documentElement.classList.contains('dark');
            const myChart = echarts.init(chartDom, isDark ? 'dark' : null);
            const sorted = [...data.data].sort((a, b) => a.date.localeCompare(b.date));
            myChart.setOption({
                backgroundColor: 'transparent',
                grid: { top: 40, bottom: 40, left: 50, right: 20 },
                tooltip: { trigger: 'axis' },
                legend: { data: ['現金股利', '股票股利'], bottom: 0, textStyle: { fontSize: 10 } },
                xAxis: { type: 'category', data: sorted.map(d => d.date), axisLabel: { fontSize: 9, rotate: 45 } },
                yAxis: { type: 'value', name: '股利金額', splitLine: { lineStyle: { type: 'dashed' } } },
                series: [
                    { name: '現金股利', type: 'bar', stack: 'total', data: sorted.map(d => d.cash), itemStyle: { color: '#3b82f6' } },
                    { name: '股票股利', type: 'bar', stack: 'total', data: sorted.map(d => d.stock), itemStyle: { color: '#10b981' } }
                ]
            });
            window.addEventListener('resize', () => myChart.resize());
        }, 100);
    },

    async renderKLineTab(container) {
        container.innerHTML = `
            <div class="flex-1 flex flex-col h-full">
                <!-- 🚀 縮減高度，確保下方內容可見 -->
                <div id="detail-chart-container" class="w-full h-[380px]"></div>
            </div>
        `;
        
        charts.init('detail-chart-container');
        const [chartData, structureData, trades] = await Promise.all([
            api.fetchChart(this.currentSymbol).catch(e => { console.warn("fetchChart failed:", e); return null; }),
            api.fetchStructure(this.currentSymbol).catch(e => { console.warn("fetchStructure failed:", e); return null; }),
            db.getAllTrades().catch(e => { console.warn("getAllTrades failed:", e); return []; })
        ]);
        
        if (!chartData) {
            const containerDom = document.getElementById('detail-chart-container');
            if (containerDom) {
                containerDom.innerHTML = `
                    <div class="flex flex-col items-center justify-center h-full space-y-2 py-12 text-center">
                        <svg class="w-12 h-12 text-gray-300 dark:text-gray-700 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 12l3-3 3 3 4-4M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <div class="text-gray-500 dark:text-gray-400 font-bold">暫無 K 線歷史數據</div>
                        <div class="text-xs text-gray-450 dark:text-gray-550 max-w-xs">請檢查網路連線或 API Key 是否正確。地端離線模式下可能無此個股之歷史 K 線檔案。</div>
                    </div>
                `;
            }
            return;
        }
        
        charts.renderKLine(this.currentSymbol, chartData, trades, structureData);
    },

    async renderProfitTab(container) {
        const data = await api.fetchFinancials(this.currentSymbol, 'quarterly');
        if (!data || !data.data || data.data.length === 0) {
            container.innerHTML = `<div class="p-8 text-center text-gray-500">暫無獲利數據</div>`;
            return;
        }

        container.innerHTML = `
            <div class="p-4 space-y-8 flex-1 overflow-y-auto no-scrollbar pb-12">
                <h3 class="text-lg font-bold text-gray-900 dark:text-white">獲利能力分析 - ${this.currentSymbol}</h3>
                <div class="space-y-3">
                    <h4 class="text-sm font-bold text-blue-500">每股盈餘 (EPS)</h4>
                    <div id="eps-chart" class="w-full h-48 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-2"></div>
                </div>
                <div class="space-y-3">
                    <h4 class="text-sm font-bold text-green-500">利潤率 (Margins)</h4>
                    <div id="margins-chart" class="w-full h-48 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-2"></div>
                </div>
                <div class="space-y-3">
                    <h4 class="text-sm font-bold text-orange-500">報酬率 (ROE / ROA)</h4>
                    <div id="returns-chart" class="w-full h-48 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-2"></div>
                </div>
                <div class="space-y-3">
                    <h4 class="text-sm font-bold text-gray-400 uppercase">財務明細表格</h4>
                    <div class="overflow-x-auto bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                        <table class="w-full text-xs text-left">
                            <thead class="bg-gray-50 dark:bg-gray-800 text-gray-500">
                                <tr>
                                    <th class="px-4 py-3">季度</th>
                                    <th class="px-4 py-3 text-right">EPS</th>
                                    <th class="px-4 py-3 text-right">毛利率</th>
                                    <th class="px-4 py-3 text-right">營益率</th>
                                    <th class="px-4 py-3 text-right">ROE</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                                ${data.data.map(item => `
                                    <tr>
                                        <td class="px-4 py-3 font-mono">${item.period}</td>
                                        <td class="px-4 py-3 text-right font-mono font-bold">${this.formatValue(item.value)}</td>
                                        <td class="px-4 py-3 text-right font-mono">${this.formatValue(item.gm)}%</td>
                                        <td class="px-4 py-3 text-right font-mono">${this.formatValue(item.om)}%</td>
                                        <td class="px-4 py-3 text-right font-mono text-orange-500">${this.formatValue(item.roe)}%</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        setTimeout(() => {
            const isDark = document.documentElement.classList.contains('dark');
            const sorted = [...data.data].sort((a, b) => a.date.localeCompare(b.date));
            const common = { backgroundColor: 'transparent', grid: { top: 30, bottom: 25, left: 40, right: 10 }, tooltip: { trigger: 'axis' }, xAxis: { type: 'category', data: sorted.map(d => d.period), axisLabel: { fontSize: 9 } } };
            const epsC = echarts.init(document.getElementById('eps-chart'), isDark ? 'dark' : null);
            epsC.setOption({ ...common, series: [{ name: 'EPS', type: 'bar', data: sorted.map(d => d.value), itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] }, label: { show: true, position: 'top', fontSize: 9 } }], yAxis: { type: 'value', splitLine: { show: false } } });
            const margC = echarts.init(document.getElementById('margins-chart'), isDark ? 'dark' : null);
            margC.setOption({ ...common, legend: { data: ['毛利率', '營益率', '淨利率'], bottom: 0, textStyle: { fontSize: 9 } }, grid: { ...common.grid, bottom: 40 }, series: [{ name: '毛利率', type: 'line', data: sorted.map(d => d.gm), smooth: true }, { name: '營益率', type: 'line', data: sorted.map(d => d.om), smooth: true }, { name: '淨利率', type: 'line', data: sorted.map(d => d.nm), smooth: true }], yAxis: { type: 'value', axisLabel: { formatter: '{value}%' } } });
            const retC = echarts.init(document.getElementById('returns-chart'), isDark ? 'dark' : null);
            retC.setOption({ ...common, legend: { data: ['ROE', 'ROA'], bottom: 0, textStyle: { fontSize: 9 } }, grid: { ...common.grid, bottom: 40 }, series: [{ name: 'ROE', type: 'line', data: sorted.map(d => d.roe), smooth: true }, { name: 'ROA', type: 'line', data: sorted.map(d => d.roa), smooth: true }], yAxis: { type: 'value', axisLabel: { formatter: '{value}%' } } });
            window.addEventListener('resize', () => { epsC.resize(); margC.resize(); retC.resize(); });
        }, 100);
    },

    async renderShareholderTab(container) {
        const [data, chartData] = await Promise.all([
            api.fetchShareholders(this.currentSymbol),
            api.fetchChart(this.currentSymbol).catch(() => null)
        ]);

        if (!data) {
            container.innerHTML = `<div class="p-8 text-center text-gray-500">暫無大股東數據</div>`;
            return;
        }

        container.innerHTML = `
            <div class="p-4 flex flex-col h-full space-y-6">
                <h3 class="text-lg font-bold text-gray-900 dark:text-white">股權分佈與股價走勢 - ${this.currentSymbol}</h3>
                
                <!-- Chart Container -->
                <div id="shareholder-chart" class="w-full h-64 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-2"></div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${(data.recent || []).slice(0, 4).map(item => `
                        <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                            <div class="text-xs text-gray-500 mb-1">${item.date}</div>
                            <div class="flex justify-between items-end">
                                <div>
                                    <div class="text-lg font-bold text-gray-900 dark:text-white">${item.percentage}%</div>
                                    <div class="text-[10px] text-gray-400">大股東持股比例</div>
                                </div>
                                <div class="text-right">
                                    <div class="text-sm ${parseFloat(item.diff) >= 0 ? 'text-red-500' : 'text-green-500'}">
                                        ${parseFloat(item.diff) > 0 ? '▲' : '▼'} ${Math.abs(item.diff)}%
                                    </div>
                                    <div class="text-[10px] text-gray-400">週變動</div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Render Chart
        setTimeout(() => {
            const chartDom = document.getElementById('shareholder-chart');
            if (!chartDom) return;
            const isDark = document.documentElement.classList.contains('dark');
            const myChart = echarts.init(chartDom, isDark ? 'dark' : null);

            const sortedRecent = [...(data.recent || [])].sort((a, b) => a.date.localeCompare(b.date));
            const xData = sortedRecent.map(d => d.date);
            const barData = sortedRecent.map(d => d.percentage);
            
            // Map prices to the same dates if available
            const priceMap = {};
            if (chartData && chartData.timestamp) {
                chartData.timestamp.forEach((ts, idx) => {
                    const d = new Date(ts * 1000).toISOString().split('T')[0];
                    priceMap[d] = chartData.close[idx];
                });
            }
            const lineData = xData.map(d => priceMap[d] || null);

            const option = {
                backgroundColor: 'transparent',
                grid: { top: 40, bottom: 30, left: 50, right: 50 },
                tooltip: {
                    trigger: 'axis',
                    axisPointer: { type: 'cross' }
                },
                legend: {
                    data: ['大股東持股 %', '收盤價'],
                    textStyle: { color: isDark ? '#9ca3af' : '#4b5563' }
                },
                xAxis: {
                    type: 'category',
                    data: xData,
                    axisLabel: { color: '#6b7280', fontSize: 10 }
                },
                yAxis: [
                    {
                        type: 'value',
                        name: '持股 %',
                        min: function(value) { return Math.max(0, value.min - 2); },
                        max: function(value) { return Math.min(100, value.max + 2); },
                        position: 'left',
                        splitLine: { show: false },
                        axisLabel: { color: '#6b7280' }
                    },
                    {
                        type: 'value',
                        name: '股價',
                        scale: true,
                        position: 'right',
                        splitLine: { lineStyle: { type: 'dashed', color: isDark ? '#374151' : '#e5e7eb' } },
                        axisLabel: { color: '#6b7280' }
                    }
                ],
                series: [
                    {
                        name: '大股東持股 %',
                        type: 'bar',
                        data: barData,
                        itemStyle: { 
                            color: '#3b82f6',
                            borderRadius: [4, 4, 0, 0],
                            opacity: 0.8
                        },
                        barWidth: '40%'
                    },
                    {
                        name: '收盤價',
                        type: 'line',
                        yAxisIndex: 1,
                        data: lineData,
                        smooth: true,
                        showSymbol: false,
                        lineStyle: { color: '#ef4444', width: 2 },
                        itemStyle: { color: '#ef4444' }
                    }
                ]
            };

            myChart.setOption(option);
            window.addEventListener('resize', () => myChart.resize());
        }, 100);
    },

    parseDate(rawDate) {
        if (!rawDate) return '未知日期';
        // Handle YYYYMMDD string or number
        const s = String(rawDate);
        if (s.length === 8 && /^\d+$/.test(s)) {
            return `${s.substring(0, 4)}/${s.substring(4, 6)}/${s.substring(6, 8)}`;
        }
        const d = new Date(rawDate);
        if (isNaN(d.getTime())) return '日期格式錯誤';
        return d.toLocaleDateString('zh-TW');
    },

    async renderTradesTab(container) {
        try {
            const trades = await db.getAllTrades();
            await CorporateActions.loadCorporateActions([this.currentSymbol]);
            const timeline = CorporateActions.buildTransactionTimeline(trades, this.currentSymbol);

            if (timeline.length === 0) {
                container.innerHTML = `<div class="p-8 text-center text-gray-500">尚無交易或企業行為紀錄。</div>`;
                return;
            }

            // Timeline reverse sort (newest on top)
            timeline.sort((a, b) => {
                if (a.date !== b.date) return b.date.localeCompare(a.date);
                return a.type === 'ACTION' ? -1 : 1; // Actions after trades on same day
            });

            container.innerHTML = `
                <div class="p-4 flex-1 overflow-y-auto max-h-[calc(100vh-250px)] no-scrollbar">
                    <h3 class="text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider">個股交易與股權變動時間軸</h3>
                    <div class="space-y-4 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100 dark:before:bg-gray-800">
                        ${timeline.map(item => {
                            if (item.type === 'TRADE') {
                                const t = item.data;
                                const type = (t.side || t.type || '').toLowerCase();
                                const isBuy = type.includes('買') || type.includes('buy');
                                return `
                                    <div class="relative pl-10">
                                        <div class="absolute left-0 top-1 w-10 h-10 rounded-full bg-white dark:bg-[#0f1115] border-2 ${isBuy ? 'border-red-500' : 'border-green-500'} flex items-center justify-center z-10 shadow-sm">
                                            <span class="text-xs font-bold ${isBuy ? 'text-red-500' : 'text-green-500'}">${isBuy ? '買' : '賣'}</span>
                                        </div>
                                        <div class="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-gray-200 transition-colors">
                                            <div class="flex justify-between items-start mb-1">
                                                <div class="text-[10px] font-mono text-gray-500">${this.parseDate(item.date)}</div>
                                                <div class="font-mono font-bold text-gray-900 dark:text-white">${this.formatValue(t.quantity || t.shares, 0)} 股</div>
                                            </div>
                                            <div class="flex justify-between items-end">
                                                <div class="text-sm font-bold ${isBuy ? 'text-red-500' : 'text-green-500'}">${isBuy ? '買入買進' : '賣出結算'}</div>
                                                <div class="text-xs text-gray-400">成交價 $${this.formatValue(t.price)}</div>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            } else {
                                const a = item.data;
                                const type = a.type.toUpperCase();
                                let color = 'border-yellow-500 text-yellow-600';
                                let icon = '💰';
                                let desc = '';
                                
                                if (type === 'DIVIDEND' || type === 'CASH_DIVIDEND') {
                                    desc = `配息 $${a.cash_dividend || 0}`;
                                    if (a.stock_dividend > 0) {
                                        desc += ` + 配股 ${a.stock_dividend} 元`;
                                        color = 'border-green-500 text-green-600';
                                        icon = '📈';
                                    }
                                } else if (type === 'REDUCTION') {
                                    desc = `減資 ${(a.capital_reduction * 100).toFixed(1)}%`;
                                    color = 'border-red-400 text-red-500';
                                    icon = '🔻';
                                } else if (type === 'SPLIT') {
                                    desc = `拆分比例 ${a.split_ratio}:1`;
                                    color = 'border-blue-400 text-blue-500';
                                    icon = '🔄';
                                }

                                return `
                                    <div class="relative pl-10">
                                        <div class="absolute left-0 top-1 w-10 h-10 rounded-full bg-white dark:bg-[#0f1115] border-2 ${color.split(' ')[0]} flex items-center justify-center z-10 shadow-sm">
                                            <span class="text-sm">${icon}</span>
                                        </div>
                                        <div class="bg-gray-50/50 dark:bg-gray-900/30 p-3 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                                            <div class="text-[10px] font-mono text-gray-500 mb-1">${this.parseDate(item.date)}</div>
                                            <div class="text-sm font-bold ${color.split(' ')[1]} italic">企業行為：${desc}</div>
                                        </div>
                                    </div>
                                `;
                            }
                        }).join('')}
                    </div>
                </div>
            `;
        } catch(err) {
            console.error('renderTradesTab failed:', err);
            container.innerHTML = `<div class="p-8 text-center text-red-500">明細載入失敗: ${err.message}</div>`;
        }
    },

    async renderFavoriteTab(container) {
        if (!window.Favorites) {
            container.innerHTML = `<div class="p-8 text-center text-gray-500">收藏模組未就緒</div>`;
            return;
        }

        const categories = window.Favorites._categories;
        const currentData = window.Favorites._data;
        
        container.innerHTML = `
            <div class="p-4 space-y-6">
                <h3 class="text-lg font-bold">收藏管理 - ${this.currentSymbol}</h3>
                <p class="text-sm text-gray-500">請選擇要將此股票加入的收藏分類（可複選）：</p>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    ${categories.map((cat, idx) => {
                        const isInCategory = currentData[cat] && currentData[cat].includes(this.currentSymbol);
                        return `
                            <button class="favorite-cat-item p-4 rounded-xl border-2 transition-all flex justify-between items-center
                                ${isInCategory ? 'border-blue-500 bg-blue-500/10 text-blue-600' : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-500 hover:border-gray-400'}"
                                onclick="StockDetail.toggleCategory('${cat}', this)">
                                <span class="font-bold">${cat}</span>
                                ${isInCategory ? '<span>✅</span>' : '<span>+</span>'}
                            </button>
                        `;
                    }).join('')}
                </div>
                
                <div class="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                    💡 您可以在「我的收藏」分頁中修改分類名稱或查看完整清單。
                </div>
            </div>
        `;
    },

    toggleCategory(category, element) {
        if (!window.Favorites) return;
        
        const symbols = window.Favorites._data[category] || [];
        const isCurrentlyIn = symbols.includes(this.currentSymbol);
        
        if (isCurrentlyIn) {
            window.Favorites._data[category] = symbols.filter(s => s !== this.currentSymbol);
            element.classList.remove('border-blue-500', 'bg-blue-500/10', 'text-blue-600');
            element.classList.add('border-gray-200', 'dark:border-gray-800', 'bg-gray-50', 'dark:bg-gray-900', 'text-gray-500');
            element.querySelector('span:last-child').textContent = '+';
        } else {
            if (!window.Favorites._data[category]) window.Favorites._data[category] = [];
            window.Favorites._data[category].push(this.currentSymbol);
            element.classList.add('border-blue-500', 'bg-blue-500/10', 'text-blue-600');
            element.classList.remove('border-gray-200', 'dark:border-gray-800', 'bg-gray-50', 'dark:bg-gray-900', 'text-gray-500');
            element.querySelector('span:last-child').textContent = '✅';
        }
        
        window.Favorites.saveData();
        this.updateFavoriteUI();
    },

    async renderHealthTab(container) {
        const data = await api.fetchHealthData(this.currentSymbol);
        if (!data) {
            container.innerHTML = `<div class="p-8 text-center text-gray-500">暫無健檢數據</div>`;
            return;
        }

        const scoreColor = data.score >= 100 ? 'text-green-500 border-green-500' : 'text-yellow-500 border-yellow-500';
        
        container.innerHTML = `
            <div class="p-4 space-y-6">
                <!-- Score Card -->
                <div class="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div class="w-32 h-32 rounded-full border-8 ${scoreColor} flex flex-col items-center justify-center bg-white dark:bg-[#0f1115]">
                        <span class="text-4xl font-bold">${data.score}</span>
                        <span class="text-xs text-gray-500">健康分</span>
                    </div>
                    <div class="flex-1 ml-6 space-y-3">
                        <div class="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg w-fit">
                            <span class="text-green-500">💚</span>
                            <span class="text-sm text-gray-500 dark:text-gray-400">健康度:</span>
                            <span class="text-sm font-bold text-green-500">${data.health_status}</span>
                        </div>
                        <div class="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg w-fit">
                            <span class="text-yellow-500">⚠️</span>
                            <span class="text-sm text-gray-500 dark:text-gray-400">風險度:</span>
                            <span class="text-sm font-bold text-yellow-500">${data.risk_level}</span>
                        </div>
                        <div class="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg w-fit">
                            <span class="text-orange-500">⚡</span>
                            <span class="text-sm text-gray-500 dark:text-gray-400">操作建議:</span>
                            <span class="text-sm font-bold text-orange-500">${data.advice}</span>
                        </div>
                    </div>
                </div>

                <!-- Profit Progress -->
                <div class="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                    <div class="text-xs text-gray-500 mb-2">獲利進度盤 (目標 +25% / 停損 -10%)</div>
                    <div class="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 mb-1 relative">
                        <div class="bg-green-500 h-2 rounded-full absolute left-[30%] w-[40%]"></div>
                        <div class="absolute w-3 h-3 bg-white border-2 border-green-500 rounded-full top-[-2px] left-[70%]"></div>
                    </div>
                    <div class="flex justify-between text-[10px] text-gray-400">
                        <span>SL -10%</span>
                        <span>TP 25%</span>
                    </div>
                </div>

                <!-- AI Summary -->
                <div class="bg-purple-50 dark:bg-purple-900/10 rounded-2xl p-6 border border-purple-100 dark:border-purple-800/30">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-bold text-purple-700 dark:text-purple-400 flex items-center">
                            <span class="mr-2">✨</span> AI 持股健檢
                        </h3>
                        <button class="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1 rounded-full">啟動 AI 解讀</button>
                    </div>
                    <p class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">${data.ai_summary}</p>
                </div>
            </div>
        `;
    },

    async renderMarketTab(container) {
        const data = await api.fetchIntradayMarket(this.currentSymbol);
        if (!data) {
            container.innerHTML = `<div class="p-8 text-center text-gray-500">暫無盤面數據</div>`;
            return;
        }

        const metrics = data.metrics;
        container.innerHTML = `
            <div class="p-4 space-y-6">
                <!-- Realtime Metrics -->
                <div>
                    <h3 class="text-orange-500 font-bold flex items-center mb-4">
                        <span class="mr-2">⏱️</span> 即時盤面指標
                    </h3>
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div class="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col items-center">
                            <span class="text-xs text-green-500 mb-1">↓ 外盤比</span>
                            <span class="text-lg font-bold text-green-500">${metrics.outer_ratio}%</span>
                        </div>
                        <div class="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col items-center">
                            <span class="text-xs text-orange-400 mb-1">📈 振幅</span>
                            <span class="text-lg font-bold text-orange-400">${metrics.amplitude}%</span>
                        </div>
                        <div class="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col items-center">
                            <span class="text-xs text-blue-400 mb-1">📋 成交筆數</span>
                            <span class="text-lg font-bold text-blue-400">${(metrics.trades_count / 10000).toFixed(1)}萬</span>
                        </div>
                        <div class="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col items-center">
                            <span class="text-xs text-cyan-500 mb-1">📦 最新量</span>
                            <span class="text-lg font-bold text-cyan-500">${metrics.latest_volume}張</span>
                        </div>
                        <div class="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col items-center">
                            <span class="text-xs text-purple-400 mb-1">💵 成交額</span>
                            <span class="text-lg font-bold text-purple-400">${metrics.turnover}億</span>
                        </div>
                    </div>
                </div>

                <!-- Price Volume Profile -->
                <div class="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-orange-500 font-bold flex items-center">
                            <span class="mr-2">📊</span> 分價量表
                        </h3>
                    </div>
                    <div class="flex justify-between text-xs mb-2">
                        <span class="text-red-500">● 外盤 (買) ${metrics.outer_ratio}%</span>
                        <span class="text-green-500">${(100 - metrics.outer_ratio).toFixed(1)}% (賣) 內盤 ●</span>
                    </div>
                    <div class="w-full h-1 bg-gray-200 dark:bg-gray-800 flex mb-4">
                        <div class="h-full bg-red-500" style="width: ${metrics.outer_ratio}%"></div>
                        <div class="h-full bg-green-500" style="width: ${100 - metrics.outer_ratio}%"></div>
                    </div>
                    <div class="space-y-1">
                        <div class="flex justify-between text-xs text-gray-400 mb-2">
                            <span>價格</span>
                            <span>成交量(張)</span>
                        </div>
                        ${data.price_volume.map(pv => {
                            const maxVol = Math.max(...data.price_volume.map(v => v.volume));
                            const wOuter = (pv.outer_vol / maxVol) * 70; // 70% max width
                            const wInner = (pv.inner_vol / maxVol) * 70;
                            return `
                                <div class="flex justify-between items-center text-sm">
                                    <span class="text-red-500 w-12 font-mono">${pv.price}</span>
                                    <div class="flex-1 flex px-2 h-4">
                                        <div class="bg-red-500/80 h-full" style="width: ${wOuter}%"></div>
                                        <div class="bg-green-500/80 h-full" style="width: ${wInner}%"></div>
                                    </div>
                                    <span class="text-gray-500 dark:text-gray-300 w-12 text-right font-mono">${pv.volume}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    formatValue(val, decimals = 2) {
        if (val === undefined || val === null) return '--';
        return new Intl.NumberFormat('zh-TW', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(val);
    }
};

// Global access for onclick handlers
window.StockDetail = StockDetail;
