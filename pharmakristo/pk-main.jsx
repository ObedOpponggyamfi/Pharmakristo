// pk-main.jsx — PharmaKristo app router + mount

const { useState } = React;

function PlaceholderPage({ title, sub }) {
  return (
    <div className="pk-content">
      <div className="pk-page-header">
        <div>
          <div className="pk-page-title">{title}</div>
          <div className="pk-page-sub">{sub}</div>
        </div>
      </div>
      <div className="pk-coming-soon">
        <Icon name="settings" size={48} style={{ color:"#d1d5db" }}/>
        <div style={{ fontSize:18, fontWeight:600, color:"#6b7280" }}>{title}</div>
        <div style={{ color:"#9ca3af" }}>This section is available in the full Python build.</div>
        <div style={{ color:"#9ca3af", fontSize:12 }}>Run the Flask app to access this feature.</div>
      </div>
    </div>
  );
}

function App() {
  const { user, logout } = useAppContext();
  const [page, setPage]     = useState("dashboard");
  const [search, setSearch] = useState("");

  if (!user) {
    return <Login />;
  }

  const renderPage = () => {
    switch (page) {
      case "dashboard":   return <Dashboard onNav={setPage}/>;
      case "products":    return <Products/>;
      case "sales":       return <Sales/>;
      case "expenses":    return <Expenses/>;
      case "reports":     return <Reports/>;
      case "procurement": return <PlaceholderPage title="Procurement" sub="Manage purchase orders and suppliers"/>;
      case "receipts":    return <PlaceholderPage title="Receipts"    sub="View and print transaction receipts"/>;
      case "staff":       return <PlaceholderPage title="Staff"       sub="Manage pharmacy staff and roles"/>;
      case "settings":    return <PlaceholderPage title="Settings"    sub="Configure your pharmacy settings"/>;
      default:            return <Dashboard onNav={setPage}/>;
    }
  };

  // For the Sales page, use the full-height POS layout (no content padding)
  const isSales = page === "sales";

  return (
    <div className="pk-app">
      <Sidebar page={page} onNav={setPage} onLogout={() => logout()}/>
      <div className="pk-main">
        <Header searchQuery={search} onSearch={setSearch}/>
        {renderPage()}
      </div>
      {/* FAB for quick sale */}
      {page !== "sales" && (
        <button className="pk-fab" onClick={() => setPage("sales")} title="New Sale">
          <Icon name="shopping-cart" size={22}/>
        </button>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <AppContextProvider>
    <App />
  </AppContextProvider>
);
