import express from "express";
import { createGrade, getGrades } from "../controllers/grade.controller";

const router = express.Router();

router.route("/").get(getGrades).post(createGrade);

export default router;
