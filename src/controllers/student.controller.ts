import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { catchAsync } from "../utils/catchAsync";
import { prisma } from "../utils/Prisma";
import { StudentEnrollmentSchema } from "../utils/validation";

export const getStudents = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const students = await prisma.student.findMany({
      include: {
        Grade: true,
        Stream: true,
        Guardian: true,
      },
    });
    
    res.status(200).json({
      success: true,
      data: students,
      message: "Students retrieved successfully",
    });
  }
);

//create student
export const createStudent = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const validatedData = StudentEnrollmentSchema.safeParse(req.body);

    if (!validatedData.success) {
      return next(new AppError(validatedData.error.errors[0].message, 400));
    }

    const student = await prisma.student.create({
      data: validatedData.data,
      include: {
        Grade: true,
        Stream: true,
        Guardian: true,
      },
    });

    res.status(201).json({
      success: true,
      data: student,
      message: "Student created successfully",
    });
  }
);
