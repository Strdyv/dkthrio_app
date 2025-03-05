const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

// Πίνακας προϊόντων με ΤΙΜΗ και ΑΠΟΘΕΜΑ
let products = [
  { id: 1, name: "Espesso", price: 0.70, stock: 0 },
  { id: 2, name: "Cappuccino", price: 1.00, stock: 0 },
  { id: 3, name: "Nescafe", price: 0.50, stock: 0 },
  { id: 4, name: "Ελληνικός Μονός", price: 0.40, stock: 0 },
  { id: 5, name: "Ελληνικός Διπλός", price: 0.60, stock: 0 },
  { id: 6, name: "Κουλούρι", price: 0.50, stock: 0 },
  { id: 7, name: "Σφολιατα", price: 1.50, stock: 0 },
  { id: 8, name: "Σφολιατα", price: 1.40, stock: 0 },
  { id: 9, name: "Σφολιατα", price: 1.30, stock: 0 },
  { id: 10, name: "Σφολιατα", price: 1.20, stock: 0 },
  { id: 11, name: "Σφολιατα", price: 1.00, stock: 0 },
  { id: 12, name: "Σφολιατα", price: 7.99, stock: 0 },
];

let sales = [];

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// ΡΟΥΤΕΣ ΓΙΑ ΤΟΝ ΧΡΗΣΤΗ
app.get("/user", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "user.html"));
});

app.get("/api/products", (req, res) => {
  res.json(products.map(p => ({ id: p.id, name: p.name, price: p.price })));
});

app.post("/api/sell", (req, res) => {
  const { productId, quantity } = req.body;
  const qty = quantity ? Number(quantity) : 1;
  const product = products.find(p => p.id === Number(productId));

  if (!product) return res.status(404).json({ message: "Το προϊόν δεν βρέθηκε" });

  product.stock -= qty;

  const sale = {
    productId: product.id,
    productName: product.name,
    price: product.price,
    quantity: qty,
    timestamp: new Date().toISOString(),
    canceled: false,
    observation: "",
    observationTimestamp: ""
  };

  sales.push(sale);

  return res.json({ message: `Πωλήθηκαν ${qty} τεμάχια του ${product.name}`, sale });
});

app.get("/api/last-sales", (req, res) => {
  res.json(sales.filter(s => !s.canceled).slice(-3));
});

app.post("/api/cancel", (req, res) => {
  const { saleIndex } = req.body;

  if (saleIndex < 0 || saleIndex >= sales.length)
    return res.status(404).json({ message: "Μη έγκυρη πώληση" });

  const sale = sales[saleIndex];
  if (sale.canceled)
    return res.status(400).json({ message: "Η πώληση είναι ήδη ακυρωμένη" });

  sale.canceled = true;
  const product = products.find(p => p.id === sale.productId);
  if (product) product.stock += sale.quantity;

  return res.json({ message: "Η πώληση ακυρώθηκε", sale });
});

// ΡΟΥΤΕΣ ΓΙΑ ΤΟΝ ΔΙΑΧΕΙΡΙΣΤΗ
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "admin.html"));
});

app.get("/api/admin/sales", (req, res) => {
  res.json(sales);
});

app.get("/api/admin/inventory", (req, res) => {
  res.json(products);
});

app.post("/api/admin/add-stock", (req, res) => {
  const { productId, quantityChange } = req.body;
  const product = products.find(p => p.id === Number(productId));

  if (!product)
    return res.status(404).json({ message: "Το προϊόν δεν βρέθηκε" });

  product.stock += Number(quantityChange);
  res.json({ message: `Ανανεώθηκε το απόθεμα του ${product.name} σε ${product.stock}`, product });
});

app.get("/api/admin/sales", (req, res) => res.json(sales));

app.post("/api/admin/reset", (req, res) => {
  sales = [];
  products.forEach(p => (p.stock = 0));
  res.json({ message: "Ο μηδενισμός ολοκληρώθηκε επιτυχώς!" });
});

app.post("/api/observation", (req, res) => {
  const { saleIndex, observation } = req.body;
  if (saleIndex < 0 || saleIndex >= sales.length)
    return res.status(404).json({ message: "Μη έγκυρη πώληση" });

  sales[saleIndex].observation = observation;
  sales[saleIndex].observationTimestamp = new Date().toISOString();

  return res.json({ message: "Παρατηρήσεις αποθηκεύτηκαν" });
});

app.listen(PORT, () => {
  console.log(`Server τρέχει στο http://localhost:${PORT}`);
});
