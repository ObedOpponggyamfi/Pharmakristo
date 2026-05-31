// pk-products.jsx — PharmaKristo Products page

function Products({ searchQuery = "" }) {
  const { showToast, userRole } = useAppContext();
  const [products, setProducts] = React.useState([]);
  const [stats, setStats] = React.useState(window.PKData.stats);
  const [suppliers, setSuppliers] = React.useState(["All Suppliers"]);
  const [filter, setFilter] = React.useState("all");
  const [query, setQuery] = React.useState(searchQuery);
  const [supplier, setSupplier] = React.useState("All Suppliers");
  const [loading, setLoading] = React.useState(true);
  const [showAdd, setShowAdd] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", generic: "", batch: "", qty: "", min_qty: "10", expiry: "", cost: "", sell: "", supplier: "" });

  const fmt = (n) => Number(n || 0).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  React.useEffect(() => { setQuery(searchQuery); }, [searchQuery]);

  const load = React.useCallback(() => {
    const params = new URLSearchParams();
    if (filter !== "all") params.set("filter", filter);
    if (query) params.set("q", query);
    return Promise.all([
      fetch("/api/products?" + params).then((r) => r.json()),
      fetch("/api/dashboard/summary?range=all").then((r) => r.ok ? r.json() : null),
    ]).then(([prods, summary]) => {
      setProducts(prods);
      if (summary) {
        setStats((s) => ({
          ...s,
          totalProducts: summary.total_products,
          lowStock: summary.low_stock,
          expiringSoon: summary.expiring_soon,
        }));
      }
      const sup = ["All Suppliers", ...new Set(prods.map((p) => p.supplier).filter(Boolean))];
      setSuppliers(sup);
    }).catch(() => showToast("Could not load products", "error"));
  }, [filter, query, showToast]);

  React.useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const filtered = React.useMemo(() => {
    let list = products;
    if (supplier !== "All Suppliers") list = list.filter((p) => p.supplier === supplier);
    return list;
  }, [products, supplier]);

  const stockBadge = (p) => {
    if (p.status === "out_stock") return <span className="pk-badge pk-badge-red">Out of Stock</span>;
    if (p.status === "low_stock" || p.low) return <><div style={{ fontWeight: 700 }}>{p.qty}</div><span className="pk-badge pk-badge-orange">Low</span></>;
    if (p.status === "expiring_soon" || p.expiring) return <><div style={{ fontWeight: 700 }}>{p.qty}</div><span className="pk-badge pk-badge-orange">Expiring</span></>;
    return <><div style={{ fontWeight: 700 }}>{p.qty}</div><span className="pk-badge pk-badge-green">In Stock</span></>;
  };

  const saveProduct = async () => {
    if (!form.name || !form.sell) return showToast("Name and sell price required", "error");
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          qty: parseInt(form.qty, 10) || 0,
          min_qty: parseInt(form.min_qty, 10) || 0,
          cost: parseFloat(form.cost) || 0,
          sell: parseFloat(form.sell) || 0,
          status: "in_stock",
        }),
      });
      if (!res.ok) throw new Error("Failed");
      showToast("Product added");
      setShowAdd(false);
      setForm({ name: "", generic: "", batch: "", qty: "", min_qty: "10", expiry: "", cost: "", sell: "", supplier: "" });
      load();
    } catch {
      showToast("Could not add product", "error");
    }
  };

  const deleteProduct = async (id) => {
    if (userRole !== "admin" || !window.confirm("Delete this product?")) return;
    await fetch("/api/products/" + id, { method: "DELETE" });
    showToast("Product removed", "info");
    load();
  };

  return (
    <div className="pk-content">
      <div className="pk-page-header">
        <div>
          <div className="pk-page-title">Products</div>
          <div className="pk-page-sub">Manage your product catalog and stock levels</div>
        </div>
        <button type="button" className="pk-btn pk-btn-primary" onClick={() => setShowAdd(true)}>
          <Icon name="plus" size={16} /> Add Product
        </button>
      </div>

      <div className="pk-cards-grid">
        <StatCard color="blue" label="Total Products" value={stats.totalProducts} icon="columns" />
        <StatCard color="orange" label="Low Stock" value={stats.lowStock} icon="alert-triangle" />
        <StatCard color="red" label="Expiring Soon" value={stats.expiringSoon} icon="calendar" />
        <StatCard color="green" label="In Catalog" value={filtered.length} meta="Current view" icon="package" />
      </div>

      {showAdd && (
        <div className="pk-panel pk-animate-in" style={{ marginBottom: 20 }}>
          <div className="pk-panel-title" style={{ marginBottom: 14 }}>New Product</div>
          <div className="pk-form-grid">
            {["name", "generic", "batch", "supplier", "expiry"].map((f) => (
              <input key={f} className="pk-input" placeholder={f.replace("_", " ")} value={form[f] || ""} onChange={(e) => setForm((v) => ({ ...v, [f]: e.target.value }))} />
            ))}
            {["qty", "min_qty", "cost", "sell"].map((f) => (
              <input key={f} className="pk-input" type="number" placeholder={f} value={form[f]} onChange={(e) => setForm((v) => ({ ...v, [f]: e.target.value }))} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button type="button" className="pk-btn pk-btn-primary" onClick={saveProduct}>Save Product</button>
            <button type="button" className="pk-btn pk-btn-outline" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="pk-panel">
        <div className="pk-filter-bar">
          {["all", "low", "expiring", "expired"].map((f) => (
            <button key={f} type="button" className={"pk-filter-chip" + (filter === f ? " active" : "")} onClick={() => setFilter(f)}>
              {f === "all" ? "All" : f.replace("_", " ")}
            </button>
          ))}
          <select className="pk-select" value={supplier} onChange={(e) => setSupplier(e.target.value)}>
            {suppliers.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        {loading ? <div className="pk-skeleton pk-skeleton-lg" /> : (
          <div className="pk-table-wrap">
            <table className="pk-table">
              <thead><tr><th>Product</th><th>Batch</th><th>Qty</th><th>Expiry</th><th>Sell</th><th>Supplier</th><th></th></tr></thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.name}</strong><div className="secondary">{p.generic}</div></td>
                    <td className="mono">{p.batch}</td>
                    <td style={{ textAlign: "center" }}>{stockBadge(p)}</td>
                    <td className="secondary">{p.expiry}</td>
                    <td><strong>₵{fmt(p.sell)}</strong></td>
                    <td className="secondary">{p.supplier}</td>
                    <td>{userRole === "admin" && <button type="button" className="pk-more-btn" onClick={() => deleteProduct(p.id)}><Icon name="x" size={14} /></button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { Products });
