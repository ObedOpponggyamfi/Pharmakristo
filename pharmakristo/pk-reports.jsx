// pk-reports.jsx — PharmaKristo Reports page

function Reports() {
  const { dateRange, setDateRange } = useAppContext();
  const fallback = window.PKData;
  const [stats, setStats] = React.useState(fallback.stats);
  const [period, setPeriod]   = React.useState("This Month");
  const [compTab, setCompTab] = React.useState("monthly");

  React.useEffect(() => {
    let cancelled = false;
    const range = mapDateRangeToApi(dateRange);

    fetch(`/api/dashboard/summary?range=${range}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (cancelled) return;
        setStats({
          ...fallback.stats,
          dailySales: data.revenue,
          dailyTxns: data.transactions,
          monthlyRevenue: data.revenue,
          netProfit: data.net_profit,
          monthExpenses: data.expenses,
          lowStock: data.low_stock,
          expiringSoon: data.expiring_soon,
          stockAlerts: data.stock_alerts,
        });
      })
      .catch(() => {
        if (!cancelled) setStats(fallback.stats);
      });

    return () => {
      cancelled = true;
    };
  }, [dateRange]);

  const fmt = (n) => n.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const fmt2 = (n) => (n < 0 ? "-₵" : "₵") + Math.abs(n).toLocaleString("en-GH", { minimumFractionDigits:2, maximumFractionDigits:2 });
  const comparison = {
    daily:   { value: stats.dailySales,  label: fmt2(stats.dailySales),  red: stats.dailySales < 0  },
    weekly:  { value: 0,                 label: "₵0.00",                  red: false                 },
    monthly: { value: stats.netProfit,   label: fmt2(stats.netProfit),   red: stats.netProfit < 0   },
    yearly:  { value: stats.yearlyNet,   label: fmt2(stats.yearlyNet),   red: stats.yearlyNet < 0   },
  };

  return (
    <div className="pk-content">
      <div className="pk-page-header">
        <div>
          <div className="pk-page-title">Reports &amp; Analytics</div>
          <div className="pk-page-sub">Comprehensive pharmacy insights and performance metrics</div>
        </div>
        <div className="pk-page-actions">
          <select className="pk-select" value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="all">All time</option>
          </select>
          <button className="pk-btn pk-btn-outline">
            <Icon name="download" size={15}/> Export
          </button>
        </div>
      </div>

      {/* Alert chips */}
      <div className="pk-alerts">
        <div className="pk-alert-chip warn">
          <Icon name="alert-triangle" size={14}/> {stats.lowStock} products low on stock
        </div>
        <div className="pk-alert-chip danger">
          <Icon name="clock" size={14}/> {stats.expired} products expired
        </div>
        <div className="pk-alert-chip expiry">
          <Icon name="calendar" size={14}/> {stats.expiringSoon} products expiring soon
        </div>
      </div>

      {/* Financial summary */}
      <div className="pk-financial-section">
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <div>
            <div className="pk-panel-title">
              <Icon name="bar-chart" size={18} style={{ color:"#16a34a" }}/>
              Financial Summary
            </div>
            <div className="pk-panel-sub" style={{ marginTop:3 }}>Sales, profit, and expenses breakdown</div>
          </div>
          <select className="pk-select" value={period} onChange={e => setPeriod(e.target.value)}>
            {["Today","This Week","This Month","This Year"].map(p => <option key={p}>{p}</option>)}
          </select>
        </div>

        {/* 4 KPI cards */}
        <div className="pk-cards-grid" style={{ marginBottom:0 }}>
          <div className="pk-panel" style={{ background:"#f0fdf4", borderColor:"#bbf7d0" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8, color:"#16a34a" }}>
              <Icon name="shopping-cart" size={16}/> Sales
            </div>
            <div style={{ fontSize:28, fontWeight:800, color:"#16a34a" }}>{stats.monthlyTxns}</div>
            <div style={{ fontSize:13, color:"#6b7280", marginTop:4 }}>{period}</div>
          </div>
          <div className="pk-panel" style={{ background:"#eff6ff", borderColor:"#bfdbfe" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8, color:"#2563eb" }}>
              <Icon name="credit-card" size={16}/> Revenue
            </div>
            <div style={{ fontSize:28, fontWeight:800, color:"#2563eb" }}>₵{fmt(stats.monthlyRevenue)}</div>
            <div style={{ fontSize:13, color:"#6b7280", marginTop:4 }}>{period}</div>
          </div>
          <div className="pk-panel" style={{ background:"#fefce8", borderColor:"#fef08a" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8, color:"#b45309" }}>
              <Icon name="trending-up" size={16}/> Expenses
            </div>
            <div style={{ fontSize:28, fontWeight:800, color:"#b45309" }}>₵{fmt(stats.monthExpenses)}</div>
            <div style={{ fontSize:13, color:"#6b7280", marginTop:4 }}>{period}</div>
          </div>
          <div className="pk-panel" style={{ background:"#fff1f2", borderColor:"#fecdd3" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8, color:"#dc2626" }}>
              <Icon name="dollar-sign" size={16}/> Net Profit
            </div>
            <div style={{ fontSize:28, fontWeight:800, color:"#dc2626" }}>₵{fmt(stats.netProfit)}</div>
            <div style={{ fontSize:13, color:"#6b7280", marginTop:4 }}>{period}</div>
          </div>
        </div>

        {/* Quick comparison */}
        <div style={{ marginTop:24 }}>
          <div style={{ fontSize:15, fontWeight:700, marginBottom:14 }}>Quick Comparison</div>
          <div className="pk-comparison-grid">
            {Object.entries(comparison).map(([key, val]) => (
              <div key={key}
                className={"pk-comp-card" + (compTab === key ? " active" : "")}
                onClick={() => setCompTab(key)}>
                <div className="pk-comp-label" style={{ textTransform:"capitalize" }}>{key}</div>
                <div className={"pk-comp-value" + (val.red ? " red" : "")}>{val.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Big colored summary cards (bottom) */}
      <div className="pk-cards-grid">
        <StatCard color="green"  label="Daily Sales"    value="0"              meta="₵0.00 revenue"                   icon="shopping-cart"/>
        <StatCard color="blue"   label="Monthly Sales"  value={stats.monthlyTxns} meta={`₵${fmt(stats.monthlyRevenue)} revenue`} icon="shopping-cart"/>
        <StatCard color="white"  label="Gross Profit"   value={`₵${fmt(stats.grossProfit)}`} meta="This month"       icon="activity"/>
        <StatCard color="orange" label="Net Profit"     value={`₵${fmt(stats.netProfit)}`}   meta={`After ₵${fmt(stats.monthExpenses)} expenses`} icon="dollar-sign"/>
      </div>
    </div>
  );
}

Object.assign(window, { Reports });
