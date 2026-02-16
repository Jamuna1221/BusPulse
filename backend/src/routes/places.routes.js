import express from "express";
import { searchPlaces } from "../controllers/places.controller.js";

const router = express.Router();

router.get("/search", searchPlaces);

export default router;
