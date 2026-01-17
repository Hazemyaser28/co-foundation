import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function Inventory() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | store | warehouse

  async function load() {
    setLoading(true);

    let query = supabase.from("inventory_summary").select("*").order("name", { ascending: true });

    if (filter === "store") query = supabase.from("store_stock").select("*").order("name", { ascending: true });
    if (filter === "warehouse") query = supabase.from("warehouse_stock").select("*").order("name", { ascending: true });

    const { data, error } = await query;
    if (error) alert(error.message);
    setRows(data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [filter]);

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Inventory</h3>

      <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <button style={btn(filter === "all")} onClick={() => setFilter("all")}>All</button>
        <button style={btn(filter === "store")} onClick={() => setFilter("store")}>Store</button>
        <button style={btn(filter === "warehouse")} onClick={() => setFilter("warehouse")}>Warehouse</button>
        <button style={btn(false)} onClick={load}>Refresh</button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <Th>Product</Th>
                <Th>Barcode</Th>
                <Th>Location</Th>
                <Th>Qty</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={r.product_id + r.location + idx}>
                  <Td>{r.name}</Td>
                  <Td>{r.barcode || "-"}</Td>
                  <Td>{r.location}</Td>
                  <Td>{r.quantity}</Td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <Td colSpan={4} style={{ color: "#666" }}>No inventory rows yet.</Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children }) {
  return <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>{children}</th>;
}
function Td({ children, ...props }) {
  return <td {...props} style={{ padding: 10, borderBottom: "1px solid #f2f2f2" }}>{children}</td>;
}

const btn = (active) => ({
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #ddd",
  background: active ? "#f2f2f2" : "white",
  cursor: "pointer",
});
