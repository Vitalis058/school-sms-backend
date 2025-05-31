import express from "express";
import {
  createTimeSlot,
  getTimeSlots,
  getTimeSlotById,
  updateTimeSlot,
  deleteTimeSlot,
} from "../controllers/time_slot.controller";
import { authenticate, requireAdmin } from "../utils/middleware";

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Public routes (authenticated users can view)
router.route("/").get(getTimeSlots).post(requireAdmin, createTimeSlot);
router.route("/:id")
  .get(getTimeSlotById)
  .put(requireAdmin, updateTimeSlot)
  .delete(requireAdmin, deleteTimeSlot);

export default router;
