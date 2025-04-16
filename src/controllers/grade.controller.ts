import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/AppError";
import { prisma } from "../utils/Prisma";
import { GradeCreationSchema } from "../utils/validation";
import slugify from "slugify";

//get the grades
export const getGrades = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const rawGrades = await prisma.grade.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            streams: true,
            students: true,
          },
        },
      },
    });

    const grades = rawGrades.map((grade) => {
      return {
        id: grade.id,
        name: grade.name,
        streams: grade._count.streams,
        students: grade._count.students,
      };
    });

    res.status(200).json({
      success: true,
      data: grades,
    });
  }
);

//create class
export const createGrade = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const validatedData = GradeCreationSchema.safeParse(req.body);

    if (!validatedData.success) {
      return next(new AppError(validatedData.error.errors[0].message, 404));
    }

    const data = {
      name: validatedData.data.name,
      slug: slugify(validatedData.data.name, {
        lower: true,
      }),
    };

    const newClass = await prisma.grade.create({
      data,
    });

    res.status(201).json({
      data: newClass,
      success: true,
    });
  }
);
