import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/AppError";
import { prisma } from "../utils/Prisma";
import slugify from "slugify";

//get the grades
export const getSubjects = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const subjects = await prisma.subject.findMany();

    res.status(200).json({
      success: true,
      data: subjects,
    });
  }
);

//create class
export const createSubject = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const data = {
      ...req.body,
      slug: slugify(req.body.name),
    };

    const newSubject = await prisma.subject.create({
      data,
    });

    res.status(201).json({
      data: newSubject,
      success: true,
    });
  }
);
