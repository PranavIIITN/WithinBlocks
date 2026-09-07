import express from "express";
import authRoutes from "./modules/auth/auth.routes.js";  // importing authentication route
import productRoutes from "./modules/product/product.routes.js";
import customerRoutes from "./modules/customer/customer.routes.js";
import invoiceRoutes from "./modules/invoice/invoice.routes.js";


const app = express();

// 1. Core middleware
app.use(express.json()); 

// 2. Routes
app.use("/api/auth", authRoutes); 
app.use("/api/products", productRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/invoices", invoiceRoutes);

// 3. Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

export default app;







