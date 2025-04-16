import express, { NextFunction, Request, Response } from "express";
import morgan from "morgan";
import dotenv from "dotenv";
import passport from "passport";
import authRoutes from "./routes/auth.route";
import adminRoutes from "./routes/admin.route";
import teacherRoutes from "./routes/teacher.route";
import streamRoutes from "./routes/stream.route";
import gradeRoutes from "./routes/grade.route";
import studentRoutes from "./routes/student.route";
import parentRoutes from "./routes/parent.route";
import { errorController } from "./controllers/error.controller";
import { AppError } from "./utils/AppError";
import cors from "cors";

dotenv.config();
export const app = express();

app.use(cors());
app.use(morgan("common"));
app.use(express.json());
app.use(passport.initialize());
import "./strategies/jwt.strategy";

//api routes
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    message: "the server is working",
  });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/teachers", teacherRoutes);
app.use("/api/v1/grades", gradeRoutes);
app.use("/api/v1/streams", streamRoutes);
app.use("/api/v1/students", studentRoutes);
app.use("/api/v1/parents", parentRoutes);

//handle unhanded routes
app.all("/*splat", (req: Request, res: Response, next: NextFunction) => {
  const err = new AppError(`cant find${req.url} on this server`, 404);
  next(err);
});

app.use(errorController);
