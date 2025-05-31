import express from "express";
import { 
  createLesson, 
  getLessons, 
  getLessonById, 
  updateLesson, 
  deleteLesson,
  getStreamTimetable,
  getTeacherTimetable
} from "../controllers/lesson.controller";
import { authenticate, authorize } from "../utils/middleware";

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Lesson CRUD routes
router.route("/")
  .get(authorize('lessons', 'read'), getLessons)
  .post(authorize('lessons', 'create'), createLesson);

router.route("/:id")
  .get(authorize('lessons', 'read'), getLessonById)
  .put(authorize('lessons', 'update'), updateLesson)
  .delete(authorize('lessons', 'delete'), deleteLesson);

// Timetable routes
router.get("/timetable/stream/:streamId", authorize('lessons', 'read'), getStreamTimetable);
router.get("/timetable/teacher/:teacherId", authorize('lessons', 'read'), getTeacherTimetable);

export default router;
