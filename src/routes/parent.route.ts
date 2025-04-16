import express from "express";
import { createParent, getParents } from "../controllers/parent.controller";

const router = express.Router();

router.route("/").get(getParents).post(createParent);

export default router;
