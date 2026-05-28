// pk-dashboard.jsx — PharmaKristo Dashboard page

function Dashboard({ onNav }) {
  const { stats, lowStock, sales } = window.PKData;
  const fmt = (n) => n.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="pk-content">
      <div className="pk-page-header">
        <div>
          <div className="pk-page-title">Dashboard</div>
          <div className="pk-page-sub">Overview of your pharmacy's performance today.</div>
        </div>
        <div className="pk-page-actions">
          <button className="pk-btn pk-btn-outline" onClick={() => onNav("reports")}>View Reports</button>
          <button className="pk-btn pk-btn-primary" onClick={() => onNav("sales")}>
            <Icon name="shopping-cart" size={16}/>
            New Sale
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="pk-cards-grid">
        <StatCard color="green"  label="Daily Sales"       value={`₵${fmt(stats.dailySales)}`}      meta={`${stats.dailyTxns} transaction${stats.dailyTxns !== 1 ? 's' : ''}`}   icon="dollar-sign"/>
        <StatCard color="blue"   label="Monthly Revenue"   value={`₵${fmt(stats.monthlyRevenue)}`}   meta={`${stats.monthlyTxns} this month`}   icon="credit-card"/>
        <StatCard color="white"  label="Net Profit"        value={`₵${fmt(stats.netProfit)}`}         meta="Net earnings"                        icon="activity" redValue={stats.netProfit < 0}/>
        <StatCard color="orange" label="Stock Alerts"      value={stats.stockAlerts}                  meta="Requires attention"                  icon="alert-triangle"/>
      </div>

      {/* Two-column layout */}
      <div className="pk-two-col">
        {/* Recent Transactions */}
        <div className="pk-panel">
          <div className="pk-section-header">
            <div>
              <div className="pk-panel-title">
                <Icon name="shopping-cart" size={18} style={{ color:"#16a34a" }}/>
                Recent Transactions
              </div>
              <div className="pk-panel-sub" style={{ marginTop:3 }}>Latest sales activity from today</div>
            </div>
            <button className="pk-view-all" onClick={() => onNav("sales")}>
              View All <Icon name="arrow-up-right" size={14}/>
            </button>
          </div>
          {stats.dailyTxns === 0 ? (
            <div className="pk-empty">
              <Icon name="shopping-cart"/>
              <div className="pk-empty-title">No sales recorded today</div>
              <div className="pk-empty-sub">Ready to process new customers</div>
            </div>
          ) : (
            <div className="pk-table-wrap">
              <table className="pk-table">
                <thead>
                  <tr>
                    <th>Receipt</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.slice(0, 4).map(s => (
                    <tr key={s.id}>
                      <td className="mono">{s.id}</td>
                      <td>{s.customer}</td>
                      <td className="secondary">{s.items.length} item{s.items.length !== 1 ? "s" : ""}</td>
                      <td><strong>₵{fmt(s.total)}</strong></td>
                      <td><span className="pk-badge pk-badge-green">{s.payment}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Low Stock */}
        <div className="pk-panel">
          <div className="pk-section-header">
            <div>
              <div className="pk-panel-title" style={{ color:"#d97706" }}>
                <Icon name="alert-triangle" size={18} style={{ color:"#d97706" }}/>
                Low Stock
              </div>
              <div className="pk-panel-sub" style={{ color:"#d97706", opacity:.8, marginTop:3 }}>Restock needed soon</div>
            </div>
            <button className="pk-more-btn"><Icon name="more-vertical" size={16}/></button>
          </div>
          {lowStock.map((item, i) => (
            <div key={i} className="pk-low-stock-item">
              <div>
                <div className="pk-low-stock-name">{item.name}</div>
                <div className="pk-low-stock-meta">Min Level: {item.min}</div>
              </div>
              <div className="pk-low-stock-right">
                <div className="pk-zero-badge">{item.qty} left</div>
                <div className="pk-order-link" onClick={() => onNav("procurement")}>Order</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Dashboard });
