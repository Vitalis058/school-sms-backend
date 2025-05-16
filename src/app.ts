import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import morgan from "morgan";
import passport from "passport";

//routes
import adminRoutes from "./routes/admin.route";
import authRoutes from "./routes/auth.route";
import departmentRoutes from "./routes/department.routes";
import gradeRoutes from "./routes/grade.route";
import lessonRoutes from "./routes/lesson.route";
import parentRoutes from "./routes/parent.route";
import streamRoutes from "./routes/stream.route";
import studentRoutes from "./routes/student.route";
import subjectRoutes from "./routes/subject.route";
import teacherRoutes from "./routes/teacher.route";
import timeSlotRoutes from "./routes/time_slot.route";

import cors from "cors";
import { errorController } from "./controllers/error.controller";
import "./strategies/jwt.strategy";
import { AppError } from "./utils/AppError";

dotenv.config();
export const app = express();

app.use(cors());
app.use(morgan("common"));
app.use(express.json());
app.use(passport.initialize());

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
app.use("/api/v1/subjects", subjectRoutes);
app.use("/api/v1/departments", departmentRoutes);
app.use("/api/v1/lessons", lessonRoutes);
app.use("/api/v1/time-slot", timeSlotRoutes);

//handle unhanded routes
app.all("/*splat", (req: Request, res: Response, next: NextFunction) => {
  const err = new AppError(`cant find${req.url} on this server`, 404);
  next(err);
});

app.use(errorController);
