import express from "express";
import {
  createStream,
  getGradeStreams,
  getStreams,
  updateStream,
  deleteStream,
  getStreamById,
} from "../controllers/stream.controller";

const router = express.Router();

router.route("/").get(getStreams).post(createStream);
router.route("/:id").get(getStreamById).put(updateStream).delete(deleteStream);
router.route("/grade/:gradeId").get(getGradeStreams);

export default router;
