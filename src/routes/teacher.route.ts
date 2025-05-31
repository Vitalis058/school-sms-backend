import express from "express";
import { createTeacher, getTeachers } from "../controllers/teachers.controller";
import { authenticate, authorizeTeachers } from "../utils/middleware";

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Get all teachers
router.get("/", authorizeTeachers.read, getTeachers);

// Create a new teacher
router.post("/", authorizeTeachers.create, createTeacher);

export default router;
