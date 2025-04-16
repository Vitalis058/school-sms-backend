import express from "express";
import {
  createStream,
  getGradeStreams,
  getStream,
} from "../controllers/stream.controller";

const router = express.Router();

router.route("/").get(getStream).post(createStream);
router.route("/:id").get(getGradeStreams);

export default router;
