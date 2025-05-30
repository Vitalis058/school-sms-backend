import { NextFunction, Request, Response } from "express";
import slugify from "slugify";
import { catchAsync } from "../utils/catchAsync";
import { prisma } from "../utils/Prisma";

//get the grades
export const getSubjects = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const subjects = await prisma.subject.findMany();

    res.status(200).json(subjects);
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

    res.status(201).json(newSubject);
  }
);
