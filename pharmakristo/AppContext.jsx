const AppContext = React.createContext(null);

function AppContextProvider({ children }) {
  const [user, setUser] = React.useState(null);
  const [userRole, setUserRole] = React.useState(null);
  const [dateRange, setDateRange] = React.useState("7days");

  const value = {
    user,
    setUser,
    userRole,
    setUserRole,
    dateRange,
    setDateRange,
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

window.AppContextProvider = AppContextProvider;
window.useAppContext = useAppContext;
