import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function Dashboard() {
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [todaySalesCount, setTodaySalesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);

    // today range
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from("sales")
      .select("total_amount, created_at")
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString());

    if (!error && data) {
      const revenue = data.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
      setTodayRevenue(revenue);
      setTodaySalesCount(data.length);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Dashboard</h3>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        <Card title="Today Revenue" value={loading ? "..." : `${todayRevenue.toFixed(2)}`} />
        <Card title="Sales Today" value={loading ? "..." : `${todaySalesCount}`} />
      </div>

      <div style={{ marginTop: 14 }}>
        <button onClick={load} style={btnStyle}>Refresh</button>
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div style={{ padding: 14, border: "1px solid #eee", borderRadius: 12 }}>
      <div style={{ color: "#666" }}>{title}</div>
      <div style={{ fontSize: 26, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

const btnStyle = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #ddd",
  background: "white",
  cursor: "pointer",
};
