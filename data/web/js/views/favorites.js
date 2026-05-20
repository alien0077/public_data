import { api } from '../api.js';

/**
 * Favorites View
 * 管理 5 個自訂收藏類別，儲存於 localStorage
 */
export const Favorites = {
    _categories: ['我的最愛', '觀察中', '定存股', '潛力股', '投機短線'],
    _data: {}, // { "類別名稱": ["2330", "0050"] }
    _activeTab: 0,
    _intervalId: null,
    
    init(secondaryTab = null) {
        this.loadData();
        
        // 如果傳入的 secondaryTab 對應某個分類名稱，則切換過去
        if (secondaryTab && this._categories.includes(secondaryTab)) {
            this._activeTab = this._categories.indexOf(secondaryTab);
        } else if (secondaryTab === '我的收藏') {
            // 從 TrendHunter 的二級導航點擊過來，預設保留當前 activeTab
        }

        const viewContainer = document.getElementById('view-favorites');
        if (!viewContainer) return;

        this.renderStructure(viewContainer);
        this.renderContent();
        this.startAutoRefresh();
    },

    loadData() {
        try {
            const savedCategories = localStorage.getItem('twstock_favorite_categories');
            if (savedCategories) {
                this._categories = JSON.parse(savedCategories);
                // 確保剛好有 5 個
                while(this._categories.length < 5) this._categories.push('新分類');
                this._categories = this._categories.slice(0, 5);
            }
            
            const savedData = localStorage.getItem('twstock_favorite_data');
            if (savedData) {
                this._data = JSON.parse(savedData);
            } else {
                this._categories.forEach(c => this._data[c] = []);
            }
        } catch (e) {
            console.error("Failed to load favorites", e);
            this._categories.forEach(c => this._data[c] = []);
        }
    },

    saveData() {
        localStorage.setItem('twstock_favorite_categories', JSON.stringify(this._categories));
        localStorage.setItem('twstock_favorite_data', JSON.stringify(this._data));
    },

    // 供其他模組呼叫 (如 stockDetail.js)
    toggleFavorite(symbol) {
        let found = false;
        let removedFrom = '';
        
        // 如果已經在任何分類中，則移除
        for (let cat of this._categories) {
            if (this._data[cat] && this._data[cat].includes(symbol)) {
                this._data[cat] = this._data[cat].filter(s => s !== symbol);
                found = true;
                removedFrom = cat;
            }
        }

        if (found) {
            this.saveData();
            return { action: 'removed', category: removedFrom };
        } else {
            // 否則加入當前活躍的分類
            const cat = this._categories[this._activeTab] || this._categories[0];
            if (!this._data[cat]) this._data[cat] = [];
            this._data[cat].push(symbol);
            this.saveData();
            return { action: 'added', category: cat };
        }
    },

    isFavorite(symbol) {
        for (let cat of this._categories) {
            if (this._data[cat] && this._data[cat].includes(symbol)) return true;
        }
        return false;
    },

    renderStructure(container) {
        container.innerHTML = `
            <div class="flex flex-col space-y-6 h-full">
                <!-- Categories Tabs -->
                <div class="flex items-center space-x-2 md:space-x-4 overflow-x-auto no-scrollbar pb-2">
                    ${this._categories.map((cat, idx) => `
                        <button class="fav-tab group relative flex-shrink-0 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 
                            ${idx === this._activeTab ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white'}"
                            data-index="${idx}">
                            <span class="tab-name">${cat}</span>
                            <span class="edit-cat absolute -top-1 -right-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full w-5 h-5 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity" title="修改名稱">✎</span>
                        </button>
                    `).join('')}
                </div>

                <!-- List Content -->
                <div class="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm flex-1 flex flex-col transition-colors duration-300">
                    <div class="overflow-x-auto flex-1">
                        <table class="w-full text-left">
                            <thead class="bg-gray-50/50 dark:bg-gray-900/50 text-gray-400 dark:text-gray-500 text-[10px] md:text-xs uppercase sticky top-0 z-10 backdrop-blur-sm">
                                <tr>
                                    <th class="px-3 md:px-6 py-4">代碼/名稱</th>
                                    <th class="px-3 md:px-6 py-4 text-right">現價</th>
                                    <th class="px-3 md:px-6 py-4 text-right">漲跌幅</th>
                                    <th class="px-3 md:px-6 py-4 text-right hidden sm:table-cell">最高</th>
                                    <th class="px-3 md:px-6 py-4 text-right hidden sm:table-cell">最低</th>
                                    <th class="px-3 md:px-6 py-4 text-right">操作</th>
                                </tr>
                            </thead>
                            <tbody id="favorites-body" class="divide-y divide-gray-100 dark:divide-gray-800 font-mono text-sm cursor-pointer">
                                <!-- Data will be injected here -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        // Bind events
        container.querySelectorAll('.fav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                if (e.target.closest('.edit-cat')) return; // Ignore edit button clicks
                this._activeTab = parseInt(tab.dataset.index);
                this.renderStructure(container); // Re-render to update active state
                this.renderContent();
                this.refreshQuotes(); // Fetch quotes immediately on tab switch
            });
        });

        container.querySelectorAll('.edit-cat').forEach((btn, idx) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const newName = prompt('請輸入新的分類名稱：', this._categories[idx]);
                if (newName !== null && newName.trim() !== '') {
                    const oldName = this._categories[idx];
                    this._categories[idx] = newName.trim();
                    // Migrate data
                    if (this._data[oldName]) {
                        this._data[newName.trim()] = this._data[oldName];
                        delete this._data[oldName];
                    }
                    this.saveData();
                    this.renderStructure(container);
                    this.renderContent();
                }
            });
        });
    },

    async renderContent(quotes = {}) {
        const body = document.getElementById('favorites-body');
        if (!body) return;

        const currentCat = this._categories[this._activeTab];
        const symbols = this._data[currentCat] || [];

        if (symbols.length === 0) {
            body.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-10 text-center text-gray-500">
                        這個分類還沒有收藏任何股票，請從其他畫面將股票加入收藏！
                    </td>
                </tr>
            `;
            return;
        }

        body.innerHTML = '';
        
        // 若有從 api.getStocksMeta() 取得的資料可以輔助名稱
        const meta = await api.getStocksMeta();

        symbols.forEach(sym => {
            const quote = quotes[sym] || {};
            const price = quote.price || 0;
            const refPrice = quote.referencePrice || price;
            const changePercent = (price > 0 && refPrice > 0) ? ((price - refPrice) / refPrice * 100) : 0;
            const high = quote.high || 0;
            const low = quote.low || 0;
            
            // Try to find name if not in quote
            let name = quote.name || '';
            if (!name && meta.stocks) {
                const stockInfo = meta.stocks.find(s => s.symbol === sym || s.symbol === sym.split('.')[0]);
                if (stockInfo) name = stockInfo.name;
            }

            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-800/30 transition-colors';
            
            // 點擊整列顯示 K 線
            row.addEventListener('click', (e) => {
                if (e.target.closest('.remove-fav')) return; // 點擊刪除按鈕時不觸發
                window.StockDetail.show(sym);
            });

            const priceColor = this.getPriceColor(price, refPrice);
            
            row.innerHTML = `
                <td class="px-3 md:px-6 py-4">
                    <div class="font-bold text-white">${sym}</div>
                    <div class="text-[10px] text-gray-500 truncate max-w-[100px]">${name}</div>
                </td>
                <td class="px-3 md:px-6 py-4 text-right ${priceColor}">
                    ${price > 0 ? this.formatNumber(price) : '--'}
                </td>
                <td class="px-3 md:px-6 py-4 text-right ${priceColor} text-xs font-bold">
                    ${price > 0 ? `${changePercent > 0 ? '▲' : (changePercent < 0 ? '▼' : '')} ${Math.abs(changePercent).toFixed(2)}%` : '--'}
                </td>
                <td class="px-3 md:px-6 py-4 text-right hidden sm:table-cell text-gray-400 text-xs">
                    ${high > 0 ? this.formatNumber(high) : '--'}
                </td>
                <td class="px-3 md:px-6 py-4 text-right hidden sm:table-cell text-gray-400 text-xs">
                    ${low > 0 ? this.formatNumber(low) : '--'}
                </td>
                <td class="px-3 md:px-6 py-4 text-right">
                    <button class="remove-fav text-gray-500 hover:text-red-500 transition-colors" data-symbol="${sym}" title="移除收藏">
                        <svg class="w-5 h-5 inline-block" fill="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </td>
            `;
            body.appendChild(row);
        });

        // 綁定刪除按鈕
        body.querySelectorAll('.remove-fav').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const sym = btn.dataset.symbol;
                if (confirm(`確定要將 ${sym} 移出此收藏分類嗎？`)) {
                    this._data[currentCat] = this._data[currentCat].filter(s => s !== sym);
                    this.saveData();
                    this.renderContent(quotes);
                }
            });
        });
    },

    async refreshQuotes() {
        const currentCat = this._categories[this._activeTab];
        const symbols = this._data[currentCat] || [];
        if (symbols.length === 0) return;

        try {
            const quotes = await api.fetchQuotes(symbols);
            this.renderContent(quotes);
        } catch (err) {
            console.error("Failed to refresh favorite quotes", err);
        }
    },

    startAutoRefresh() {
        if (this._intervalId) clearInterval(this._intervalId);
        this.refreshQuotes();
        this._intervalId = setInterval(() => this.refreshQuotes(), 60000);
    },

    stopAutoRefresh() {
        if (this._intervalId) {
            clearInterval(this._intervalId);
            this._intervalId = null;
        }
    },

    formatNumber(num, decimals = 2) {
        return new Intl.NumberFormat('zh-TW', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(num);
    },

    getPriceColor(price, refPrice) {
        if (!price || !refPrice) return 'text-white';
        if (price > refPrice) return 'text-red-500';
        if (price < refPrice) return 'text-green-500';
        return 'text-white';
    }
};

// 暴露到 window 以便外部呼叫
window.Favorites = Favorites;
