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

    if (url.pathname === "/api/quote") {
      const symbols = url.searchParams.get("symbols");
      if (!symbols) {
        return new Response(JSON.stringify({ error: "Missing symbols" }), { status: 400, headers: corsHeaders });
      }
      const yahooUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`;
      const res = await fetch(yahooUrl);
      const data = await res.json();
      return new Response(JSON.stringify(data), { headers: corsHeaders });
    }

    if (url.pathname === "/api/chart") {
      const symbol = url.searchParams.get("symbol");
      if (!symbol) {
        return new Response(JSON.stringify({ error: "Missing symbol" }), { status: 400, headers: corsHeaders });
      }
      const range = url.searchParams.get("range") || "1mo";
      const interval = url.searchParams.get("interval") || "1d";
      const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}`;
      const res = await fetch(yahooUrl);
      const data = await res.json();
      return new Response(JSON.stringify(data), { headers: corsHeaders });
    }

    if (url.pathname === "/api/auth_check") {
      return new Response(JSON.stringify({ status: "ok" }), { headers: corsHeaders });
    }

    return new Response("Not Found", { status: 404 });
  }
};
