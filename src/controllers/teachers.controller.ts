import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { TeacherEnrollmentSchema } from "../utils/validation";
import { AppError } from "../utils/AppError";
import { prisma } from "../utils/Prisma";

export const getTeachers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const teachers = await prisma.teacher.findMany({
      select: {
        firstName: true,
        id: true,
      },
    });
    res.status(200).json({
      success: true,
      data: teachers,
    });
  }
);

//create teacher
export const createTeacher = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const teachersData = {
      ...req.body,
      joiningDate: new Date(req.body.joiningDate),
      dateOfBirth: new Date(req.body.dateOfBirth),
    };

    const validatedData = TeacherEnrollmentSchema.safeParse(teachersData);

    if (!validatedData.success) {
      return next(new AppError(validatedData.error.errors[0].message, 404));
    }

    const teacher = await prisma.teacher.create({
      data: validatedData.data,
    });

    res.status(201).json({
      data: teacher,
      success: true,
    });
  }
);
