import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { catchAsync } from "../utils/catchAsync";
import { prisma } from "../utils/Prisma";
import { TeacherEnrollmentSchema } from "../utils/validation";

export const getTeachers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const teachers = await prisma.teacher.findMany({
      include: {
        Department: true,
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
      data: {
        ...validatedData.data,
        subjects: {
          connect: validatedData.data.subjects.map((id: string) => ({
            id,
          })),
        },
      },
    });

    res.status(201).json({
      data: teacher,
      success: true,
    });
  }
);
