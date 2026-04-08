import { useState, useEffect, useCallback } from "react";

const BASE_URL = "http://localhost:5000";
const req = (path, opts = {}) =>
  fetch(`${BASE_URL}${path}`, { headers: { "Content-Type": "application/json" }, ...opts }).then(r => r.json());
const api = {
  get:    path       => req(path),
  post:   (path, b)  => req(path, { method: "POST",   body: JSON.stringify(b) }),
  put:    (path, b)  => req(path, { method: "PUT",    body: JSON.stringify(b) }),
  del:    (path, b)  => req(path, { method: "DELETE", body: JSON.stringify(b) }),
};

// ── Icons ──────────────────────────────────────────────────
const icon = (d, w = 20, extra = "") => <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: d }} />;
const CartIcon    = () => icon(`<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>`);
const PlusIcon    = () => icon(`<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>`, 14);
const MinusIcon   = () => icon(`<line x1="5" y1="12" x2="19" y2="12"/>`, 14);
const TrashIcon   = () => icon(`<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>`, 15);
const SearchIcon  = () => icon(`<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>`, 16);
const CloseIcon   = () => icon(`<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>`, 18);
const CheckIcon   = () => icon(`<polyline points="20 6 9 17 4 12"/>`, 18);
const ReceiptIcon = () => icon(`<path d="M14 2H6a2 2 0 0 0-2 2v16l3-3 3 3 3-3 3 3V4a2 2 0 0 0-2-2z"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="12" y2="15"/>`, 17);
const UserIcon    = () => icon(`<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>`, 16);
const AdminIcon   = () => icon(`<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>`, 16);
const FilterIcon  = () => icon(`<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>`, 15);
const AlertIcon   = () => icon(`<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>`, 16);
const BoxIcon     = () => icon(`<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>`, 44);

const PALETTE = ["#f87171","#fb923c","#a78bfa","#34d399","#60a5fa","#f472b6","#facc15","#4ade80"];
function ProductAvatar({ name, size = 80 }) {
  const color = PALETTE[name.charCodeAt(0) % PALETTE.length];
  const initials = name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: 12, background: color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.28, fontWeight: 700, color, userSelect: "none" }}>
      {initials}
    </div>
  );
}

