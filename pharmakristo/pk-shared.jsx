// pk-shared.jsx — PharmaKristo shared components
// Sidebar, Header, Icon, and utility components

// ─── Icon component (Lucide subset, inline SVG paths) ─────────────────
function Icon({ name, size = 18, className = "", style = {} }) {
  const paths = {
    "layout-dashboard": <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></>,
    "package":     <><path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.27 6.96 12 12.01l8.73-5.05"/><path d="M12 22.08V12"/></>,
    "shopping-cart":<><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></>,
    "truck":        <><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/><rect x="9" y="11" width="14" height="10" rx="1"/><circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/></>,
    "dollar-sign":  <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>,
    "receipt":      <><path d="M4 2v20l2-2 2 2 2-2 2 2 2-2 2 2 2-2 2 2V2l-2 2-2-2-2 2-2-2-2 2-2-2-2 2-2-2Z"/><path d="M8 7h8M8 11h8M8 15h5"/></>,
    "bar-chart":    <><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></>,
    "users":        <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    "settings":     <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
    "log-out":      <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    "bell":         <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>,
    "search":       <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></>,
    "map-pin":      <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>,
    "chevron-down": <path d="m6 9 6 6 6-6"/>,
    "plus":         <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    "filter":       <><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>,
    "alert-triangle":<><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></>,
    "clock":        <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    "calendar":     <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    "trending-up":  <><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></>,
    "trending-down":<><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></>,
    "download":     <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
    "more-vertical":<><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></>,
    "arrow-up-right":<><path d="M7 7h10v10"/><path d="M7 17 17 7"/></>,
    "tag":          <><path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l7.3-7.3a1 1 0 0 0 0-1.41L12 2Z"/><path d="M7 7h.01"/></>,
    "credit-card":  <><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></>,
    "smartphone":   <><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></>,
    "layout":       <><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></>,
    "x":            <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    "check":        <><polyline points="20 6 9 17 4 12"/></>,
    "activity":     <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>,
    "dollar":       <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>,
    "columns":      <><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round"
         strokeLinejoin="round" className={className} style={style}>
      {paths[name]}
    </svg>
  );
}

// ─── Logo SVG (pharmacy cross) ─────────────────────────────────────────
function PharmaLogo({ size = 40 }) {
  return (
    <div className="pk-sidebar-logo" style={{ width: size, height: size }}>
      <svg width={Math.round(size * 0.5)} height={Math.round(size * 0.5)} viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <rect x="17" y="8" width="6" height="24" rx="2" fill="white"/>
        <rect x="8" y="17" width="24" height="6" rx="2" fill="white"/>
      </svg>
    </div>
  );
}

// ─── Sidebar ───────────────────────────────────────────────────────────
function Sidebar({ page, onNav, onLogout }) {
  const { user, userRole } = useAppContext();
  const nav = [
    { id:"dashboard",    label:"Dashboard",   icon:"layout-dashboard" },
    { id:"products",     label:"Products",    icon:"package" },
    { id:"sales",        label:"Sales",       icon:"shopping-cart" },
    { id:"procurement",  label:"Procurement", icon:"truck" },
    { id:"expenses",     label:"Expenses",    icon:"dollar-sign" },
    { id:"receipts",     label:"Receipts",    icon:"receipt" },
    { id:"reports",      label:"Reports",     icon:"bar-chart" },
  ];
  const mgmt = userRole === "admin"
    ? [
        { id:"staff",        label:"Staff",       icon:"users" },
        { id:"settings",     label:"Settings",    icon:"settings" },
      ]
    : [];
  return (
    <aside className="pk-sidebar">
      <div className="pk-sidebar-brand">
        <PharmaLogo size={40}/>
        <div>
          <div className="pk-brand-name">PharmaKristo</div>
          <div className="pk-brand-sub">Management System</div>
        </div>
      </div>
      <nav className="pk-sidebar-nav">
        <div className="pk-nav-section-label">Platform</div>
        {nav.map(n => (
          <button key={n.id} className={"pk-nav-item" + (page === n.id ? " active" : "")} onClick={() => onNav(n.id)}>
            <Icon name={n.icon} size={18} className="pk-nav-icon"/>
            {n.label}
          </button>
        ))}
        <div className="pk-nav-section-label" style={{ marginTop: 10 }}>Management</div>
        {mgmt.map(n => (
          <button key={n.id} className={"pk-nav-item" + (page === n.id ? " active" : "")} onClick={() => onNav(n.id)}>
            <Icon name={n.icon} size={18} className="pk-nav-icon"/>
            {n.label}
          </button>
        ))}
      </nav>
      <div className="pk-sidebar-user">
        <div className="pk-user-avatar">{(user || "?")[0].toUpperCase()}</div>
        <div>
          <div className="pk-user-name">{user || "User"}</div>
          <div className="pk-user-role">{userRole || "staff"}</div>
        </div>
        <button className="pk-logout" title="Log out" onClick={onLogout}><Icon name="log-out" size={16}/></button>
      </div>
    </aside>
  );
}

// ─── Header ────────────────────────────────────────────────────────────
function Header({ searchQuery, onSearch }) {
  const D = window.PKData;
  return (
    <header className="pk-header">
      <button className="pk-header-collapse"><Icon name="layout" size={20}/></button>
      <div className="pk-pharmacy-chip">
        <span className="pk-pharmacy-dot"/>
        {D.pharmacy.name}
      </div>
      <div className="pk-branch-selector">
        <Icon name="map-pin" size={14}/>
        {D.pharmacy.branch}
        <Icon name="chevron-down" size={14}/>
      </div>
      <div className="pk-search">
        <Icon name="search" size={15} style={{ color:"#9ca3af", flexShrink:0 }}/>
        <input value={searchQuery} onChange={e => onSearch?.(e.target.value)} placeholder="Search anything..."/>
        <span className="pk-kbd">⌘ K</span>
      </div>
      <div className="pk-header-right">
        <button className="pk-bell">
          <Icon name="bell" size={20}/>
          <span className="pk-bell-badge">87</span>
        </button>
        <div className="pk-avatar">A</div>
      </div>
    </header>
  );
}

// ─── StatCard ──────────────────────────────────────────────────────────
function StatCard({ color, label, value, meta, icon, redValue }) {
  return (
    <div className={"pk-stat-card " + color}>
      <div className="pk-stat-label">{label}</div>
      <div className={"pk-stat-value" + (redValue ? " red-num" : "")}>{value}</div>
      {meta && <div className="pk-stat-meta">{meta}</div>}
      {icon && (
        <div className="pk-stat-icon">
          <Icon name={icon} size={20}/>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { Icon, PharmaLogo, Sidebar, Header, StatCard });
