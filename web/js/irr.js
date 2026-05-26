function calculateXIRR(cashflows, guess) {
    if (guess === void 0) guess = 0.1;
    if (!cashflows || cashflows.length < 2) return 0;
    var sorted = cashflows.slice().sort(function(a, b) { return a.date - b.date; });
    var firstDate = sorted[0].date;
    var days = sorted.map(function(cf) { return (cf.date - firstDate) / (1000 * 60 * 60 * 24); });
    var totalDays = days[days.length - 1];
    if (totalDays <= 0) return 0;
    function npv(rate) {
        return sorted.reduce(function(sum, cf, i) { return sum + cf.amount / Math.pow(1 + rate, days[i] / 365); }, 0);
    }
    function npvPrime(rate) {
        return sorted.reduce(function(sum, cf, i) { return sum - cf.amount * (days[i] / 365) / Math.pow(1 + rate, days[i] / 365 + 1); }, 0);
    }
    var rate = guess;
    for (var i = 0; i < 100; i++) {
        var f = npv(rate);
        var fp = npvPrime(rate);
        if (Math.abs(f) < 1e-7) break;
        if (Math.abs(fp) < 1e-12) break;
        var newRate = rate - f / fp;
        if (!isFinite(newRate)) break;
        if (Math.abs(newRate - rate) < 1e-7) { rate = newRate; break; }
        rate = newRate;
    }
    if (!isFinite(rate) || rate < -0.999) return 0;
    return rate;
}
window.calculateXIRR = calculateXIRR;
