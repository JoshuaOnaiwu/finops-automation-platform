const path = require("path");
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const products = [
  {
    id: 1,
    name: "Black Urban Jacket",
    category: "Jackets",
    price: 120,
  },
  {
    id: 2,
    name: "White Premium Tee",
    category: "T-Shirts",
    price: 45,
  },
  {
    id: 3,
    name: "Red Street Hoodie",
    category: "Hoodies",
    price: 95,
  },
];

app.get("/api/catalogue", (req, res) => {
  res.json(products);
});

app.post("/api/login", (req, res) => {
  const { username } = req.body;

  res.json({
    token: "demo-token",
    user: {
      username,
      role: "customer",
    },
  });
});

app.get("/api/cart", (req, res) => {
  res.json({
    items: [],
    itemCount: 0,
    subtotal: 0,
    delivery: 0,
    total: 0,
  });
});

app.post("/api/checkout", (req, res) => {
  res.json({
    message: "Checkout successful",
    orderId: Math.floor(Math.random() * 100000),
  });
});

const PORT = 4000;

app.use(express.static(path.join(__dirname, "dist")));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});