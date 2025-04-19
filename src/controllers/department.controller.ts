import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/AppError";
import { prisma } from "../utils/Prisma";
import {
  DepartmentCreationSchema,
  GradeCreationSchema,
} from "../utils/validation";
import slugify from "slugify";

//get the grades
export const getDepartments = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const departments = await prisma.department.findMany();

    res.status(200).json({
      success: true,
      data: departments,
    });
  }
);

//create class
export const createDepartment = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const validatedData = DepartmentCreationSchema.safeParse(req.body);

    if (!validatedData.success) {
      return next(new AppError(validatedData.error.errors[0].message, 404));
    }

    const data = {
      name: validatedData.data.name,
      slug: slugify(validatedData.data.name, {
        lower: true,
      }),
    };

    const newClass = await prisma.department.create({
      data,
    });

    res.status(201).json({
      data: newClass,
      success: true,
    });
  }
);
