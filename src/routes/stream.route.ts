import express from "express";
import {
  createStream,
  getGradeStreams,
  getStreams,
} from "../controllers/stream.controller";

const router = express.Router();

router.route("/").get(getStreams).post(createStream);
router.route("/:id").get(getGradeStreams);

export default router;
