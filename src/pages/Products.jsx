import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    barcode: "",
    category: "",
    cost_price: "",
    sell_price: "",
  });

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setProducts(data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addProduct(e) {
    e.preventDefault();

    const payload = {
      name: form.name.trim(),
      barcode: form.barcode.trim() || null,
      category: form.category.trim() || null,
      cost_price: Number(form.cost_price || 0),
      sell_price: Number(form.sell_price || 0),
    };

    const { error } = await supabase.from("products").insert(payload);
    if (error) return alert(error.message);

    setForm({ name: "", barcode: "", category: "", cost_price: "", sell_price: "" });
    load();
  }

  async function deleteProduct(id) {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return alert(error.message);
    load();
  }

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Products</h3>

      <form onSubmit={addProduct} style={{ display: "grid", gap: 10, marginBottom: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
          <input style={inputStyle} placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input style={inputStyle} placeholder="Barcode (optional)" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
          <input style={inputStyle} placeholder="Category (optional)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <input style={inputStyle} placeholder="Cost price" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} />
          <input style={inputStyle} placeholder="Sell price" value={form.sell_price} onChange={(e) => setForm({ ...form, sell_price: e.target.value })} />
        </div>

        <button style={btnStyle}>Add Product</button>
      </form>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Barcode</Th>
                <Th>Category</Th>
                <Th>Cost</Th>
                <Th>Price</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <Td>{p.name}</Td>
                  <Td>{p.barcode || "-"}</Td>
                  <Td>{p.category || "-"}</Td>
                  <Td>{Number(p.cost_price).toFixed(2)}</Td>
                  <Td>{Number(p.sell_price).toFixed(2)}</Td>
                  <Td>
                    <button onClick={() => deleteProduct(p.id)} style={dangerBtn}>Delete</button>
                  </Td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <Td colSpan={6} style={{ color: "#666" }}>No products yet.</Td>
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

const inputStyle = { padding: "12px 14px", borderRadius: 12, border: "1px solid #ddd" };
const btnStyle = { padding: "12px 14px", borderRadius: 12, border: "1px solid #ddd", background: "white", cursor: "pointer", fontWeight: 700 };
const dangerBtn = { padding: "8px 12px", borderRadius: 10, border: "1px solid #ddd", background: "white", cursor: "pointer" };
