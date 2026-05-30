const STOCKS_URL = 'https://alien0077.github.io/Public_Data/data/meta/stocks.json';

export const GroupSearch = {
    _groupIndex: {},
    _allStocks: [],
    _loaded: false,
    _searchTimer: null,

    async init() {
        const container = document.getElementById('view-groupSearch');
        if (!container) return;

        container.innerHTML = `
            <div class="p-4 md:p-6 max-w-3xl mx-auto w-full">
                <div class="relative mb-6">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">🔎</span>
                    <input type="text" id="gs-input"
                        class="w-full pl-12 pr-4 py-3 bg-[#161b22] border border-gray-800 rounded-xl text-white text-base outline-none focus:border-blue-500 transition-colors"
                        placeholder="搜尋族群 (例: CPO、載板、AI、半導體)">
                    <button id="gs-clear" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-lg hidden" onclick="GroupSearch.clear()">✕</button>
                </div>
                <div id="gs-status" class="text-center text-gray-500 py-10">
                    <div class="inline-block w-5 h-5 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin mr-2 align-middle"></div>
                    載入股票資料中...
                </div>
                <div id="gs-results" class="space-y-2"></div>
            </div>
        `;

        if (!this._loaded) await this._loadData();

        const input = document.getElementById('gs-input');
        if (input) {
            input.addEventListener('input', () => this._onSearch());
            input.focus();
        }

        document.getElementById('gs-status').innerHTML = '📂 ' + Object.keys(this._groupIndex).length + ' 個族群 · 📈 ' + new Set(Object.values(this._groupIndex).flat()).size + ' 檔股票';
        this._onSearch();
    },

    async _loadData() {
        try {
            const resp = await fetch(STOCKS_URL + '?t=' + Date.now());
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            const json = await resp.json();
            const stocks = json.stocks || json.data || [];
            this._allStocks = stocks;

            const idx = {};
            for (const s of stocks) {
                const groups = new Set();
                if (s.primary_theme) groups.add(s.primary_theme);
                if (s.macro_sector) groups.add(s.macro_sector);
                if (s.official_sector) groups.add(s.official_sector);
                if (Array.isArray(s.themes)) s.themes.forEach(function(t) { groups.add(t); });
                groups.forEach(function(g) {
                    if (!g) return;
                    if (!idx[g]) idx[g] = [];
                    idx[g].push(s.symbol);
                });
            }
            this._groupIndex = idx;
            this._loaded = true;
        } catch (e) {
            document.getElementById('gs-status').innerHTML = '<span class="text-red-500">❌ 載入失敗：' + e.message + '</span>';
        }
    },

    _onSearch() {
        const input = document.getElementById('gs-input');
        if (!input) return;
        const q = input.value.trim();
        document.getElementById('gs-clear').style.display = q.length > 0 ? 'block' : 'none';

        if (!q) {
            document.getElementById('gs-results').innerHTML = '<div class="text-center text-gray-500 py-16"><div class="text-5xl mb-4">🔍</div><p>輸入族群名稱開始搜尋</p><p class="text-sm mt-2 text-gray-600">例如：CPO、載板、AI、半導體、散熱</p></div>';
            return;
        }

        const query = q.toLowerCase();
        const names = Object.keys(this._groupIndex).filter(function(name) { return name.toLowerCase().indexOf(query) !== -1; }).sort().slice(0, 30);

        if (names.length === 0) {
            document.getElementById('gs-results').innerHTML = '<div class="text-center text-gray-500 py-16"><div class="text-5xl mb-4">🔎</div><p>沒有找到符合「' + this._esc(q) + '」的族群</p></div>';
            return;
        }

        let html = '<div class="text-xs text-gray-500 font-semibold uppercase tracking-wider px-1 mb-3">📊 找到 ' + names.length + ' 個族群</div>';
        for (let i = 0; i < names.length; i++) {
            const name = names[i];
            const symbols = this._groupIndex[name];
            html += '<div class="bg-[#161b22] border border-gray-800 rounded-xl overflow-hidden mb-2">' +
                '<div class="gs-group-header flex items-center justify-between px-4 py-3.5 cursor-pointer hover:border-blue-500 transition-colors" onclick="GroupSearch._toggle(this)">' +
                '<div><span class="text-[15px] font-semibold text-white">' + this._esc(name) + '</span> <span class="text-xs text-gray-500 bg-[#1c2333] px-2.5 py-0.5 rounded-full ml-2">' + symbols.length + ' 檔</span></div>' +
                '<span class="gs-arrow text-gray-500 text-xs transition-transform">▸</span></div>' +
                '<div class="gs-stocks hidden border-t border-gray-800">';
            const maxShow = Math.min(symbols.length, 50);
            for (let j = 0; j < maxShow; j++) {
                const sym = symbols[j];
                const stock = this._allStocks.find(function(s) { return s.symbol === sym; });
                const sname = stock ? stock.name : sym;
                html += '<div class="gs-stock-row flex items-center justify-between px-4 py-2.5 text-sm hover:bg-[#1c2333] cursor-pointer transition-colors" onclick="event.stopPropagation();StockDetail.show(\'' + this._esc(sym) + '\')">' +
                    '<div class="flex items-center gap-2.5"><span class="gs-symbol font-mono font-semibold text-blue-400">' + this._esc(sym) + '</span><span class="text-gray-500">' + this._esc(sname) + '</span></div>' +
                    '<span class="text-xs text-gray-600">↗</span></div>';
            }
            if (symbols.length > 50) {
                html += '<div class="px-4 py-2.5 text-sm text-gray-600">⋯ 尚有 ' + (symbols.length - 50) + ' 檔</div>';
            }
            html += '</div></div>';
        }
        document.getElementById('gs-results').innerHTML = html;
    },

    _toggle(header) {
        const stocks = header.nextElementSibling;
        const arrow = header.querySelector('.gs-arrow');
        const isOpen = stocks.classList.contains('open');
        stocks.classList.toggle('open', !isOpen);
        stocks.style.display = isOpen ? 'none' : 'block';
        arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(90deg)';
    },

    clear() {
        const input = document.getElementById('gs-input');
        if (input) { input.value = ''; this._onSearch(); input.focus(); }
    },

    _esc(s) {
        const d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }
};

window.GroupSearch = GroupSearch;
