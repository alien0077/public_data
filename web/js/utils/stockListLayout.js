export function escapeHtml(value = '') {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

export function stockIdentityHTML(symbol, name, options = {}) {
    const {
        className = '',
        symbolClass = '',
        nameClass = '',
        badgeHTML = ''
    } = options;
    const safeSymbol = escapeHtml(symbol || '');
    const safeName = escapeHtml(name || symbol || '');

    return `
        <div class="stock-identity ${className}">
            <div class="stock-identity-main">
                <span class="stock-symbol ${symbolClass}">${safeSymbol}</span>
                ${badgeHTML}
            </div>
            <div class="stock-name ${nameClass}">${safeName}</div>
        </div>
    `;
}

export function stockMetricHTML(label, value, options = {}) {
    const { className = '', valueClass = '', labelClass = '' } = options;
    return `
        <div class="stock-metric ${className}">
            <div class="stock-metric-value ${valueClass}">${value}</div>
            <div class="stock-metric-label ${labelClass}">${escapeHtml(label)}</div>
        </div>
    `;
}

export function stockMobileCardHTML({
    symbol,
    name,
    badgeHTML = '',
    primaryHTML = '',
    metricsHTML = '',
    detailHTML = '',
    actionsHTML = '',
    onClick = ''
}) {
    const clickAttr = onClick ? ` onclick="${onClick}"` : '';
    return `
        <div class="stock-card-row"${clickAttr}>
            <div class="stock-card-top">
                ${stockIdentityHTML(symbol, name, { badgeHTML })}
                <div class="stock-card-primary">${primaryHTML}</div>
            </div>
            ${metricsHTML ? `<div class="stock-card-metrics">${metricsHTML}</div>` : ''}
            ${detailHTML ? `<div class="stock-card-detail">${detailHTML}</div>` : ''}
            ${actionsHTML ? `<div class="stock-card-actions">${actionsHTML}</div>` : ''}
        </div>
    `;
}
