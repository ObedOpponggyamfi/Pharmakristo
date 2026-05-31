// pk-dashboard.jsx — PharmaKristo Dashboard page

function Dashboard({ onNav }) {
  const { dateRange, setDateRange } = useAppContext();
  const fallback = window.PKData;
  const [summary, setSummary] = React.useState(null);
  const [sales, setSales] = React.useState(fallback.sales);
  const [lowStock, setLowStock] = React.useState(fallback.lowStock);
  const [trend, setTrend] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;
    const range = mapDateRangeToApi(dateRange);

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [summaryRes, salesRes, lowRes, trendRes] = await Promise.all([
          fetch(`/api/dashboard/summary?range=${range}`),
          fetch("/api/sales/recent?limit=4"),
          fetch("/api/products?filter=low"),
          fetch(`/api/dashboard/sales-trend?range=${range}`),
        ]);

        if (!summaryRes.ok || !salesRes.ok || !lowRes.ok) {
          throw new Error("Failed to load dashboard data");
        }

        const [summaryData, salesData, lowData, trendData] = await Promise.all([
          summaryRes.json(),
          salesRes.json(),
          lowRes.json(),
          trendRes.ok ? trendRes.json() : [],
        ]);

        if (cancelled) return;

        setSummary(summaryData);
        setSales(salesData);
        setTrend(trendData);
        setLowStock(
          lowData.slice(0, 6).map((p) => ({
            name: p.name,
            min: p.min_qty ?? p.min ?? 0,
            qty: p.qty,
          }))
        );
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Could not load dashboard");
          setSummary(null);
          setSales(fallback.sales);
          setLowStock(fallback.lowStock);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [dateRange]);

  const stats = summary
    ? {
        dailySales: summary.revenue,
        dailyTxns: summary.transactions,
        monthlyRevenue: summary.revenue,
        monthlyTxns: summary.transactions,
        netProfit: summary.net_profit,
        stockAlerts: summary.stock_alerts,
      }
    : fallback.stats;

  const fmt = (n) =>
    Number(n || 0).toLocaleString("en-GH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const periodLabel =
    dateRange === "7days"
      ? "Last 7 days"
      : dateRange === "30days"
        ? "Last 30 days"
        : "All time";

  return (
    <div className="pk-content">
      <div className="pk-page-header">
        <div>
          <div className="pk-page-title">Dashboard</div>
          <div className="pk-page-sub">
            Overview of your pharmacy&apos;s performance — {periodLabel.toLowerCase()}.
          </div>
        </div>
        <div className="pk-page-actions">
          <select
            className="pk-select"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="all">All time</option>
          </select>
          <button className="pk-btn pk-btn-outline" onClick={() => onNav("reports")}>
            View Reports
          </button>
          <button className="pk-btn pk-btn-primary" onClick={() => onNav("sales")}>
            <Icon name="shopping-cart" size={16} />
            New Sale
          </button>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-amber-700 mb-3">{error} (showing cached data)</p>
      ) : null}
      {loading ? (
        <p className="text-sm text-slate-500 mb-3">Loading live data…</p>
      ) : null}

      <div className="pk-cards-grid">
        <StatCard
          color="green"
          label="Period Sales"
          value={`₵${fmt(stats.dailySales)}`}
          meta={`${stats.dailyTxns} transaction${stats.dailyTxns !== 1 ? "s" : ""}`}
          icon="dollar-sign"
        />
        <StatCard
          color="blue"
          label="Revenue"
          value={`₵${fmt(stats.monthlyRevenue)}`}
          meta={periodLabel}
          icon="credit-card"
        />
        <StatCard
          color="white"
          label="Net Profit"
          value={`₵${fmt(stats.netProfit)}`}
          meta="Sales minus expenses"
          icon="activity"
          redValue={stats.netProfit < 0}
        />
        <StatCard
          color="orange"
          label="Stock Alerts"
          value={stats.stockAlerts}
          meta="Requires attention"
          icon="alert-triangle"
        />
      </div>

      <div className="pk-panel pk-animate-in" style={{ marginBottom: 20 }}>
        <div className="pk-panel-title" style={{ marginBottom: 12 }}>
          <Icon name="trending-up" size={18} /> Sales Trend
        </div>
        <TrendChart points={trend} height={140} />
      </div>

      <div className="pk-two-col">
        <div className="pk-panel">
          <div className="pk-section-header">
            <div>
              <div className="pk-panel-title">
                <Icon name="shopping-cart" size={18} style={{ color: "#16a34a" }} />
                Recent Transactions
              </div>
              <div className="pk-panel-sub" style={{ marginTop: 3 }}>
                Latest sales activity
              </div>
            </div>
            <button className="pk-view-all" onClick={() => onNav("sales")}>
              View All <Icon name="arrow-up-right" size={14} />
            </button>
          </div>
          {stats.dailyTxns === 0 ? (
            <div className="pk-empty">
              <Icon name="shopping-cart" />
              <div className="pk-empty-title">No sales in this period</div>
              <div className="pk-empty-sub">Ready to process new customers</div>
            </div>
          ) : (
            <div className="pk-table-wrap">
              <table className="pk-table">
                <thead>
                  <tr>
                    <th>Receipt</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.slice(0, 4).map((s) => (
                    <tr key={s.id}>
                      <td className="mono">{s.id}</td>
                      <td>{s.customer}</td>
                      <td className="secondary">
                        {s.items.length} item{s.items.length !== 1 ? "s" : ""}
                      </td>
                      <td>
                        <strong>₵{fmt(s.total)}</strong>
                      </td>
                      <td>
                        <span className="pk-badge pk-badge-green">{s.payment}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="pk-panel">
          <div className="pk-section-header">
            <div>
              <div className="pk-panel-title" style={{ color: "#d97706" }}>
                <Icon name="alert-triangle" size={18} style={{ color: "#d97706" }} />
                Low Stock
              </div>
              <div
                className="pk-panel-sub"
                style={{ color: "#d97706", opacity: 0.8, marginTop: 3 }}
              >
                Restock needed soon
              </div>
            </div>
            <button className="pk-more-btn">
              <Icon name="more-vertical" size={16} />
            </button>
          </div>
          {lowStock.length === 0 ? (
            <div className="pk-empty">
              <div className="pk-empty-title">No low-stock items</div>
            </div>
          ) : (
            lowStock.map((item, i) => (
              <div key={i} className="pk-low-stock-item">
                <div>
                  <div className="pk-low-stock-name">{item.name}</div>
                  <div className="pk-low-stock-meta">Min Level: {item.min}</div>
                </div>
                <div className="pk-low-stock-right">
                  <div className="pk-zero-badge">{item.qty} left</div>
                  <div className="pk-order-link" onClick={() => onNav("procurement")}>
                    Order
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Dashboard });
