import express from "express";
import { createLesson, getLessons } from "../controllers/lesson.controller";

const router = express.Router();

router.route("/").post(createLesson).get(getLessons);

export default router;
