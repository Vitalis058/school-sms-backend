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

    const data = validatedData.data;

    // Check that the end time is always higher than the starting time
    const start = data.startTime.split(':').map(Number);
    const end = data.endTime.split(':').map(Number);
    const startMinutes = start[0] * 60 + start[1];
    const endMinutes = end[0] * 60 + end[1];

    if (endMinutes <= startMinutes) {
      return next(new AppError("End time must be after start time", 400));
    }

    // Check for overlapping time slots
    const overlapping = await prisma.timeSlot.findFirst({
      where: {
        OR: [
          {
            AND: [
              { startTime: { lte: data.startTime } },
              { endTime: { gt: data.startTime } }
            ]
          },
          {
            AND: [
              { startTime: { lt: data.endTime } },
              { endTime: { gte: data.endTime } }
            ]
          },
          {
            AND: [
              { startTime: { gte: data.startTime } },
              { endTime: { lte: data.endTime } }
            ]
          }
        ]
      }
    });

    if (overlapping) {
      return next(new AppError("Time slot overlaps with existing time slot", 400));
    }

    const timeSlot = await prisma.timeSlot.create({
      data: validatedData.data,
    });

    res.status(201).json({
      success: true,
      data: timeSlot,
      message: "Time slot created successfully",
    });
  }
);

export const getTimeSlots = catchAsync(async (req: Request, res: Response) => {
  const timeSlots = await prisma.timeSlot.findMany({
    include: {
      _count: {
        select: {
          lessons: true,
        },
      },
    },
    orderBy: {
      startTime: 'asc',
    },
  });

  res.status(200).json({
    success: true,
    data: timeSlots,
    count: timeSlots.length,
  });
});

export const getTimeSlotById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const timeSlot = await prisma.timeSlot.findUnique({
      where: { id },
      include: {
        lessons: {
          include: {
            Subject: {
              select: {
                id: true,
                name: true,
                subjectCode: true,
              },
            },
            Teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            Stream: {
              include: {
                Grade: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            lessons: true,
          },
        },
      },
    });

    if (!timeSlot) {
      return next(new AppError("Time slot not found", 404));
    }

    res.status(200).json({
      success: true,
      data: timeSlot,
    });
  }
);

export const updateTimeSlot = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const validatedData = timeSlotSchema.partial().safeParse(req.body);

    if (!validatedData.success) {
      return next(new AppError(validatedData.error.errors[0].message, 400));
    }

    const data = validatedData.data;

    // Check if time slot exists
    const existingTimeSlot = await prisma.timeSlot.findUnique({
      where: { id },
    });

    if (!existingTimeSlot) {
      return next(new AppError("Time slot not found", 404));
    }

    // If updating times, validate them
    if (data.startTime || data.endTime) {
      const startTime = data.startTime || existingTimeSlot.startTime;
      const endTime = data.endTime || existingTimeSlot.endTime;

      const start = startTime.split(':').map(Number);
      const end = endTime.split(':').map(Number);
      const startMinutes = start[0] * 60 + start[1];
      const endMinutes = end[0] * 60 + end[1];

      if (endMinutes <= startMinutes) {
        return next(new AppError("End time must be after start time", 400));
      }

      // Check for overlapping time slots (excluding current one)
      const overlapping = await prisma.timeSlot.findFirst({
        where: {
          id: { not: id },
          OR: [
            {
              AND: [
                { startTime: { lte: startTime } },
                { endTime: { gt: startTime } }
              ]
            },
            {
              AND: [
                { startTime: { lt: endTime } },
                { endTime: { gte: endTime } }
              ]
            },
            {
              AND: [
                { startTime: { gte: startTime } },
                { endTime: { lte: endTime } }
              ]
            }
          ]
        }
      });

      if (overlapping) {
        return next(new AppError("Time slot overlaps with existing time slot", 400));
      }
    }

    const updatedTimeSlot = await prisma.timeSlot.update({
      where: { id },
      data,
      include: {
        _count: {
          select: {
            lessons: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: updatedTimeSlot,
      message: "Time slot updated successfully",
    });
  }
);

export const deleteTimeSlot = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const timeSlot = await prisma.timeSlot.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            lessons: true,
          },
        },
      },
    });

    if (!timeSlot) {
      return next(new AppError("Time slot not found", 404));
    }

    // Check if time slot has lessons
    if (timeSlot._count.lessons > 0) {
      return next(new AppError("Cannot delete time slot with existing lessons", 400));
    }

    await prisma.timeSlot.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: "Time slot deleted successfully",
    });
  }
);
