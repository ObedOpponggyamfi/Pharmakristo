// pk-receipts.jsx — Receipt history & print

function Receipts() {
  const { showToast } = useAppContext();
  const [sales, setSales] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState(null);
  const fmt = (n) => Number(n || 0).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  React.useEffect(() => {
    fetch("/api/sales/recent?limit=20")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setSales)
      .catch(() => showToast("Could not load receipts", "error"))
      .finally(() => setLoading(false));
  }, []);

  const printReceipt = (sale) => {
    const lines = sale.items.map((i) => `<tr><td>${i.name}</td><td>${i.qty}</td><td>₵${fmt(i.price * i.qty)}</td></tr>`).join("");
    const html = `<!doctype html><html><head><title>Receipt ${sale.id}</title>
      <style>body{font-family:Inter,sans-serif;padding:24px;max-width:360px;margin:auto}
      h1{font-size:18px;color:#0c1e36}table{width:100%;border-collapse:collapse;margin-top:12px}
      td,th{padding:6px 0;border-bottom:1px solid #eee;font-size:13px;text-align:left}
      .total{font-weight:800;font-size:16px;margin-top:12px}</style></head><body>
      <h1>PharmaKristo</h1><p>Receipt <strong>${sale.id}</strong></p>
      <p>${sale.date} · ${sale.time}<br/>${sale.customer} · ${sale.payment}</p>
      <table><thead><tr><th>Item</th><th>Qty</th><th>Total</th></tr></thead><tbody>${lines}</tbody></table>
      <p class="total">Total: ₵${fmt(sale.total)}</p></body></html>`;
    const w = window.open("", "_blank", "width=420,height=640");
    if (!w) return showToast("Allow pop-ups to print receipts", "info");
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <div className="pk-content">
      <div className="pk-page-header">
        <div>
          <div className="pk-page-title">Receipts</div>
          <div className="pk-page-sub">View and print transaction receipts</div>
        </div>
      </div>

      <div className="pk-two-col">
        <div className="pk-panel">
          <div className="pk-panel-title" style={{ marginBottom: 14 }}>Recent Sales</div>
          {loading ? <div className="pk-skeleton pk-skeleton-lg" /> : (
            <div className="pk-table-wrap">
              <table className="pk-table">
                <thead><tr><th>ID</th><th>Customer</th><th>Total</th><th></th></tr></thead>
                <tbody>
                  {sales.map((s) => (
                    <tr key={s.id} className={selected?.id === s.id ? "pk-row-active" : ""} onClick={() => setSelected(s)} style={{ cursor: "pointer" }}>
                      <td className="mono">{s.id}</td>
                      <td>{s.customer}</td>
                      <td><strong>₵{fmt(s.total)}</strong></td>
                      <td><button type="button" className="pk-btn pk-btn-outline pk-btn-sm" onClick={(e) => { e.stopPropagation(); printReceipt(s); }}>Print</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="pk-panel">
          {!selected ? (
            <div className="pk-empty"><div className="pk-empty-title">Select a receipt</div></div>
          ) : (
            <>
              <div className="pk-panel-title">{selected.id}</div>
              <div className="pk-panel-sub" style={{ marginBottom: 16 }}>{selected.date} · {selected.payment}</div>
              {selected.items.map((item, i) => (
                <div key={i} className="pk-receipt-line">
                  <span>{item.name} × {item.qty}</span>
                  <strong>₵{fmt(item.price * item.qty)}</strong>
                </div>
              ))}
              <div className="pk-receipt-total">Total: ₵{fmt(selected.total)}</div>
              <button type="button" className="pk-btn pk-btn-primary" style={{ marginTop: 16 }} onClick={() => printReceipt(selected)}>
                <Icon name="download" size={15}/> Print Receipt
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Receipts });
