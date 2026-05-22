/**
 * Charts Module for TWStockTracker Web
 */

export const charts = {
    instance: null,

    /**
     * Initialize ECharts instance
     * @param {string} containerId 
     */
    init(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return null;
        
        if (this.instance) {
            this.instance.dispose();
            this.instance = null;
        }
        
        this.instance = echarts.init(container);
        
        // Use a single listener strategy
        if (!this._hasResizeListener) {
            window.addEventListener('resize', () => {
                if (this.instance) this.instance.resize();
            });
            this._hasResizeListener = true;
        }
        return this.instance;
    },

    /**
     * Render K-line chart
     * @param {string} symbol 
     * @param {Object} rawData 
     * @param {Array} trades 
     * @param {Object} structureData 
     */
    renderKLine(symbol, rawData, trades = [], structureData = null) {
        if (!this.instance) return;

        const data = this.transformKData(rawData);
        
        // Calculate average cost markLine
        const markLines = [];
        const markAreas = [];

        if (trades.length > 0) {
            const avgCost = this.calculateAvgCost(trades, symbol);
            if (avgCost > 0) {
                markLines.push({
                    yAxis: avgCost,
                    label: {
                        formatter: `成本: ${avgCost.toFixed(2)}`,
                        position: 'start',
                        backgroundColor: '#3b82f6',
                        color: '#fff',
                        padding: [2, 4],
                        borderRadius: 2
                    },
                    lineStyle: {
                        type: 'dashed',
                        color: '#3b82f6',
                        width: 1,
                        opacity: 0.8
                    }
                });
            }
        }

        // Process Structure Data (BOS/CHOCH/Zones)
        if (structureData && structureData.lines) {
            structureData.lines.forEach(line => {
                if (!line.broken) {
                    // Active structure lines
                    markLines.push({
                        yAxis: line.price,
                        label: {
                            formatter: line.type === 'high' ? '強抗' : '強撐',
                            position: 'end',
                            backgroundColor: line.type === 'high' ? '#ef4444' : '#22c55e',
                            color: '#fff',
                            padding: [2, 4],
                            fontSize: 10
                        },
                        lineStyle: {
                            type: 'solid',
                            color: line.type === 'high' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.4)',
                            width: 1
                        }
                    });
                }
            });
        }

        if (structureData && structureData.events) {
            structureData.events.forEach(event => {
                const dateStr = event.date.replace(/-/g, '/');
                markLines.push({
                    name: event.type,
                    xAxis: dateStr,
                    label: {
                        formatter: event.type.includes('BOS') ? 'BOS' : 'CHOCH',
                        position: 'middle',
                        color: event.type.includes('UP') ? '#ef4444' : '#22c55e',
                        fontSize: 9,
                        fontWeight: 'bold'
                    },
                    lineStyle: {
                        type: 'dotted',
                        color: 'rgba(139, 148, 158, 0.3)',
                        width: 1
                    }
                });
            });
        }

        const option = {
            backgroundColor: 'transparent',
            animation: false,
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'cross' },
                backgroundColor: 'rgba(22, 27, 34, 0.9)',
                borderColor: '#30363d',
                borderWidth: 1,
                textStyle: { color: '#c9d1d9', fontSize: 10 },
                confine: true
            },
            grid: [
                { left: 40, right: 10, top: 10, height: '70%' },
                { left: 40, right: 10, top: '82%', height: '15%' }
            ],
            xAxis: [
                {
                    type: 'category',
                    data: data.categoryData,
                    boundaryGap: true,
                    axisLine: { lineStyle: { color: '#30363d' } },
                    axisLabel: { color: '#8b949e', fontSize: 10 },
                    splitLine: { show: false }
                },
                {
                    type: 'category',
                    gridIndex: 1,
                    data: data.categoryData,
                    boundaryGap: true,
                    axisLine: { lineStyle: { color: '#30363d' } },
                    axisTick: { show: false },
                    axisLabel: { show: false },
                    splitLine: { show: false }
                }
            ],
            yAxis: [
                {
                    scale: true,
                    position: 'left',
                    axisLine: { lineStyle: { color: '#30363d' } },
                    axisLabel: { color: '#8b949e', fontSize: 10 },
                    splitLine: { lineStyle: { color: '#161b22' } }
                },
                {
                    scale: true,
                    gridIndex: 1,
                    splitNumber: 2,
                    axisLabel: { show: false },
                    axisLine: { show: false },
                    axisTick: { show: false },
                    splitLine: { show: false }
                }
            ],
            dataZoom: [
                {
                    type: 'inside',
                    xAxisIndex: [0, 1],
                    start: Math.max(0, 100 - (120 / data.categoryData.length * 100)),
                    end: 100
                }
            ],
            series: [
                {
                    name: 'K線',
                    type: 'candlestick',
                    data: data.values,
                    barMaxWidth: 10,
                    itemStyle: {
                        color: '#ef4444',
                        color0: '#22c55e',
                        borderColor: '#ef4444',
                        borderColor0: '#22c55e',
                        borderWidth: 1
                    },
                    markLine: {
                        symbol: ['none', 'none'],
                        data: markLines
                    },
                    markArea: {
                        silent: true,
                        data: markAreas
                    }
                },
                {
                    name: '成交量',
                    type: 'bar',
                    xAxisIndex: 1,
                    yAxisIndex: 1,
                    data: data.volumes,
                    barMaxWidth: 10,
                    itemStyle: {
                        color: (params) => {
                            const val = data.values[params.dataIndex];
                            if (!val) return '#8b949e';
                            return val[1] >= val[0] ? '#ef4444' : '#22c55e';
                        }
                    }
                }
            ]
        };

        this.instance.setOption(option);
    },

    /**
     * Transform raw Yahoo-style data to ECharts format
     * @param {Object} rawData 
     */
    transformKData(rawData) {
        const categoryData = [];
        const values = [];
        const volumes = [];
        
        if (!rawData) {
            return { categoryData, values, volumes };
        }
        
        // Handle different possible response structures
        const timestamps = rawData.timestamps || rawData.timestamp || [];
        const opens = rawData.open || [];
        const highs = rawData.high || [];
        const lows = rawData.low || [];
        const closes = rawData.close || [];
        const vols = rawData.volume || [];

        for (let i = 0; i < timestamps.length; i++) {
            const ts = timestamps[i];
            const date = new Date(ts * 1000);
            const dateStr = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
            categoryData.push(dateStr);
            
            // ECharts candlestick format: [open, close, low, high]
            values.push([
                opens[i],
                closes[i],
                lows[i],
                highs[i]
            ]);
            
            volumes.push(vols[i]);
        }

        return { categoryData, values, volumes };
    },

    /**
     * Calculate average cost for a specific symbol
     * @param {Array} trades 
     * @param {string} symbol 
     */
    calculateAvgCost(trades, symbol) {
        const rawSymbol = symbol.split('.')[0];
        const relevantTrades = trades.filter(t => {
            const tSym = t.symbol || t.stock_id || t.stockId || '';
            return tSym.split('.')[0] === rawSymbol;
        });
        let shares = 0;
        let totalCost = 0;

        // Sort trades by date
        const sorted = [...relevantTrades].sort((a, b) => {
            return new Date(a.date || a.timestamp) - new Date(b.date || b.timestamp);
        });

        sorted.forEach(t => {
            const type = (t.side || t.type || '').toLowerCase();
            const qty = parseFloat(t.quantity || t.shares || 0);
            const price = parseFloat(t.price || 0);

            if (type === '買入' || type === 'buy') {
                shares += qty;
                totalCost += qty * price;
            } else if (type === '賣出' || type === 'sell') {
                const avg = shares > 0 ? totalCost / shares : 0;
                shares -= qty;
                totalCost = shares * avg;
            }
        });

        return shares > 0 ? totalCost / shares : 0;
    }
};