function Toast({ message, visible, type = "success" }) {
  return (
    <div style={{ position: "fixed", bottom: "2rem", left: "50%", transform: `translateX(-50%) translateY(${visible ? 0 : "80px"})`, background: type === "error" ? "#ef4444" : "#111", color: "#fff", padding: "11px 22px", borderRadius: 40, fontSize: 13.5, fontWeight: 500, zIndex: 9999, transition: "transform 0.35s cubic-bezier(.34,1.56,.64,1), opacity 0.3s", opacity: visible ? 1 : 0, pointerEvents: "none", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
      {type === "success" && <span style={{ color: "#4ade80" }}><CheckIcon /></span>}
      {message}
    </div>
  );
}

function FilterBar({ categories, filters, setFilters }) {
  const activeCount = Object.values(filters).filter(Boolean).length;
  const set = k => e => setFilters(f => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  return (
    <div style={{ background: "#fff", border: "1px solid #f0eff5", borderRadius: 14, padding: "14px 18px", marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#7c3aed", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
        <FilterIcon /> Filters
        {activeCount > 0 && <span style={{ background: "#7c3aed", color: "#fff", borderRadius: "50%", width: 18, height: 18, fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{activeCount}</span>}
      </div>
      <select value={filters.category} onChange={set("category")} style={{ padding: "7px 12px", border: "1px solid #ebe9f5", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit", background: filters.category ? "#f5f3ff" : "#fff", color: filters.category ? "#7c3aed" : "#555", fontWeight: filters.category ? 600 : 400 }}>
        <option value="">All categories</option>
        {categories.map(c => <option key={c.category_id} value={c.category_name}>{c.category_name}</option>)}
      </select>
      {["min_price", "max_price"].map((k, i) => (
        <input key={k} type="number" placeholder={i === 0 ? "Min ₹" : "Max ₹"} min="0" value={filters[k]} onChange={set(k)}
          style={{ width: 86, padding: "7px 10px", border: "1px solid #ebe9f5", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit" }} />
      ))}
      <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", fontSize: 13, fontWeight: 500, color: "#555", userSelect: "none" }}>
        <input type="checkbox" checked={filters.in_stock} onChange={set("in_stock")} style={{ accentColor: "#7c3aed", width: 15, height: 15, cursor: "pointer" }} />
        In stock only
      </label>
      {activeCount > 0 && (
        <button onClick={() => setFilters({ category: "", min_price: "", max_price: "", in_stock: false })} style={{ marginLeft: "auto", background: "none", border: "1px solid #f0eff5", borderRadius: 8, padding: "7px 12px", fontSize: 12, fontWeight: 600, color: "#f87171", cursor: "pointer", fontFamily: "inherit" }}>
          Clear all
        </button>
      )}
    </div>
  );
}

function ProductCard({ product, onAddToCart }) {
  const [adding, setAdding] = useState(false);
  const { stock, name, product_id, price, category_name } = product;
  const outOfStock = stock === 0;

  async function handleAdd() {
    setAdding(true);
    await onAddToCart(product);
    setTimeout(() => setAdding(false), 700);
  }

  return (
    <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #f0eff5", overflow: "hidden", display: "flex", flexDirection: "column", transition: "transform 0.22s, box-shadow 0.22s" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-5px)"; e.currentTarget.style.boxShadow = "0 16px 48px rgba(0,0,0,0.09)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
      <div style={{ height: 140, display: "flex", alignItems: "center", justifyContent: "center", background: "#faf9fe", position: "relative" }}>
        <ProductAvatar name={name} size={84} />
        {stock > 0 && stock <= 5 && <span style={{ position: "absolute", top: 10, left: 10, background: "#fff8e6", color: "#92400e", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, border: "1px solid #fde68a" }}>Only {stock} left</span>}
        {outOfStock && <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.82)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#bbb", letterSpacing: 1.5 }}>OUT OF STOCK</div>}
      </div>
      <div style={{ padding: 16, display: "flex", flexDirection: "column", flex: 1, gap: 5 }}>
        {category_name && <span style={{ fontSize: 10, background: "#ede9fe", color: "#6d28d9", padding: "2px 8px", borderRadius: 20, fontWeight: 700, letterSpacing: 0.3, alignSelf: "flex-start" }}>{category_name}</span>}
        <span style={{ fontSize: 11, color: "#c4b5fd", fontWeight: 600, letterSpacing: 0.5 }}>ID #{product_id}</span>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#111", lineHeight: 1.3 }}>{name}</h3>
        <p style={{ margin: 0, fontSize: 12, color: outOfStock ? "#f87171" : "#aaa" }}>{outOfStock ? "Out of stock" : `${stock} in stock`}</p>
        <div style={{ marginTop: "auto", paddingTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: "#111" }}>₹{Number(price).toFixed(2)}</span>
          <button onClick={handleAdd} disabled={outOfStock || adding} style={{ display: "flex", alignItems: "center", gap: 6, background: adding ? "#dcfce7" : outOfStock ? "#f5f5f5" : "#7c3aed", color: adding ? "#15803d" : outOfStock ? "#bbb" : "#fff", border: "none", borderRadius: 10, padding: "9px 15px", fontSize: 13, fontWeight: 600, cursor: outOfStock ? "not-allowed" : "pointer", transition: "all 0.2s", fontFamily: "inherit" }}>
            {adding ? <><CheckIcon /> Added</> : <><PlusIcon /> Add</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function Overlay({ onClose }) {
  return <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100, backdropFilter: "blur(3px)", animation: "fadeIn 0.2s" }} />;
}

function Sidebar({ onClose, children, width = 430 }) {
  return (
    <>
      <Overlay onClose={onClose} />
      <aside style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: `min(${width}px, 100vw)`, background: "#fff", zIndex: 101, display: "flex", flexDirection: "column", boxShadow: "-20px 0 60px rgba(0,0,0,0.1)", animation: "slideIn 0.3s cubic-bezier(.34,1.1,.64,1)" }}>
        {children}
      </aside>
    </>
  );
}

function CartSidebar({ cart, total, userId, onClose, onUpdate, onRemove, onCheckout, paying, payMethod, setPayMethod }) {
  const count = cart.reduce((s, i) => s + i.quantity, 0);
  return (
    <Sidebar onClose={onClose}>
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #f0eff5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#111" }}>Your Cart</h2>
          <p style={{ margin: 0, fontSize: 12, color: "#bbb" }}>{count} item{count !== 1 ? "s" : ""} · User #{userId}</p>
        </div>
        <button onClick={onClose} style={{ background: "#f5f4fa", border: "none", borderRadius: 8, padding: 8, cursor: "pointer", color: "#666", display: "flex" }}><CloseIcon /></button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 24px" }}>
        {cart.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 0", color: "#ccc" }}>
            <BoxIcon /><p style={{ fontWeight: 600, color: "#bbb", margin: "12px 0 4px" }}>Cart is empty</p>
            <p style={{ fontSize: 13 }}>Add products to get started</p>
          </div>
        ) : cart.map(item => (
          <div key={item.product_id} style={{ display: "grid", gridTemplateColumns: "50px 1fr", gap: 12, padding: "13px 0", borderBottom: "1px solid #f7f6fb" }}>
            <ProductAvatar name={item.name} size={50} />
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#111" }}>{item.name}</p>
              <p style={{ margin: 0, fontSize: 12, color: "#bbb" }}>₹{Number(item.price).toFixed(2)} each</p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
                <div style={{ display: "flex", alignItems: "center", border: "1px solid #ebe9f5", borderRadius: 8, overflow: "hidden" }}>
                  {[[-1, <MinusIcon />], [0, item.quantity], [1, <PlusIcon />]].map(([delta, child], i) =>
                    delta === 0
                      ? <span key={i} style={{ width: 28, textAlign: "center", fontSize: 13, fontWeight: 700 }}>{child}</span>
                      : <button key={i} onClick={() => onUpdate(item.product_id, item.quantity + delta)} style={{ width: 28, height: 28, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#666" }}>{child}</button>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>₹{Number(item.subtotal).toFixed(2)}</span>
                  <button onClick={() => onRemove(item.product_id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ddd", padding: 0, display: "flex" }}><TrashIcon /></button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {cart.length > 0 && (
        <div style={{ padding: "18px 24px", borderTop: "1px solid #f0eff5" }}>
          {[["Subtotal", `₹${Number(total).toFixed(2)}`], ["Shipping", "Free"]].map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: "#aaa", fontSize: 13 }}>{l}</span>
              <span style={{ color: l === "Shipping" ? "#16a34a" : undefined, fontWeight: 600, fontSize: 13 }}>{v}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid #f0eff5", marginBottom: 16 }}>
            <span style={{ fontWeight: 800, fontSize: 16 }}>Total</span>
            <span style={{ fontWeight: 800, fontSize: 20, color: "#7c3aed" }}>₹{Number(total).toFixed(2)}</span>
          </div>
          <p style={{ fontSize: 11, color: "#bbb", marginBottom: 7, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Payment method</p>
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {["Credit Card","UPI","Net Banking","COD"].map(m => (
              <button key={m} onClick={() => setPayMethod(m)} style={{ flex: 1, padding: "7px 0", fontSize: 10.5, fontWeight: 600, border: `1.5px solid ${payMethod === m ? "#7c3aed" : "#ebe9f5"}`, background: payMethod === m ? "#f5f3ff" : "#fff", color: payMethod === m ? "#7c3aed" : "#bbb", borderRadius: 8, cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit" }}>{m}</button>
            ))}
          </div>
          <button onClick={onCheckout} disabled={paying} style={{ width: "100%", padding: 14, background: paying ? "#ede9fe" : "#7c3aed", color: paying ? "#7c3aed" : "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: paying ? "wait" : "pointer", transition: "background 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "inherit" }}>
            {paying ? "Placing order…" : `Place Order · ₹${Number(total).toFixed(2)}`}
          </button>
        </div>
      )}
    </Sidebar>
  );
}

function OrderHistory({ orders, loading, onClose }) {
  const grouped = orders.reduce((acc, row) => {
    if (!acc[row.order_id]) acc[row.order_id] = { order_id: row.order_id, date: row.date, items: [] };
    acc[row.order_id].items.push(row);
    return acc;
  }, {});

  return (
    <Sidebar onClose={onClose} width={460}>
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #f0eff5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, background: "#f5f3ff", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#7c3aed" }}><ReceiptIcon /></div>
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Order History</h2>
            <p style={{ margin: 0, fontSize: 12, color: "#bbb" }}>{Object.keys(grouped).length} order{Object.keys(grouped).length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <button onClick={onClose} style={{ background: "#f5f4fa", border: "none", borderRadius: 8, padding: 8, cursor: "pointer", color: "#666", display: "flex" }}><CloseIcon /></button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
        {loading ? <Spinner /> : orders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 0", color: "#bbb" }}>
            <p style={{ fontWeight: 600, color: "#bbb", marginTop: 12 }}>No orders yet</p>
          </div>
        ) : Object.values(grouped).map(order => {
          const orderTotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
          return (
            <div key={order.order_id} style={{ marginBottom: 14, border: "1px solid #f0eff5", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ background: "#faf9fe", padding: "11px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 13, color: "#111" }}>Order #{order.order_id}</span>
                  <span style={{ fontSize: 11, color: "#bbb", marginLeft: 10 }}>{String(order.date).slice(0, 10)}</span>
                </div>
                <span style={{ fontWeight: 700, fontSize: 14, color: "#7c3aed" }}>₹{orderTotal.toFixed(2)}</span>
              </div>
              {order.items.map((item, i) => (
                <div key={i} style={{ padding: "10px 16px", borderTop: "1px solid #f7f6fb", display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "#333", fontWeight: 500 }}>{item.product}</span>
                  <span style={{ color: "#aaa" }}>×{item.quantity} · ₹{Number(item.price).toFixed(2)}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </Sidebar>
  );
}

function Spinner() {
  return (
    <div style={{ padding: "3rem", textAlign: "center" }}>
      <div style={{ width: 32, height: 32, border: "3px solid #ede9fe", borderTopColor: "#7c3aed", borderRadius: "50%", margin: "0 auto", animation: "spin 0.7s linear infinite" }} />
    </div>
  );
}

function BarChart({ items, valueKey, labelKey, color }) {
  const max = Math.max(...items.map(i => i[valueKey]), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: "#555", width: 120, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item[labelKey]}</span>
          <div style={{ flex: 1, height: 18, background: "#f4f3fa", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ width: `${(item[valueKey] / max) * 100}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.6s ease", minWidth: 4 }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#333", width: 70, textAlign: "right", flexShrink: 0 }}>₹{Number(item[valueKey]).toLocaleString("en-IN")}</span>
        </div>
      ))}
    </div>
  );
}

function AdminDashboard({ onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get("/admin/analytics").then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, backdropFilter: "blur(3px)" }} />
      <div style={{ position: "fixed", inset: 0, zIndex: 101, overflowY: "auto", padding: 24 }}>
        <div style={{ maxWidth: 860, margin: "0 auto", background: "#fff", borderRadius: 22, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.18)" }}>
          <div style={{ background: "linear-gradient(135deg, #1e0b4a, #4c1d95)", padding: "24px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 38, height: 38, background: "rgba(255,255,255,0.15)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}><AdminIcon /></div>
              <div>
                <h2 style={{ margin: 0, color: "#fff", fontSize: 18, fontWeight: 800 }}>Admin Dashboard</h2>
                <p style={{ margin: 0, color: "#c4b5fd", fontSize: 12 }}>Sales analytics</p>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, padding: 8, cursor: "pointer", color: "#fff", display: "flex" }}><CloseIcon /></button>
          </div>
          {loading ? <Spinner /> : !data ? (
            <div style={{ padding: "4rem", textAlign: "center", color: "#bbb" }}><p style={{ fontWeight: 600 }}>Could not load analytics. Is the server running?</p></div>
          ) : (
            <div style={{ padding: "24px 28px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 28 }}>
                {[
                  { label: "Total Orders",    value: data.summary.total_orders,                                          color: "#7c3aed", bg: "#f5f3ff" },
                  { label: "Total Revenue",   value: `₹${Number(data.summary.total_revenue).toLocaleString("en-IN")}`,   color: "#059669", bg: "#f0fdf4" },
                  { label: "Total Customers", value: data.summary.total_customers,                                        color: "#0284c7", bg: "#f0f9ff" },
                ].map(s => (
                  <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: "18px 20px" }}>
                    <p style={{ margin: "0 0 6px", fontSize: 11, color: "#888", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</p>
                    <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 28 }}>
                <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: "#111" }}>Top products by revenue</h3>
                {data.top_products.length === 0 ? <p style={{ color: "#bbb", fontSize: 13 }}>No order data yet.</p> : (
                  <>
                    <BarChart items={data.top_products} valueKey="revenue" labelKey="product" color="#7c3aed" />
                    <div style={{ marginTop: 14, border: "1px solid #f0eff5", borderRadius: 12, overflow: "hidden" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                          <tr style={{ background: "#faf9fe" }}>
                            {["Product","Category","Units sold","Revenue"].map((h, i) => (
                              <th key={h} style={{ padding: "10px 14px", textAlign: i >= 2 ? "right" : "left", fontWeight: 700, color: "#555", borderBottom: "1px solid #f0eff5" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {data.top_products.map((p, i) => (
                            <tr key={i} style={{ borderBottom: "1px solid #f7f6fb" }}>
                              <td style={{ padding: "10px 14px", fontWeight: 600, color: "#111" }}>{p.product}</td>
                              <td style={{ padding: "10px 14px" }}><span style={{ background: "#ede9fe", color: "#6d28d9", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{p.category}</span></td>
                              <td style={{ padding: "10px 14px", textAlign: "right", color: "#555" }}>{p.total_sold}</td>
                              <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: "#7c3aed" }}>₹{Number(p.revenue).toLocaleString("en-IN")}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>

              {data.category_revenue.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: "#111" }}>Revenue by category</h3>
                  <BarChart items={data.category_revenue} valueKey="revenue" labelKey="category" color="#0ea5e9" />
                </div>
              )}

              <div>
                <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: "#111", display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ color: "#ef4444" }}><AlertIcon /></span> Low stock alerts
                  {data.low_stock.length > 0 && <span style={{ background: "#fef2f2", color: "#ef4444", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, border: "1px solid #fecaca" }}>{data.low_stock.length} product{data.low_stock.length > 1 ? "s" : ""}</span>}
                </h3>
                {data.low_stock.length === 0 ? (
                  <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "14px 16px", fontSize: 13, color: "#15803d", fontWeight: 500 }}>All products are sufficiently stocked.</div>
                ) : data.low_stock.map(p => (
                  <div key={p.product_id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: p.stock === 0 ? "#fef2f2" : "#fff8f0", border: `1px solid ${p.stock === 0 ? "#fecaca" : "#fed7aa"}`, borderRadius: 10, padding: "12px 16px", marginBottom: 8 }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#111" }}>{p.name}</p>
                      <p style={{ margin: 0, fontSize: 11, color: "#888" }}>ID #{p.product_id} · {p.category}</p>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: p.stock === 0 ? "#ef4444" : "#ea580c" }}>{p.stock === 0 ? "OUT OF STOCK" : `${p.stock} left`}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function SuccessModal({ onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 22, padding: "42px 36px", maxWidth: 400, width: "100%", textAlign: "center", animation: "popIn 0.35s cubic-bezier(.34,1.56,.64,1)" }}>
        <div style={{ width: 68, height: 68, background: "#ede9fe", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", color: "#7c3aed" }}><CheckIcon /></div>
        <h2 style={{ margin: "0 0 8px", fontWeight: 800, fontSize: 22 }}>Order Placed!</h2>
        <p style={{ color: "#aaa", margin: "0 0 20px", fontSize: 14, lineHeight: 1.6 }}>Your order has been placed and payment has been recorded successfully.</p>
        <button onClick={onClose} style={{ width: "100%", padding: 14, background: "#7c3aed", color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Continue Shopping</button>
      </div>
    </div>
  );
}

const iStyle = { width: "100%", padding: "11px 14px", border: "1px solid #ebe9f5", borderRadius: 10, fontSize: 14, marginBottom: 12, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };

function AuthModal({ onLogin, onClose }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "customer" });
  const [msg,  setMsg]  = useState("");
  const [busy, setBusy] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

async function handleSubmit() {
  setBusy(true);
  setMsg("");

  if (mode === "register") {
    const res = await api.post("/register", {
      name: form.name, email: form.email,
      password: form.password, role: form.role
    });
    if (res.error) {
      setMsg("Email already registered");
    } else {
      setMsg("Registered! You can now sign in.");
      setMode("login");
    }

  } else {
    const res = await api.post("/login", {
      email: form.email, password: form.password
    });
    if (res.error) {
      setMsg("Invalid credentials");
    } else {
      localStorage.setItem("user_id", res.user_id);
      localStorage.setItem("user_role", res.role);
      onLogin(res.user_id, res.role);
    }
  }

  setBusy(false);
}

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 22, padding: "34px 30px", maxWidth: 390, width: "100%", animation: "popIn 0.3s cubic-bezier(.34,1.56,.64,1)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>{mode === "login" ? "Sign in" : "Create account"}</h2>
          <button onClick={onClose} style={{ background: "#f5f4fa", border: "none", borderRadius: 8, padding: 8, cursor: "pointer", display: "flex", color: "#666" }}><CloseIcon /></button>
        </div>
        {mode === "register" && <input value={form.name} onChange={set("name")} placeholder="Full name" style={iStyle} />}
        <input value={form.email} onChange={set("email")} placeholder="Email" type="email" style={iStyle} />
        <input value={form.password} onChange={set("password")} placeholder="Password" type="password" style={iStyle} />
        {mode === "register" && (
          <select value={form.role} onChange={set("role")} style={{ ...iStyle, color: "#111" }}>
            <option value="customer">Customer</option>
            <option value="admin">Admin</option>
          </select>
        )}
        {msg && <p style={{ fontSize: 13, color: msg.includes("Registered") ? "#16a34a" : "#ef4444", margin: "0 0 10px" }}>{msg}</p>}
        <button onClick={handleSubmit} disabled={busy} style={{ width: "100%", padding: 13, background: "#7c3aed", color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: busy ? "wait" : "pointer", marginBottom: 12, fontFamily: "inherit" }}>
          {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
        </button>
        <p style={{ textAlign: "center", fontSize: 13, color: "#bbb", margin: 0 }}>
          {mode === "login" ? "New here? " : "Have an account? "}
          <button onClick={() => { setMode(m => m === "login" ? "register" : "login"); setMsg(""); }} style={{ background: "none", border: "none", color: "#7c3aed", fontWeight: 600, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
            {mode === "login" ? "Create account" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────
export default function ShoppingCart() {
  const [userId,      setUserId]      = useState(() => Number(localStorage.getItem("user_id") || 0));
  const [userRole,    setUserRole]    = useState(() => localStorage.getItem("user_role") || "customer");
  const [products,    setProducts]    = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [cart,        setCart]        = useState([]);
  const [cartTotal,   setCartTotal]   = useState(0);
  const [orders,      setOrders]      = useState([]);
  const [search,      setSearch]      = useState("");
  const [loading,     setLoading]     = useState(true);
  const [serverError, setServerError] = useState(false);
  const [paying,      setPaying]      = useState(false);
  const [payMethod,   setPayMethod]   = useState("UPI");
  const [filters,     setFilters]     = useState({ category: "", min_price: "", max_price: "", in_stock: false });
  const [toast,       setToast]       = useState({ message: "", visible: false, type: "success" });
  const [panels, setPanels] = useState({ cart: false, history: false, admin: false, success: false, auth: false, ordersLoading: false });
  const panel = (k, v = true) => setPanels(p => ({ ...p, [k]: v }));

  const showToast = useCallback((msg, type = "success") => {
    setToast({ message: msg, visible: true, type });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2400);
  }, []);

  useEffect(() => {
    api.get("/categories").then(d => setCategories(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const loadProducts = useCallback(() => {
    setLoading(true); setServerError(false);
    const params = new URLSearchParams();
    if (filters.category)  params.append("category",  filters.category);
    if (filters.min_price) params.append("min_price", filters.min_price);
    if (filters.max_price) params.append("max_price", filters.max_price);
    if (filters.in_stock)  params.append("in_stock",  "true");
    if (search)            params.append("search",    search);
    const qs = params.toString();
    api.get(`/products${qs ? `?${qs}` : ""}`)
      .then(d => setProducts(Array.isArray(d) ? d : []))
      .catch(() => { setProducts([]); setServerError(true); })
      .finally(() => setLoading(false));
  }, [filters, search]);

  useEffect(() => { const t = setTimeout(loadProducts, 300); return () => clearTimeout(t); }, [loadProducts]);

  const refreshCart = useCallback(async () => {
    if (!userId) return;
    const [items, totRes] = await Promise.all([api.get(`/cart/${userId}`), api.get(`/cart/total/${userId}`)]).catch(() => [[], { total: 0 }]);
    setCart(Array.isArray(items) ? items : []);
    setCartTotal(totRes?.total ?? 0);
  }, [userId]);

  useEffect(() => { refreshCart(); }, [refreshCart]);

  const handleAddToCart = useCallback(async product => {
    if (!userId) { panel("auth"); return; }
    const res = await api.post("/cart/add", { user_id: userId, product_id: product.product_id, quantity: 1 }).catch(() => ({ error: "Could not add item" }));
    if (res.error) { showToast(res.error, "error"); return; }
    await refreshCart();
    showToast(`${product.name} added to cart`);
  }, [userId, refreshCart, showToast]);

  const handleUpdateQty = useCallback(async (productId, qty) => {
    if (qty < 1) return handleRemoveItem(productId);
    await api.post("/cart/update", { user_id: userId, product_id: productId, quantity: qty }).catch(() => {});
    refreshCart();
  }, [userId, refreshCart]);

  const handleRemoveItem = useCallback(async productId => {
    await api.del("/cart/remove", { user_id: userId, product_id: productId }).catch(() => {});
    refreshCart(); showToast("Item removed");
  }, [userId, refreshCart, showToast]);

  const handleCheckout = useCallback(async () => {
    setPaying(true);
    try {
      await api.post("/order/place", { user_id: userId });
      await api.post("/payment", { user_id: userId, payment_method: payMethod });
      await refreshCart(); loadProducts();
      panel("cart", false); panel("success");
    } catch { showToast("Checkout failed. Try again.", "error"); }
    setPaying(false);
  }, [userId, payMethod, showToast, refreshCart, loadProducts]);

  const openHistory = useCallback(async () => {
    panel("history"); panel("ordersLoading");
    const data = await api.get(`/order/history/${userId}`).catch(() => []);
    setOrders(Array.isArray(data) ? data : []);
    panel("ordersLoading", false);
  }, [userId]);

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const isAdmin   = userRole === "admin";

  function handleSignOut() {
    ["user_id","user_role"].forEach(k => localStorage.removeItem(k));
    setUserId(0); setUserRole("customer"); setCart([]); setCartTotal(0);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Sora', sans-serif; background: #f4f3fa; color: #111; }
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }
        @keyframes popIn   { from { transform: scale(0.85); opacity: 0 } to { transform: scale(1); opacity: 1 } }
        @keyframes spin    { to { transform: rotate(360deg) } }
        ::-webkit-scrollbar { width: 4px }
        ::-webkit-scrollbar-thumb { background: #e0dff5; border-radius: 4px }
        input:focus, select:focus { border-color: #7c3aed !important; box-shadow: 0 0 0 3px rgba(124,58,237,0.1); }
      `}</style>

      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(244,243,250,0.93)", backdropFilter: "blur(14px)", borderBottom: "1px solid #e8e6f5", padding: "0 clamp(16px,5vw,64px)" }}>
        <div style={{ maxWidth: 1300, margin: "0 auto", height: 60, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginRight: 4, flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, background: "#7c3aed", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: -0.5 }}>ShopCart</span>
          </div>
          <div style={{ flex: 1, maxWidth: 380, position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#ccc" }}><SearchIcon /></span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…" style={{ width: "100%", padding: "9px 14px 9px 38px", background: "#fff", border: "1px solid #e8e6f5", borderRadius: 10, fontSize: 13.5, outline: "none", fontFamily: "inherit" }} />
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            {isAdmin && <button onClick={() => panel("admin")} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff8e1", border: "1px solid #fde68a", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#92400e", fontFamily: "inherit" }}><AdminIcon /> Admin</button>}
            {userId > 0 && <button onClick={openHistory} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid #e8e6f5", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#666", fontFamily: "inherit" }}><ReceiptIcon /> Orders</button>}
            <button onClick={() => userId > 0 ? handleSignOut() : panel("auth")} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid #e8e6f5", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#666", fontFamily: "inherit" }}>
              <UserIcon /> {userId > 0 ? `${isAdmin ? "Admin" : "User"} #${userId}` : "Sign in"}
            </button>
            <button onClick={() => userId > 0 ? panel("cart") : panel("auth")} style={{ display: "flex", alignItems: "center", gap: 7, background: "#7c3aed", color: "#fff", border: "none", borderRadius: 10, padding: "8px 16px", cursor: "pointer", fontWeight: 700, fontSize: 13.5, fontFamily: "inherit", flexShrink: 0 }}>
              <CartIcon /> Cart
              {cartCount > 0 && <span style={{ background: "#fff", color: "#7c3aed", borderRadius: "50%", width: 18, height: 18, fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{cartCount}</span>}
            </button>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: 1300, margin: "0 auto", padding: "28px clamp(16px,5vw,64px)" }}>
        <div style={{ borderRadius: 20, padding: "36px 44px", marginBottom: 28, background: "linear-gradient(135deg, #1e0b4a 0%, #4c1d95 55%, #1e1b60 100%)", position: "relative", overflow: "hidden" }}>
          {[0,1,2].map(i => <div key={i} style={{ position: "absolute", borderRadius: "50%", background: "rgba(255,255,255,0.04)", width: 120 + i * 80, height: 120 + i * 80, right: -20 + i * 60, top: -30 - i * 15 }} />)}
          <p style={{ color: "#c4b5fd", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>Your one-stop shop</p>
          <h1 style={{ color: "#fff", fontSize: "clamp(20px,3vw,32px)", fontWeight: 800, lineHeight: 1.2, marginBottom: 10 }}>ShopCart</h1>
          <p style={{ color: "#a78bfa", fontSize: 14 }}>{products.length} products available</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 26 }}>
          {[
            { label: "Products",   value: products.length,                     color: "#7c3aed" },
            { label: "In Cart",    value: cartCount,                           color: "#0ea5e9" },
            { label: "Cart Value", value: `₹${Number(cartTotal).toFixed(0)}`,  color: "#10b981" },
            { label: "User",       value: userId > 0 ? `#${userId}` : "Guest", color: "#f59e0b" },
          ].map(s => (
            <div key={s.label} style={{ background: "#fff", borderRadius: 14, padding: "14px 18px", border: "1px solid #f0eff5" }}>
              <p style={{ fontSize: 11, color: "#ccc", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 4px" }}>{s.label}</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
            </div>
          ))}
        </div>

        <FilterBar categories={categories} filters={filters} setFilters={setFilters} />
        <p style={{ fontSize: 13, color: "#bbb", marginBottom: 18, fontWeight: 500 }}>{products.length} product{products.length !== 1 ? "s" : ""}{search ? ` matching "${search}"` : ""}</p>

        {loading ? (
          <div style={{ textAlign: "center", padding: "5rem 0" }}><Spinner /><p style={{ color: "#bbb", marginTop: 14, fontSize: 13 }}>Loading products…</p></div>
        ) : serverError ? (
          <div style={{ textAlign: "center", padding: "5rem 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#ef4444", marginBottom: 6 }}>Could not connect to the server</p>
            <p style={{ fontSize: 13, color: "#bbb", marginBottom: 20 }}>Make sure the backend is running and try again.</p>
            <button onClick={loadProducts} style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 10, padding: "10px 22px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 13 }}>Retry</button>
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "5rem 0" }}>
            <p style={{ fontSize: 17, fontWeight: 700, color: "#ccc" }}>No products match your filters</p>
            <button onClick={() => setFilters({ category: "", min_price: "", max_price: "", in_stock: false })} style={{ marginTop: 12, background: "#7c3aed", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 13 }}>Clear filters</button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", gap: 18 }}>
            {products.map(p => <ProductCard key={p.product_id} product={p} onAddToCart={handleAddToCart} />)}
          </div>
        )}
      </main>

      {panels.cart    && <CartSidebar cart={cart} total={cartTotal} userId={userId} onClose={() => panel("cart", false)} onUpdate={handleUpdateQty} onRemove={handleRemoveItem} onCheckout={handleCheckout} paying={paying} payMethod={payMethod} setPayMethod={setPayMethod} />}
      {panels.history && <OrderHistory orders={orders} loading={panels.ordersLoading} onClose={() => panel("history", false)} />}
      {panels.admin   && <AdminDashboard onClose={() => panel("admin", false)} />}
      {panels.success && <SuccessModal onClose={() => panel("success", false)} />}
      {panels.auth    && <AuthModal onLogin={(id, role) => { setUserId(id); setUserRole(role); panel("auth", false); showToast(`Signed in as ${role === "admin" ? "Admin" : "User"} #${id}`); }} onClose={() => panel("auth", false)} />}
      <Toast message={toast.message} visible={toast.visible} type={toast.type} />
    </>
  );
}
