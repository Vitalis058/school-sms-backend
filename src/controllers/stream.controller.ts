import { NextFunction, Request, Response } from "express";
import slugify from "slugify";
import { AppError } from "../utils/AppError";
import { catchAsync } from "../utils/catchAsync";
import { prisma } from "../utils/Prisma";
import { StreamCreationSchema } from "../utils/validation";

//get the streams
export const getStreams = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const streams = await prisma.stream.findMany({
      include: {},
    });
    res.status(200).json(streams);
  }
);

//get streams related to a class
export const getGradeStreams = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const param = req.params.id;

    const streamsData = await prisma.stream.findMany({
      where: {
        gradeId: param,
      },

      include: {
        _count: {
          select: { students: true },
        },

        Teacher: {
          select: {
            firstName: true,
          },
        },
      },
    });

    const streams = streamsData.map((stream) => {
      return {
        id: stream.id,
        classTeacher: stream.Teacher?.firstName,
        slug: stream.slug,
        students: stream._count.students,
        name: stream.name,
      };
    });

    res.status(200).json(streams);
  }
);

//create stream
export const createStream = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const validatedData = StreamCreationSchema.safeParse(req.body);

    if (!validatedData.success) {
      return next(new AppError(validatedData.error.errors[0].message, 404));
    }

    const data = {
      ...validatedData.data,
      slug: slugify(validatedData.data.name, {
        lower: true,
      }),
    };

    const newClass = await prisma.stream.create({
      data,
    });

    res.status(201).json({
      data: newClass,
      success: true,
    });
  }
);
