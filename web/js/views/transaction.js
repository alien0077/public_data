import { db } from '../db.js';
import { api } from '../api.js';

function debounce(fn, ms) {
    let timer; return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}

function attachAutocomplete(inputEl, onSelect) {
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    inputEl.parentNode.insertBefore(wrapper, inputEl);
    wrapper.appendChild(inputEl);

    const dropdown = document.createElement('div');
    dropdown.className = 'autocomplete-dropdown';
    wrapper.appendChild(dropdown);

    const doSearch = debounce(async () => {
        const q = inputEl.value.trim();
        if (q.length < 1) { dropdown.innerHTML = ''; return; }
        const meta = await api.getStocksMeta();
        const stocks = meta.stocks || [];
        const ql = q.toLowerCase();
        const matches = stocks.filter(s =>
            s.symbol.toLowerCase().includes(ql) || s.name.toLowerCase().includes(ql)
        ).slice(0, 10);
        if (matches.length === 0) { dropdown.innerHTML = ''; return; }
        dropdown.innerHTML = matches.map(s => `
            <div class="autocomplete-item" data-symbol="${s.symbol}" data-name="${s.name}">
                <span class="sym">${s.symbol}</span>
                <span class="name">${s.name}</span>
            </div>
        `).join('');
    }, 150);

    inputEl.addEventListener('input', doSearch);
    inputEl.addEventListener('focus', doSearch);
    inputEl.addEventListener('blur', () => setTimeout(() => { dropdown.innerHTML = ''; }, 200));

    dropdown.addEventListener('mousedown', (e) => {
        const item = e.target.closest('.autocomplete-item');
        if (item) {
            e.preventDefault();
            onSelect(item.dataset.symbol, item.dataset.name);
            dropdown.innerHTML = '';
        }
    });
}

