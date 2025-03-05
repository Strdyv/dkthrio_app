const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

/**
 * Για την αυτόματη εκκαθάριση κάθε μέρα, κρατάμε τη μέρα που έγινε τελευταία φορά reset.
 * Αν αλλάξει η ημερομηνία συστήματος, κάνουμε reset (μηδενισμό).
 */
let lastResetDate = new Date().getDate();

// Πίνακας προϊόντων με ΤΙΜΗ και ΑΠΟΘΕΜΑ
let products = [
  { id: 1, name: "Espesso", price: 0.70, stock: 0 },
  { id: 2, name: "Cappuccino", price: 1.00, stock: 0 },
  { id: 3, name: "Nescafe ", price: 0.50, stock: 0 },
  { id: 4, name: "Ελληνικός Μονός ", price: 0.40, stock: 0 },
  { id: 5, name: "Ελληνικός Διπλός ", price: 0.60, stock: 0 },
  { id: 6, name: "Κουλούρι ", price: 0.50, stock: 0 },
  { id: 7, name: "Σφολιατα ", price: 1.50, stock: 0 },
  { id: 8, name: "Σφολιατα ", price: 1.40, stock: 0 },
  { id: 9, name: "Σφολιατα ", price: 1.30, stock: 0 },
  { id: 10, name: "Σφολιατα ", price: 1.20, stock: 0 },
  { id: 11, name: "Σφολιατα ", price: 1.00, stock: 0 },
  { id: 12, name: "Σφολιατα ", price: 7.99, stock: 0 },
];

// Πίνακας πωλήσεων
let sales = [];

/**
 * Κάθε αίτημα ελέγχει αν άλλαξε η ημερομηνία, και αν ναι, κάνει reset.
 */
function checkDailyReset() {
  const currentDay = new Date().getDate();
  if (currentDay !== lastResetDate) {
    // Μηδενίζουμε πωλήσεις
    sales = [];
    // Επαναφέρουμε την αρχική κατάσταση (αν θέλουμε να ορίσουμε συγκεκριμένα αποθέματα/τιμές)
    products = [
    { id: 1, name: "Espesso", price: 0.70, stock: 0 },
  { id: 2, name: "Cappuccino", price: 1.00, stock: 0 },
  { id: 3, name: "Nescafe ", price: 0.50, stock: 0 },
  { id: 4, name: "Ελληνικός Μονός ", price: 0.40, stock: 0 },
  { id: 5, name: "Ελληνικός Διπλός ", price: 0.60, stock: 0 },
  { id: 6, name: "Κουλούρι ", price: 0.50, stock: 0 },
  { id: 7, name: "Σφολιατα ", price: 1.50, stock: 0 },
  { id: 8, name: "Σφολιατα ", price: 1.40, stock: 0 },
  { id: 9, name: "Σφολιατα ", price: 1.30, stock: 0 },
  { id: 10, name: "Σφολιατα ", price: 1.20, stock: 0 },
  { id: 11, name: "Σφολιατα ", price: 1.00, stock: 0 },
  { id: 12, name: "Σφολιατα ", price: 7.99, stock: 0 },
    ];
    lastResetDate = currentDay;
    console.log("Αυτόματος μηδενισμός ημέρας ολοκληρώθηκε!");
  }
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Σερβίρουμε τα στατικά αρχεία από το public
app.use(express.static(path.join(__dirname, "public")));

// ---------------------------------
// ΡΟΥΤΕΣ ΓΙΑ ΤΟΝ ΧΡΗΣΤΗ
// ---------------------------------
app.get("/user", (req, res) => {
  checkDailyReset();
  res.sendFile(path.join(__dirname, "views", "user.html"));
});

/** Επιστροφή λίστας προϊόντων - ο χρήστης βλέπει ΜΟΝΟ name & price (ΟΧΙ stock) */
app.get("/api/products", (req, res) => {
  checkDailyReset();
  // Στέλνουμε μόνο name, price, id (χωρίς το stock)
  const dataToSend = products.map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
  }));
  res.json(dataToSend);
});

