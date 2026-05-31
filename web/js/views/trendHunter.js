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
        '法人建倉': {
            title: '法人佈局密碼',
            description: '偵測法人低檔潛伏建倉的量化籌碼流訊號，掌握 AI 族群輪動先機。',
            sideTitle: '訊號說明',
            sideContent: 'A=低檔潛伏建倉: 橫盤+法人吸籌+籌碼沉澱。A+=起跑試探: 量能微溫+均線糾結。B=突發攻擊: 爆量長紅+法人支撐。清單依法人累計買超由大到小排序。'
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

            <div class="space-y-6">
                <div class="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                    <details class="flex-none border-b border-gray-100 dark:border-gray-800">
                        <summary class="px-5 py-3 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer select-none flex items-center font-bold">
                            <span class="mr-2">💡</span> ${config.sideTitle}
                            <svg class="ml-2 w-3 h-3 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                        </summary>
                        <div class="px-5 pb-4 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">${config.sideContent}</div>
                    </details>
                    ${this.getMainContentPlaceholder(subPage)}
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
                <div id="quant-container" class="p-6 space-y-6 flex-1 flex flex-col">
                    <div id="regime-banner" class="hidden"></div>
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
                    <div id="quant-live-pms" class="hidden"></div>
                    <div id="quant-capital-dashboard" class="hidden"></div>
                    <div id="quant-alpha-allocation" class="hidden"></div>
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
                                        <th class="px-6 py-3 text-left hidden lg:table-cell">原因</th>
                                        <th class="px-6 py-3 text-right">配置權重</th>
                                        <th class="px-6 py-3 text-right hidden sm:table-cell">進場日期</th>
                                        <th class="px-6 py-3 text-right">累積回報</th>
                                        <th class="px-6 py-3 text-right hidden md:table-cell">籌碼特徵</th>
                                        <th class="px-6 py-3 text-right">操作建議</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-100 dark:divide-gray-800 font-mono text-sm text-gray-400">
                                    <tr><td colspan="7" class="px-6 py-8 text-center text-gray-500">加載數據中...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div id="quant-trade-log" class="hidden"></div>
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

        if (subPage === '法人建倉') {
            return `
                <div id="inst-track-container" class="p-6 space-y-4 flex-1 flex flex-col">
                    <div id="inst-track-summary" class="hidden"></div>
                    <div id="inst-track-sectors" class="space-y-3 flex-1"></div>
                    <div id="inst-track-empty" class="flex-1 flex items-center justify-center">
                        <div class="text-center">
                            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                            <p class="text-gray-500 text-sm">正在載入法人建倉數據...</p>
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

                    <!-- ETF 成分股權重圓餅圖 -->
                    <div id="etf-pie-chart" class="w-full h-72 bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-2 hidden"></div>

                    <!-- ETF 主題資金流 -->
                    <div id="etf-category-summary" class="hidden"></div>

                    <!-- ETF 股動輪轉 -->
                    <div id="etf-rotation" class="hidden"></div>

                    <!-- ETF 換股動向 -->
                    <div id="etf-rebalance" class="hidden"></div>

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
        
        if (subPage === '法人建倉') {
            const sectorsContainer = document.getElementById('inst-track-sectors');
            const emptyContainer = document.getElementById('inst-track-empty');
            const summaryEl = document.getElementById('inst-track-summary');
            if (!sectorsContainer) return;

            try {
                const data = await api.fetchLocalJson('quant/institutional_leaderboard.json');
                if (!data || !data.sectors || data.sectors.length === 0) {
                    if (emptyContainer) emptyContainer.innerHTML = '<div class="text-center py-12 text-gray-500">目前無符合法人低檔建倉條件的標的</div>';
                    return;
                }

                if (emptyContainer) emptyContainer.style.display = 'none';

                if (summaryEl) {
                    summaryEl.classList.remove('hidden');
                    summaryEl.innerHTML = `
                        <div class="bg-gradient-to-r from-blue-600/10 to-indigo-600/10 rounded-2xl border border-blue-500/20 p-4 flex items-center justify-between">
                            <div>
                                <span class="text-sm font-bold text-gray-900 dark:text-white">📡 監控中 AI 族群</span>
                                <span class="ml-2 text-xs text-gray-500">${data.total_tracking} 檔個股法人建倉中</span>
                            </div>
                            <span class="text-xs text-gray-400 font-mono">${data.date}</span>
                        </div>
                    `;
                }

                sectorsContainer.innerHTML = data.sectors.map(sector => `
                    <div class="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                        <div class="px-5 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors sector-accordion-header"
                             onclick="this.nextElementSibling.classList.toggle('hidden'); this.querySelector('.chevron').classList.toggle('rotate-180')">
                            <div class="flex items-center space-x-3">
                                <span class="text-lg">${sector.emoji || '📁'}</span>
                                <div>
                                    <div class="font-bold text-gray-900 dark:text-white text-sm">${sector.display_tag || sector.sector_tag}</div>
                                    <div class="text-xs ${sector.tracking_count >= 3 ? 'text-orange-500' : 'text-gray-400'}">
                                        ${sector.tracking_count} 檔個股法人建倉中
                                    </div>
                                </div>
                            </div>
                            <div class="flex items-center space-x-3">
                                <span class="text-xs text-gray-400 font-mono">${sector.stocks.length} 檔</span>
                                <svg class="chevron w-4 h-4 text-gray-400 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                                </svg>
                            </div>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="w-full text-left">
                                <thead class="bg-gray-50/50 dark:bg-gray-900/50 text-gray-400 text-[10px] uppercase">
                                    <tr>
                                        <th class="px-5 py-2">股票</th>
                                        <th class="px-5 py-2 text-left">備註</th>
                                        <th class="px-5 py-2 text-right">開始日</th>
                                        <th class="px-5 py-2 text-right">天數</th>
                                        <th class="px-5 py-2 text-right">累計買超(張)</th>
                                        <th class="px-5 py-2 text-right">區間損益</th>
                                        <th class="px-5 py-2 text-right">訊號</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-100 dark:divide-gray-800 font-mono text-xs">
                                    ${sector.stocks.map(s => {
                                        const ret = s.current_return || 0;
                                        const retStr = (ret >= 0 ? '+' : '') + (ret * 100).toFixed(1) + '%';
                                        const retClass = ret >= 0 ? 'text-red-500' : 'text-green-500';
                                        const buyStr = s.accumulated_inst_buy >= 1000
                                            ? (s.accumulated_inst_buy / 1000).toFixed(1) + 'K'
                                            : s.accumulated_inst_buy.toLocaleString();
                                        const signalConfig = {
                                            'B': { icon: '🔴', label: 'B 發動', cls: 'bg-red-500/15 text-red-500 border-red-500/30' },
                                            'A+': { icon: '🟠', label: 'A+ 起跑', cls: 'bg-orange-500/15 text-orange-500 border-orange-500/30' },
                                            'A': { icon: '🔵', label: 'A 潛伏', cls: 'bg-blue-500/15 text-blue-500 border-blue-500/30' },
                                        };
                                        const sig = signalConfig[s.latest_signal_code];
                                        const entrySig = signalConfig[s.entry_signal_code];
                                        const entryBadge = entrySig
                                            ? `<span class="text-[9px] font-bold px-1.5 py-0.5 rounded border ${entrySig.cls}">進場 ${entrySig.label}</span>`
                                            : '';
                                        const signalBadge = sig
                                            ? `<span class="text-[11px] font-bold px-2 py-1 rounded border ${sig.cls}">${sig.icon} ${sig.label}</span>`
                                            : '<span class="text-[10px] text-gray-400">追蹤中</span>';
                                        return `<tr class="hover:bg-gray-50 dark:hover:bg-gray-800/20 cursor-pointer transition-colors"
                                                     onclick="window.StockDetail.show('${s.stock_id}')">
                                            <td class="px-5 py-2.5">
                                                <div class="font-bold text-gray-900 dark:text-white">${s.stock_id}</div>
                                                <div class="text-[10px] text-gray-400">${s.name || ''}</div>
                                            </td>
                                            <td class="px-5 py-2.5 text-left">
                                                ${s.note ? `<span class="text-[10px] text-orange-500 leading-tight">${s.note}</span>` : '<span class="text-[10px] text-gray-400">--</span>'}
                                            </td>
                                            <td class="px-5 py-2.5 text-right text-gray-500">${s.start_date ? s.start_date.substring(5) : '--'}</td>
                                            <td class="px-5 py-2.5 text-right text-gray-500">${s.tracking_days}d</td>
                                            <td class="px-5 py-2.5 text-right font-bold text-blue-500">${buyStr}</td>
                                            <td class="px-5 py-2.5 text-right font-bold ${retClass}">${retStr}</td>
                                            <td class="px-5 py-2.5 text-right">
                                                <div class="flex flex-col items-end space-y-1">
                                                    ${signalBadge}
                                                    ${entryBadge}
                                                </div>
                                            </td>
                                        </tr>`;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `).join('');

            } catch (err) {
                console.error('法人建倉 loading error:', err);
                if (emptyContainer) {
                    emptyContainer.innerHTML = '<div class="text-center py-12 text-red-500 text-sm">數據載入失敗: ' + err.message + '</div>';
                }
            }
            return;
        }

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

                // 🚀 v10.6: 產業/AI 主題切換開關
                const toggleHtml = `
                    <div class="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 mb-2" style="width:fit-content">
                        <button class="view-toggle px-3 py-1 text-xs rounded-md font-bold bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm" data-view="industry">🏭 產業分類</button>
                        <button class="view-toggle px-3 py-1 text-xs rounded-md text-gray-500 dark:text-gray-400" data-view="ai">🤖 AI主題</button>
                    </div>
                `;
                container.insertAdjacentHTML('beforeend', toggleHtml);

                const chartDom = document.createElement('div');
                chartDom.style.width = '100%';
                chartDom.style.height = '100%';
                container.appendChild(chartDom);

                setTimeout(() => {
                    if (!container.contains(chartDom)) return;
                    const isDark = document.documentElement.classList.contains('dark');
                    const myChart = echarts.init(chartDom, isDark ? 'dark' : null);
                    window.addEventListener('resize', () => myChart.resize());

                    function getActiveData(view) {
                        return view === 'ai' ? (rotationData.ai_themes || rotationData.themes) : rotationData.themes;
                    }

                    function buildOption(data) {
                        const netFlows = data.map(t => t.net_flow || 0);
                        const bound = Math.max(...netFlows.map(Math.abs), 5);
                        const seriesData = data.map(t => [t.net_flow || 0, t.avg_pct, t.name, t.trend, t.flow_ratio]);

                        return {
                            backgroundColor: 'transparent',
                            tooltip: {
                                trigger: 'item',
                                formatter: function (params) {
                                    const nf = params.value[0];
                                    const nfStr = nf >= 0 ? `+${nf.toFixed(1)}億` : `${nf.toFixed(1)}億`;
                                    return `<b>${params.value[2]}</b><br/>法人淨買超: ${nfStr}<br/>平均漲跌幅: ${params.value[1].toFixed(2)}%<br/>成交佔比: ${(params.value[4] || 0).toFixed(1)}%`;
                                }
                            },
                            grid: {
                                left: '12%',
                                right: '10%',
                                bottom: '20%',
                                top: '22%',
                                containLabel: true
                            },
                            xAxis: {
                                name: '法人淨買超 (億元)',
                                nameLocation: 'middle',
                                nameGap: 60,
                                splitLine: { show: false },
                                axisLabel: { color: isDark ? '#888' : '#666', fontSize: 10 },
                                min: -bound - 2,
                                max: bound + 2
                            },
                            yAxis: {
                                name: '平均漲跌幅 (%)',
                                nameLocation: 'end',
                                nameGap: 35,
                                splitLine: { 
                                    show: true,
                                    lineStyle: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }
                                },
                                axisLabel: { color: isDark ? '#888' : '#666', fontSize: 10 },
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
                                            top: -210,
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
                                            bottom: -240,
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
                                            top: -210,
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
                                            bottom: -240,
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
                                symbolSize: function (value) {
                                    const flow = (value && value[4]) || 0;
                                    return Math.max(10, Math.min(50, flow * 1.5 + 8));
                                },
                                itemStyle: {
                                    color: function(params) {
                                        const x = params.value[0];
                                        const y = params.value[1];
                                        if (x > 0) {
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
                                        { xAxis: 0, name: '零軸線', label: { position: 'start', distance: 25, color: isDark ? '#aaa' : '#666' } },
                                        { yAxis: 0, name: '平盤線', label: { position: 'end', color: isDark ? '#aaa' : '#666' } }
                                    ],
                                    label: {
                                        show: true,
                                        fontSize: 11,
                                        formatter: function(p) {
                                            return p.name;
                                        }
                                    }
                                }
                            }]
                        };
                    }

                    let currentView = 'industry';
                    let option = buildOption(getActiveData(currentView));
                    myChart.setOption(option);
                    myChart.resize();
                    window.addEventListener('resize', () => myChart.resize());

                    // 🚀 v10.6: 切換事件
                    container.querySelectorAll('.view-toggle').forEach(btn => {
                        btn.addEventListener('click', function() {
                            const view = this.dataset.view;
                            if (view === currentView) return;
                            currentView = view;
                            container.querySelectorAll('.view-toggle').forEach(b => {
                                b.className = 'view-toggle px-3 py-1 text-xs rounded-md text-gray-500 dark:text-gray-400';
                            });
                            this.className = 'view-toggle px-3 py-1 text-xs rounded-md font-bold bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm';
                            option = buildOption(getActiveData(view));
                            myChart.setOption(option, true);
                        });
                    });
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
                            <td class="px-6 py-4 font-mono text-gray-500">${s.entry_date || s.exit_date || s.date}</td>
                            <td class="px-6 py-4">
                                <div class="font-bold text-gray-900 dark:text-white">${cleanStockId}</div>
                                <div class="text-[10px] text-gray-400">${stockName}</div>
                            </td>
                            <td class="px-6 py-4">
                                <span class="px-2 py-0.5 rounded text-[10px] font-bold ${type === 'BUY' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}">
                                    ${type === 'BUY' ? '買進 BUY' : '賣出 SELL'}
                                </span>
                            </td>
                            <td class="px-6 py-4 text-xs">
                                ${s.select_reason ? `<span class="inline-block px-1.5 py-0.5 rounded text-[8px] font-bold mr-1 ${s.select_reason.includes('趨勢') ? 'text-red-500 bg-red-500/10' : s.select_reason.includes('法人') ? 'text-orange-500 bg-orange-500/10' : s.select_reason.includes('ETF') ? 'text-purple-500 bg-purple-500/10' : 'text-blue-500 bg-blue-500/10'}">${s.select_reason}</span>` : ''}
                                <span class="text-gray-450">${s.reason || s.label || 'SIGNAL'}</span>
                            </td>
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

                // Regime Banner
                const regimeBanner = document.getElementById('regime-banner');
                if (regimeBanner && data.regime) {
                    const isAggressive = data.regime === 'AGGRESSIVE';
                    const isDefensive = data.regime === 'DEFENSIVE';
                    const config = data.regime_config || {};
                    const mode = config.mode || (isAggressive ? '積極進攻' : (isDefensive ? '保守防禦' : data.regime));
                    const desc = config.description || (isAggressive ? '加權指數站穩 60MA，市場多頭格局，系統積極建倉' : (isDefensive ? '轉向低 Beta / Alpha 穩健股' : ''));
                    const maxPos = config.max_positions ?? '-';
                    const dailyLimit = config.daily_entry_limit ?? '-';
                    regimeBanner.classList.remove('hidden');
                    if (isAggressive || isDefensive) {
                        regimeBanner.innerHTML = `
                            <div class="flex items-center justify-between p-3 rounded-xl text-white ${isAggressive ? 'bg-gradient-to-r from-orange-500 to-red-600' : 'bg-gradient-to-r from-indigo-600 to-blue-600'}">
                                <div class="flex items-center space-x-3">
                                    <span class="text-xl">${isAggressive ? '🔥' : '🛡️'}</span>
                                    <div>
                                        <div class="text-sm font-bold">${mode}</div>
                                        <div class="text-[10px] opacity-80">${desc}</div>
                                    </div>
                                </div>
                                <div class="text-[10px] font-mono opacity-70">持倉上限 ${maxPos}檔 · 每日 ${dailyLimit}檔</div>
                            </div>
                        `;
                    } else {
                        regimeBanner.innerHTML = `
                            <div class="flex items-center justify-between p-3 rounded-xl bg-gray-100 dark:bg-gray-800">
                                <div class="flex items-center space-x-3">
                                    <span>📊</span>
                                    <div class="text-sm font-bold">環境: ${data.regime}</div>
                                </div>
                            </div>
                        `;
                    }
                }

                // Live PMS
                const livePmsEl = document.getElementById('quant-live-pms');
                if (livePmsEl && data.performance) {
                    const perf = data.performance;
                    const liveTotalReturn = (perf.live_total_return ?? 0) * 100;
                    const liveSharpe = perf.live_sharpe ?? 0;
                    const liveDrawdown = (perf.live_max_drawdown ?? 0) * 100;
                    const liveWinRate = (perf.live_win_rate ?? 0) * 100;
                    const equity = perf.live_equity || [];
                    const returnColor = liveTotalReturn >= 0 ? 'text-red-500' : 'text-green-500';
                    livePmsEl.innerHTML = `
                        <div class="bg-white dark:bg-[#161b22] rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                            <h3 class="font-bold text-gray-900 dark:text-white flex items-center text-sm mb-4">
                                <span class="mr-2">📈</span> 基金實戰監控 (Live PMS)
                            </h3>
                            <div class="grid grid-cols-2 gap-4">
                                <div class="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl">
                                    <div class="text-[10px] text-gray-500 mb-1">實戰報酬</div>
                                    <div class="text-lg font-bold font-mono ${returnColor}">${liveTotalReturn.toFixed(2)}%</div>
                                </div>
                                <div class="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl">
                                    <div class="text-[10px] text-gray-500 mb-1">實戰 Sharpe</div>
                                    <div class="text-lg font-bold font-mono text-orange-500">${liveSharpe.toFixed(2)}</div>
                                </div>
                                <div class="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl">
                                    <div class="text-[10px] text-gray-500 mb-1">實戰回撤</div>
                                    <div class="text-lg font-bold font-mono text-green-500">${liveDrawdown.toFixed(2)}%</div>
                                </div>
                                <div class="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl">
                                    <div class="text-[10px] text-gray-500 mb-1">實戰勝率</div>
                                    <div class="text-lg font-bold font-mono text-gray-900 dark:text-white">${liveWinRate.toFixed(1)}%</div>
                                </div>
                            </div>
                            ${equity.length > 0 ? `
                            <div class="mt-4 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl">
                                <div class="text-[10px] text-gray-500 mb-2">實戰資產趨勢</div>
                                <div id="quant-equity-chart" class="w-full h-24"></div>
                            </div>` : ''}
                        </div>
                    `;
                    livePmsEl.classList.remove('hidden');
                    if (equity.length > 0) {
                        setTimeout(() => {
                            const chartDom = document.getElementById('quant-equity-chart');
                            if (!chartDom) return;
                            const isDark = document.documentElement.classList.contains('dark');
                            const chart = echarts.init(chartDom, isDark ? 'dark' : null);
                            chart.setOption({
                                backgroundColor: 'transparent',
                                grid: { left: '5%', right: '5%', top: '5%', bottom: '5%' },
                                xAxis: { type: 'category', data: equity.map(e => e.date || ''), show: false },
                                yAxis: { type: 'value', show: false, scale: true },
                                series: [{
                                    type: 'line', data: equity.map(e => e.equity), smooth: true, showSymbol: false,
                                    areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(34,197,94,0.3)' }, { offset: 1, color: 'rgba(34,197,94,0)' }]) },
                                    lineStyle: { color: '#22c55e', width: 2 }, itemStyle: { color: '#22c55e' }
                                }]
                            });
                            window.addEventListener('resize', () => chart.resize());
                        }, 100);
                    }
                }

                // Virtual Account
                const capitalEl = document.getElementById('quant-capital-dashboard');
                if (capitalEl && data.metadata) {
                    const meta = data.metadata;
                    const nav = data.nav || 0;
                    const totalCap = meta.total_capital || nav;
                    const usedCap = meta.used_capital || 0;
                    const dashCash = data.cash !== undefined ? data.cash : (totalCap - usedCap);
                    const usageRatio = totalCap > 0 ? usedCap / totalCap : 0;
                    capitalEl.innerHTML = `
                        <div class="bg-white dark:bg-[#161b22] rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                            <div class="flex items-center justify-between mb-4">
                                <h3 class="font-bold text-gray-900 dark:text-white flex items-center text-sm">
                                    <span class="mr-2">💰</span> 虛擬金帳戶狀態
                                </h3>
                                <span class="text-xs font-mono font-bold text-blue-500">NAV: $${nav.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                            </div>
                            <div class="flex justify-between mb-3">
                                <div>
                                    <div class="text-[10px] text-gray-500 mb-0.5">可用現金 (Cash)</div>
                                    <div class="text-sm font-bold font-mono text-gray-900 dark:text-white">$${dashCash.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                                </div>
                                <div class="text-right">
                                    <div class="text-[10px] text-gray-500 mb-0.5">已用資金 (Used)</div>
                                    <div class="text-sm font-bold font-mono text-orange-500">$${usedCap.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                                </div>
                            </div>
                            <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div class="h-full rounded-full bg-gradient-to-r from-orange-400 to-green-500" style="width: ${(usageRatio * 100).toFixed(0)}%"></div>
                            </div>
                            <div class="flex justify-between mt-1">
                                <span class="text-[10px] text-gray-500">資金利用率</span>
                                <span class="text-[10px] font-bold text-gray-500">${(usageRatio * 100).toFixed(0)}%</span>
                            </div>
                        </div>
                    `;
                    capitalEl.classList.remove('hidden');
                }

                // Alpha Allocation
                const alphaEl = document.getElementById('quant-alpha-allocation');
                if (alphaEl && data.alpha_allocation && data.alpha_allocation.length > 0) {
                    const alphaLabel = { 'TREND': '趨勢對沖', 'MR': '反轉對沖' };
                    alphaEl.innerHTML = `
                        <div class="bg-white dark:bg-[#161b22] rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                            <h3 class="font-bold text-gray-900 dark:text-white flex items-center text-sm mb-4">
                                <span class="mr-2">🧠</span> Alpha 策略權重分佈
                            </h3>
                            <div class="grid grid-cols-2 gap-4">
                                ${[...data.alpha_allocation].sort((a, b) => b.weight - a.weight).map(a => {
                                    const label = alphaLabel[a.strategy] || a.strategy;
                                    const scoreLabel = a.strategy === 'TREND' ? 'Beta' : 'Alpha';
                                    return `
                                        <div class="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl">
                                            <div class="flex items-center justify-between mb-2">
                                                <span class="text-xs font-bold">${label}</span>
                                                <span class="text-[10px] text-gray-500">(${scoreLabel}: ${(a.score || 0).toFixed(2)})</span>
                                            </div>
                                            <div class="text-lg font-bold font-mono text-orange-500">${(a.weight * 100).toFixed(0)}%</div>
                                            <div class="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-2 overflow-hidden">
                                                <div class="h-full bg-orange-500 rounded-full" style="width: ${(a.weight * 100).toFixed(0)}%"></div>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    `;
                    alphaEl.classList.remove('hidden');
                }

                // 📊 選股來源分布統計
                const candidates = (data.portfolio || []).filter(p => !p.is_held && (p.entry_reason === 'SIGNAL' || p.action === 'BUY'));
                const allItems = [...activeHoldings, ...candidates];
                const srcStats = { 趨勢跟蹤: 0, 法人建倉: 0, 均值回歸: 0, ETF動能: 0 };
                allItems.forEach(item => {
                    const r = item.select_reason || item.entry_reason || '';
                    if (r.includes('趨勢跟蹤')) srcStats['趨勢跟蹤']++;
                    if (r.includes('法人建倉')) srcStats['法人建倉']++;
                    if (r.includes('均值回歸')) srcStats['均值回歸']++;
                    if (r.includes('ETF動能')) srcStats['ETF動能']++;
                });
                const totalSrc = Object.values(srcStats).reduce((a, b) => a + b, 0) || 1;
                const srcBarHtml = `
                    <div class="bg-white dark:bg-[#161b22] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="font-bold text-gray-900 dark:text-white text-sm">📊 選股來源分布（共 ${allItems.length} 檔）</h3>
                            <span class="text-[10px] text-gray-500 font-mono">持倉 ${activeHoldings.length} · 候選 ${candidates.length}</span>
                        </div>
                        <div class="space-y-2">
                            ${Object.entries({ '趨勢跟蹤': 'red', '法人建倉': 'orange', '均值回歸': 'blue' }).map(([name, color]) => {
                                const count = srcStats[name] || 0;
                                const pct = (count / totalSrc * 100).toFixed(0);
                                const barColor = color === 'red' ? 'bg-red-500' : color === 'orange' ? 'bg-orange-500' : 'bg-blue-500';
                                const textColor = color === 'red' ? 'text-red-500' : color === 'orange' ? 'text-orange-500' : 'text-blue-500';
                                return count > 0 ? `
                                <div class="flex items-center text-xs">
                                    <span class="w-16 font-bold ${textColor}">${name}</span>
                                    <span class="w-10 text-right font-mono text-gray-500">${pct}%</span>
                                    <div class="flex-1 h-3 bg-gray-100 dark:bg-gray-800 rounded-full mx-2 overflow-hidden">
                                        <div class="h-full ${barColor} rounded-full" style="width: ${pct}%"></div>
                                    </div>
                                    <span class="w-8 text-right font-mono text-gray-400">${count}檔</span>
                                </div>` : '';
                            }).join('')}
                            ${srcStats['ETF動能'] > 0 ? `
                            <div class="flex items-center text-xs pt-1 border-t border-gray-100 dark:border-gray-800">
                                <span class="w-16 font-bold text-purple-500">ETF動能</span>
                                <span class="w-10 text-right font-mono text-gray-500">${(srcStats['ETF動能'] / totalSrc * 100).toFixed(0)}%</span>
                                <div class="flex-1 h-3 bg-gray-100 dark:bg-gray-800 rounded-full mx-2 overflow-hidden">
                                    <div class="h-full bg-purple-500 rounded-full" style="width: ${(srcStats['ETF動能'] / totalSrc * 100).toFixed(0)}%"></div>
                                </div>
                                <span class="w-8 text-right font-mono text-gray-400">${srcStats['ETF動能']}檔</span>
                            </div>` : ''}
                        </div>
                    </div>
                `;
                // Insert stats bar before the holdings table card
                const holdingsCard = document.querySelector('#quant-holdings-table')?.closest('.rounded-xl.border');
                if (holdingsCard && holdingsCard.parentNode) {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = srcBarHtml;
                    holdingsCard.parentNode.insertBefore(tempDiv.firstElementChild, holdingsCard);
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
                            const reason = p.select_reason || '';
                            const reasonColor = reason.includes('趨勢') ? 'text-red-500 bg-red-500/10' : reason.includes('法人') ? 'text-orange-500 bg-orange-500/10' : reason.includes('ETF') ? 'text-purple-500 bg-purple-500/10' : 'text-blue-500 bg-blue-500/10';
                            return `
                                <tr class="hover:bg-gray-50 dark:hover:bg-gray-900/30 cursor-pointer" onclick="window.StockDetail.show('${cleanStockId}')">
                                    <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                        <div class="font-bold">${cleanStockId}</div>
                                        <div class="text-xs text-gray-500">${name}</div>
                                    </td>
                                    <td class="px-6 py-4 text-left hidden lg:table-cell">
                                        ${reason ? `<span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold ${reasonColor}">${reason}</span>` : ''}
                                    </td>
                                    <td class="px-6 py-4 text-right font-bold text-gray-700 dark:text-gray-300">${((p.weight || 0) * 100).toFixed(1)}%</td>
                                    <td class="px-6 py-4 text-right text-gray-500 font-mono text-xs hidden sm:table-cell">${p.entry_date || '--'}</td>
                                    <td class="px-6 py-4 text-right font-bold ${isProfit ? 'text-red-500' : 'text-green-500'}">
                                        ${isProfit ? '+' : ''}${rawRet.toFixed(2)}%
                                    </td>
                                    <td class="px-6 py-4 text-right text-xs text-gray-500 hidden md:table-cell">${p.chips || p.chip_label || ''}</td>
                                    <td class="px-6 py-4 text-right">
                                        <span class="px-2 py-1 rounded text-xs font-bold ${actionColor}">${action}</span>
                                    </td>
                                </tr>
                            `;
                        }).join('');
                    }
                }

                // Trade Log
                const tradeLogEl = document.getElementById('quant-trade-log');
                if (tradeLogEl && data.trade_log && data.trade_log.length > 0) {
                    const trades = data.trade_log.slice(0, 20);
                    tradeLogEl.innerHTML = `
                        <div class="bg-white dark:bg-[#161b22] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                            <div class="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex-none">
                                <h3 class="font-bold text-gray-900 dark:text-white flex items-center text-sm">
                                    <span class="mr-2">🕐</span> 實戰動態日誌 (近期進出場)
                                </h3>
                            </div>
                            <div class="divide-y divide-gray-100 dark:divide-gray-800">
                                ${trades.map(t => {
                                    const isBuy = t.action === 'BUY' || !t.exit_date;
                                    const stockName = stocksMeta[t.stock] || '';
                                    const ret = t.return;
                                    const hasReturn = ret !== undefined && ret !== null;
                                    return `
                                        <div class="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900/30">
                                            <div class="min-w-0 flex-1">
                                                <div class="font-bold text-sm text-gray-900 dark:text-white">${stockName || t.stock}</div>
                                                <div class="flex items-center space-x-2 mt-1">
                                                    <span class="px-1.5 py-0.5 rounded text-[10px] font-bold ${isBuy ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'}">
                                                        ${isBuy ? '已買入' : '已賣出'}
                                                    </span>
                                                    <span class="text-[10px] font-mono text-gray-500">${t.stock}</span>
                                                </div>
                                                ${t.select_reason ? `<div class="mt-1"><span class="inline-block px-1.5 py-0.5 rounded text-[8px] font-bold ${t.select_reason.includes('趨勢') ? 'text-red-500 bg-red-500/10' : t.select_reason.includes('法人') ? 'text-orange-500 bg-orange-500/10' : t.select_reason.includes('ETF') ? 'text-purple-500 bg-purple-500/10' : 'text-blue-500 bg-blue-500/10'}">${t.select_reason}</span></div>` : ''}
                                            </div>
                                            <div class="text-right mx-4 flex-shrink-0">
                                                <div class="text-[10px] font-mono text-gray-500">
                                                    ${t.exit_date ? `${t.entry_date} → ${t.exit_date}` : `買入於 ${t.entry_date}`}
                                                </div>
                                                <div class="text-[10px] text-gray-500">${t.reason || t.entry_reason || (isBuy ? '策略進場' : '策略出場')}</div>
                                            </div>
                                            <div class="text-right min-w-[70px] flex-shrink-0">
                                                ${hasReturn ? `<span class="text-sm font-bold font-mono ${ret >= 0 ? 'text-red-500' : 'text-green-500'}">${(ret * 100).toFixed(2)}%</span>` : '<span class="text-xs font-bold text-blue-500">持倉中</span>'}
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    `;
                    tradeLogEl.classList.remove('hidden');
                }

                // 渲染訊號表格 (分頁) — 合併候選股(有select_reason) + trade_log(補歷史)
                const signalCandidates = (data.portfolio || []).filter(p => !p.is_held && (p.entry_reason === 'SIGNAL'));
                allSignals = signalCandidates.map(c => ({
                    entry_date: data.date, symbol: c.stock, type: 'BUY',
                    select_reason: c.select_reason || '',
                    reason: c.select_reason || '模型選入'
                }));
                if (data.trade_log && data.trade_log.length > 0) {
                    const tradeSignals = data.trade_log.map(t => ({
                        entry_date: t.entry_date || t.exit_date || '',
                        symbol: t.stock, type: t.action === 'SELL' ? 'SELL' : 'BUY',
                        select_reason: t.select_reason || '',
                        reason: t.reason || t.select_reason || (t.action === 'SELL' ? '策略出場' : '策略進場')
                    }));
                    const seen = new Set(allSignals.map(s => s.symbol + '_' + s.entry_date));
                    allSignals = [...allSignals, ...tradeSignals.filter(t => !seen.has(t.symbol + '_' + t.entry_date))];
                }
                
                if (allSignals.length > 0) allSignals.sort((a, b) => new Date(b.entry_date || b.date || 0) - new Date(a.entry_date || a.date || 0));
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
                            
                            ${s.note ? `<p class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed bg-blue-50/50 dark:bg-blue-900/10 p-2.5 rounded-lg border border-blue-100 dark:border-blue-900/30">${s.note}</p>` : ''}
                            ${s.params ? `<p class="text-[10px] font-mono text-orange-500 leading-relaxed bg-orange-50/50 dark:bg-orange-900/10 px-2.5 py-1.5 rounded-lg border border-orange-200/50 dark:border-orange-900/30">⚙️ ${s.params}</p>` : ''}
                            
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

                // 🚀 Issue 7a: ETF 主題資金流
                try {
                    const etfRotation = await api.fetchLocalJson('quant/etf/outputs/rotation.json');
                    const catSummary = document.getElementById('etf-category-summary');
                    if (catSummary && etfRotation) {
                        const catLabels = {
                            index: '市值型', high_dividend: '高股息', technology: '科技型', semiconductor: '半導體',
                            ai: '人工智慧', esg: 'ESG永續', active: '主動式', bond: '債券型',
                            financial: '金融型', overseas_us: '美股型', overseas_japan: '日股型',
                            overseas_china: '中股型', overseas_india: '印度型', overseas_semiconductor: '海外半導體',
                            leveraged: '槓桿型', inverse: '反向型', gold: '黃金型', oil: '原油型'
                        };
                        const entries = Object.entries(etfRotation);
                        if (entries.length > 0) {
                            catSummary.classList.remove('hidden');
                            catSummary.innerHTML = `
                                <div class="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
                                    <h3 class="font-bold text-gray-900 dark:text-white flex items-center mb-4 text-sm">
                                        <span class="mr-2">📊</span> ETF 主題資金流
                                    </h3>
                                    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                        ${entries.sort((a, b) => Math.abs(b[1].avg_weight_change || 0) - Math.abs(a[1].avg_weight_change || 0)).map(([key, val]) => {
                                            const wc = val.avg_weight_change || 0;
                                            const wcPct = (wc * 100).toFixed(1);
                                            const isPos = wc >= 0;
                                            return `
                                                <div class="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl">
                                                    <div class="text-[10px] text-gray-500 mb-1 font-medium">${catLabels[key] || key}</div>
                                                    <div class="flex items-center justify-between">
                                                        <span class="text-sm font-bold font-mono ${isPos ? 'text-red-500' : 'text-green-500'}">${isPos ? '+' : ''}${wcPct}%</span>
                                                        <span class="text-[9px] text-gray-400">${val.etf_count || 0}檔</span>
                                                    </div>
                                                    <div class="h-1 bg-gray-200 dark:bg-gray-700 rounded-full mt-2 overflow-hidden">
                                                        <div class="h-full rounded-full ${isPos ? 'bg-red-500' : 'bg-green-500'}" style="width: ${Math.min(Math.abs(wc) * 200, 100)}%"></div>
                                                    </div>
                                                </div>
                                            `;
                                        }).join('')}
                                    </div>
                                </div>
                            `;
                        }
                    }
                } catch(e) { console.warn("ETF rotation fetch failed", e); }

                // 🚀 Issue 7b: ETF 股動輪轉
                try {
                    const etfRotation = await api.fetchLocalJson('quant/etf/outputs/rotation.json');
                    const rotEl = document.getElementById('etf-rotation');
                    if (rotEl && etfRotation) {
                        const allInflows = Object.values(etfRotation).flatMap(cat => cat.top_inflow || []);
                        const uniqueInflows = [...new Set(allInflows)];
                        if (uniqueInflows.length > 0) {
                            rotEl.classList.remove('hidden');
                            rotEl.innerHTML = `
                                <div class="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
                                    <h3 class="font-bold text-gray-900 dark:text-white flex items-center mb-4 text-sm">
                                        <span class="mr-2">🔥</span> ETF 股動輪轉
                                        <span class="ml-2 text-[10px] text-gray-500 font-normal">資金流入標的</span>
                                    </h3>
                                    <div class="overflow-x-auto">
                                        <div class="flex space-x-3 min-w-max pb-2">
                                            ${uniqueInflows.map(sym => `
                                                <div onclick="window.StockDetail.show('${sym}')" class="flex flex-col items-center justify-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800 min-w-[80px] cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors">
                                                    <span class="text-lg">📈</span>
                                                    <span class="text-xs font-bold mt-1 text-gray-900 dark:text-white">${sym}</span>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                </div>
                            `;
                        }
                    }
                } catch(e) { console.warn("ETF rotation inflow fetch failed", e); }

                // 🚀 Issue 7c: ETF 換股動向
                try {
                    const rebalance = await api.fetchLocalJson('quant/etf/outputs/rebalance.json');
                    const rebEl = document.getElementById('etf-rebalance');
                    if (rebEl && rebalance) {
                        const rebEntries = Object.entries(rebalance).filter(([, v]) => (v.added && v.added.length) || (v.removed && v.removed.length) || (v.weight_up && v.weight_up.length) || (v.weight_down && v.weight_down.length));
                        if (rebEntries.length > 0) {
                            rebEl.classList.remove('hidden');
                            rebEl.innerHTML = `
                                <div class="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
                                    <h3 class="font-bold text-gray-900 dark:text-white flex items-center mb-4 text-sm">
                                        <span class="mr-2">🔄</span> ETF 換股動向
                                        <span class="ml-2 text-[10px] text-gray-500 font-normal">最近異動</span>
                                    </h3>
                                    <div class="overflow-x-auto">
                                        <div class="flex space-x-4 min-w-max pb-2">
                                            ${rebEntries.map(([etfID, reb]) => `
                                                <div class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800 min-w-[160px] max-w-[200px]">
                                                    <div class="font-bold text-xs text-gray-900 dark:text-white mb-2">${reb.name || etfID}</div>
                                                    ${reb.added && reb.added.length ? `
                                                        <div class="mb-2">
                                                            <span class="text-[10px] font-bold text-red-500">✦ 新進</span>
                                                            <div class="flex flex-wrap gap-1 mt-1">
                                                                ${reb.added.slice(0, 4).map(s => `<span class="text-[9px] font-mono bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded">${s}</span>`).join('')}
                                                            </div>
                                                        </div>
                                                    ` : ''}
                                                    ${reb.removed && reb.removed.length ? `
                                                        <div class="mb-2">
                                                            <span class="text-[10px] font-bold text-green-500">✧ 剔除</span>
                                                            <div class="flex flex-wrap gap-1 mt-1">
                                                                ${reb.removed.slice(0, 4).map(s => `<span class="text-[9px] font-mono bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded">${s}</span>`).join('')}
                                                            </div>
                                                        </div>
                                                    ` : ''}
                                                    ${reb.weight_up && reb.weight_up.length ? `
                                                        <div class="mb-2">
                                                            <span class="text-[10px] font-bold text-blue-500">↑ 權重增</span>
                                                            <div class="flex flex-wrap gap-1 mt-1">
                                                                ${reb.weight_up.slice(0, 3).map(w => `<span class="text-[9px] font-mono bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded">${w.stock_id} +${w.diff.toFixed(1)}</span>`).join('')}
                                                            </div>
                                                        </div>
                                                    ` : ''}
                                                    ${reb.weight_down && reb.weight_down.length ? `
                                                        <div>
                                                            <span class="text-[10px] font-bold text-orange-500">↓ 權重減</span>
                                                            <div class="flex flex-wrap gap-1 mt-1">
                                                                ${reb.weight_down.slice(0, 3).map(w => `<span class="text-[9px] font-mono bg-orange-500/10 text-orange-500 px-1.5 py-0.5 rounded">${w.stock_id} ${w.diff.toFixed(1)}</span>`).join('')}
                                                            </div>
                                                        </div>
                                                    ` : ''}
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                </div>
                            `;
                        }
                    }
                } catch(e) { console.warn("ETF rebalance fetch failed", e); }

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

                // 量化系統運作機制說明
                try {
                    const epData = await api.fetchLocalJson('quant/evolved_params.json');
                    const ep = (epData && epData.global) ? epData.global : {};
                    const rsExit = ep.rs_exit || '--';
                    const mrRsi = ep.mr_rsi_exit || '--';
                    const trailGap = ep.trailing_gap ? (ep.trailing_gap * 100).toFixed(0) : '--';
                    container.innerHTML += `
                        <details class="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                            <summary class="px-5 py-3 text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer select-none flex items-center">
                                🧠 量化系統運作機制
                                <svg class="ml-2 w-3 h-3 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                            </summary>
                            <div class="px-5 pb-5 text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed space-y-3 font-mono">
                                <div>
                                    <div class="font-bold text-gray-700 dark:text-gray-300">📅 train（每週六）</div>
                                    <div class="pl-3 border-l-2 border-gray-200 dark:border-gray-700 mt-1">
                                        回放最近 120 天歷史資料，從 100 萬初始資金開始模擬交易。<br>
                                        計算 TREND / MR / Portfolio 的 Sharpe、總報酬率、勝率。<br>
                                        訓練結束後自動執行 optimize() 搜尋最佳出場參數，<br>
                                        以 Portfolio Sharpe 最高為目標調整 RS_exit / MR_RSI_exit。
                                    </div>
                                </div>
                                <div>
                                    <div class="font-bold text-gray-700 dark:text-gray-300">📅 run（每交易日）</div>
                                    <div class="pl-3 border-l-2 border-gray-200 dark:border-gray-700 mt-1">
                                        接續前一天的實戰持倉與資金，執行當日交易決策。<br>
                                        產出 latest_portfolio.json（持股、候選、交易紀錄、績效）。<br>
                                        產出 latest_strategies.json（策略回測數字 + 演化後參數）。<br>
                                        每天晚上台灣時間 20:00 由 GitHub Actions 自動執行。
                                    </div>
                                </div>
                                <div>
                                    <div class="font-bold text-gray-700 dark:text-gray-300">🧬 策略演化（Evolution Engine）</div>
                                    <div class="pl-3 border-l-2 border-gray-200 dark:border-gray-700 mt-1">
                                        analyze_regret() — 賣出後若股價再漲 15%+ → 放寬該主題 RS 出場閾值；MR 賣出後反彈續強 → 調高 RSI 出場閾值<br>
                                        optimize() — 每週訓練後對 rs_exit（80~92）、mr_rsi_exit（75~85）做網格搜尋，選出 Portfolio Sharpe 最高的參數組合
                                    </div>
                                </div>
                                <div>
                                    <div class="font-bold text-gray-700 dark:text-gray-300">📊 回測績效計算（PerformanceMetrics）</div>
                                    <div class="pl-3 border-l-2 border-gray-200 dark:border-gray-700 mt-1">
                                        淨值曲線 equity → pct_change() → 日報酬率序列<br>
                                        Total Return =（最終淨值 - 初始資金）/ 初始資金<br>
                                        Sharpe Ratio = avg(日報酬) / std(日報酬) × √252<br>
                                        Max Drawdown = min(（淨值 - 歷史高點）/ 歷史高點)<br>
                                        Win Rate = 獲利交易次數 / 總交易次數
                                    </div>
                                </div>
                                <div class="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                                    <span class="font-bold text-gray-700 dark:text-gray-300">⚙️ 當前演化參數</span>
                                    <div class="grid grid-cols-3 gap-2 mt-2 text-[10px]">
                                        <div class="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700 text-center">
                                            <div class="text-gray-400">RS_exit</div>
                                            <div class="font-bold text-orange-500">${rsExit}</div>
                                        </div>
                                        <div class="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700 text-center">
                                            <div class="text-gray-400">MR_RSI_exit</div>
                                            <div class="font-bold text-orange-500">${mrRsi}</div>
                                        </div>
                                        <div class="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700 text-center">
                                            <div class="text-gray-400">Trailing Gap</div>
                                            <div class="font-bold text-orange-500">${trailGap}%</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </details>
                    `;
                } catch(e) { console.warn('System desc load failed', e); }
                            }
                        }

                        // 🚀 Issue 8: ETF 圓餅圖
                        const pieContainer = document.getElementById('etf-pie-chart');
                        if (pieContainer) {
                            if (window.etfPieChartInstance) window.etfPieChartInstance.dispose();
                            const allHoldings = etf.holdings || [];
                            if (allHoldings.length > 0) {
                                pieContainer.classList.remove('hidden');
                                const sorted = [...allHoldings].sort((a, b) => (b.weight || 0) - (a.weight || 0));
                                const top10 = sorted.slice(0, 10);
                                const others = sorted.slice(10);
                                const othersWeight = others.reduce((s, h) => s + (h.weight || 0), 0);
                                const pieDom = document.createElement('div');
                                pieDom.style.width = '100%';
                                pieDom.style.height = '100%';
                                pieContainer.innerHTML = '';
                                pieContainer.appendChild(pieDom);
                                setTimeout(() => {
                                    if (!pieContainer.contains(pieDom)) return;
                                    const isDark = document.documentElement.classList.contains('dark');
                                    const chart = echarts.init(pieDom, isDark ? 'dark' : null);
                                    window.etfPieChartInstance = chart;
                                    const pieData = top10.map(h => ({ name: h.stock_name || h.stock_id || h.name, value: h.weight || 0 }));
                                    if (othersWeight > 0) pieData.push({ name: '其他', value: othersWeight });
                                    chart.setOption({
                                        backgroundColor: 'transparent',
                                        tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
                                        series: [{
                                            type: 'pie', radius: ['30%', '60%'], center: ['50%', '50%'],
                                            data: pieData,
                                            label: { fontSize: 10, formatter: '{b}\n{d}%' },
                                            itemStyle: { borderRadius: 4 }
                                        }]
                                    });
                                    window.addEventListener('resize', () => chart.resize());
                                }, 100);
                            } else {
                                pieContainer.classList.add('hidden');
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
window.TrendHunter = TrendHunter;