export const Transaction = {
    async init() {
        const viewContainer = document.getElementById('view-addTrade');
        if (!viewContainer) return;

        const today = new Date().toISOString().split('T')[0];

        viewContainer.innerHTML = `
            <div class="max-w-2xl mx-auto py-4">
                <div class="bg-white dark:bg-[#161b22] p-8 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg transition-colors duration-300">
                    <h3 class="text-xl font-bold mb-6 text-gray-900 dark:text-white">手動新增交易紀錄</h3>
                    
                    <form id="add-trade-form" class="space-y-4">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs text-gray-500 mb-1 uppercase tracking-wider font-bold">股票代號</label>
                                <input type="text" id="trade-symbol" required placeholder="輸入代號或名稱"
                                    class="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 outline-none focus:border-blue-500 transition-colors text-gray-900 dark:text-white">
                            </div>
                            <div>
                                <label class="block text-xs text-gray-500 mb-1 uppercase tracking-wider font-bold">股票名稱</label>
                                <input type="text" id="trade-name" placeholder="自動帶入"
                                    class="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 outline-none focus:border-blue-500 transition-colors text-gray-900 dark:text-white">
                            </div>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs text-gray-500 mb-1 uppercase tracking-wider font-bold">交易日期</label>
                                <input type="date" id="trade-date" required value="${today}"
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

                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                            <div>
                                <label class="block text-xs text-gray-500 mb-1 uppercase tracking-wider font-bold">手續費</label>
                                <input type="number" step="1" id="trade-fee" placeholder="自動計算" value="0"
                                    class="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 outline-none focus:border-blue-500 transition-colors font-mono text-gray-900 dark:text-white">
                            </div>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs text-gray-500 mb-1 uppercase tracking-wider font-bold">稅金</label>
                                <input type="number" step="1" id="trade-tax" placeholder="自動計算" value="0"
                                    class="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 outline-none focus:border-blue-500 transition-colors font-mono text-gray-900 dark:text-white">
                            </div>
                            <div>
                                <label class="block text-xs text-gray-500 mb-1 uppercase tracking-wider font-bold">備註</label>
                                <input type="text" id="trade-notes" placeholder="選填"
                                    class="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 outline-none focus:border-blue-500 transition-colors text-gray-900 dark:text-white">
                            </div>
                        </div>

                        <div id="trade-summary" class="text-xs text-gray-500 text-right hidden"></div>

                        <div class="pt-4">
                            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg active:scale-95 transition-all">
                                儲存交易紀錄
                            </button>
                        </div>
                    </form>
                </div>
                
                <div class="mt-8 bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm transition-colors duration-300">
                    <div class="p-4 border-b border-gray-100 dark:border-gray-800">
                        <h3 class="font-bold text-gray-900 dark:text-white">最近新增</h3>
                    </div>
                    <div id="recent-trades" class="p-4 space-y-2">
                        <div class="text-center text-gray-500 text-sm py-4">尚無最近新增紀錄</div>
                    </div>
                </div>
            </div>
        `;

        // Autocomplete for symbol
        const symInput = document.getElementById('trade-symbol');
        const nameInput = document.getElementById('trade-name');
        attachAutocomplete(symInput, (symbol, name) => {
            symInput.value = symbol;
            nameInput.value = name;
        });

        // Auto-calculate fee/tax
        const priceInput = document.getElementById('trade-price');
        const qtyInput = document.getElementById('trade-quantity');
        const feeInput = document.getElementById('trade-fee');
        const taxInput = document.getElementById('trade-tax');
        const sideSelect = document.getElementById('trade-side');
        const summaryEl = document.getElementById('trade-summary');

        function calcFeeTax() {
            const price = parseFloat(priceInput.value) || 0;
            const qty = parseFloat(qtyInput.value) || 0;
            const gross = price * qty;
            const isSell = sideSelect.value === 'sell';

            // Default fee: gross * 0.001425 * 0.6 (broker discount)
            const defaultFee = Math.round(gross * 0.001425 * 0.6);
            if (!feeInput.dataset.manual) feeInput.value = defaultFee > 0 ? defaultFee : '';

            // Default tax: sell only, 0.3% stamp tax
            const defaultTax = isSell ? Math.round(gross * 0.003) : 0;
            if (!taxInput.dataset.manual) taxInput.value = defaultTax > 0 ? defaultTax : 0;

            // Summary
            const fee = parseFloat(feeInput.value) || 0;
            const tax = parseFloat(taxInput.value) || 0;
            const net = isSell ? gross - fee - tax : gross + fee;
            if (gross > 0) {
                summaryEl.classList.remove('hidden');
                summaryEl.textContent = `總額 $${gross.toLocaleString()} | 手續費 $${fee.toLocaleString()} | 稅金 $${tax.toLocaleString()} | 淨收付 $${net.toLocaleString()}`;
            } else {
                summaryEl.classList.add('hidden');
            }
        }

        priceInput.addEventListener('input', calcFeeTax);
        qtyInput.addEventListener('input', calcFeeTax);
        sideSelect.addEventListener('change', calcFeeTax);
        feeInput.addEventListener('input', () => { feeInput.dataset.manual = '1'; calcFeeTax(); });
        taxInput.addEventListener('input', () => { taxInput.dataset.manual = '1'; calcFeeTax(); });

        // Form Submit
        const form = document.getElementById('add-trade-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const trade = {
                symbol: symInput.value.trim(),
                name: nameInput.value.trim(),
                date: document.getElementById('trade-date').value,
                side: sideSelect.value,
                price: parseFloat(priceInput.value),
                shares: parseFloat(qtyInput.value),
                quantity: parseFloat(qtyInput.value),
                fee: parseFloat(feeInput.value) || 0,
                tax: parseFloat(taxInput.value) || 0,
                notes: document.getElementById('trade-notes').value.trim() || '',
                timestamp: Date.now()
            };

            try {
                await db.saveTrades([trade]);
                alert('交易紀錄儲存成功！');
                form.reset();
                document.getElementById('trade-date').value = today;
                delete feeInput.dataset.manual;
                delete taxInput.dataset.manual;
                summaryEl.classList.add('hidden');
                await this.updateRecentTrades();
                window.dispatchEvent(new CustomEvent('twstock:data-changed'));
            } catch (err) {
                alert('儲存失敗：' + err);
            }
        });

        await this.updateRecentTrades();
    },

    async updateRecentTrades() {
        const trades = await db.getAllTrades();
        const el = document.getElementById('recent-trades');
        if (!el) return;

        const recent = trades.filter(t => t.timestamp).sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);

        if (recent.length === 0) {
            el.innerHTML = '<div class="text-center text-gray-500 text-sm py-4">尚無最近新增紀錄</div>';
            return;
        }

        el.innerHTML = recent.map(t => `
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
                    <div class="text-xs text-gray-600 dark:text-gray-300">$${t.price} x ${t.quantity || t.shares}</div>
                </div>
            </div>
        `).join('');
    }
};

window.Transaction = Transaction;
