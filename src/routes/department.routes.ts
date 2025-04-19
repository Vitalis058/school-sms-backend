import express from "express";
import {
  createDepartment,
  getDepartments,
} from "../controllers/department.controller";

const router = express.Router();

router.route("/").get(getDepartments).post(createDepartment);

export default router;
