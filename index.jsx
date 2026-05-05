import { useState, useEffect, useCallback } from "react";

const TICKER_SYMBOLS = {
  us: ["SPY", "QQQ", "AAPL", "NVDA", "TSLA", "MSFT", "AMZN", "META", "GOOGL", "AMD"],
  canada: ["XIU.TO", "ENB.TO", "RY.TO", "TD.TO", "CNQ.TO", "SU.TO", "BCE.TO", "SHOP.TO", "BNS.TO", "MFC.TO"],
  indices: ["S&P 500", "NASDAQ", "DOW", "TSX", "VIX", "USD/CAD"],
};

const SECTORS = ["Technology", "Energy", "Financials", "Healthcare", "Materials", "Consumer"];

function generateMockMarketData() {
  const now = new Date();
  return {
    timestamp: now.toISOString(),
    indices: [
      { name: "S&P 500", value: 5287.43, change: +0.34, pts: +17.9, premarket: true },
      { name: "NASDAQ", value: 18421.6, change: -0.12, pts: -22.1, premarket: true },
      { name: "DOW", value: 39812.5, change: +0.21, pts: +83.4, premarket: true },
      { name: "TSX", value: 22104.7, change: +0.18, pts: +39.8, premarket: true },
      { name: "VIX", value: 14.23, change: -3.1, pts: -0.46, premarket: false },
      { name: "USD/CAD", value: 1.3641, change: +0.09, pts: +0.0012, premarket: false },
    ],
    usMovers: [
      { ticker: "NVDA", name: "NVIDIA Corp", price: 892.4, change: +4.2, vol: "48.2M", sector: "Technology", signal: "BUY" },
      { ticker: "AAPL", name: "Apple Inc", price: 189.3, change: -0.8, vol: "31.5M", sector: "Technology", signal: "HOLD" },
      { ticker: "TSLA", name: "Tesla Inc", price: 174.2, change: +2.1, vol: "62.1M", sector: "Consumer", signal: "BUY" },
      { ticker: "AMD", name: "Adv Micro Devices", price: 163.8, change: +3.6, vol: "28.9M", sector: "Technology", signal: "BUY" },
      { ticker: "META", name: "Meta Platforms", price: 512.6, change: -1.2, vol: "19.4M", sector: "Technology", signal: "HOLD" },
      { ticker: "AMZN", name: "Amazon.com", price: 184.7, change: +0.6, vol: "22.3M", sector: "Consumer", signal: "HOLD" },
      { ticker: "MSFT", name: "Microsoft Corp", price: 418.9, change: -0.3, vol: "17.8M", sector: "Technology", signal: "HOLD" },
      { ticker: "GOOGL", name: "Alphabet Inc", price: 174.5, change: +1.4, vol: "15.2M", sector: "Technology", signal: "BUY" },
    ],
    canadaMovers: [
      { ticker: "SHOP.TO", name: "Shopify Inc", price: 94.2, change: +3.8, vol: "8.2M", sector: "Technology", signal: "BUY" },
      { ticker: "ENB.TO", name: "Enbridge Inc", price: 54.7, change: +0.4, vol: "12.1M", sector: "Energy", signal: "HOLD" },
      { ticker: "RY.TO", name: "Royal Bank", price: 138.4, change: -0.6, vol: "9.8M", sector: "Financials", signal: "HOLD" },
      { ticker: "CNQ.TO", name: "Cdn Natural Res", price: 87.3, change: +1.2, vol: "7.4M", sector: "Energy", signal: "BUY" },
      { ticker: "TD.TO", name: "TD Bank", price: 82.1, change: -1.4, vol: "11.3M", sector: "Financials", signal: "SELL" },
      { ticker: "SU.TO", name: "Suncor Energy", price: 56.8, change: +2.1, vol: "8.9M", sector: "Energy", signal: "BUY" },
      { ticker: "BCE.TO", name: "BCE Inc", price: 38.4, change: -0.9, vol: "6.7M", sector: "Telecom", signal: "HOLD" },
      { ticker: "MFC.TO", name: "Manulife Financial", price: 31.2, change: +0.7, vol: "9.1M", sector: "Financials", signal: "HOLD" },
    ],
    sectorHeatmap: [
      { name: "Technology", usChange: +1.8, caChange: +2.1 },
      { name: "Energy", usChange: -0.4, caChange: +1.4 },
      { name: "Financials", usChange: +0.2, caChange: -0.8 },
      { name: "Healthcare", usChange: +0.6, caChange: +0.3 },
      { name: "Materials", usChange: -1.1, caChange: -0.5 },
      { name: "Consumer", usChange: +0.9, caChange: +0.4 },
    ],
    earningsToday: [
      { company: "Microsoft (MSFT)", time: "After Close", est: "$2.82 EPS", flag: "US" },
      { company: "Alphabet (GOOGL)", time: "After Close", est: "$1.79 EPS", flag: "US" },
      { company: "Royal Bank (RY)", time: "Pre-Market", est: "$2.94 EPS", flag: "CA" },
      { company: "Shopify (SHOP)", time: "Pre-Market", est: "$0.19 EPS", flag: "CA" },
    ],
    economicEvents: [
      { time: "8:30 AM ET", event: "US Initial Jobless Claims", impact: "HIGH", prev: "212K", est: "215K" },
      { time: "8:30 AM ET", event: "Canada CPI (YoY)", impact: "HIGH", prev: "2.8%", est: "2.6%" },
      { time: "10:00 AM ET", event: "US Existing Home Sales", impact: "MED", prev: "4.02M", est: "4.10M" },
      { time: "10:30 AM ET", event: "EIA Crude Oil Inventories", impact: "MED", prev: "-1.6M", est: "-0.9M" },
      { time: "2:00 PM ET", event: "FOMC Minutes Release", impact: "HIGH", prev: "—", est: "—" },
    ],
  };
}

