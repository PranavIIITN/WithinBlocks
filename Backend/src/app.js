import express from "express";
import authRoutes from "./modules/auth/auth.routes.js";  // importing authentication route

const app = express();

// 1. Core middleware
app.use(express.json()); 

// 2. Auth Route
app.use("/api/auth", authRoutes); 

// 3. Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

export default app;







