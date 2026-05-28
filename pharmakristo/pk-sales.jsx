// pk-sales.jsx — PharmaKristo Point of Sale page

function Sales() {
  const { products } = window.PKData;
  const [query, setQuery]   = React.useState("");
  const [cart, setCart]     = React.useState([]);
  const [customer, setCustomer] = React.useState("");
  const [payment, setPayment]   = React.useState("cash");

  const fmt = (n) => n.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Filter products for Quick Select and search
  const visible = React.useMemo(() => {
    const q = query.toLowerCase();
    return products
      .filter(p => p.status !== "out_stock")
      .filter(p => !q || p.name.toLowerCase().includes(q) || p.generic.toLowerCase().includes(q) || p.batch.toLowerCase().includes(q))
      .slice(0, 16);
  }, [query]);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => {
      const next = prev.map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i);
      return next.filter(i => i.qty > 0);
    });
  };

  const subtotal = cart.reduce((s, i) => s + i.sell * i.qty, 0);

  const paymentOpts = [
    { id:"cash",   label:"Cash",         icon:"dollar-sign" },
    { id:"momo",   label:"Mobile Money", icon:"smartphone" },
    { id:"card",   label:"Card",         icon:"credit-card" },
    { id:"credit", label:"Credit",       icon:"clock" },
  ];

  const processRef = () => {
    if (cart.length === 0) return;
    alert(`Sale processed!\nTotal: ₵${fmt(subtotal)}\nPayment: ${payment.toUpperCase()}`);
    setCart([]);
    setCustomer("");
  };

  return (
    <div className="pk-pos-layout">
      {/* Left — product search + quick select */}
      <div className="pk-pos-left">
        <div className="pk-page-header" style={{ marginBottom:18 }}>
          <div>
            <div className="pk-page-title">Point of Sale</div>
            <div className="pk-page-sub">Process sales and manage transactions</div>
          </div>
        </div>

        {/* Search */}
        <div className="pk-input-search" style={{ marginBottom:20 }}>
          <Icon name="search" size={15} style={{ color:"#9ca3af" }}/>
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search products by name, generic name, or batch..."/>
        </div>

        {/* Quick select */}
        <div>
          <div style={{ fontWeight:700, fontSize:16, marginBottom:4 }}>Quick Select</div>
          <div style={{ color:"#6b7280", fontSize:13, marginBottom:14 }}>Click to add to cart</div>
          <div className="pk-quick-grid">
            {visible.map(p => (
              <div key={p.id + p.batch} className={"pk-quick-card" + (p.low ? " low" : "")}
                   onClick={() => addToCart(p)}>
                <div className="pk-quick-name">{p.name}</div>
                <div className="pk-quick-generic">{p.generic}</div>
                <div className="pk-quick-bottom">
                  <div className="pk-quick-price">₵{p.sell.toFixed(2)}</div>
                  <div className={"pk-quick-qty" + (p.low ? " low" : "")}>
                    {p.low && <Icon name="alert-triangle" size={12} style={{ display:"inline", marginRight:2 }}/>}
                    {p.qty} left
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — cart */}
      <div className="pk-pos-right">
        <div className="pk-cart-header">
          <div className="pk-cart-title">
            <Icon name="shopping-cart" size={18} style={{ color:"#16a34a" }}/>
            Current Sale
          </div>
          <div style={{ marginTop:10 }}>
            <input className="pk-input" value={customer} onChange={e => setCustomer(e.target.value)}
              placeholder="Customer name (optional)" style={{ fontSize:13 }}/>
          </div>
        </div>

        <div className="pk-cart-body">
          {cart.length === 0 ? (
            <div className="pk-cart-empty">
              <Icon name="shopping-cart" style={{ width:44, height:44, color:"#d1d5db" }}/>
              <div style={{ fontSize:14, fontWeight:600, color:"#6b7280" }}>No items in cart</div>
              <div style={{ fontSize:12.5 }}>Search for products to add</div>
            </div>
          ) : cart.map(item => (
            <div key={item.id + item.batch} className="pk-cart-item">
              <div className="pk-cart-item-name">
                {item.name}
                <div style={{ fontSize:12, color:"#9ca3af" }}>{item.generic}</div>
              </div>
              <div className="pk-cart-item-qty">
                <button className="pk-qty-btn" onClick={() => updateQty(item.id, -1)}>−</button>
                <span style={{ fontSize:14, fontWeight:600, minWidth:20, textAlign:"center" }}>{item.qty}</span>
                <button className="pk-qty-btn" onClick={() => updateQty(item.id, 1)}>+</button>
              </div>
              <div className="pk-cart-item-price">₵{fmt(item.sell * item.qty)}</div>
            </div>
          ))}
        </div>

        <div className="pk-cart-footer">
          <div className="pk-cart-totals">
            <div className="pk-total-row">
              <span>Subtotal</span>
              <span>₵{fmt(subtotal)}</span>
            </div>
            <div className="pk-total-row grand">
              <span>Total</span>
              <span>₵{fmt(subtotal)}</span>
            </div>
          </div>

          <div className="pk-payment-label">Payment Method</div>
          <div className="pk-payment-grid">
            {paymentOpts.map(opt => (
              <button key={opt.id}
                className={"pk-payment-opt" + (payment === opt.id ? " selected" : "")}
                onClick={() => setPayment(opt.id)}>
                <Icon name={opt.icon} size={15}/>
                {opt.label}
              </button>
            ))}
          </div>

          <button className="pk-process-btn" onClick={processRef} disabled={cart.length === 0}>
            {cart.length === 0 ? "Add items to process sale" : `Process Sale — ₵${fmt(subtotal)}`}
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Sales });
