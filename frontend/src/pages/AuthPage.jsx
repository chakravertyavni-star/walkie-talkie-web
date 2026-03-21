import { useState } from "react";
import { useAppContext } from "../context/AppContext.jsx";

export const AuthPage = () => {
  const { login, signup } = useAppContext();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const isLogin = mode === "login";

  const submit = () => {
    const result = isLogin
      ? login({ email, password })
      : signup({ name, email, password });

    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setMessage("");
  };

  return (
    <section className="auth-page">
      <div className="auth-grid-bg" aria-hidden="true">
        {Array.from({ length: 140 }).map((_, idx) => (
          <div key={idx} className="auth-tile" />
        ))}
      </div>

      <div className="auth-card card">
        <h1 className="card-title">{isLogin ? "Welcome Back" : "Create Account"}</h1>
        <p className="page-subtitle">Sign in to start using Convoy Walkie.</p>

        <div className="auth-toggle">
          <button
            className={mode === "login" ? "auth-tab auth-tab-active" : "auth-tab"}
            onClick={() => {
              setMode("login");
              setMessage("");
            }}
          >
            Login
          </button>
          <button
            className={mode === "signup" ? "auth-tab auth-tab-active" : "auth-tab"}
            onClick={() => {
              setMode("signup");
              setMessage("");
            }}
          >
            Sign Up
          </button>
        </div>

        {!isLogin && (
          <label className="field">
            <span className="field-label">Name</span>
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
        )}
        <label className="field">
          <span className="field-label">Email</span>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="field">
          <span className="field-label">Password</span>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {message ? <p className="page-subtitle status-text">{message}</p> : null}
        <button className="primary-btn full-width" onClick={submit}>
          {isLogin ? "Login" : "Create Account"}
        </button>
      </div>
    </section>
  );
};
