import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { catchAsync } from "../utils/catchAsync";
import { prisma } from "../utils/Prisma";
import { timeSlotSchema } from "../utils/validation";

export const createTimeSlot = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const validatedData = timeSlotSchema.safeParse(req.body);

    if (!validatedData.success) {
      return next(new AppError(validatedData.error.errors[0].message, 400));
    }

    //TODO check that the end time is always higher than the starting time

    const time_slot = await prisma.timeSlot.create({
      data: validatedData.data,
    });

    res.status(200).json({
      success: true,
    });
  }
);

export const getTimeSlots = catchAsync(async (req: Request, res: Response) => {
  const timeSlots = await prisma.timeSlot.findMany();

  res.status(200).json({
    success: true,
    data: timeSlots,
  });
});
