import express from "express";
import {
  createDepartment,
  getDepartment,
  getDepartments,
} from "../controllers/department.controller";

const router = express.Router();

router.route("/").get(getDepartments).post(createDepartment);
router.route("/:departmentId").get(getDepartment);

export default router;
