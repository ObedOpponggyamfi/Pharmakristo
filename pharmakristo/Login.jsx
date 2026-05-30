function Login() {
  const { setUser, setUserRole } = useAppContext();
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }
      setUser(data.username);
      setUserRole(data.role);
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pk-auth-page">
      <div className="pk-auth-card">
        <div className="pk-auth-logo" aria-hidden="true">
          <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
            <rect x="17" y="8" width="6" height="24" rx="2" fill="white" />
            <rect x="8" y="17" width="24" height="6" rx="2" fill="white" />
          </svg>
        </div>
        <h1 className="pk-auth-title">PharmaKristo</h1>
        <p className="pk-auth-sub">Your pharmacy management hub</p>

        <form onSubmit={handleLogin}>
          <div className="pk-auth-field">
            <label className="pk-auth-label" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              className="pk-auth-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              autoComplete="username"
              required
            />
          </div>
          <div className="pk-auth-field">
            <label className="pk-auth-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="pk-auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              autoComplete="current-password"
              required
            />
          </div>
          {error ? <div className="pk-auth-error">{error}</div> : null}
          <button type="submit" className="pk-auth-btn" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="pk-auth-hint">Demo: admin / 12345 · cashier1 / 12345</p>
      </div>
    </div>
  );
}

window.Login = Login;
