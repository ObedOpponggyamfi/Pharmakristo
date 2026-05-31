// pk-sales.jsx — PharmaKristo Point of Sale page

function Sales() {
  const { showToast } = useAppContext();
  const [products, setProducts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");
  const [cart, setCart] = React.useState([]);
  const [customer, setCustomer] = React.useState("");
  const [payment, setPayment] = React.useState("cash");
  const [submitting, setSubmitting] = React.useState(false);

  const fmt = (n) => n.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  React.useEffect(() => {
    fetch("/api/products")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setProducts)
      .catch(() => showToast("Could not load products", "error"))
      .finally(() => setLoading(false));
  }, []);

  const visible = React.useMemo(() => {
    const q = query.toLowerCase();
    return products
      .filter((p) => p.status !== "out_stock")
      .filter((p) => !q || [p.name, p.generic, p.batch].some((s) => (s || "").toLowerCase().includes(q)))
      .slice(0, 16);
  }, [products, query]);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) return prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { id: product.id, name: product.name, generic: product.generic, price: product.sell, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart((prev) => prev.map((i) => (i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i)).filter((i) => i.qty > 0));
  };

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const paymentOpts = [
    { id: "cash", label: "Cash", icon: "dollar-sign" },
    { id: "momo", label: "Mobile Money", icon: "smartphone" },
    { id: "card", label: "Card", icon: "credit-card" },
    { id: "credit", label: "Credit", icon: "clock" },
  ];

  const paymentLabel = { cash: "Cash", momo: "MoMo", card: "Card", credit: "Credit" };

  const processSale = async () => {
    if (!cart.length || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/sales/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
          customer: customer || "Walk-in",
          payment: paymentLabel[payment] || "Cash",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sale failed");
      showToast(`Sale complete — ${data.receipt_id} · ₵${fmt(data.total)}`);
      setCart([]);
      setCustomer("");
    } catch (err) {
      showToast(err.message || "Could not process sale", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pk-pos-layout">
      <div className="pk-pos-left">
        <div className="pk-page-header" style={{ marginBottom: 18 }}>
          <div>
            <div className="pk-page-title">Point of Sale</div>
            <div className="pk-page-sub">Process sales and manage transactions</div>
          </div>
        </div>
        <div className="pk-input-search" style={{ marginBottom: 20 }}>
          <Icon name="search" size={15} style={{ color: "#9ca3af" }} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products…" />
        </div>
        {loading ? (
          <div className="pk-quick-grid">{[1, 2, 3, 4].map((i) => <div key={i} className="pk-skeleton pk-skeleton-card" />)}</div>
        ) : (
          <div className="pk-quick-grid">
            {visible.map((p) => (
              <div key={p.id} className={"pk-quick-card" + (p.low ? " low" : "")} onClick={() => addToCart(p)}>
                <div className="pk-quick-name">{p.name}</div>
                <div className="pk-quick-generic">{p.generic}</div>
                <div className="pk-quick-bottom">
                  <div className="pk-quick-price">₵{Number(p.sell).toFixed(2)}</div>
                  <div className={"pk-quick-qty" + (p.low ? " low" : "")}>{p.qty} left</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pk-pos-right">
        <div className="pk-cart-header">
          <div className="pk-cart-title"><Icon name="shopping-cart" size={18} /> Current Sale</div>
          <input className="pk-input" value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Customer name (optional)" style={{ marginTop: 10, fontSize: 13 }} />
        </div>
        <div className="pk-cart-body">
          {cart.length === 0 ? (
            <div className="pk-cart-empty">
              <Icon name="shopping-cart" style={{ width: 44, height: 44, color: "#d1d5db" }} />
              <div>No items in cart</div>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="pk-cart-item">
                <div className="pk-cart-item-name">{item.name}<div style={{ fontSize: 12, color: "#9ca3af" }}>{item.generic}</div></div>
                <div className="pk-cart-item-qty">
                  <button type="button" className="pk-qty-btn" onClick={() => updateQty(item.id, -1)}>−</button>
                  <span>{item.qty}</span>
                  <button type="button" className="pk-qty-btn" onClick={() => updateQty(item.id, 1)}>+</button>
                </div>
                <div className="pk-cart-item-price">₵{fmt(item.price * item.qty)}</div>
              </div>
            ))
          )}
        </div>
        <div className="pk-cart-footer">
          <div className="pk-total-row grand"><span>Total</span><span>₵{fmt(subtotal)}</span></div>
          <div className="pk-payment-grid">
            {paymentOpts.map((opt) => (
              <button key={opt.id} type="button" className={"pk-payment-opt" + (payment === opt.id ? " selected" : "")} onClick={() => setPayment(opt.id)}>
                <Icon name={opt.icon} size={15} /> {opt.label}
              </button>
            ))}
          </div>
          <button type="button" className="pk-process-btn" onClick={processSale} disabled={!cart.length || submitting}>
            {submitting ? "Processing…" : cart.length ? `Process Sale — ₵${fmt(subtotal)}` : "Add items to process sale"}
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Sales });
