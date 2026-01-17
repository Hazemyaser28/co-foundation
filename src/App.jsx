import React, { useEffect, useState } from "react";
import { supabase } from "./supabase";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Inventory from "./pages/Inventory";
import Transfers from "./pages/Transfers";
import Sales from "./pages/Sales";

const tabs = [
  { key: "dashboard", label: "Dashboard" },
  { key: "products", label: "Products" },
  { key: "inventory", label: "Inventory" },
  { key: "transfers", label: "Transfers" },
  { key: "sales", label: "Sales" },
];

export default function App() {
  const [session, setSession] = useState(null);
  const [tab, setTab] = useState("dashboard");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (!session) return <Login />;

  return (
    <div style={{ fontFamily: "Arial", padding: 20, maxWidth: 1100, margin: "0 auto" }}>
      <Header email={session.user.email} />

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #ddd",
              background: tab === t.key ? "#f2f2f2" : "white",
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 14 }}>
        {tab === "dashboard" && <Dashboard />}
        {tab === "products" && <Products />}
        {tab === "inventory" && <Inventory />}
        {tab === "transfers" && <Transfers />}
        {tab === "sales" && <Sales />}
      </div>
    </div>
  );
}

function Header({ email }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700 }}>Inventory System</div>
        <div style={{ color: "#666" }}>Store + Warehouse</div>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <span style={{ color: "#444" }}>{email}</span>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
          }}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #ddd",
            background: "white",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