/** Ο χρήστης κάνει πώληση - το απόθεμα μειώνεται, επιτρέπεται να γίνει και αρνητικό. */
app.post("/api/sell", (req, res) => {
  checkDailyReset();
  const { productId } = req.body;
  const product = products.find(p => p.id === Number(productId));

  if (!product) {
    return res.status(404).json({ message: "Το προϊόν δεν βρέθηκε" });
  }

  // Αφαιρούμε 1 από το stock, ακόμη κι αν πάει σε αρνητικό.
  product.stock -= 1;

  // Καταχώρηση της πώλησης
  const sale = {
    productId: product.id,
    productName: product.name,
    price: product.price,
    quantity: 1,
    timestamp: new Date().toISOString(),
    canceled: false,
  };
  sales.push(sale);

  return res.json({ message: `Πωλήθηκε το ${product.name}`, sale });
});

/** Τελευταίες 3 πωλήσεις (μη ακυρωμένες). */
app.get("/api/last-sales", (req, res) => {
  checkDailyReset();
  const validSales = sales.filter(s => !s.canceled);
  const last3 = validSales.slice(-3);
  res.json(last3);
});

/** Ακύρωση πώλησης */
app.post("/api/cancel", (req, res) => {
  checkDailyReset();
  const { saleIndex } = req.body;

  if (saleIndex < 0 || saleIndex >= sales.length) {
    return res.status(404).json({ message: "Μη έγκυρη πώληση" });
  }

  const sale = sales[saleIndex];
  if (sale.canceled) {
    return res.status(400).json({ message: "Η πώληση είναι ήδη ακυρωμένη" });
  }

  sale.canceled = true;

  // Μπορείς, αν θες, να προσθέσεις πίσω στο stock (εδώ το κάνουμε)
  const product = products.find(p => p.id === sale.productId);
  if (product) {
    product.stock += sale.quantity;
  }

  return res.json({ message: "Η πώληση ακυρώθηκε", sale });
});

// ---------------------------------
// ΡΟΥΤΕΣ ΓΙΑ ΤΟΝ ΔΙΑΧΕΙΡΙΣΤΗ
// ---------------------------------
app.get("/admin", (req, res) => {
  checkDailyReset();
  res.sendFile(path.join(__dirname, "views", "admin.html"));
});

/** 1. Όλες οι πωλήσεις */
app.get("/api/admin/sales", (req, res) => {
  checkDailyReset();
  res.json(sales);
});

/** 2. Επιστροφή αποθέματος για να μπορεί να το βλέπει ο διαχειριστής */
app.get("/api/admin/inventory", (req, res) => {
  checkDailyReset();
  // Επιστρέφουμε όλο το προϊόν, μαζί με stock
  res.json(products);
});

/** 3. Προσθήκη αποθέματος (ή αφαίρεση) σε ένα προϊόν */
app.post("/api/admin/add-stock", (req, res) => {
  checkDailyReset();
  const { productId, quantityChange } = req.body; // quantityChange μπορεί να είναι θετικό ή αρνητικό
  const product = products.find(p => p.id === Number(productId));

  if (!product) {
    return res.status(404).json({ message: "Το προϊόν δεν βρέθηκε" });
  }

  product.stock += Number(quantityChange); // επιτρέπουμε να πάει και σε αρνητικό

  res.json({ message: `Ανανεώθηκε το απόθεμα του ${product.name} σε ${product.stock}`, product });
});

/** 4. Επιστροφή συνόλου πωλήσεων ανά προϊόν (για σήμερα) */
app.get("/api/admin/daily-sales", (req, res) => {
  checkDailyReset();
  const grouped = {};
  for (const sale of sales) {
    if (sale.canceled) continue;
    const key = sale.productId;
    if (!grouped[key]) {
      grouped[key] = {
        productId: sale.productId,
        productName: sale.productName,
        totalSold: 0,
        totalIncome: 0,
      };
    }
    grouped[key].totalSold += sale.quantity;
    grouped[key].totalIncome += sale.quantity * sale.price;
  }
  res.json(Object.values(grouped)); 
});

/** 5. Χειροκίνητος Μηδενισμός (εφόσον το θες εκτός από τον αυτόματο) */
app.post("/api/admin/reset", (req, res) => {
  sales = [];
  products = [
    { id: 1, name: "Προϊόν Α", price: 10.0, stock: 10 },
    { id: 2, name: "Προϊόν Β", price: 15.5, stock: 5 },
    { id: 3, name: "Προϊόν Γ", price: 7.99, stock: 20 },
  ];
  lastResetDate = new Date().getDate();
  res.json({ message: "Ο μηδενισμός ολοκληρώθηκε επιτυχώς!" });
});

app.listen(PORT, () => {
  console.log(`Server τρέχει στο http://localhost:${PORT}`);
});
