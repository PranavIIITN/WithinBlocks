import express from "express";
import authRoutes from "./modules/auth/auth.routes.js";  // importing authentication route
import productRoutes from "./modules/product/product.routes.js";
import customerRoutes from "./modules/customer/customer.routes.js";
import invoiceRoutes from "./modules/invoice/invoice.routes.js";
import uploadRoutes from "./modules/upload/upload.routes.js";
import companyRoutes from "./modules/company/company.routes.js";
import agentRoutes from "./modules/agent/agent.routes.js";
import cors from 'cors';


const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}))

// 1. Core middleware
app.use(express.json()); 

// 2. Routes
app.use("/api/auth", authRoutes); 
app.use("/api/products", productRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/agent", agentRoutes);


// 3. Global error handler
// Services throw errors carrying a statusCode (404 customer not found,
// 400 insufficient stock). Honour it instead of flattening everything to 500,
// so the agent panel can show a useful message.
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    error: err.message,
    message: err.message,
  });
});

export default app;