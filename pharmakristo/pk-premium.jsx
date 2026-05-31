// pk-premium.jsx — Premium UI: charts, Krista AI, export

function TrendChart({ points, height = 160 }) {
  if (!points || points.length === 0) {
    return (
      <div className="pk-chart-empty" style={{ height }}>
        No sales data for this period
      </div>
    );
  }
  const values = points.map((p) => p.total);
  const max = Math.max(...values, 1);
  const w = 100;
  const h = height - 24;
  const step = points.length > 1 ? w / (points.length - 1) : w;
  const coords = points.map((p, i) => {
    const x = i * step;
    const y = h - (p.total / max) * (h - 8) + 4;
    return `${x},${y}`;
  });
  const area = `0,${h + 4} ${coords.join(" ")} ${w},${h + 4}`;

  return (
    <div className="pk-trend-chart">
      <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="pk-trend-svg">
        <defs>
          <linearGradient id="pkTrendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(245,176,20,.35)" />
            <stop offset="100%" stopColor="rgba(245,176,20,0)" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#pkTrendFill)" />
        <polyline points={coords.join(" ")} fill="none" stroke="#f5b014" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="pk-trend-labels">
        <span>{points[0]?.date}</span>
        <span>{points[points.length - 1]?.date}</span>
      </div>
    </div>
  );
}

function KristaChat() {
  const { showToast } = useAppContext();
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState("");
  const [messages, setMessages] = React.useState([
    { role: "bot", text: "Hi! I'm Krista. Ask about expenses, stock, sales, or profitability." },
  ]);
  const [loading, setLoading] = React.useState(false);
  const endRef = React.useRef(null);
  const panelRef = React.useRef(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  React.useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    const onClick = (e) => {
      if (panelRef.current?.contains(e.target)) return;
      if (e.target.closest(".pk-krista-fab")) return;
      setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const ask = async (text) => {
    const q = (text || input).trim();
    if (!q || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chat failed");
      setMessages((m) => [...m, { role: "bot", text: data.response }]);
    } catch (err) {
      showToast(err.message || "Krista is unavailable", "error");
    } finally {
      setLoading(false);
    }
  };

  const chips = [
    "What are my top expenses?",
    "Which products are low on stock?",
    "How are sales this week?",
  ];

  return (
    <>
      <button type="button" className="pk-krista-fab" onClick={() => setOpen((v) => !v)} title="Ask Krista">
        <Icon name="activity" size={22} />
      </button>
      {open && (
        <div className="pk-krista-panel" ref={panelRef}>
          <div className="pk-krista-head">
            <div>
              <div className="pk-krista-title">Krista AI</div>
              <div className="pk-krista-sub">Pharmacy insights assistant</div>
            </div>
            <button type="button" className="pk-krista-close" onClick={() => setOpen(false)} aria-label="Close">
              <Icon name="x" size={18} />
            </button>
          </div>
          <div className="pk-krista-msgs">
            {messages.map((m, i) => (
              <div key={i} className={"pk-krista-msg " + m.role}>{m.text}</div>
            ))}
            {loading && <div className="pk-krista-msg bot pk-krista-typing">Thinking…</div>}
            <div ref={endRef} />
          </div>
          <div className="pk-krista-chips">
            {chips.map((c) => (
              <button key={c} type="button" className="pk-krista-chip" onClick={() => ask(c)}>{c}</button>
            ))}
          </div>
          <form
            className="pk-krista-form"
            onSubmit={(e) => {
              e.preventDefault();
              ask();
            }}
          >
            <input
              className="pk-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Krista anything…"
            />
            <button type="submit" className="pk-btn pk-btn-primary pk-btn-sm" disabled={loading}>Send</button>
          </form>
        </div>
      )}
    </>
  );
}

function exportCsv(filename, rows) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = rows.map((r) => r.map(esc).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function LoadingScreen() {
  return (
    <div className="pk-auth-page">
      <div className="pk-auth-card pk-loading-card">
        <div className="pk-spinner" />
        <p className="pk-auth-sub">Loading PharmaKristo…</p>
      </div>
    </div>
  );
}

Object.assign(window, { TrendChart, KristaChat, exportCsv, LoadingScreen });
