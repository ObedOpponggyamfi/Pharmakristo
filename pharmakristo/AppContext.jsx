const SESSION_TIMEOUT_MS = 15 * 60 * 1000;

const AppContext = React.createContext(null);

function useAppContext() {
  const context = React.useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppContextProvider");
  return context;
}

function mapDateRangeToApi(dateRange) {
  if (dateRange === "7days") return "7d";
  if (dateRange === "30days") return "30d";
  return "all";
}

function ToastHost() {
  const { toasts } = useAppContext();
  if (!toasts.length) return null;
  return (
    <div className="pk-toast-stack" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={"pk-toast pk-toast-" + t.type}>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

function AppContextProvider({ children }) {
  const [user, setUser] = React.useState(null);
  const [userRole, setUserRole] = React.useState(null);
  const [dateRange, setDateRange] = React.useState("7days");
  const [theme, setThemeState] = React.useState(
    () => localStorage.getItem("pk-theme") || "light"
  );
  const [pharmacyName, setPharmacyNameState] = React.useState(
    () => localStorage.getItem("pk-pharmacy") || "Kristo Health Pharmacy"
  );
  const [toasts, setToasts] = React.useState([]);
  const [booting, setBooting] = React.useState(true);

  const showToast = React.useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const setTheme = React.useCallback((next) => {
    setThemeState(next);
    localStorage.setItem("pk-theme", next);
    document.documentElement.setAttribute("data-theme", next);
  }, []);

  const setPharmacyName = React.useCallback((name) => {
    setPharmacyNameState(name);
    localStorage.setItem("pk-pharmacy", name);
  }, []);

  const logout = React.useCallback(
    async (message) => {
      try {
        await fetch("/api/auth/logout", { method: "POST" });
      } catch (_) {
        /* ignore */
      }
      setUser(null);
      setUserRole(null);
      if (message) showToast(message, "info");
    },
    [showToast]
  );

  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (cancelled) return;
        setUser(data.username);
        setUserRole(data.role);
        if (data.pharmacy) setPharmacyNameState(data.pharmacy);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setBooting(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!user) return undefined;

    let timeoutId = null;
    const resetTimer = () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        logout("Session expired due to inactivity. Please log in again.");
      }, SESSION_TIMEOUT_MS);
    };

    const events = ["mousemove", "keydown", "click", "scroll"];
    events.forEach((e) => window.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [user, logout]);

  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        document.querySelector(".pk-search input")?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const value = {
    user,
    setUser,
    userRole,
    setUserRole,
    dateRange,
    setDateRange,
    theme,
    setTheme,
    pharmacyName,
    setPharmacyName,
    toasts,
    showToast,
    logout,
    booting,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
      <ToastHost />
    </AppContext.Provider>
  );
}

window.AppContextProvider = AppContextProvider;
window.useAppContext = useAppContext;
window.mapDateRangeToApi = mapDateRangeToApi;
