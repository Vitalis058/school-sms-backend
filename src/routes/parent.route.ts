import express from "express";
import { createParent, getParents } from "../controllers/parent.controller";
import { authenticate, requireAdmin } from "../utils/middleware";

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Get all parents
router.get("/", requireAdmin, getParents);

// Create a new parent
router.post("/", requireAdmin, createParent);

export default router;
