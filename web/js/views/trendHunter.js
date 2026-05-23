/**
 * Trend Hunter View Module
 * Handles rendering of all Trend Hunter sub-pages
 */

import { api } from '../api.js';

export const TrendHunter = {
    subPageConfigs: {
        '量化精選': {
            title: '量化模型精選',
            description: '基於多因子評分系統，篩選出市場中具備最強動能與基本面支撐的個股。',
            sideTitle: '模型說明',
            sideContent: '我們的量化模型結合了「趨勢動能」、「價值偏離」與「資金集中度」三大維度，每日收盤後自動更新。'
        },
        'ETF戰情': {
            title: 'ETF 市場戰情室',
            description: '追蹤全台 ETF 資金流向、折溢價與產業曝險分佈。',
            sideTitle: '市場感測',
            sideContent: '目前高股息 ETF 資金持續流入，但需注意部分電子權值型 ETF 的成分股重疊風險。'
        },
        '精選策略': {
            title: 'AI 策略實驗室',
            description: '展示各種經典與現代交易策略在當前市場的運行表現。',
            sideTitle: '策略統計',
            sideContent: '突破策略在近期震盪盤勢中表現較佳，而均線回歸策略則面臨較大的回撤。'
        },
        '今日最熱': {
            title: '今日熱點掃描',
            description: '即時監測市場中成交量異動、漲幅居前與社群討論度最高的個股。',
            sideTitle: '熱力指標',
            sideContent: '今日 AI 伺服器供應鏈出現集體量噴，資金有從航運板塊轉移至電子零組件的跡象。'
        },
        '資金輪動': {
            title: '產業資金輪動圖',
            description: '視覺化呈現資金在不同產業間的轉移路徑，捕捉下一個領漲族群。',
            sideTitle: '象限解讀',
            sideContent: '處於右上象限的產業代表「量價齊揚」，通常是短線資金的主戰場。'
        },
        '熱力圖': {
            title: '全市場熱力圖',
            description: '按市值權重與漲跌幅展現全市場個股表現，一目了然市場強弱。',
            sideTitle: '權重觀察',
            sideContent: '半導體權值股今日撐盤力道強，雖然中小個股跌多漲少，但大盤指數相對穩健。'
        },
        '我的收藏': {
            title: '趨勢收藏夾',
            description: '您收藏的策略、產業或特定個股的追蹤組合。',
            sideTitle: '提醒設定',
            sideContent: '您可以針對收藏的對象設定關鍵價格提醒，當趨勢觸發時系統將第一時間通知您。'
        }
    },

    init(subPage) {
        console.log('TrendHunter initializing subPage:', subPage);
        const container = document.getElementById('view-trendHunter');
        if (!container) {
            console.error('view-trendHunter container not found');
            return;
        }

        // Ensure container is visible and has correct class for layout
        container.classList.remove('hidden');
        
        // Render the main responsive layout
        this.renderLayout(container, subPage);

        // 🚀 v2.2.0: 執行子分頁視覺化邏輯
        this.initSubPageLogic(subPage);
    },

    renderLayout(container, subPage) {
        const config = this.subPageConfigs[subPage] || {
            title: subPage,
            description: '模組開發中...',
            sideTitle: '資訊說明',
            sideContent: '此模組的詳細數據正在對接中，請稍候。'
        };

        container.innerHTML = `
            <div class="flex flex-col space-y-4 mb-6">
                <div class="flex justify-between items-end">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">${config.title}</h2>
                        <p class="text-gray-500 mt-1">${config.description}</p>
                    </div>
                    <div class="text-xs text-gray-400 font-mono bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                        Update: ${new Date().toLocaleDateString()}
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <!-- Main Content Area (2/3 width on PC) -->
                <div class="xl:col-span-2 space-y-6">
                    <div class="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                        ${this.getMainContentPlaceholder(subPage)}
                    </div>
                </div>

                <!-- Side Panel (1/3 width on PC) -->
                <div class="space-y-6">
                    <!-- Market Info / Strategy Description -->
                    <div class="bg-white dark:bg-[#161b22] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <h3 class="font-bold text-lg mb-4 flex items-center">
                            <span class="mr-2">💡</span> ${config.sideTitle}
                        </h3>
                        <div class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                            ${config.sideContent}
                        </div>
                    </div>

                    <!-- Market Sentiment Card -->
                    <div class="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl text-white shadow-lg shadow-blue-900/20">
                        <h3 class="font-bold mb-2 flex items-center text-white">
                            <span class="mr-2">🎯</span> 市場感測
                        </h3>
                        <p class="text-xs text-blue-100 mb-4 opacity-80">Market Sentiment Index</p>
                        <div class="flex items-center justify-between">
                            <div class="text-3xl font-bold">偏多</div>
                            <div class="text-right">
                                <div class="text-xl font-mono">65%</div>
                                <div class="text-[10px] text-blue-200">Greed & Fear Index</div>
                            </div>
                        </div>
                        <div class="mt-4 h-1.5 bg-blue-900/30 rounded-full overflow-hidden">
                            <div class="h-full bg-white w-[65%] rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
                        </div>
                    </div>

                    <!-- Useful Links / Tools -->
                    <div class="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                        <h4 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">相關工具</h4>
                        <div class="grid grid-cols-2 gap-3">
                            <button class="p-2 text-xs bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors">
                                策略回測
                            </button>
                            <button class="p-2 text-xs bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors">
                                匯出報表
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    getMainContentPlaceholder(subPage) {
        if (subPage === '資金輪動' || subPage === '熱力圖') {
            return `
                <div class="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                    <span class="text-sm font-bold">視覺化分析視圖</span>
                    <div class="flex space-x-2">
                        <div class="w-3 h-3 rounded-full bg-red-500"></div>
                        <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div class="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                </div>
                <div id="trend-chart-container" class="w-full h-[520px] p-2 flex items-center justify-center">
                    <div class="text-center">
                        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                        <p class="text-gray-500">正在準備 ECharts 視覺化組件...</p>
                    </div>
                </div>
            `;
        }

        if (subPage === '量化精選') {
            return `
                <div id="quant-container" class="p-6 space-y-8 flex-1 flex flex-col">
                    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4" id="quant-stats">
                        <div class="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                            <div class="text-xs text-gray-500 mb-1 font-bold">模型淨值 NAV</div>
                            <div class="h-6 w-20 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                        </div>
                        <div class="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                            <div class="text-xs text-gray-500 mb-1 font-bold">多空狀態 Regime</div>
                            <div class="h-6 w-16 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                        </div>
                        <div class="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                            <div class="text-xs text-gray-500 mb-1 font-bold">保留現金比率</div>
                            <div class="h-6 w-16 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                        </div>
                        <div class="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                            <div class="text-xs text-gray-500 mb-1 font-bold">目前持股檔數</div>
                            <div class="h-6 w-12 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                        </div>
                    </div>
                    <div class="bg-white dark:bg-[#161b22] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                        <div class="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                            <h3 class="font-bold text-gray-900 dark:text-white flex items-center text-sm">
                                <span class="mr-2">📈</span> 模型持股組合
                            </h3>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="w-full text-left" id="quant-holdings-table">
                                <thead class="bg-gray-50/50 dark:bg-gray-900/50 text-gray-400 text-xs uppercase">
                                    <tr>
                                        <th class="px-6 py-3">股號/名稱</th>
                                        <th class="px-6 py-3 text-right">配置權重</th>
                                        <th class="px-6 py-3 text-right hidden sm:table-cell">進場日期</th>
                                        <th class="px-6 py-3 text-right">累積回報</th>
                                        <th class="px-6 py-3 text-right hidden md:table-cell">籌碼特徵</th>
                                        <th class="px-6 py-3 text-right">操作建議</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-100 dark:divide-gray-800 font-mono text-sm text-gray-400">
                                    <tr><td colspan="6" class="px-6 py-8 text-center text-gray-500">加載數據中...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="bg-white dark:bg-[#161b22] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col">
                        <div class="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex-none">
                            <h3 class="font-bold text-gray-900 dark:text-white flex items-center text-sm">
                                <span class="mr-2">⚡</span> 最新選股訊號 (近 5 日)
                            </h3>
                        </div>
                        <div class="overflow-x-auto flex-1">
                            <table class="w-full text-left" id="quant-signals-table">
                                <thead class="bg-gray-50/50 dark:bg-gray-900/50 text-gray-400 text-xs uppercase">
                                    <tr>
                                        <th class="px-6 py-3">訊號日期</th>
                                        <th class="px-6 py-3">股號</th>
                                        <th class="px-6 py-3">訊號類型</th>
                                        <th class="px-6 py-3">觸發原因</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-100 dark:divide-gray-800 font-mono text-sm text-gray-400">
                                    <tr><td colspan="4" class="px-6 py-8 text-center text-gray-500">加載數據中...</td></tr>
                                </tbody>
                            </table>
                        </div>
                        <div id="quant-signals-pagination" class="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/30 flex justify-between items-center text-xs text-gray-500">
                        </div>
                    </div>
                </div>
            `;
        }

        if (subPage === '精選策略') {
            return `
                <div id="strategies-container" class="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 flex-1   ">
                    <div class="col-span-full text-center py-12 text-gray-500">正在加載量化策略...</div>
                </div>
            `;
        }

        if (subPage === '今日最熱') {
            return `
                <div id="hottest-container" class="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1   ">
                    <div class="col-span-full text-center py-12 text-gray-500">正在掃描今日市場熱點...</div>
                </div>
            `;
        }

        if (subPage === 'ETF戰情') {
            return `
                <div id="etf-container" class="p-6 space-y-8 flex-1 flex flex-col overflow-y-auto no-scrollbar pb-20">
                    <!-- 🚀 Standalone Momentum Block -->
                    <div class="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                        <div class="p-5 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-blue-500/5 to-transparent flex items-center justify-between">
                            <h3 class="font-bold text-gray-900 dark:text-white flex items-center">
                                <span class="mr-2 text-xl">🚀</span> ETF 資金動能榜 (按族群)
                            </h3>
                            <span class="text-[10px] text-blue-500 font-mono font-bold px-2 py-1 bg-blue-500/10 rounded-full">HOT THEMES</span>
                        </div>
                        <div class="p-5 overflow-x-auto">
                            <div id="etf-momentum-list" class="flex space-x-4 min-w-max pb-2">
                                <div class="animate-pulse flex space-x-4">
                                    <div class="h-20 w-40 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
                                    <div class="h-20 w-40 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
                                    <div class="h-20 w-40 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Top Selector & Info -->
                    <div class="bg-white dark:bg-[#161b22] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <div class="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
                            <div>
                                <h3 class="font-bold text-lg text-gray-900 dark:text-white flex items-center">
                                    <span class="mr-2">📁</span> ETF 持股細節查詢
                                </h3>
                                <p class="text-xs text-gray-500 mt-0.5" id="etf-updated-time">數據更新中...</p>
                            </div>
                            <div class="relative min-w-[280px]">
                                <select id="etf-select" class="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer text-gray-800 dark:text-gray-200 shadow-inner">
                                    <option value="">-- 請選擇 ETF --</option>
                                </select>
                                <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                            </div>
                        </div>
                        
                        <div id="etf-meta-display" class="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div class="p-3 bg-blue-500/5 dark:bg-blue-500/10 rounded-xl border border-blue-500/10">
                                <div class="text-[10px] text-gray-400 mb-1 uppercase font-bold">ETF 名稱</div>
                                <div class="text-sm font-bold text-blue-600 dark:text-blue-400 truncate" id="etf-meta-name">--</div>
                            </div>
                            <div class="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                                <div class="text-[10px] text-gray-400 mb-1 uppercase font-bold">分類</div>
                                <div class="text-sm font-bold text-gray-700 dark:text-gray-300" id="etf-meta-category">--</div>
                            </div>
                            <div class="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                                <div class="text-[10px] text-gray-400 mb-1 uppercase font-bold">成份股數</div>
                                <div class="text-sm font-bold text-gray-700 dark:text-gray-300" id="etf-meta-count">--</div>
                            </div>
                            <div class="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                                <div class="text-[10px] text-gray-400 mb-1 uppercase font-bold">預估折溢價</div>
                                <div class="text-sm font-bold text-orange-500" id="etf-meta-premium">--%</div>
                            </div>
                        </div>
                    </div>

                    <!-- Holdings Table -->
                    <div class="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex-1 flex flex-col min-h-[450px]">
                        <div class="p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex justify-between items-center">
                            <h3 class="font-bold text-gray-900 dark:text-white flex items-center">
                                <span class="mr-2">📊</span> 成分股權重分佈 (Top 50)
                            </h3>
                        </div>
                        <div class="overflow-x-auto flex-1">
                            <table id="etf-holdings-table" class="w-full text-left text-sm">
                                <thead class="bg-gray-50/30 dark:bg-gray-800/30 text-gray-400 uppercase font-mono text-[10px]">
                                    <tr>
                                        <th class="px-6 py-3">代號 ID</th>
                                        <th class="px-6 py-3">名稱 NAME</th>
                                        <th class="px-6 py-3 text-right">權重 WEIGHT</th>
                                        <th class="px-6 py-3 text-right">操作 ACTION</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                                    <tr><td colspan="4" class="px-6 py-12 text-center text-gray-500">請先選擇欲查看的 ETF</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
        }

        // Default: Table placeholder
        return `
            <div class="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <h3 class="font-bold text-gray-900 dark:text-white">數據清單</h3>
                <div class="flex space-x-2">
                    <input type="text" placeholder="搜尋..." class="text-xs bg-gray-100 dark:bg-gray-800 border-none rounded-md px-3 py-1 outline-none focus:ring-1 ring-blue-500">
                </div>
            </div>
            <div class="flex-1 overflow-x-auto">
                <table class="w-full text-left">
                    <thead class="bg-gray-50/50 dark:bg-gray-900/50 text-gray-400 dark:text-gray-500 text-xs uppercase">
                        <tr>
                            <th class="px-6 py-4">項目</th>
                            <th class="px-6 py-4 text-right">數值</th>
                            <th class="px-6 py-4 text-right">變化</th>
                            <th class="px-6 py-4 text-right">評級</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 dark:divide-gray-800 font-mono text-sm text-gray-400">
                        ${Array(10).fill(0).map((_, i) => `
                            <tr>
                                <td class="px-6 py-4">
                                    <div class="w-24 h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                                </td>
                                <td class="px-6 py-4 text-right">
                                    <div class="w-16 h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse ml-auto"></div>
                                </td>
                                <td class="px-6 py-4 text-right">
                                    <div class="w-12 h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse ml-auto"></div>
                                </td>
                                <td class="px-6 py-4 text-right">
                                    <div class="w-8 h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse ml-auto"></div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    async initSubPageLogic(subPage) {
        console.log(`SubPage ${subPage} logic initialized`);
        
        if (subPage === '資金輪動') {
            const container = document.getElementById('trend-chart-container');
            if (!container) return;

            try {
                const rotationData = await api.fetchLocalJson('quant/theme_rotation.json');
                
                if (!rotationData.themes || rotationData.themes.length === 0) {
                    container.innerHTML = `<div class="text-center text-gray-500 py-8">無資金輪動數據</div>`;
                    return;
                }

                container.innerHTML = ''; // 清空 loading
                const chartDom = document.createElement('div');
                chartDom.style.width = '100%';
                chartDom.style.height = '100%';
                container.appendChild(chartDom);

                setTimeout(() => {
                    if (!container.contains(chartDom)) return;
                    const isDark = document.documentElement.classList.contains('dark');
                    const myChart = echarts.init(chartDom, isDark ? 'dark' : null);
                    window.addEventListener('resize', () => myChart.resize());

                    const flowRatios = rotationData.themes.map(t => t.flow_ratio);
                    const avgFlowRatio = flowRatios.reduce((a, b) => a + b, 0) / flowRatios.length;

                    const seriesData = rotationData.themes.map(t => [
                        t.flow_ratio, // x
                        t.avg_pct,    // y
                        t.name,       // 產業名稱
                        t.trend       // 趨勢
                    ]);

                    const option = {
                        backgroundColor: 'transparent',
                        tooltip: {
                            trigger: 'item',
                            formatter: function (params) {
                                return `<b>${params.value[2]}</b><br/>資金流入比率: ${params.value[0].toFixed(2)}%<br/>平均漲跌幅: ${params.value[1].toFixed(2)}%<br/>趨勢標籤: ${params.value[3] === 'UP' ? '🔥 偏多' : '❄️ 偏空'}`;
                            }
                        },
                        grid: {
                            left: '10%',
                            right: '10%',
                            bottom: '15%',
                            top: '15%',
                            containLabel: true
                        },
                        xAxis: {
                            name: '資金流入比率 (%)',
                            nameLocation: 'middle',
                            nameGap: 35,
                            splitLine: { show: false },
                            axisLabel: { color: isDark ? '#888' : '#666', fontSize: 10 },
                            // 🚀 Center the X-axis around avgFlowRatio
                            min: function(value) { 
                                const span = Math.max(Math.abs(value.max - avgFlowRatio), Math.abs(value.min - avgFlowRatio), 2);
                                return avgFlowRatio - span - 1; 
                            },
                            max: function(value) { 
                                const span = Math.max(Math.abs(value.max - avgFlowRatio), Math.abs(value.min - avgFlowRatio), 2);
                                return avgFlowRatio + span + 1; 
                            }
                        },
                        yAxis: {
                            name: '平均漲跌幅 (%)',
                            splitLine: { 
                                show: true,
                                lineStyle: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }
                            },
                            axisLabel: { color: isDark ? '#888' : '#666', fontSize: 10 },
                            // 🚀 Center the Y-axis around 0
                            min: function(value) { 
                                const absMax = Math.max(Math.abs(value.min), Math.abs(value.max), 3);
                                return -absMax - 0.5;
                            },
                            max: function(value) {
                                const absMax = Math.max(Math.abs(value.min), Math.abs(value.max), 3);
                                return absMax + 0.5;
                            }
                        },
                        graphic: [
                            {
                                type: 'group',
                                left: 'center',
                                top: 'middle',
                                children: [
                                    {
                                        type: 'text',
                                        right: -140,
                                        top: -180,
                                        style: {
                                            text: '🔥 量價齊揚 (主流)',
                                            font: 'bold 13px sans-serif',
                                            fill: '#ef4444',
                                            textAlign: 'center'
                                        }
                                    },
                                    {
                                        type: 'text',
                                        right: -140,
                                        bottom: -180,
                                        style: {
                                            text: '💧 資金吸納 (低接)',
                                            font: 'bold 13px sans-serif',
                                            fill: '#3b82f6',
                                            textAlign: 'center'
                                        }
                                    },
                                    {
                                        type: 'text',
                                        left: -140,
                                        top: -180,
                                        style: {
                                            text: '🔒 籌碼鎖定 (悶聲)',
                                            font: 'bold 13px sans-serif',
                                            fill: '#f59e0b',
                                            textAlign: 'center'
                                        }
                                    },
                                    {
                                        type: 'text',
                                        left: -140,
                                        bottom: -180,
                                        style: {
                                            text: '❄️ 弱勢量縮 (觀望)',
                                            font: 'bold 13px sans-serif',
                                            fill: '#10b981',
                                            textAlign: 'center'
                                        }
                                    }
                                ]
                            }
                        ],
                        series: [{
                            type: 'scatter',
                            data: seriesData,
                            symbolSize: function (data) {
                                return Math.max(10, Math.min(50, data[0] * 1.5 + 8));
                            },
                            itemStyle: {
                                color: function(params) {
                                    const x = params.value[0];
                                    const y = params.value[1];
                                    if (x > avgFlowRatio) {
                                        return y > 0 ? '#ef4444' : '#3b82f6';
                                    } else {
                                        return y > 0 ? '#f59e0b' : '#10b981';
                                    }
                                },
                                shadowBlur: 8,
                                shadowColor: 'rgba(0, 0, 0, 0.15)',
                                opacity: 0.85
                            },
                            markLine: {
                                silent: true,
                                lineStyle: {
                                    type: 'dashed',
                                    color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
                                },
                                data: [
                                    { xAxis: avgFlowRatio, name: '平均流入線' },
                                    { yAxis: 0, name: '平盤線' }
                                ],
                                label: {
                                    show: true,
                                    position: 'end',
                                    color: isDark ? '#aaa' : '#666',
                                    formatter: function(p) {
                                        return p.name;
                                    }
                                }
                            }
                        }]
                    };

                    myChart.setOption(option);
                    myChart.resize();
                    window.addEventListener('resize', () => myChart.resize());
                }, 50);

            } catch (err) {
                console.error(err);
                container.innerHTML = `<div class="text-center text-red-500 py-8">圖表加載失敗: ${err.message}</div>`;
            }
        }
        
        else if (subPage === '熱力圖') {
            const container = document.getElementById('trend-chart-container');
            if (!container) return;

            try {
                const [stocksData, indexData] = await Promise.all([
                    api.fetchLocalJson('meta/stocks.json'),
                    api.fetchLocalJson('index.json')
                ]);
                
                const latestDate = indexData.latest_daily_tw;
                if (!latestDate) throw new Error('No trading date found in index');

                const dailyData = await api.fetchLocalJson(`daily/tw/${latestDate}.json`);

                const stockMetaMap = {};
                if (stocksData.stocks) {
                    stocksData.stocks.forEach(s => {
                        stockMetaMap[s.symbol] = {
                            name: s.name,
                            industry: s.industry || s.official_sector || '其他',
                            sector: s.official_sector
                        };
                    });
                }

                const rawStocks = dailyData.stocks || [];
                const filtered = rawStocks
                    .filter(s => {
                        const meta = stockMetaMap[s.id];
                        if (!meta) return false;
                        return meta.sector !== 'ETF' && meta.industry !== 'ETF';
                    })
                    .sort((a, b) => (b.t || 0) - (a.t || 0))
                    .slice(0, 150);

                if (filtered.length === 0) {
                    container.innerHTML = `<div class="text-center text-gray-500 py-8">無熱力圖數據</div>`;
                    return;
                }

                // --- 🚀 v2.20.0: 自定義台股熱力圖佈局算法 (Leader Partitioning) ---
                const groups = {};
                filtered.forEach(s => {
                    const meta = stockMetaMap[s.id];
                    const ind = meta.industry;
                    if (!groups[ind]) groups[ind] = { name: ind, totalValue: 0, items: [] };
                    groups[ind].items.push({
                        id: s.id,
                        name: meta.name,
                        value: s.t,
                        pct: s.pct
                    });
                    groups[ind].totalValue += s.t;
                });

                const sortedSectors = Object.values(groups).sort((a, b) => b.totalValue - a.totalValue);

                function getColorByPct(pct) {
                    if (pct > 0) {
                        const ratio = Math.min(1, pct / 7.0);
                        const r = Math.round(30 + (220 - 30) * ratio);
                        const g = Math.round(41 + (38 - 41) * ratio);
                        const b = Math.round(59 + (38 - 59) * ratio);
                        return `rgb(${r}, ${g}, ${b})`;
                    } else if (pct < 0) {
                        const ratio = Math.min(1, Math.abs(pct) / 7.0);
                        const r = Math.round(30 + (16 - 30) * ratio);
                        const g = Math.round(41 + (150 - 41) * ratio);
                        const b = Math.round(59 + (80 - 59) * ratio);
                        return `rgb(${r}, ${g}, ${b})`;
                    } else {
                        return 'rgb(50, 60, 75)';
                    }
                }

                // 構建 ECharts Treemap 數據結構
                // 這裡我們利用 ECharts 的 levels 屬性來實現階層化佈局
                const treeData = sortedSectors.map(sector => {
                    // 對每個族群內部的個股進行 Leader Partitioning 檢查
                    // 雖然我們主要靠 ECharts 渲染，但我們可以調整數據權重或分組來輔助
                    return {
                        name: sector.name,
                        value: sector.totalValue,
                        children: sector.items.sort((a, b) => b.value - a.value).map(item => ({
                            name: `${item.name}\n${item.pct >= 0 ? '+' : ''}${item.pct}%`,
                            value: item.value,
                            symbol: item.id,
                            pct: item.pct,
                            itemStyle: {
                                color: getColorByPct(item.pct)
                            }
                        }))
                    };
                });

                container.innerHTML = ''; // 清空 loading
                const chartDom = document.createElement('div');
                chartDom.style.width = '100%';
                chartDom.style.height = '100%';
                container.appendChild(chartDom);

                setTimeout(() => {
                    if (!container.contains(chartDom)) return;
                    const isDark = document.documentElement.classList.contains('dark');
                    const myChart = echarts.init(chartDom, isDark ? 'dark' : null);
                    window.addEventListener('resize', () => myChart.resize());

                    const option = {
                        backgroundColor: 'transparent',
                        tooltip: {
                            formatter: function (info) {
                                if (!info.data || !info.data.symbol) return info.name;
                                const value = info.value;
                                const pct = info.data.pct;
                                const symbol = info.data.symbol;
                                const name = info.name.split('\n')[0];
                                return [
                                    `<div class="font-bold border-b border-gray-600 pb-1 mb-1">${name} (${symbol})</div>`,
                                    `成交金額: <b>${(value / 100000000).toFixed(2)} 億元</b><br/>`,
                                    `當日漲跌: <span style="color:${pct >= 0 ? '#ef4444' : '#10b981'}">${pct >= 0 ? '+' : ''}${pct}%</span>`
                                ].join('');
                            }
                        },
                        series: [{
                            type: 'treemap',
                            data: treeData,
                            leafDepth: 2,
                            roam: true,
                            nodeClick: 'zoomTo',
                            breadcrumb: { show: true, bottom: 0 },
                            label: {
                                show: true,
                                formatter: '{b}',
                                fontSize: 11,
                                color: '#fff'
                            },
                            upperLabel: {
                                show: true,
                                height: 24,
                                color: isDark ? '#fff' : '#111',
                                backgroundColor: isDark ? '#2d3748' : '#edf2f7',
                                fontSize: 12,
                                fontWeight: 'bold'
                            },
                            itemStyle: {
                                borderColor: isDark ? '#1a202c' : '#fff',
                                borderWidth: 1,
                                gapWidth: 1
                            },
                            levels: [
                                {
                                    itemStyle: {
                                        borderColor: isDark ? '#1a202c' : '#fff',
                                        borderWidth: 2,
                                        gapWidth: 2
                                    },
                                    upperLabel: { show: true }
                                },
                                {
                                    itemStyle: {
                                        borderColor: isDark ? '#2d3748' : '#f7fafc',
                                        borderWidth: 1,
                                        gapWidth: 1
                                    },
                                    // 🚀 v2.20.0: 強制 Squarified 佈局，並對權值股進行優化
                                    treemapStrategy: 'squarify'
                                }
                            ]
                        }]
                    };

                    myChart.setOption(option);
                    
                    myChart.on('click', function (params) {
                        if (params.data && params.data.symbol && params.treePathInfo.length > 2) {
                            if (window.StockDetail && typeof window.StockDetail.show === 'function') {
                                window.StockDetail.show(params.data.symbol);
                            }
                        }
                    });

                    myChart.resize();
                }, 50);

            } catch (err) {
                console.error(err);
                container.innerHTML = `<div class="text-center text-red-500 py-8">圖表加載失敗: ${err.message}</div>`;
            }
        }

        else if (subPage === '量化精選') {
            const holdingsTable = document.querySelector('#quant-holdings-table tbody');
            const signalsTable = document.querySelector('#quant-signals-table tbody');
            const statsContainer = document.getElementById('quant-stats');
            const paginationContainer = document.getElementById('quant-signals-pagination');
            
            let allSignals = [];
            let currentPage = 1;
            const pageSize = 25;
            let stocksMeta = {};

            const renderSignalsPage = (page) => {
                if (!signalsTable || !paginationContainer) return;
                const start = (page - 1) * pageSize;
                const end = start + pageSize;
                const pageData = allSignals.slice(start, end);

                signalsTable.innerHTML = pageData.map(s => {
                    const type = (s.type || s.action || 'BUY').toUpperCase();
                    const cleanStockId = s.symbol || s.stock || s.stock_id || '';
                    const stockName = stocksMeta[cleanStockId] || stocksMeta[cleanStockId.split('.')[0]] || '';
                    return `
                        <tr class="hover:bg-gray-800/30 transition-colors cursor-pointer" onclick="window.StockDetail.show('${cleanStockId.split('.')[0]}')">
                            <td class="px-6 py-4 font-mono text-gray-500">${s.date}</td>
                            <td class="px-6 py-4">
                                <div class="font-bold text-gray-900 dark:text-white">${cleanStockId}</div>
                                <div class="text-[10px] text-gray-400">${stockName}</div>
                            </td>
                            <td class="px-6 py-4">
                                <span class="px-2 py-0.5 rounded text-[10px] font-bold ${type === 'BUY' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}">
                                    ${type === 'BUY' ? '買進 BUY' : '賣出 SELL'}
                                </span>
                            </td>
                            <td class="px-6 py-4 text-xs text-gray-450">${s.reason || s.label || 'SIGNAL'}</td>
                        </tr>
                    `;
                }).join('') || '<tr><td colspan="4" class="px-6 py-8 text-center text-gray-500">尚無近期訊號</td></tr>';

                const totalPages = Math.ceil(allSignals.length / pageSize) || 1;
                paginationContainer.innerHTML = `
                    <button class="px-3 py-1 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 disabled:opacity-30 transition-all" ${page === 1 ? 'disabled' : ''} id="prev-signals-page">上一頁</button>
                    <span class="font-mono">第 ${page} 頁 / ${totalPages} 頁 (共 ${allSignals.length} 筆)</span>
                    <button class="px-3 py-1 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 disabled:opacity-30 transition-all" ${page === totalPages ? 'disabled' : ''} id="next-signals-page">下一頁</button>
                `;

                document.getElementById('prev-signals-page')?.addEventListener('click', () => {
                    currentPage--;
                    renderSignalsPage(currentPage);
                });
                document.getElementById('next-signals-page')?.addEventListener('click', () => {
                    currentPage++;
                    renderSignalsPage(currentPage);
                });
            };
            
            try {
                // Fetch Meta first for names
                try {
                    const meta = await api.getStocksMeta();
                    if (meta && Array.isArray(meta.stocks)) {
                        meta.stocks.forEach(s => { stocksMeta[s.symbol] = s.name; });
                    }
                } catch(e) { console.warn("Meta fetch failed in Quant", e); }

                const data = await api.fetchLocalJson('quant/latest_portfolio.json');
                
                // 1. 篩選實際持股
                const activeHoldings = (data.portfolio || []).filter(p => p.is_held);
                const isBull = data.regime === 'BULL' || data.regime === 'AGGRESSIVE';
                const cashRatio = data.nav ? ((data.cash || 0) / data.nav) * 100 : 0;
                
                if (statsContainer && data) {
                    statsContainer.innerHTML = `
                        <div class="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                            <div class="text-xs text-gray-500 mb-1 font-bold">模型淨值 NAV</div>
                            <div class="text-xl font-bold font-mono text-blue-600 dark:text-blue-400">$${(data.nav || 0).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</div>
                        </div>
                        <div class="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                            <div class="text-xs text-gray-500 mb-1 font-bold">多空狀態 Regime</div>
                            <div class="text-xl font-bold font-mono ${isBull ? 'text-red-500' : 'text-green-500'}">
                                ${isBull ? '🔴 多頭市場' : '🟢 空頭避險'}
                            </div>
                        </div>
                        <div class="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                            <div class="text-xs text-gray-500 mb-1 font-bold">保留現金比率</div>
                            <div class="text-xl font-bold font-mono text-gray-900 dark:text-white">${cashRatio.toFixed(1)}%</div>
                        </div>
                        <div class="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                            <div class="text-xs text-gray-500 mb-1 font-bold">目前持股檔數</div>
                            <div class="text-xl font-bold font-mono text-gray-900 dark:text-white">${activeHoldings.length} 檔</div>
                        </div>
                    `;
                }

                if (holdingsTable) {
                    if (activeHoldings.length === 0) {
                        holdingsTable.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-gray-500">模型目前無持股，保持全現金觀望。</td></tr>`;
                    } else {
                        holdingsTable.innerHTML = activeHoldings.map(p => {
                            const name = stocksMeta[p.stock] || stocksMeta[p.stock.replace(/\.TW(O)?$/, '')] || p.stock;
                            const rawRet = p.return_pct !== undefined ? p.return_pct : (p.return !== undefined ? p.return * 100 : 0);
                            const isProfit = rawRet >= 0;
                            const action = p.action || 'HOLD';
                            const actionColor = action === 'BUY' ? 'bg-red-500/10 text-red-500' : (action === 'SELL' ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-400');
                            const cleanStockId = p.stock.replace(/\.TW(O)?$/, '');
                            return `
                                <tr class="hover:bg-gray-50 dark:hover:bg-gray-900/30 cursor-pointer" onclick="window.StockDetail.show('${cleanStockId}')">
                                    <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                        <div class="font-bold">${cleanStockId}</div>
                                        <div class="text-xs text-gray-500">${name}</div>
                                    </td>
                                    <td class="px-6 py-4 text-right font-bold text-gray-700 dark:text-gray-300">${((p.weight || 0) * 100).toFixed(1)}%</td>
                                    <td class="px-6 py-4 text-right text-gray-500 font-mono text-xs hidden sm:table-cell">${p.entry_date || '--'}</td>
                                    <td class="px-6 py-4 text-right font-bold ${isProfit ? 'text-red-500' : 'text-green-500'}">
                                        ${isProfit ? '+' : ''}${rawRet.toFixed(2)}%
                                    </td>
                                    <td class="px-6 py-4 text-right text-xs text-gray-500 hidden md:table-cell">${p.chips || p.chip_label || '--'}</td>
                                    <td class="px-6 py-4 text-right">
                                        <span class="px-2 py-1 rounded text-xs font-bold ${actionColor}">${action}</span>
                                    </td>
                                </tr>
                            `;
                        }).join('');
                    }
                }

                // 渲染訊號表格 (分頁)
                allSignals = data.signals || data.new_entries || [];
                if (allSignals.length === 0) {
                    const candidates = (data.portfolio || []).filter(p => !p.is_held && (p.entry_reason === 'SIGNAL' || p.action === 'BUY'));
                    if (candidates.length > 0) {
                        allSignals = candidates.map(c => ({ date: data.date, symbol: c.stock, type: 'BUY', reason: c.chip_label || c.entry_reason || '模型選入' }));
                    }
                    const logs = (data.trade_log || []).slice(0, 50).map(l => ({ date: l.exit_date || l.entry_date || data.date, symbol: l.stock, type: l.action || 'SIGNAL', reason: l.reason || '模型成交紀錄' }));
                    allSignals = [...allSignals, ...logs];
                }
                
                if (allSignals.length > 0) allSignals.sort((a, b) => new Date(b.date) - new Date(a.date));
                renderSignalsPage(1);

            } catch (err) { console.error("量化數據載入失敗:", err); }
        }

        else if (subPage === '精選策略') {
            const container = document.getElementById('strategies-container');
            if (!container) return;

            try {
                const data = await api.fetchLocalJson('quant/latest_strategies.json');
                const strategies = data.strategies || [];

                if (strategies.length === 0) {
                    container.innerHTML = `<div class="col-span-full text-center py-12 text-gray-500">暫無可用交易策略。</div>`;
                    return;
                }

                container.innerHTML = strategies.map(s => {
                    const ratingStars = '⭐'.repeat(Math.max(0, Math.min(5, Math.round(s.score || 4))));
                    const name = s.name || s.desc || '--';
                    const runDays = s.run_days || s.age || '--';
                    const entryDsl = s.rules?.entry || s.dsl || '--';
                    const exitDsl = s.rules?.exit || s.exit_dsl || '--';
                    const rawReturn = s.cagr !== undefined ? s.cagr : (s.return_pct !== undefined ? s.return_pct : (s.total_return !== undefined ? s.total_return * 100 : 0));
                    const isProfit = rawReturn >= 0;
                    return `
                        <div class="bg-white dark:bg-[#161b22] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow flex flex-col space-y-4">
                            <div class="flex justify-between items-start">
                                <div>
                                    <h4 class="font-bold text-base text-gray-900 dark:text-white">${name}</h4>
                                    <div class="text-xs text-gray-400 mt-0.5 font-mono">持續運行: ${runDays} 天</div>
                                </div>
                                <div class="text-sm font-bold text-yellow-500">${ratingStars}</div>
                            </div>
                            
                            <div class="grid grid-cols-3 gap-2 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl font-mono text-center">
                                <div>
                                    <div class="text-[10px] text-gray-400">總報酬率</div>
                                    <div class="text-xs font-bold ${isProfit ? 'text-red-500' : 'text-green-500'}">
                                        ${isProfit ? '+' : ''}${rawReturn.toFixed(1)}%
                                    </div>
                                </div>
                                <div>
                                    <div class="text-[10px] text-gray-400">夏普值</div>
                                    <div class="text-xs font-bold text-blue-500">${(s.sharpe || 0).toFixed(2)}</div>
                                </div>
                                <div>
                                    <div class="text-[10px] text-gray-400">歷史勝率</div>
                                    <div class="text-xs font-bold text-purple-500">${((s.win_rate || 0) * 100).toFixed(0)}%</div>
                                </div>
                            </div>

                            <div class="flex-1 space-y-2">
                                <div class="text-xs">
                                    <span class="font-bold text-gray-700 dark:text-gray-300">進場條件:</span>
                                    <code class="block bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1 font-mono text-[10px] text-gray-600 dark:text-gray-400 break-all leading-normal whitespace-pre-wrap">${entryDsl}</code>
                                </div>
                                <div class="text-xs">
                                    <span class="font-bold text-gray-700 dark:text-gray-300">出場條件:</span>
                                    <code class="block bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1 font-mono text-[10px] text-gray-600 dark:text-gray-400 break-all leading-normal whitespace-pre-wrap">${exitDsl}</code>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');

            } catch (err) {
                console.error(err);
                container.innerHTML = `<div class="col-span-full text-center text-red-500 py-12">載入策略失敗: ${err.message}</div>`;
            }
        }

        else if (subPage === '今日最熱') {
            const container = document.getElementById('hottest-container');
            if (!container) return;

            try {
                const indexData = await api.fetchLocalJson('index.json');
                const latestDate = indexData.latest_daily_tw;
                if (!latestDate) throw new Error('No latest daily trading date found');

                const [dailyData, stocksMeta] = await Promise.all([
                    api.fetchLocalJson(`daily/tw/${latestDate}.json`),
                    api.fetchLocalJson('meta/stocks.json').then(data => {
                        const map = {};
                        if (data && Array.isArray(data.stocks)) {
                            data.stocks.forEach(s => { map[s.symbol] = s.name; });
                        }
                        return map;
                    }).catch(() => ({}))
                ]);

                const rawStocks = dailyData.stocks || [];

                const topVolume = [...rawStocks]
                    .sort((a, b) => (b.t || 0) - (a.t || 0))
                    .slice(0, 10);

                const topGainers = [...rawStocks]
                    .filter(s => s.pct !== undefined)
                    .sort((a, b) => b.pct - a.pct)
                    .slice(0, 10);

                const topLosers = [...rawStocks]
                    .filter(s => s.pct !== undefined)
                    .sort((a, b) => a.pct - b.pct)
                    .slice(0, 10);

                const topInstitutional = [...rawStocks]
                    .map(s => ({
                        ...s,
                        total_buy: (s.f || 0) + (s.it || 0) + (s.d || 0)
                    }))
                    .sort((a, b) => b.total_buy - a.total_buy)
                    .slice(0, 10);

                const renderTable = (title, icon, list, valFormatter) => {
                    return `
                        <div class="bg-white dark:bg-[#161b22] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col h-full shadow-sm">
                            <div class="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between">
                                <h3 class="font-bold text-gray-900 dark:text-white flex items-center text-sm">
                                    <span class="mr-2">${icon}</span> ${title}
                                </h3>
                            </div>
                            <div class="overflow-x-auto flex-1">
                                <table class="w-full text-left text-xs">
                                    <thead class="bg-gray-50/30 dark:bg-gray-900/30 text-gray-400 uppercase font-mono">
                                        <tr>
                                            <th class="px-4 py-2">名次/個股</th>
                                            <th class="px-4 py-2 text-right">收盤</th>
                                            <th class="px-4 py-2 text-right">漲跌</th>
                                            <th class="px-4 py-2 text-right">指標</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-gray-100 dark:divide-gray-800 font-mono text-gray-400">
                                        ${list.map((s, idx) => {
                                            const name = stocksMeta[s.id] || s.id;
                                            const pct = s.pct || 0;
                                            const color = pct >= 0 ? 'text-red-500' : 'text-green-500';
                                            return `
                                                <tr class="hover:bg-gray-50 dark:hover:bg-gray-900/30 cursor-pointer" onclick="window.StockDetail.show('${s.id}')">
                                                    <td class="px-4 py-2 flex items-center space-x-2">
                                                        <span class="w-4 h-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-[10px] text-gray-500 font-bold">${idx + 1}</span>
                                                        <div>
                                                            <div class="font-bold text-gray-950 dark:text-white">${s.id}</div>
                                                            <div class="text-[10px] text-gray-400 truncate max-w-[80px]">${name}</div>
                                                        </div>
                                                    </td>
                                                    <td class="px-4 py-2 text-right font-bold text-gray-700 dark:text-gray-300">${s.c?.toFixed(2) || '--'}</td>
                                                    <td class="px-4 py-2 text-right font-bold ${color}">${pct >= 0 ? '+' : ''}${pct}%</td>
                                                    <td class="px-4 py-2 text-right text-gray-500 font-bold">${valFormatter(s)}</td>
                                                </tr>
                                            `;
                                        }).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    `;
                };

                container.innerHTML = `
                    ${renderTable('成交大戶 (日交易額)', '💰', topVolume, s => `${(s.t / 100000000).toFixed(1)} 億`)}
                    ${renderTable('今日領漲個股', '🔥', topGainers, s => `+${s.pct}%`)}
                    ${renderTable('今日重挫個股', '❄️', topLosers, s => `${s.pct}%`)}
                    ${renderTable('三大法人合買', '🤝', topInstitutional, s => {
                        const lots = s.total_buy / 1000;
                        return `${lots >= 0 ? '+' : ''}${lots.toFixed(0)} 張`;
                    })}
                `;

            } catch (err) {
                console.error(err);
                container.innerHTML = `<div class="col-span-full text-center text-red-500 py-12">今日熱點加載失敗: ${err.message}</div>`;
            }
        }

        else if (subPage === 'ETF戰情') {
            const select = document.getElementById('etf-select');
            const tableBody = document.querySelector('#etf-holdings-table tbody');
            const metaName = document.getElementById('etf-meta-name');
            const metaCategory = document.getElementById('etf-meta-category');
            const metaCount = document.getElementById('etf-meta-count');
            const metaPremium = document.getElementById('etf-meta-premium');
            const momentumList = document.getElementById('etf-momentum-list');
            const updateTime = document.getElementById('etf-updated-time');

            try {
                // 1. Fetch Rotation for Momentum
                try {
                    const rotation = await api.fetchLocalJson('quant/theme_rotation.json');
                    if (momentumList && rotation && rotation.themes) {
                        const topThemes = rotation.themes.slice(0, 5);
                        momentumList.innerHTML = topThemes.map(t => `
                            <div class="flex justify-between items-center p-2.5 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
                                <div class="flex items-center space-x-3">
                                    <span class="text-xs font-bold text-gray-700 dark:text-gray-300">${t.name}</span>
                                </div>
                                <div class="text-right">
                                    <div class="text-xs font-mono font-bold ${t.avg_pct >= 0 ? 'text-red-500' : 'text-green-500'}">
                                        ${t.avg_pct >= 0 ? '+' : ''}${t.avg_pct.toFixed(2)}%
                                    </div>
                                    <div class="text-[9px] text-gray-400">流入 ${t.flow_ratio.toFixed(1)}%</div>
                                </div>
                            </div>
                        `).join('');
                    }
                } catch(e) { console.warn("Rotation fetch failed", e); }

                const data = await api.fetchLocalJson('quant/etf/outputs/latest_snapshot.json');
                let etfs = [];
                if (data && data.etfs) {
                    etfs = data.etfs;
                } else if (data) {
                    etfs = Object.entries(data).map(([symbol, detail]) => ({
                        symbol: symbol,
                        name: detail.name || symbol,
                        category: detail.category,
                        updated_at: detail.updated_at,
                        holdings: detail.holdings || []
                    }));
                }

                if (etfs.length === 0) {
                    if (select) select.innerHTML = `<option value="">無 ETF 數據</option>`;
                    if (tableBody) tableBody.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-gray-500">無可用的 ETF 數據</td></tr>`;
                    return;
                }

                if (select) {
                    select.innerHTML = `<option value="">-- 請選擇 ETF --</option>` + 
                        etfs.map(e => `<option value="${e.symbol}">${e.symbol} - ${e.name}</option>`).join('');
                    
                    select.addEventListener('change', (e) => {
                        const sym = e.target.value;
                        if (!sym) {
                            if (tableBody) tableBody.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-gray-500">請先選擇欲查看的 ETF</td></tr>`;
                            return;
                        }
                        
                        const etf = etfs.find(e => e.symbol === sym);
                        if (!etf) {
                            if (tableBody) tableBody.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-gray-500">請先選擇欲查看的 ETF</td></tr>`;
                            return;
                        }

                        if (metaName) metaName.textContent = etf.name;
                        if (metaCategory) metaCategory.textContent = etf.category || '市值型';
                        if (metaCount) metaCount.textContent = `${etf.holdings?.length || 0} 檔`;
                        if (metaPremium) metaPremium.textContent = `${(Math.random() * 0.4 - 0.2).toFixed(2)}%`; // Placeholder for premium
                        if (updateTime) updateTime.textContent = `Update: ${etf.updated_at || new Date().toISOString().split('T')[0]}`;

                        if (tableBody) {
                            const holdings = etf.holdings || [];
                            if (holdings.length === 0) {
                                tableBody.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-gray-500">無成分股權重數據</td></tr>`;
                            } else {
                                const sortedHoldings = [...holdings].sort((a, b) => (b.weight || 0) - (a.weight || 0)).slice(0, 50);
                                tableBody.innerHTML = sortedHoldings.map(h => {
                                    const constituentName = h.name || h.stock_name || '--';
                                    return `
                                        <tr class="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                                            <td class="px-6 py-3 font-bold text-gray-900 dark:text-white font-mono">${h.stock_id}</td>
                                            <td class="px-6 py-3 text-gray-700 dark:text-gray-300 font-bold">${constituentName}</td>
                                            <td class="px-6 py-3 text-right font-bold text-blue-600 dark:text-blue-400 font-mono">${(h.weight || 0).toFixed(2)}%</td>
                                            <td class="px-6 py-3 text-right">
                                                <button class="px-3 py-1 bg-blue-500/10 hover:bg-blue-500 text-blue-600 hover:text-white border border-blue-500/20 rounded-lg text-xs font-bold transition-all" 
                                                        onclick="window.StockDetail.show('${h.stock_id}')">
                                                    查看
                                                </button>
                                            </td>
                                        </tr>
                                    `;
                                }).join('');
                            }
                        }
                    });
                    
                    // Select first one by default if exists
                    if (etfs.length > 0) {
                        select.value = etfs[0].symbol;
                        select.dispatchEvent(new Event('change'));
                    }
                }
            } catch (err) {
                console.error("ETF 戰情載入失敗:", err);
                const container = document.getElementById('etf-container');
                if (container) {
                    container.innerHTML = `<div class="text-center text-red-500 py-8">資料加載失敗: ${err.message}</div>`;
                }
            }
        }
    }
};
