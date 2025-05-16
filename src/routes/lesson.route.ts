import express from "express";
import { createLesson } from "../controllers/lesson.controller";

const router = express.Router();

router.route("/").post(createLesson);

export default router;
