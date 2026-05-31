// pk-settings.jsx — App preferences

function Settings() {
  const { theme, setTheme, pharmacyName, setPharmacyName, user, userRole, showToast } = useAppContext();
  const [name, setName] = React.useState(pharmacyName);

  const save = () => {
    setPharmacyName(name.trim() || "Kristo Health Pharmacy");
    showToast("Settings saved");
  };

  return (
    <div className="pk-content">
      <div className="pk-page-header">
        <div>
          <div className="pk-page-title">Settings</div>
          <div className="pk-page-sub">Customize your PharmaKristo experience</div>
        </div>
      </div>

      <div className="pk-settings-grid">
        <div className="pk-panel">
          <div className="pk-panel-title" style={{ marginBottom: 16 }}>Pharmacy Profile</div>
          <div className="pk-auth-field">
            <label className="pk-auth-label">Display name</label>
            <input className="pk-auth-input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <button type="button" className="pk-btn pk-btn-primary" onClick={save}>Save Changes</button>
        </div>

        <div className="pk-panel">
          <div className="pk-panel-title" style={{ marginBottom: 16 }}>Appearance</div>
          <div className="pk-theme-picker">
            {["light", "dark"].map((t) => (
              <button
                key={t}
                type="button"
                className={"pk-theme-opt" + (theme === t ? " active" : "")}
                onClick={() => setTheme(t)}
              >
                <Icon name={t === "dark" ? "moon" : "sun"} size={20}/>
                {t === "dark" ? "Dark mode" : "Light mode"}
              </button>
            ))}
          </div>
        </div>

        <div className="pk-panel">
          <div className="pk-panel-title" style={{ marginBottom: 16 }}>Account</div>
          <div className="pk-settings-row"><span>Signed in as</span><strong>{user}</strong></div>
          <div className="pk-settings-row"><span>Role</span><span className="pk-badge pk-badge-green">{userRole}</span></div>
          <div className="pk-settings-row"><span>Session timeout</span><span>15 minutes</span></div>
        </div>

        <div className="pk-panel pk-premium-badge-panel">
          <div className="pk-premium-badge">Premium</div>
          <div className="pk-panel-title">PharmaKristo Pro</div>
          <p className="pk-panel-sub" style={{ marginTop: 8 }}>
            Live analytics, Krista AI assistant, dark mode, receipt printing, and real-time inventory sync.
          </p>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Settings });
