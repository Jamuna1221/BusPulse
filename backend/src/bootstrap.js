import dotenv from "dotenv";

// Load env FIRST, before anything else
dotenv.config({ path: "../.env" });

// After env is loaded, start the app
import "./app.js";
