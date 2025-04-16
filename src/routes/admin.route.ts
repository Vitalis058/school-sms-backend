import express from "express";
import { protectedRoute } from "../controllers/admin.controller";
import passport from "passport";

const router = express.Router();

router.get(
  "/protected",
  passport.authenticate("jwt", { session: false }),
  protectedRoute
);

export default router;
