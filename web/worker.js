export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");
    
    const corsHeaders = {
      "Access-Control-Allow-Origin": origin || "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    const authHeader = request.headers.get("Authorization");
    if (authHeader !== `Bearer ${env.MY_SECRET_KEY}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const fetchYahoo = async (yahooUrl) => {
      return await fetch(yahooUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
          "Accept": "*/*",
          "Referer": "https://finance.yahoo.com/"
        }
      });
    };

    if (url.pathname === "/api/quote") {
      const symbols = url.searchParams.get("symbols");
      if (!symbols) return new Response(JSON.stringify({ error: "Missing symbols" }), { status: 400, headers: corsHeaders });

      // 🚀 v1.3: 終極組合包 - 嘗試多個端點與版本
      const endpoints = [
          `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`,
          `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`,
          `https://query1.finance.yahoo.com/v6/finance/quote?symbols=${symbols}`
      ];

      for (const ep of endpoints) {
          try {
              const res = await fetchYahoo(ep);
              const data = await res.json();
              const result = data.quoteResponse?.result || data.finance?.result;
              if (result && result.length > 0) {
                  return new Response(JSON.stringify({ quoteResponse: { result } }), { headers: corsHeaders });
              }
          } catch (e) {}
      }

      // 如果批量請求失敗，嘗試單個請求 v10 (這通常更穩)
      if (symbols.split(',').length === 1) {
          const s = symbols.split(',')[0];
          try {
              const v10Url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${s}?modules=price`;
              const res = await fetchYahoo(v10Url);
              const data = await res.json();
              const p = data.quoteSummary.result[0].price;
              const mapped = {
                  symbol: s,
                  regularMarketPrice: p.regularMarketPrice.raw,
                  regularMarketPreviousClose: p.regularMarketPreviousClose.raw,
                  regularMarketChange: p.regularMarketChange.raw,
                  regularMarketChangePercent: p.regularMarketChangePercent.raw * 100,
                  shortName: p.shortName || s
              };
              return new Response(JSON.stringify({ quoteResponse: { result: [mapped] } }), { headers: corsHeaders });
          } catch (e) {}
      }

      return new Response(JSON.stringify({ error: "Yahoo Finance Blocked", note: "Try deploying worker in a different region or using a custom proxy." }), { status: 503, headers: corsHeaders });
    }

    if (url.pathname === "/api/chart") {
      const symbol = url.searchParams.get("symbol");
      if (!symbol) return new Response(JSON.stringify({ error: "Missing symbol" }), { status: 400, headers: corsHeaders });
      const range = url.searchParams.get("range") || "1mo";
      const interval = url.searchParams.get("interval") || "1d";
      const yahooUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}`;
      const res = await fetchYahoo(yahooUrl);
      const data = await res.json();
      return new Response(JSON.stringify(data), { headers: corsHeaders });
    }

    if (url.pathname === "/api/auth_check") {
      return new Response(JSON.stringify({ status: "ok" }), { headers: corsHeaders });
    }

    return new Response("Not Found", { status: 404 });
  }
};
