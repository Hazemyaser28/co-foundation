import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabase";

export default function Sales() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");

  const [cart, setCart] = useState([]); // {product_id, name, sell_price, qty}
  const [payment, setPayment] = useState("cash");
  const [loading, setLoading] = useState(true);

  async function loadProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("id,name,sell_price,barcode")
      .eq("is_active", true)
      .order("name");

    if (error) alert(error.message);
    setProducts(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products.slice(0, 30);
    return products
      .filter((p) => (p.name || "").toLowerCase().includes(q) || (p.barcode || "").includes(q))
      .slice(0, 30);
  }, [products, search]);

  function addToCart(p) {
    setCart((prev) => {
      const ex = prev.find((x) => x.product_id === p.id);
      if (ex) {
        return prev.map((x) =>
          x.product_id === p.id ? { ...x, qty: x.qty + 1 } : x
        );
      }
      return [...prev, { product_id: p.id, name: p.name, sell_price: Number(p.sell_price), qty: 1 }];
    });
  }

  function updateQty(product_id, qty) {
    const n = Number(qty);
    if (n <= 0) {
      setCart((prev) => prev.filter((x) => x.product_id !== product_id));
    } else {
      setCart((prev) => prev.map((x) => (x.product_id === product_id ? { ...x, qty: n } : x)));
    }
  }

  const total = cart.reduce((sum, x) => sum + x.qty * x.sell_price, 0);

  async function checkout() {
    if (cart.length === 0) return alert("Cart is empty");

    // 1) create sale
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    const { data: sale, error: saleErr } = await supabase
      .from("sales")
      .insert({
        payment_method: payment,
        created_by: userId || null,
      })
      .select("*")
      .single();

    if (saleErr) return alert(saleErr.message);

    // 2) insert sale items
    const itemsPayload = cart.map((x) => ({
      sale_id: sale.id,
      product_id: x.product_id,
      qty: x.qty,
      sell_price: x.sell_price,
    }));

    const { error: itemsErr } = await supabase.from("sale_items").insert(itemsPayload);
    if (itemsErr) return alert(itemsErr.message);

    alert("Sale completed ✅");
    setCart([]);
    setSearch("");
  }

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Sales</h3>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 12 }}>
        <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
            <input
              style={inputStyle}
              placeholder="Search product or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button onClick={loadProducts} style={btnStyle}>Refresh</button>
          </div>

          {loading ? (
            <div>Loading...</div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {filtered.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: 10,
                    border: "1px solid #f0f0f0",
                    borderRadius: 12,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800 }}>{p.name}</div>
                    <div style={{ color: "#666", fontSize: 13 }}>
                      {p.barcode ? `Barcode: ${p.barcode}` : ""} | Price: {Number(p.sell_price).toFixed(2)}
                    </div>
                  </div>
                  <button onClick={() => addToCart(p)} style={btnStyle}>Add</button>
                </div>
              ))}
              {filtered.length === 0 && <div style={{ color: "#666" }}>No results</div>}
            </div>
          )}
        </div>

        <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Cart</div>

          {cart.length === 0 ? (
            <div style={{ color: "#666" }}>No items</div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {cart.map((x) => (
                <div key={x.product_id} style={{ border: "1px solid #f2f2f2", borderRadius: 12, padding: 10 }}>
                  <div style={{ fontWeight: 800 }}>{x.name}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                    <div style={{ color: "#666" }}>Price: {x.sell_price.toFixed(2)}</div>
                    <input
                      style={{ ...inputStyle, width: 90 }}
                      type="number"
                      min={0}
                      value={x.qty}
                      onChange={(e) => updateQty(x.product_id, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 12, borderTop: "1px solid #f2f2f2", paddingTop: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 800 }}>Total</div>
              <div style={{ fontWeight: 900 }}>{total.toFixed(2)}</div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <select style={inputStyle} value={payment} onChange={(e) => setPayment(e.target.value)}>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="wallet">Wallet</option>
              </select>

              <button
                onClick={checkout}
                style={{ ...btnStyle, fontWeight: 900, width: "100%" }}
              >
                Checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle = { padding: "12px 14px", borderRadius: 12, border: "1px solid #ddd", width: "100%" };
const btnStyle = { padding: "10px 14px", borderRadius: 10, border: "1px solid #ddd", background: "white", cursor: "pointer" };
