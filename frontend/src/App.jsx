import React, { useEffect, useMemo, useState } from "react";

const emptyCart = {
  items: [],
  itemCount: 0,
  subtotal: 0,
  delivery: 0,
  total: 0
};

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    },
    ...options
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const stored = localStorage.getItem("fashionista_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginMessage, setLoginMessage] = useState("");
  const [catalogue, setCatalogue] = useState([]);
  const [cart, setCart] = useState(emptyCart);
  const [loading, setLoading] = useState(false);
  const [orderMessage, setOrderMessage] = useState("");

  const categories = useMemo(() => [...new Set(catalogue.map((item) => item.category))], [catalogue]);

  const userHeaders = currentUser ? { "x-fashionista-user": currentUser.username } : {};

  useEffect(() => {
    apiRequest("/api/catalogue")
      .then(setCatalogue)
      .catch((error) => setLoginMessage(error.message));
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setCart(emptyCart);
      return;
    }

    apiRequest("/api/cart", { headers: { "x-fashionista-user": currentUser.username } })
      .then(setCart)
      .catch((error) => setOrderMessage(error.message));
  }, [currentUser]);

  const login = async (event) => {
    event.preventDefault();
    setLoading(true);
    setLoginMessage("");

    try {
      const payload = await apiRequest("/api/login", {
        method: "POST",
        body: JSON.stringify(loginForm)
      });
      localStorage.setItem("fashionista_user", JSON.stringify(payload.user));
      localStorage.setItem("fashionista_token", payload.token);
      setCurrentUser(payload.user);
    } catch (error) {
      setLoginMessage(`${error.message} Use Dave / dave123 or Drake / drake123.`);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("fashionista_user");
    localStorage.removeItem("fashionista_token");
    setCurrentUser(null);
    setCart(emptyCart);
    setOrderMessage("");
  };

  const addToCart = async (product) => {
    setOrderMessage("");
    const nextCart = await apiRequest("/api/cart/items", {
      method: "POST",
      headers: userHeaders,
      body: JSON.stringify({ productId: product.id })
    });
    setCart(nextCart);
  };

  const updateQuantity = async (id, quantity) => {
    setOrderMessage("");
    const nextCart = await apiRequest(`/api/cart/items/${id}`, {
      method: "PUT",
      headers: userHeaders,
      body: JSON.stringify({ quantity })
    });
    setCart(nextCart);
  };

  const checkout = async () => {
    setOrderMessage("");
    try {
      const order = await apiRequest("/api/checkout", {
        method: "POST",
        headers: userHeaders
      });
      setCart(emptyCart);
      setOrderMessage(`${order.message} Order ID: ${order.orderId}`);
    } catch (error) {
      setOrderMessage(error.message);
    }
  };

  if (!currentUser) {
    return (
      <main className="login-page">
        <section className="login-showcase">
          <div className="brand-mark">F</div>
          <p className="eyebrow">DevOps ready full-stack storefront</p>
          <h1>Fashionista</h1>
          <p className="showcase-copy">
            A Node.js and React demo shop with backend authentication, curated menswear,
            API-driven catalogue data, and a working checkout cart.
          </p>
          <div className="style-strip" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </section>

        <section className="login-card" aria-label="Fashionista login">
          <p className="eyebrow">Backend powered login</p>
          <h2>Welcome back</h2>
          <form className="login-form" onSubmit={login}>
            <label>
              Username
              <input
                autoComplete="username"
                placeholder="Dave or Drake"
                value={loginForm.username}
                onChange={(event) => setLoginForm({ ...loginForm, username: event.target.value })}
              />
            </label>
            <label>
              Password
              <input
                autoComplete="current-password"
                placeholder="Try dave123 or drake123"
                type="password"
                value={loginForm.password}
                onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
              />
            </label>
            <button className="primary-button" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
          {loginMessage ? <p className="form-message">{loginMessage}</p> : null}
          <div className="demo-users">
            <span>Dave / dave123</span>
            <span>Drake / drake123</span>
          </div>
        </section>
      </main>
    );
  }

  return (
    <div className="store-shell">
      <header className="store-header">
        <div>
          <p className="eyebrow">Fashionista</p>
          <h1>Men's catalogue</h1>
        </div>
        <div className="header-actions">
          <span className="user-pill">{currentUser.username} - {currentUser.role}</span>
          <span className="cart-pill">{cart.itemCount} items</span>
          <button className="ghost-button" onClick={logout}>Logout</button>
        </div>
      </header>

      <main className="store-layout">
        <section className="catalogue-section">
          <div className="hero-band">
            <div>
              <p className="eyebrow">White, red and black collection</p>
              <h2>Sharp menswear for confident releases.</h2>
            </div>
            <div className="hero-stats">
              <strong>{catalogue.length}</strong>
              <span>catalogue items</span>
            </div>
          </div>

          <div className="category-row">
            {categories.map((category) => (
              <span key={category}>{category}</span>
            ))}
          </div>

          <div className="product-grid">
            {catalogue.map((product) => (
              <article className="product-card" key={product.id}>
                <div className="product-art" data-index={product.id}>
                  <span>{product.category}</span>
                </div>
                <div className="product-info">
                  <p>{String(product.id).padStart(2, "0")}</p>
                  <h3>{product.name}</h3>
                  <div className="product-footer">
                    <strong>${product.price.toFixed(2)}</strong>
                    <button onClick={() => addToCart(product)}>Add</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="checkout-panel" aria-label="Checkout cart">
          <div className="checkout-head">
            <div>
              <p className="eyebrow">Checkout</p>
              <h2>Cart</h2>
            </div>
            <span>{cart.itemCount}</span>
          </div>

          {orderMessage ? <p className="form-message">{orderMessage}</p> : null}

          <div className="cart-items">
            {cart.items.length === 0 ? (
              <p className="empty-cart">Your cart is waiting for a strong first pick.</p>
            ) : (
              cart.items.map((item) => (
                <div className="cart-item" key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <p>${item.price.toFixed(2)}</p>
                  </div>
                  <div className="quantity-control">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="summary">
            <div>
              <span>Subtotal</span>
              <strong>${cart.subtotal.toFixed(2)}</strong>
            </div>
            <div>
              <span>Delivery</span>
              <strong>${cart.delivery.toFixed(2)}</strong>
            </div>
            <div className="summary-total">
              <span>Total</span>
              <strong>${cart.total.toFixed(2)}</strong>
            </div>
            <button className="primary-button" disabled={cart.items.length === 0} onClick={checkout}>
              Checkout
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;
