import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { catchAsync } from "../utils/catchAsync";
import { prisma } from "../utils/Prisma";
import { ParentsEnrollmentSchema } from "../utils/validation";

export const getParents = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const parents = await prisma.guardian.findMany();
    res.status(200).json(parents);
  }
);

//create teacher
export const createParent = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const rawData = {
      ...req.body,
      dateOfBirth: new Date(req.body.dateOfBirth),
    };

    const validatedData = ParentsEnrollmentSchema.safeParse(rawData);

    if (!validatedData.success) {
      return next(new AppError(validatedData.error.errors[0].message, 404));
    }

    const parent = await prisma.guardian.create({
      data: validatedData.data,
    });

    res.status(201).json(parent);
  }
);
