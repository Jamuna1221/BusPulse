import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import etaRoutes from "./routes/etaRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
connectDB();
app.use("/api", etaRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Backend is running",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
