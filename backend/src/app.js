import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the backend root directory (one level up from src)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express from "express";
import cors from "cors";
import adminAuthRoutes from "./routes/adminAuth.routes.js";
import userAuthRoutes from "./routes/userAuth.routes.js";
import adminUsersRoutes from "./routes/Adminusers.routes.js"
const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth/admin", adminAuthRoutes);
app.use("/auth/user", userAuthRoutes);
app.use("/api/admin/users", adminUsersRoutes);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚍 Server running on port ${PORT}`);
});
