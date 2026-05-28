// pk-expenses.jsx — PharmaKristo Expenses page

function Expenses() {
  const { expenses, stats, expenseCategories } = window.PKData;
  const [query, setQuery]     = React.useState("");
  const [category, setCat]    = React.useState("All Categories");
  const [showAdd, setShowAdd] = React.useState(false);
  const [newExp, setNewExp]   = React.useState({ description:"", category:"Salaries", amount:"" });
  const [list, setList]       = React.useState(expenses);

  const fmt = (n) => n.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const filtered = React.useMemo(() => {
    let l = list;
    if (category !== "All Categories") l = l.filter(e => e.category === category);
    if (query) l = l.filter(e => e.description.toLowerCase().includes(query.toLowerCase()));
    return l;
  }, [list, category, query]);

  const monthTotal = list.reduce((s, e) => s + e.amount, 0);
  const todayTotal = 0;

  const catColors = {
    "Salaries":    "pk-badge-gray",
    "Rent":        "pk-badge-blue",
    "Utilities":   "pk-badge-blue",
    "Supplies":    "pk-badge-green",
    "Maintenance": "pk-badge-orange",
    "Other":       "pk-badge-orange",
  };

  const addExpense = () => {
    if (!newExp.description || !newExp.amount) return;
    setList(prev => [{
      id: prev.length + 1,
      date: "May 27, 2026",
      description: newExp.description,
      category: newExp.category,
      amount: parseFloat(newExp.amount),
    }, ...prev]);
    setNewExp({ description:"", category:"Salaries", amount:"" });
    setShowAdd(false);
  };

  return (
    <div className="pk-content">
      <div className="pk-page-header">
        <div>
          <div className="pk-page-title">Expenses</div>
          <div className="pk-page-sub">Track and manage your pharmacy business expenses</div>
        </div>
        <button className="pk-btn pk-btn-primary" onClick={() => setShowAdd(v => !v)}>
          <Icon name="plus" size={16}/> Add Expense
        </button>
      </div>

      {/* Add Expense form */}
      {showAdd && (
        <div className="pk-panel" style={{ marginBottom:20 }}>
          <div className="pk-panel-title" style={{ marginBottom:16 }}>New Expense</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 160px auto", gap:12, alignItems:"end" }}>
            <div>
              <div style={{ fontSize:12, fontWeight:600, color:"#6b7280", marginBottom:5 }}>DESCRIPTION</div>
              <input className="pk-input" value={newExp.description}
                onChange={e => setNewExp(v => ({ ...v, description:e.target.value }))}
                placeholder="e.g. Supplier payment"/>
            </div>
            <div>
              <div style={{ fontSize:12, fontWeight:600, color:"#6b7280", marginBottom:5 }}>CATEGORY</div>
              <select className="pk-select" style={{ width:"100%" }} value={newExp.category}
                onChange={e => setNewExp(v => ({ ...v, category:e.target.value }))}>
                {expenseCategories.slice(1).map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize:12, fontWeight:600, color:"#6b7280", marginBottom:5 }}>AMOUNT (₵)</div>
              <input className="pk-input" type="number" value={newExp.amount}
                onChange={e => setNewExp(v => ({ ...v, amount:e.target.value }))}
                placeholder="0.00"/>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button className="pk-btn pk-btn-primary" onClick={addExpense}>Save</button>
              <button className="pk-btn pk-btn-outline" onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:16, marginBottom:24 }}>
        <div className="pk-panel" style={{ padding:"18px 20px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <div style={{ fontSize:13.5, color:"#6b7280", marginBottom:8 }}>Today's Expenses</div>
              <div style={{ fontSize:28, fontWeight:800 }}>₵{fmt(todayTotal)}</div>
            </div>
            <Icon name="receipt" size={20} style={{ color:"#9ca3af" }}/>
          </div>
        </div>
        <div className="pk-panel" style={{ padding:"18px 20px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <div style={{ fontSize:13.5, color:"#6b7280", marginBottom:8 }}>This Month</div>
              <div style={{ fontSize:28, fontWeight:800 }}>₵{fmt(monthTotal)}</div>
            </div>
            <Icon name="trending-up" size={20} style={{ color:"#9ca3af" }}/>
          </div>
        </div>
        <div className="pk-panel" style={{ padding:"18px 20px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <div style={{ fontSize:13.5, color:"#6b7280", marginBottom:8 }}>Top Category</div>
              <div style={{ fontSize:24, fontWeight:800 }}>Salaries</div>
            </div>
            <Icon name="tag" size={20} style={{ color:"#9ca3af" }}/>
          </div>
        </div>
      </div>

      {/* Search + filter + table */}
      <div className="pk-panel">
        <div style={{ display:"flex", gap:12, marginBottom:18 }}>
          <div className="pk-input-search" style={{ flex:1 }}>
            <Icon name="search" size={15} style={{ color:"#9ca3af" }}/>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search expenses..."/>
          </div>
          <select className="pk-select" value={category} onChange={e => setCat(e.target.value)}>
            {expenseCategories.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div className="pk-table-wrap">
          <table className="pk-table">
            <thead>
              <tr>
                <th>Date</th><th>Description</th><th>Category</th><th style={{ textAlign:"right" }}>Amount</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id}>
                  <td className="secondary" style={{ whiteSpace:"nowrap" }}>{e.date}</td>
                  <td>{e.description}</td>
                  <td><span className={"pk-badge " + (catColors[e.category] || "pk-badge-gray")}>{e.category}</span></td>
                  <td style={{ textAlign:"right", fontWeight:600 }}>₵{e.amount.toLocaleString("en-GH", { minimumFractionDigits:2, maximumFractionDigits:2 })}</td>
                  <td><button className="pk-more-btn"><Icon name="more-vertical" size={16}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="pk-empty" style={{ padding:"24px 20px" }}>
              <div className="pk-empty-title">No expenses found</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Expenses });
