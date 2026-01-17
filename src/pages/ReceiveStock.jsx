import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function ReceiveStock() {
  const [products, setProducts] = useState([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    product_id: "",
    qty: 1,
    reason: "Supplier delivery",
  });

  async function load() {
    setLoading(true);

    const { data: p, error: pe } = await supabase
      .from("products")
      .select("id,name,barcode")
      .eq("is_active", true)
      .order("name");

    if (pe) alert(pe.message);

    const { data: locs, error: le } = await supabase
      .from("locations")
      .select("id,name");

    if (le) alert(le.message);

    const wh = (locs || []).find((x) => x.name === "Warehouse");
    setWarehouseId(wh?.id || "");

    setProducts(p || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e) {
    e.preventDefault();

    if (!form.product_id) return alert("Choose a product");
    if (!warehouseId) return alert("Warehouse location not found");
    if (Number(form.qty) <= 0) return alert("Qty must be > 0");

    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    const payload = {
      product_id: form.product_id,
      location_id: warehouseId,
      adjustment_qty: Number(form.qty), // positive adds stock
      reason: form.reason || null,
      created_by: userId || null,
    };

    const { error } = await supabase.from("stock_adjustments").insert(payload);
    if (error) return alert(error.message);

    alert("Stock added to Warehouse ✅");
    setForm((prev) => ({ ...prev, qty: 1 }));
  }

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Receive Stock (Warehouse In)</h3>

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
                <option key={p.id} value={p.id}>
                  {p.name} {p.barcode ? `(${p.barcode})` : ""}
                </option>
              ))}
            </select>
          </label>

          <label style={labelStyle}>
            Quantity received
            <input
              style={inputStyle}
              type="number"
              min={1}
              value={form.qty}
              onChange={(e) => setForm({ ...form, qty: e.target.value })}
            />
          </label>

          <label style={labelStyle}>
            Reason (optional)
            <input
              style={inputStyle}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Supplier delivery"
            />
          </label>

          <button style={btnStyle}>Add to Warehouse</button>
        </form>
      )}
    </div>
  );
}

const labelStyle = { display: "grid", gap: 6, fontWeight: 700 };
const inputStyle = { padding: "12px 14px", borderRadius: 12, border: "1px solid #ddd" };
const btnStyle = { padding: "12px 14px", borderRadius: 12, border: "1px solid #ddd", background: "white", cursor: "pointer", fontWeight: 700 };
