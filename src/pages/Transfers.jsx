import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function Transfers() {
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    product_id: "",
    qty: 1,
    from_location_id: "",
    to_location_id: "",
    note: "",
  });

  async function load() {
    setLoading(true);

    const { data: p } = await supabase.from("products").select("id,name").order("name");
    const { data: l } = await supabase.from("locations").select("id,name").order("name");
    setProducts(p || []);
    setLocations(l || []);

    // default: Warehouse -> Store
    const wh = (l || []).find((x) => x.name === "Warehouse");
    const st = (l || []).find((x) => x.name === "Store");

    setForm((prev) => ({
      ...prev,
      from_location_id: prev.from_location_id || (wh?.id ?? ""),
      to_location_id: prev.to_location_id || (st?.id ?? ""),
    }));

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e) {
    e.preventDefault();

    if (!form.product_id) return alert("Choose a product");
    if (!form.from_location_id || !form.to_location_id) return alert("Choose locations");
    if (form.from_location_id === form.to_location_id) return alert("From and To cannot be same");
    if (Number(form.qty) <= 0) return alert("Qty must be > 0");

    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    const payload = {
      product_id: form.product_id,
      qty: Number(form.qty),
      from_location_id: form.from_location_id,
      to_location_id: form.to_location_id,
      note: form.note.trim() || null,
      created_by: userId || null,
    };

    const { error } = await supabase.from("transfers").insert(payload);
    if (error) return alert(error.message);

    alert("Transfer done ✅");
    setForm({ ...form, qty: 1, note: "" });
  }

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Transfers</h3>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <form onSubmit={submit} style={{ display: "grid", gap: 10, maxWidth: 520 }}>
          <label style={labelStyle}>
            Product
            <select
              style={inputStyle}
              value={form.product_id}
              onChange={(e) => setForm({ ...form, product_id: e.target.value })}
            >
              <option value="">-- Select --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label style={labelStyle}>
              From
              <select
                style={inputStyle}
                value={form.from_location_id}
                onChange={(e) => setForm({ ...form, from_location_id: e.target.value })}
              >
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </label>

            <label style={labelStyle}>
              To
              <select
                style={inputStyle}
                value={form.to_location_id}
                onChange={(e) => setForm({ ...form, to_location_id: e.target.value })}
              >
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </label>
          </div>

          <label style={labelStyle}>
            Quantity
            <input
              style={inputStyle}
              type="number"
              min={1}
              value={form.qty}
              onChange={(e) => setForm({ ...form, qty: e.target.value })}
            />
          </label>

          <label style={labelStyle}>
            Note (optional)
            <input
              style={inputStyle}
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </label>

          <button style={btnStyle}>Transfer</button>
        </form>
      )}
    </div>
  );
}

const labelStyle = { display: "grid", gap: 6, fontWeight: 700 };
const inputStyle = { padding: "12px 14px", borderRadius: 12, border: "1px solid #ddd" };
const btnStyle = { padding: "12px 14px", borderRadius: 12, border: "1px solid #ddd", background: "white", cursor: "pointer", fontWeight: 700 };
