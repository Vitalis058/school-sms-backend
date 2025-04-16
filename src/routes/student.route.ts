import express from "express";
import { createStudent, getStudents } from "../controllers/student.controller";

const router = express.Router();

router.route("/").get(getStudents).post(createStudent);

export default router;
