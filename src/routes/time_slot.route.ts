import express from "express";
import {
  createTimeSlot,
  getTimeSlots,
} from "../controllers/time_slot.controller";

const router = express.Router();

router.route("/").post(createTimeSlot).get(getTimeSlots);

export default router;
