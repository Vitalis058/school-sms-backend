import express from "express";
import { protectedRoute } from "../controllers/admin.controller";
import { getSystemHealth } from "../controllers/system.controller";
import { authenticate, requireAdmin } from "../utils/middleware";

const router = express.Router();

router.get(
  "/protected",
  authenticate,
  requireAdmin,
  protectedRoute
);

// System health endpoint for admin
router.get(
  "/health",
  authenticate,
  requireAdmin,
  getSystemHealth
);

export default router;
