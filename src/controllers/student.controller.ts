import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/AppError";
import { prisma } from "../utils/Prisma";
import { StudentEnrollmentSchema } from "../utils/validation";

export const getStudents = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const students = await prisma.student.findMany();
    res.status(200).json({
      success: true,
      data: students,
    });
  }
);

//create teacher
export const createStudent = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const validatedData = StudentEnrollmentSchema.safeParse(req.body);

    if (!validatedData.success) {
      return next(new AppError(validatedData.error.errors[0].message, 404));
    }

    const student = await prisma.student.create({
      data: validatedData.data,
    });

    res.status(201).json({
      data: student,
      success: true,
    });
  }
);
