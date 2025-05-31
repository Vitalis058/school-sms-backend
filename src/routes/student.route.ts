import express from "express";
import { createStudent, getStudents } from "../controllers/student.controller";
import { authenticate, authorizeStudents } from "../utils/middleware";

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Get all students
router.get("/", authorizeStudents.read, getStudents);

// Create a new student
router.post("/", authorizeStudents.create, createStudent);

router.route("/:id")
  .get(authorizeStudents.read, getStudents) // TODO: Add getStudent controller
  .put(authorizeStudents.update, createStudent) // TODO: Add updateStudent controller  
  .delete(authorizeStudents.delete, createStudent); // TODO: Add deleteStudent controller

export default router;
