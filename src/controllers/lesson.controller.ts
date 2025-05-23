import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { catchAsync } from "../utils/catchAsync";
import { prisma } from "../utils/Prisma";
import { lessonSchema } from "../utils/validation";

//create the lesson
export const createLesson = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    //check the data
    const validatedData = lessonSchema.safeParse(req.body);

    // Check if validation failed
    if (!validatedData.success) {
      return next(new AppError("Invalid lesson data", 400));
    }

    const data = validatedData.data;

    const newLesson = await prisma.lesson.create({
      data,
    });

    res.status(200).json({
      success: true,
      data: newLesson,
    });
  }
);

//get lesson
export const getLessons = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const lessons = await prisma.lesson.findMany();

    console.log(lessons);

    res.status(200).json({
      success: true,
      data: lessons,
    });
  }
);
