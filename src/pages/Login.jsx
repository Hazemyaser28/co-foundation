import React, { useState } from "react";
import { supabase } from "../supabase";

export default function Login() {
  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMsg("Account created ✅ You can login now.");
        setMode("login");
      }
    } catch (err) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ fontFamily: "Arial", padding: 30, maxWidth: 420, margin: "80px auto" }}>
      <h2 style={{ marginBottom: 6 }}>Inventory Login</h2>
      <p style={{ marginTop: 0, color: "#666" }}>
        {mode === "login" ? "Login to your dashboard" : "Create a new account"}
      </p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10 }}>
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />

        <button disabled={loading} style={btnStyle}>
          {loading ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
        </button>

        {msg && <div style={{ padding: 10, background: "#f7f7f7", borderRadius: 10 }}>{msg}</div>}
      </form>

      <div style={{ marginTop: 12 }}>
        {mode === "login" ? (
          <button onClick={() => setMode("signup")} style={linkBtnStyle}>
            Create account
          </button>
        ) : (
          <button onClick={() => setMode("login")} style={linkBtnStyle}>
            Back to login
          </button>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #ddd",
  outline: "none",
};

const btnStyle = {
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #ddd",
  background: "white",
  cursor: "pointer",
  fontWeight: 700,
};

const linkBtnStyle = {
  border: "none",
  background: "transparent",
  color: "#333",
  cursor: "pointer",
  textDecoration: "underline",
};
