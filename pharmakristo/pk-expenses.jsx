// pk-expenses.jsx — PharmaKristo Expenses page

function Expenses() {
  const { showToast } = useAppContext();
  const { expenseCategories } = window.PKData;
  const [query, setQuery] = React.useState("");
  const [category, setCat] = React.useState("All Categories");
  const [showAdd, setShowAdd] = React.useState(false);
  const [newExp, setNewExp] = React.useState({ description: "", category: "Salaries", amount: "" });
  const [list, setList] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const fmt = (n) => n.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const load = React.useCallback(() => {
    const params = new URLSearchParams();
    if (category !== "All Categories") params.set("category", category);
    if (query) params.set("q", query);
    return fetch("/api/expenses?" + params)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setList)
      .catch(() => showToast("Could not load expenses", "error"));
  }, [category, query, showToast]);

  React.useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const monthTotal = list.reduce((s, e) => s + Number(e.amount), 0);
  const topCat = React.useMemo(() => {
    const m = {};
    list.forEach((e) => { m[e.category] = (m[e.category] || 0) + Number(e.amount); });
    return Object.entries(m).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
  }, [list]);

  const catColors = {
    Salaries: "pk-badge-gray", Rent: "pk-badge-blue", Utilities: "pk-badge-blue",
    Supplies: "pk-badge-green", Maintenance: "pk-badge-orange", Other: "pk-badge-orange",
  };

  const addExpense = async () => {
    if (!newExp.description || !newExp.amount) return;
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: newExp.description, category: newExp.category, amount: parseFloat(newExp.amount) }),
      });
      if (!res.ok) throw new Error("Save failed");
      showToast("Expense added");
      setNewExp({ description: "", category: "Salaries", amount: "" });
      setShowAdd(false);
      load();
    } catch {
      showToast("Could not save expense", "error");
    }
  };

  const removeExpense = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    await fetch("/api/expenses/" + id, { method: "DELETE" });
    showToast("Expense removed", "info");
    load();
  };

  return (
    <div className="pk-content">
      <div className="pk-page-header">
        <div>
          <div className="pk-page-title">Expenses</div>
          <div className="pk-page-sub">Track and manage your pharmacy business expenses</div>
        </div>
        <button type="button" className="pk-btn pk-btn-primary" onClick={() => setShowAdd((v) => !v)}>
          <Icon name="plus" size={16} /> Add Expense
        </button>
      </div>

      {showAdd && (
        <div className="pk-panel pk-animate-in" style={{ marginBottom: 20 }}>
          <div className="pk-panel-title" style={{ marginBottom: 16 }}>New Expense</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 160px auto", gap: 12, alignItems: "end" }}>
            <input className="pk-input" value={newExp.description} onChange={(e) => setNewExp((v) => ({ ...v, description: e.target.value }))} placeholder="Description" />
            <select className="pk-select" value={newExp.category} onChange={(e) => setNewExp((v) => ({ ...v, category: e.target.value }))}>
              {expenseCategories.slice(1).map((c) => <option key={c}>{c}</option>)}
            </select>
            <input className="pk-input" type="number" value={newExp.amount} onChange={(e) => setNewExp((v) => ({ ...v, amount: e.target.value }))} placeholder="0.00" />
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" className="pk-btn pk-btn-primary" onClick={addExpense}>Save</button>
              <button type="button" className="pk-btn pk-btn-outline" onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="pk-cards-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <StatCard color="white" label="Period Total" value={`₵${fmt(monthTotal)}`} meta={`${list.length} entries`} icon="receipt" />
        <StatCard color="blue" label="Top Category" value={topCat} icon="tag" />
        <StatCard color="orange" label="Avg Entry" value={`₵${fmt(list.length ? monthTotal / list.length : 0)}`} icon="trending-up" />
      </div>

      <div className="pk-panel">
        <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
          <div className="pk-input-search" style={{ flex: 1 }}>
            <Icon name="search" size={15} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search expenses…" />
          </div>
          <select className="pk-select" value={category} onChange={(e) => setCat(e.target.value)}>
            {expenseCategories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        {loading ? <div className="pk-skeleton pk-skeleton-lg" /> : (
          <div className="pk-table-wrap">
            <table className="pk-table">
              <thead><tr><th>Date</th><th>Description</th><th>Category</th><th style={{ textAlign: "right" }}>Amount</th><th></th></tr></thead>
              <tbody>
                {list.map((e) => (
                  <tr key={e.id}>
                    <td className="secondary">{e.date}</td>
                    <td>{e.description}</td>
                    <td><span className={"pk-badge " + (catColors[e.category] || "pk-badge-gray")}>{e.category}</span></td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>₵{fmt(e.amount)}</td>
                    <td><button type="button" className="pk-more-btn" onClick={() => removeExpense(e.id)} title="Delete"><Icon name="x" size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!list.length && <div className="pk-empty"><div className="pk-empty-title">No expenses found</div></div>}
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { Expenses });
