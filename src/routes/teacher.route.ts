import express from "express";
import { createTeacher, getTeachers } from "../controllers/teachers.controller";

const router = express.Router();

router.route("/").get(getTeachers).post(createTeacher);

export default router;
