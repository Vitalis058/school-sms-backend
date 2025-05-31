import express from "express";
import { 
  createSubject, 
  getSubjects, 
  getSubjectById, 
  updateSubject, 
  deleteSubject,
  assignTeacherToSubject,
  removeTeacherFromSubject
} from "../controllers/subject.controller";
import { authenticate, authorize } from "../utils/middleware";

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Subject CRUD routes
router.route("/")
  .get(authorize('subjects', 'read'), getSubjects)
  .post(authorize('subjects', 'create'), createSubject);

router.route("/:id")
  .get(authorize('subjects', 'read'), getSubjectById)
  .put(authorize('subjects', 'update'), updateSubject)
  .delete(authorize('subjects', 'delete'), deleteSubject);

// Teacher assignment routes
router.post("/:id/teachers", authorize('subjects', 'update'), assignTeacherToSubject);
router.delete("/:id/teachers", authorize('subjects', 'update'), removeTeacherFromSubject);

export default router;