const signalColor = (s) =>
  s === "BUY" ? "#00e5a0" : s === "SELL" ? "#ff4d6d" : "#f0b429";

const changeColor = (v) => (v >= 0 ? "#00e5a0" : "#ff4d6d");

const impactColor = (i) =>
  i === "HIGH" ? "#ff4d6d" : i === "MED" ? "#f0b429" : "#8a9bb0";

const heatColor = (v) => {
  if (v >= 2) return "#00e5a0";
  if (v >= 0.5) return "#4ade80";
  if (v >= 0) return "#a7f3d0";
  if (v >= -0.5) return "#fca5a5";
  if (v >= -2) return "#f87171";
  return "#ff4d6d";
};

export default function PremarketDashboard() {
  const [data, setData] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [lastRefresh, setLastRefresh] = useState(null);
  const [ticker, setTicker] = useState(0);

  const tickerItems = [
    "🟢 NVDA +4.2% | Pre-market surge on AI chip demand",
    "🔴 TD.TO -1.4% | Regulatory concerns weigh on Canadian banks",
    "🟢 SHOP.TO +3.8% | Strong e-commerce data ahead of earnings",
    "⚪ USD/CAD 1.3641 | Loonie steady on oil price stability",
    "🔴 NASDAQ Futures -0.12% | Tech profit-taking continues",
    "🟢 TSX Futures +0.18% | Energy sector lifting Canadian index",
    "🔴 VIX 14.23 -3.1% | Fear gauge declining, market calming",
    "🟢 AMD +3.6% | Chipmaker rallies on strong server demand",
    "⚠️ FOMC Minutes due 2:00 PM ET | High volatility expected",
    "🟢 CNQ.TO +1.2% | Oil sands producer benefits from WTI above $82",
  ];

  useEffect(() => {
    const d = generateMockMarketData();
    setData(d);
    setLastRefresh(new Date());
    fetchAIAnalysis(d);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTicker((p) => (p + 1) % tickerItems.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const fetchAIAnalysis = async (marketData) => {
    setAiLoading(true);
    setAiAnalysis("");
    try {
      const prompt = `You are a senior financial analyst and professional day trader covering both US and Canadian equity markets. Based on the following pre-market data snapshot for ${new Date().toLocaleDateString("en-CA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}, provide a sharp, actionable morning briefing in under 280 words.

INDICES: S&P 500 futures +0.34%, NASDAQ futures -0.12%, TSX futures +0.18%, VIX 14.23 (-3.1%), USD/CAD 1.3641.

TOP US PRE-MARKET MOVERS: NVDA +4.2%, AMD +3.6%, TSLA +2.1%, GOOGL +1.4%, AMZN +0.6%, MSFT -0.3%, META -1.2%, AAPL -0.8%.

TOP CANADA PRE-MARKET MOVERS: SHOP.TO +3.8%, SU.TO +2.1%, CNQ.TO +1.2%, MFC.TO +0.7%, ENB.TO +0.4%, RY.TO -0.6%, BCE.TO -0.9%, TD.TO -1.4%.

KEY EVENTS TODAY: Canada CPI at 8:30AM, US Jobless Claims at 8:30AM, FOMC Minutes at 2:00PM ET.

EARNINGS: MSFT and GOOGL after close; RY.TO and SHOP.TO pre-market.

Give: (1) Market tone & key themes in 2-3 sentences, (2) Top 3 US trade setups with brief rationale, (3) Top 2 Canadian trade setups, (4) Key risk events to watch, (5) One contrarian view. Be direct, data-driven, no fluff.`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const result = await response.json();
      const text = result.content?.map((c) => c.text || "").join("") || "Analysis unavailable.";
      setAiAnalysis(text);
    } catch (e) {
      setAiAnalysis("⚠️ Unable to fetch AI analysis. Please check your connection.");
    }
    setAiLoading(false);
  };

  const refresh = () => {
    const d = generateMockMarketData();
    setData(d);
    setLastRefresh(new Date());
    fetchAIAnalysis(d);
  };

  if (!data) return (
    <div style={{ background: "#070d1a", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#00e5a0", fontFamily: "monospace", fontSize: 18 }}>Initializing market feed...</div>
    </div>
  );

  const tabs = ["overview", "us markets", "canada markets", "events", "ai briefing"];

  return (
    <div style={{
      background: "#070d1a",
      minHeight: "100vh",
      fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
      color: "#c9d8ef",
      overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&family=IBM+Plex+Sans:wght@300;400;600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0e1829; }
        ::-webkit-scrollbar-thumb { background: #1e3a5f; border-radius: 2px; }
        .tab-btn { background: none; border: none; cursor: pointer; padding: 8px 16px; font-family: inherit; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; transition: all 0.2s; }
        .tab-btn.active { color: #00e5a0; border-bottom: 2px solid #00e5a0; }
        .tab-btn:not(.active) { color: #4a6580; border-bottom: 2px solid transparent; }
        .tab-btn:hover:not(.active) { color: #8aa8c8; }
        .card { background: #0e1829; border: 1px solid #1a2d47; border-radius: 4px; }
        .signal-badge { display: inline-block; padding: 2px 8px; border-radius: 2px; font-size: 9px; font-weight: 700; letter-spacing: 0.1em; }
        .ticker-scroll { animation: slideIn 0.5s ease; }
        @keyframes slideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .refresh-btn { background: #0e1829; border: 1px solid #1a2d47; color: #00e5a0; cursor: pointer; padding: 6px 14px; font-family: inherit; font-size: 10px; letter-spacing: 0.1em; transition: all 0.2s; border-radius: 3px; }
        .refresh-btn:hover { background: #162236; border-color: #00e5a0; }
        .row-hover:hover { background: #121f35 !important; }
      `}</style>

      {/* Header */}
      <div style={{ background: "#050b14", borderBottom: "1px solid #1a2d47", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ color: "#00e5a0", fontSize: 13, fontWeight: 700, letterSpacing: "0.15em" }}>◈ TRADEPULSE</div>
          <div style={{ color: "#1a2d47", fontSize: 10 }}>|</div>
          <div style={{ color: "#4a6580", fontSize: 10, letterSpacing: "0.08em" }}>PRE-MARKET INTELLIGENCE</div>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00e5a0" }} className="pulse"></div>
          <div style={{ color: "#00e5a0", fontSize: 9, letterSpacing: "0.08em" }}>LIVE</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ color: "#4a6580", fontSize: 9 }}>
            {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString()}` : ""}
          </div>
          <div style={{ color: "#4a6580", fontSize: 9 }}>
            {new Date().toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric", year: "numeric" }).toUpperCase()}
          </div>
          <button className="refresh-btn" onClick={refresh}>⟳ REFRESH</button>
        </div>
      </div>

      {/* News Ticker */}
      <div style={{ background: "#050b14", borderBottom: "1px solid #1a2d47", padding: "7px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ color: "#ff4d6d", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", whiteSpace: "nowrap" }}>MARKET WIRE</div>
        <div style={{ color: "#1a2d47" }}>│</div>
        <div className="ticker-scroll" key={ticker} style={{ color: "#8aa8c8", fontSize: 10, letterSpacing: "0.06em" }}>
          {tickerItems[ticker]}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid #1a2d47", padding: "0 24px", display: "flex", gap: 4 }}>
        {tabs.map(t => (
          <button key={t} className={`tab-btn ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>{t}</button>
        ))}
      </div>

      <div style={{ padding: "16px 24px", overflowY: "auto", maxHeight: "calc(100vh - 130px)" }}>

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Index Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
              {data.indices.map(idx => (
                <div key={idx.name} className="card" style={{ padding: "12px 14px" }}>
                  <div style={{ color: "#4a6580", fontSize: 9, letterSpacing: "0.1em", marginBottom: 6 }}>{idx.name}</div>
                  <div style={{ color: "#c9d8ef", fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{idx.value.toLocaleString()}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: changeColor(idx.change), fontSize: 10, fontWeight: 600 }}>
                      {idx.change >= 0 ? "▲" : "▼"} {Math.abs(idx.change)}%
                    </span>
                    {idx.premarket && (
                      <span style={{ color: "#f0b429", fontSize: 8, letterSpacing: "0.08em" }}>PM</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Two columns: US + Canada movers */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

              {/* US Movers */}
              <div className="card">
                <div style={{ padding: "10px 14px", borderBottom: "1px solid #1a2d47", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ color: "#c9d8ef", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em" }}>🇺🇸 US PRE-MARKET MOVERS</div>
                  <div style={{ color: "#4a6580", fontSize: 9 }}>NYSE / NASDAQ</div>
                </div>
                <div>
                  {data.usMovers.map((s, i) => (
                    <div key={s.ticker} className="row-hover" style={{ padding: "8px 14px", borderBottom: i < data.usMovers.length - 1 ? "1px solid #0d1c2e" : "none", display: "grid", gridTemplateColumns: "60px 1fr 70px 60px 50px", alignItems: "center", gap: 8 }}>
                      <div>
                        <div style={{ color: "#c9d8ef", fontSize: 11, fontWeight: 600 }}>{s.ticker}</div>
                        <div style={{ color: "#2a4060", fontSize: 8 }}>{s.sector}</div>
                      </div>
                      <div style={{ color: "#4a6580", fontSize: 9, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ color: "#c9d8ef", fontSize: 11 }}>${s.price.toFixed(2)}</div>
                        <div style={{ color: "#4a6580", fontSize: 8 }}>{s.vol}</div>
                      </div>
                      <div style={{ color: changeColor(s.change), fontSize: 11, fontWeight: 600, textAlign: "right" }}>
                        {s.change >= 0 ? "+" : ""}{s.change}%
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span className="signal-badge" style={{ background: s.signal === "BUY" ? "#002a1a" : s.signal === "SELL" ? "#2a0010" : "#1a1400", color: signalColor(s.signal), border: `1px solid ${signalColor(s.signal)}33` }}>{s.signal}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Canada Movers */}
              <div className="card">
                <div style={{ padding: "10px 14px", borderBottom: "1px solid #1a2d47", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ color: "#c9d8ef", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em" }}>🇨🇦 CANADA PRE-MARKET MOVERS</div>
                  <div style={{ color: "#4a6580", fontSize: 9 }}>TSX / TSX-V</div>
                </div>
                <div>
                  {data.canadaMovers.map((s, i) => (
                    <div key={s.ticker} className="row-hover" style={{ padding: "8px 14px", borderBottom: i < data.canadaMovers.length - 1 ? "1px solid #0d1c2e" : "none", display: "grid", gridTemplateColumns: "72px 1fr 70px 60px 50px", alignItems: "center", gap: 8 }}>
                      <div>
                        <div style={{ color: "#c9d8ef", fontSize: 11, fontWeight: 600 }}>{s.ticker}</div>
                        <div style={{ color: "#2a4060", fontSize: 8 }}>{s.sector}</div>
                      </div>
                      <div style={{ color: "#4a6580", fontSize: 9, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ color: "#c9d8ef", fontSize: 11 }}>C${s.price.toFixed(2)}</div>
                        <div style={{ color: "#4a6580", fontSize: 8 }}>{s.vol}</div>
                      </div>
                      <div style={{ color: changeColor(s.change), fontSize: 11, fontWeight: 600, textAlign: "right" }}>
                        {s.change >= 0 ? "+" : ""}{s.change}%
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span className="signal-badge" style={{ background: s.signal === "BUY" ? "#002a1a" : s.signal === "SELL" ? "#2a0010" : "#1a1400", color: signalColor(s.signal), border: `1px solid ${signalColor(s.signal)}33` }}>{s.signal}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sector Heatmap */}
            <div className="card">
              <div style={{ padding: "10px 14px", borderBottom: "1px solid #1a2d47" }}>
                <div style={{ color: "#c9d8ef", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em" }}>SECTOR HEATMAP</div>
              </div>
              <div style={{ padding: 14, display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
                {data.sectorHeatmap.map(s => (
                  <div key={s.name} style={{ textAlign: "center" }}>
                    <div style={{ marginBottom: 6, color: "#4a6580", fontSize: 9, letterSpacing: "0.08em" }}>{s.name.toUpperCase()}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                      <div style={{ background: heatColor(s.usChange) + "22", border: `1px solid ${heatColor(s.usChange)}44`, borderRadius: 3, padding: "6px 4px", textAlign: "center" }}>
                        <div style={{ color: heatColor(s.usChange), fontSize: 11, fontWeight: 700 }}>{s.usChange >= 0 ? "+" : ""}{s.usChange}%</div>
                        <div style={{ color: "#2a4060", fontSize: 8 }}>US</div>
                      </div>
                      <div style={{ background: heatColor(s.caChange) + "22", border: `1px solid ${heatColor(s.caChange)}44`, borderRadius: 3, padding: "6px 4px", textAlign: "center" }}>
                        <div style={{ color: heatColor(s.caChange), fontSize: 11, fontWeight: 700 }}>{s.caChange >= 0 ? "+" : ""}{s.caChange}%</div>
                        <div style={{ color: "#2a4060", fontSize: 8 }}>CA</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* US MARKETS TAB */}
        {activeTab === "us markets" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {data.indices.slice(0, 3).map(idx => (
                <div key={idx.name} className="card" style={{ padding: 16 }}>
                  <div style={{ color: "#4a6580", fontSize: 9, letterSpacing: "0.1em", marginBottom: 8 }}>{idx.name} FUTURES</div>
                  <div style={{ color: "#c9d8ef", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{idx.value.toLocaleString()}</div>
                  <div style={{ display: "flex", gap: 12 }}>
                    <span style={{ color: changeColor(idx.change), fontSize: 12, fontWeight: 600 }}>{idx.change >= 0 ? "+" : ""}{idx.change}%</span>
                    <span style={{ color: changeColor(idx.pts), fontSize: 12 }}>{idx.pts >= 0 ? "+" : ""}{idx.pts} pts</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="card">
              <div style={{ padding: "10px 14px", borderBottom: "1px solid #1a2d47" }}>
                <div style={{ color: "#c9d8ef", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em" }}>🇺🇸 FULL US PRE-MARKET TABLE</div>
              </div>
              <div style={{ padding: "0 0 0 0" }}>
                <div style={{ display: "grid", gridTemplateColumns: "70px 1fr 80px 70px 60px 55px", gap: 8, padding: "8px 14px", borderBottom: "1px solid #1a2d47" }}>
                  {["TICKER","NAME","PRICE","CHG %","VOLUME","SIGNAL"].map(h => (
                    <div key={h} style={{ color: "#2a4060", fontSize: 9, letterSpacing: "0.1em" }}>{h}</div>
                  ))}
                </div>
                {data.usMovers.map((s, i) => (
                  <div key={s.ticker} className="row-hover" style={{ display: "grid", gridTemplateColumns: "70px 1fr 80px 70px 60px 55px", gap: 8, padding: "10px 14px", borderBottom: i < data.usMovers.length - 1 ? "1px solid #0d1c2e" : "none", alignItems: "center" }}>
                    <div style={{ color: "#00e5a0", fontSize: 11, fontWeight: 700 }}>{s.ticker}</div>
                    <div style={{ color: "#8aa8c8", fontSize: 10 }}>{s.name}</div>
                    <div style={{ color: "#c9d8ef", fontSize: 11 }}>${s.price.toFixed(2)}</div>
                    <div style={{ color: changeColor(s.change), fontSize: 11, fontWeight: 600 }}>{s.change >= 0 ? "+" : ""}{s.change}%</div>
                    <div style={{ color: "#4a6580", fontSize: 10 }}>{s.vol}</div>
                    <span className="signal-badge" style={{ background: s.signal === "BUY" ? "#002a1a" : s.signal === "SELL" ? "#2a0010" : "#1a1400", color: signalColor(s.signal), border: `1px solid ${signalColor(s.signal)}33` }}>{s.signal}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CANADA MARKETS TAB */}
        {activeTab === "canada markets" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <div className="card" style={{ padding: 16 }}>
                <div style={{ color: "#4a6580", fontSize: 9, letterSpacing: "0.1em", marginBottom: 8 }}>S&P/TSX COMPOSITE</div>
                <div style={{ color: "#c9d8ef", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>22,104.7</div>
                <div style={{ color: "#00e5a0", fontSize: 12, fontWeight: 600 }}>+0.18% | +39.8 pts</div>
              </div>
              <div className="card" style={{ padding: 16 }}>
                <div style={{ color: "#4a6580", fontSize: 9, letterSpacing: "0.1em", marginBottom: 8 }}>USD/CAD</div>
                <div style={{ color: "#c9d8ef", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>1.3641</div>
                <div style={{ color: "#00e5a0", fontSize: 12, fontWeight: 600 }}>+0.09%</div>
              </div>
              <div className="card" style={{ padding: 16 }}>
                <div style={{ color: "#4a6580", fontSize: 9, letterSpacing: "0.1em", marginBottom: 8 }}>WTI CRUDE OIL</div>
                <div style={{ color: "#c9d8ef", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>$82.41</div>
                <div style={{ color: "#00e5a0", fontSize: 12, fontWeight: 600 }}>+0.7% — Bullish CA</div>
              </div>
            </div>
            <div className="card">
              <div style={{ padding: "10px 14px", borderBottom: "1px solid #1a2d47" }}>
                <div style={{ color: "#c9d8ef", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em" }}>🇨🇦 FULL CANADA PRE-MARKET TABLE</div>
              </div>
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 80px 70px 60px 55px", gap: 8, padding: "8px 14px", borderBottom: "1px solid #1a2d47" }}>
                  {["TICKER","NAME","PRICE","CHG %","VOLUME","SIGNAL"].map(h => (
                    <div key={h} style={{ color: "#2a4060", fontSize: 9, letterSpacing: "0.1em" }}>{h}</div>
                  ))}
                </div>
                {data.canadaMovers.map((s, i) => (
                  <div key={s.ticker} className="row-hover" style={{ display: "grid", gridTemplateColumns: "80px 1fr 80px 70px 60px 55px", gap: 8, padding: "10px 14px", borderBottom: i < data.canadaMovers.length - 1 ? "1px solid #0d1c2e" : "none", alignItems: "center" }}>
                    <div style={{ color: "#00e5a0", fontSize: 11, fontWeight: 700 }}>{s.ticker}</div>
                    <div style={{ color: "#8aa8c8", fontSize: 10 }}>{s.name}</div>
                    <div style={{ color: "#c9d8ef", fontSize: 11 }}>C${s.price.toFixed(2)}</div>
                    <div style={{ color: changeColor(s.change), fontSize: 11, fontWeight: 600 }}>{s.change >= 0 ? "+" : ""}{s.change}%</div>
                    <div style={{ color: "#4a6580", fontSize: 10 }}>{s.vol}</div>
                    <span className="signal-badge" style={{ background: s.signal === "BUY" ? "#002a1a" : s.signal === "SELL" ? "#2a0010" : "#1a1400", color: signalColor(s.signal), border: `1px solid ${signalColor(s.signal)}33` }}>{s.signal}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* EVENTS TAB */}
        {activeTab === "events" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="card">
              <div style={{ padding: "10px 14px", borderBottom: "1px solid #1a2d47" }}>
                <div style={{ color: "#c9d8ef", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em" }}>📅 ECONOMIC CALENDAR</div>
              </div>
              {data.economicEvents.map((e, i) => (
                <div key={i} className="row-hover" style={{ padding: "12px 14px", borderBottom: i < data.economicEvents.length - 1 ? "1px solid #0d1c2e" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ color: "#4a6580", fontSize: 9 }}>{e.time}</div>
                    <span style={{ background: impactColor(e.impact) + "22", color: impactColor(e.impact), border: `1px solid ${impactColor(e.impact)}44`, padding: "2px 8px", borderRadius: 2, fontSize: 8, letterSpacing: "0.1em" }}>{e.impact}</span>
                  </div>
                  <div style={{ color: "#c9d8ef", fontSize: 11, fontWeight: 600, marginBottom: 6 }}>{e.event}</div>
                  <div style={{ display: "flex", gap: 16 }}>
                    <div><span style={{ color: "#2a4060", fontSize: 9 }}>PREV </span><span style={{ color: "#8aa8c8", fontSize: 10 }}>{e.prev}</span></div>
                    <div><span style={{ color: "#2a4060", fontSize: 9 }}>EST </span><span style={{ color: "#f0b429", fontSize: 10 }}>{e.est}</span></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="card">
              <div style={{ padding: "10px 14px", borderBottom: "1px solid #1a2d47" }}>
                <div style={{ color: "#c9d8ef", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em" }}>📊 EARNINGS TODAY</div>
              </div>
              {data.earningsToday.map((e, i) => (
                <div key={i} className="row-hover" style={{ padding: "14px 14px", borderBottom: i < data.earningsToday.length - 1 ? "1px solid #0d1c2e" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ color: "#c9d8ef", fontSize: 12, fontWeight: 600 }}>{e.company}</div>
                    <span style={{ color: "#4a6580", fontSize: 9 }}>{e.flag === "US" ? "🇺🇸" : "🇨🇦"}</span>
                  </div>
                  <div style={{ display: "flex", gap: 16 }}>
                    <div><span style={{ color: "#2a4060", fontSize: 9 }}>TIME </span><span style={{ color: "#f0b429", fontSize: 10 }}>{e.time}</span></div>
                    <div><span style={{ color: "#2a4060", fontSize: 9 }}>EST </span><span style={{ color: "#00e5a0", fontSize: 10 }}>{e.est}</span></div>
                  </div>
                </div>
              ))}
              <div style={{ padding: "12px 14px", borderTop: "1px solid #1a2d47", marginTop: 4 }}>
                <div style={{ color: "#2a4060", fontSize: 9, letterSpacing: "0.08em", lineHeight: 1.6 }}>
                  ⚠️ High earnings volatility expected around MSFT and GOOGL reports after close. Consider reducing position size 30min before close.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI BRIEFING TAB */}
        {activeTab === "ai briefing" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <div style={{ color: "#00e5a0", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", marginBottom: 4 }}>◈ AI MARKET BRIEFING</div>
                  <div style={{ color: "#4a6580", fontSize: 9 }}>Powered by Claude · {new Date().toLocaleTimeString()}</div>
                </div>
                <button className="refresh-btn" onClick={refresh} disabled={aiLoading}>
                  {aiLoading ? "ANALYZING..." : "⟳ REGENERATE"}
                </button>
              </div>
              {aiLoading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{ height: 12, background: "#1a2d47", borderRadius: 2, width: `${60 + i * 8}%`, animation: "pulse 1.5s infinite" }}></div>
                  ))}
                  <div style={{ color: "#4a6580", fontSize: 10, marginTop: 8 }}>Analyzing pre-market conditions across US and Canadian markets...</div>
                </div>
              ) : (
                <div style={{ color: "#c9d8ef", fontSize: 12, lineHeight: 1.9, whiteSpace: "pre-wrap", borderLeft: "3px solid #00e5a0", paddingLeft: 16 }}>
                  {aiAnalysis}
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {[
                { label: "MARKET TONE", value: "CAUTIOUSLY BULLISH", color: "#00e5a0" },
                { label: "KEY RISK", value: "FOMC MINUTES 2PM", color: "#ff4d6d" },
                { label: "TOP SECTOR", value: "TECHNOLOGY", color: "#f0b429" },
              ].map(s => (
                <div key={s.label} className="card" style={{ padding: 16, textAlign: "center" }}>
                  <div style={{ color: "#4a6580", fontSize: 9, letterSpacing: "0.1em", marginBottom: 8 }}>{s.label}</div>
                  <div style={{ color: s.color, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em" }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
