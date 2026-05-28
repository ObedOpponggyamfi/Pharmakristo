// pk-products.jsx — PharmaKristo Products page

function Products() {
  const { products, stats, suppliers } = window.PKData;
  const [filter, setFilter] = React.useState("all");
  const [query, setQuery]   = React.useState("");
  const [supplier, setSupplier] = React.useState("All Suppliers");

  const fmt = (n) => n.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const filtered = React.useMemo(() => {
    let list = products;
    if (filter === "low")      list = list.filter(p => p.low || p.status === "low_stock");
    if (filter === "expiring") list = list.filter(p => p.expiring || p.status === "expiring_soon");
    if (filter === "expired")  list = list.filter(p => p.status === "expired");
    if (supplier !== "All Suppliers") list = list.filter(p => p.supplier === supplier);
    if (query) list = list.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.generic.toLowerCase().includes(query.toLowerCase()) || p.batch.toLowerCase().includes(query.toLowerCase()));
    return list;
  }, [filter, query, supplier]);

  const stockBadge = (p) => {
    if (p.status === "out_stock") return <span className="pk-badge pk-badge-red">Out of Stock</span>;
    if (p.status === "low_stock") return <><div style={{ fontWeight:700 }}>{p.qty}</div><span className="pk-badge pk-badge-orange">Low Stock</span></>;
    if (p.status === "expiring_soon") return <><div style={{ fontWeight:700 }}>{p.qty}</div><span className="pk-badge pk-badge-orange">Expiring</span></>;
    return <><div style={{ fontWeight:700 }}>{p.qty}</div><span className="pk-badge pk-badge-green">In Stock</span></>;
  };

  return (
    <div className="pk-content">
      <div className="pk-page-header">
        <div>
          <div className="pk-page-title">Products</div>
          <div className="pk-page-sub">Manage your product catalog and stock levels</div>
        </div>
        <button className="pk-btn pk-btn-primary">
          <Icon name="plus" size={16}/> Add Product
        </button>
      </div>

      {/* Stat cards */}
      <div className="pk-cards-grid">
        <StatCard color="blue"   label="Total Products"  value={stats.totalProducts} icon="columns"/>
        <StatCard color="orange" label="Low Stock"       value={stats.lowStock}      icon="alert-triangle"/>
        <StatCard color="red"    label="Expiring Soon"   value={stats.expiringSoon}  icon="calendar"/>
        <StatCard color="green"  label="Stock Value"     value={`₵${fmt(stats.stockValue)}`} icon="shopping-cart"/>
      </div>

      {/* Product list */}
      <div className="pk-panel">
        <div className="pk-section-header">
          <div>
            <div className="pk-panel-title">Product List</div>
            <div className="pk-panel-sub">{filtered.length} of {products.length} products</div>
          </div>
          <div className="pk-input-search" style={{ width:220 }}>
            <Icon name="search" size={15} style={{ color:"#9ca3af" }}/>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products..."/>
          </div>
        </div>

        {/* Filters */}
        <div className="pk-filter-bar">
          <Icon name="filter" size={15} style={{ color:"#9ca3af" }}/>
          {[
            { id:"all",      label:"All" },
            { id:"low",      label:`Low Stock`, count:stats.lowStock },
            { id:"expiring", label:`Expiring Soon`, count:stats.expiringSoon },
            { id:"expired",  label:`Expired`, count:stats.expired },
          ].map(f => (
            <button key={f.id} className={"pk-filter-chip" + (filter === f.id ? " active" : "")} onClick={() => setFilter(f.id)}>
              {f.label}
              {f.count != null && <span className="pk-filter-count">{f.count}</span>}
            </button>
          ))}
          <div className="pk-filter-chip">
            <select value={supplier} onChange={e => setSupplier(e.target.value)}>
              {suppliers.map(s => <option key={s}>{s}</option>)}
            </select>
            <Icon name="chevron-down" size={13}/>
          </div>
        </div>

        {/* Table */}
        <div className="pk-table-wrap">
          <table className="pk-table">
            <thead>
              <tr>
                <th>Product</th><th>Generic</th><th>Batch</th>
                <th style={{ textAlign:"center" }}>Qty</th>
                <th>Expiry</th><th>Cost</th><th>Sell</th><th>Supplier</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id + p.batch}>
                  <td><strong>{p.name}</strong></td>
                  <td className="secondary">{p.generic}</td>
                  <td className="mono">{p.batch}</td>
                  <td style={{ textAlign:"center" }}>
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                      {stockBadge(p)}
                    </div>
                  </td>
                  <td className="secondary">{p.expiry}</td>
                  <td>₵{fmt(p.cost)}</td>
                  <td><strong>₵{fmt(p.sell)}</strong></td>
                  <td className="secondary" style={{ maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.supplier}</td>
                  <td><button className="pk-more-btn"><Icon name="more-vertical" size={16}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="pk-empty" style={{ padding:"32px 20px" }}>
              <Icon name="package"/>
              <div className="pk-empty-title">No products found</div>
              <div className="pk-empty-sub">Try adjusting your filters or search.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Products });
