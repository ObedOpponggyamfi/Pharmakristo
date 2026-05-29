const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

const AppContext = React.createContext(null);

function AppContextProvider({ children }) {
  const [user, setUser] = React.useState(null);
  const [userRole, setUserRole] = React.useState(null);
  const [dateRange, setDateRange] = React.useState("7days");

  const logout = React.useCallback(async (message) => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (_) {
      /* ignore network errors on logout */
    }
    setUser(null);
    setUserRole(null);
    if (message) {
      window.alert(message);
    }
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
    events.forEach((eventName) => window.addEventListener(eventName, resetTimer));

    resetTimer();

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      events.forEach((eventName) => window.removeEventListener(eventName, resetTimer));
    };
  }, [user, logout]);

  const value = {
    user,
    setUser,
    userRole,
    setUserRole,
    dateRange,
    setDateRange,
    logout,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function useAppContext() {
  const context = React.useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppContextProvider");
  }
  return context;
}

function mapDateRangeToApi(dateRange) {
  if (dateRange === "7days") return "7d";
  if (dateRange === "30days") return "30d";
  return "all";
}

window.AppContextProvider = AppContextProvider;
window.useAppContext = useAppContext;
window.mapDateRangeToApi = mapDateRangeToApi;
