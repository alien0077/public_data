/**
 * Charts Module for TWStockTracker Web - Enhanced Visibility
 */

export const charts = {
    instance: null,

    init(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return null;
        if (this.instance) { this.instance.dispose(); this.instance = null; }
        this.instance = echarts.init(container);
        if (!this._hasResizeListener) {
            window.addEventListener('resize', () => { if (this.instance) this.instance.resize(); });
            this._hasResizeListener = true;
        }
        return this.instance;
    },

    renderKLine(symbol, rawData, trades = [], structureData = null) {
        if (!this.instance) return;
        const data = this.transformKData(rawData);
        if (data.categoryData.length === 0) return;

        // 🚀 Calculate 6 MAs
        const ma5 = this.calculateMA(5, data.values);
        const ma10 = this.calculateMA(10, data.values);
        const ma20 = this.calculateMA(20, data.values);
        const ma60 = this.calculateMA(60, data.values);
        const ma120 = this.calculateMA(120, data.values);
        const ma240 = this.calculateMA(240, data.values);
        
        const markLines = [];
        const avgCost = this.calculateAvgCost(trades, symbol);
        if (avgCost > 0) {
            markLines.push({
                yAxis: avgCost,
                label: { formatter: `成本: ${avgCost.toFixed(1)}`, position: 'start', backgroundColor: '#3b82f6', color: '#fff', padding: [2, 4], borderRadius: 2, fontSize: 10 },
                lineStyle: { type: 'dashed', color: '#3b82f6', width: 1, opacity: 0.8 }
            });
        }

        const isDark = document.documentElement.classList.contains('dark');
        const upColor = '#ef4444';
        const downColor = '#10b981';

        const option = {
            backgroundColor: 'transparent',
            animation: false,
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'cross', label: { backgroundColor: '#374151' } },
                backgroundColor: isDark ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                borderColor: isDark ? '#374151' : '#e5e7eb',
                textStyle: { color: isDark ? '#f3f4f6' : '#1f2937', fontSize: 11 },
                confine: true
            },
            grid: [
                { left: '40', right: '10', top: '5%', height: '72%' },
                { left: '40', right: '10', top: '82%', height: '15%' }
            ],
            xAxis: [
                { type: 'category', data: data.categoryData, boundaryGap: true, axisLine: { lineStyle: { color: isDark ? '#374151' : '#e5e7eb' } }, axisLabel: { color: '#9ca3af', fontSize: 10 } },
                { type: 'category', gridIndex: 1, data: data.categoryData, boundaryGap: true, axisLine: { lineStyle: { color: isDark ? '#374151' : '#e5e7eb' } }, axisTick: { show: false }, axisLabel: { show: false } }
            ],
            yAxis: [
                { scale: true, axisLine: { show: false }, axisLabel: { color: '#9ca3af', fontSize: 10 }, splitLine: { lineStyle: { color: isDark ? '#1f2937' : '#f3f4f6' } } },
                { scale: true, gridIndex: 1, splitNumber: 2, axisLabel: { show: false }, axisLine: { show: false }, axisTick: { show: false }, splitLine: { show: false } }
            ],
            dataZoom: [{ type: 'inside', xAxisIndex: [0, 1], start: Math.max(0, 100 - (50 / data.categoryData.length * 100)), end: 100 }],
            series: [
                {
                    name: 'K線', type: 'candlestick', data: data.values,
                    itemStyle: { color: upColor, color0: downColor, borderColor: upColor, borderColor0: downColor },
                    markLine: { symbol: ['none', 'none'], data: markLines }
                },
                // 🚀 Thicker lines (width: 2) for better visibility
                { name: 'MA5', type: 'line', data: ma5, smooth: true, showSymbol: false, lineStyle: { width: 2, color: '#f59e0b', opacity: 0.9 } },
                { name: 'MA10', type: 'line', data: ma10, smooth: true, showSymbol: false, lineStyle: { width: 2, color: '#fb923c', opacity: 0.9 } },
                { name: 'MA20', type: 'line', data: ma20, smooth: true, showSymbol: false, lineStyle: { width: 2, color: '#3b82f6', opacity: 0.9 } },
                { name: 'MA60', type: 'line', data: ma60, smooth: true, showSymbol: false, lineStyle: { width: 2, color: '#a855f7', opacity: 0.9 } },
                { name: 'MA120', type: 'line', data: ma120, smooth: true, showSymbol: false, lineStyle: { width: 2, color: '#9ca3af', opacity: 0.9 } },
                { name: 'MA240', type: 'line', data: ma240, smooth: true, showSymbol: false, lineStyle: { width: 2, color: '#16a34a', opacity: 0.9 } },
                {
                    name: '成交量', type: 'bar', xAxisIndex: 1, yAxisIndex: 1, data: data.volumes,
                    itemStyle: { color: (p) => { const v = data.values[p.dataIndex]; return v && v[1] >= v[0] ? upColor : downColor; } }
                }
            ]
        };
        this.instance.setOption(option);
    },

    calculateMA(dayCount, data) {
        const result = [];
        for (let i = 0, len = data.length; i < len; i++) {
            if (i < dayCount - 1) { result.push(null); continue; }
            let sum = 0;
            for (let j = 0; j < dayCount; j++) { sum += data[i - j][1]; }
            result.push(+(sum / dayCount).toFixed(2));
        }
        return result;
    },

    transformKData(rawData) {
        const categoryData = [], values = [], volumes = [];
        if (!rawData) return { categoryData, values, volumes };
        const ts = rawData.timestamps || rawData.timestamp || [];
        const o = rawData.open || [], h = rawData.high || [], l = rawData.low || [], c = rawData.close || [], v = rawData.volume || [];
        for (let i = 0; i < ts.length; i++) {
            if (o[i] === null || c[i] === null) continue;
            const date = new Date(ts[i] * 1000);
            categoryData.push(`${date.getFullYear()}/${String(date.getMonth()+1).padStart(2,'0')}/${String(date.getDate()).padStart(2,'0')}`);
            // Use parseFloat to ensure numerical data
            values.push([ parseFloat(o[i]), parseFloat(c[i]), parseFloat(l[i]), parseFloat(h[i]) ]);
            volumes.push(parseFloat(v[i] || 0));
        }
        return { categoryData, values, volumes };
    },

    calculateAvgCost(trades, symbol) {
        const rawS = symbol.split('.')[0];
        const filtered = trades.filter(t => (t.symbol || t.stock_id || t.stockId || '').split('.')[0] === rawS);
        let shares = 0, cost = 0;
        const sorted = [...filtered].sort((a, b) => new Date(a.date || a.timestamp || a.tradeDate) - new Date(b.date || b.timestamp || b.tradeDate));
        sorted.forEach(t => {
            const type = String(t.side || t.type || '').toLowerCase();
            const q = Math.abs(parseFloat(t.quantity || t.shares || 0));
            const p = parseFloat(t.price || 0);
            if (type.includes('買') || type.includes('buy')) { shares += q; cost += q * p; }
            else if (type.includes('賣') || type.includes('sell')) { if (shares > 0) { const avg = cost / shares; cost = Math.max(0, cost - (q * avg)); shares = Math.max(0, shares - q); } }
        });
        return shares > 0 ? cost / shares : 0;
    }
};

window.charts = charts;
