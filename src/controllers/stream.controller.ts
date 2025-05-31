import { NextFunction, Request, Response } from "express";
import slugify from "slugify";
import { AppError } from "../utils/AppError";
import { catchAsync } from "../utils/catchAsync";
import { prisma } from "../utils/Prisma";
import { StreamCreationSchema } from "../utils/validation";

//get the streams
export const getStreams = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { gradeId } = req.query;
    
    const whereClause: any = {};
    if (gradeId) {
      whereClause.gradeId = gradeId as string;
    }

    const streams = await prisma.stream.findMany({
      where: whereClause,
      include: {
        Grade: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        Teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: { 
            students: true,
            Lesson: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: streams,
    });
  }
);

//get single stream by ID
export const getStreamById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const stream = await prisma.stream.findUnique({
      where: { id },
      include: {
        Grade: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        Teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: { 
            students: true,
            Lesson: true,
          },
        },
      },
    });

    if (!stream) {
      return next(new AppError("Stream not found", 404));
    }

    res.status(200).json({
      success: true,
      data: stream,
    });
  }
);

//get streams related to a class
export const getGradeStreams = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const param = req.params.gradeId;

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
            lastName: true,
          },
        },
      },
    });

    const streams = streamsData.map((stream) => {
      return {
        id: stream.id,
        classTeacher: stream.Teacher ? `${stream.Teacher.firstName} ${stream.Teacher.lastName}` : null,
        slug: stream.slug,
        students: stream._count.students,
        name: stream.name,
        teacherId: stream.teacherId,
      };
    });

    res.status(200).json({
      success: true,
      data: streams,
    });
  }
);

//create stream
export const createStream = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const validatedData = StreamCreationSchema.safeParse(req.body);

    if (!validatedData.success) {
      return next(new AppError(validatedData.error.errors[0].message, 400));
    }

    const data = {
      ...validatedData.data,
      slug: slugify(validatedData.data.name, {
        lower: true,
      }),
    };

    const newStream = await prisma.stream.create({
      data,
      include: {
        Grade: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        Teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: { 
            students: true,
            Lesson: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: newStream,
      message: "Stream created successfully",
    });
  }
);

//update stream
export const updateStream = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const validatedData = StreamCreationSchema.partial().safeParse(req.body);

    if (!validatedData.success) {
      return next(new AppError(validatedData.error.errors[0].message, 400));
    }

    // Check if stream exists
    const existingStream = await prisma.stream.findUnique({
      where: { id },
    });

    if (!existingStream) {
      return next(new AppError("Stream not found", 404));
    }

    const updateData: any = { ...validatedData.data };
    
    // Update slug if name is being updated
    if (updateData.name) {
      updateData.slug = slugify(updateData.name, { lower: true });
    }

    const updatedStream = await prisma.stream.update({
      where: { id },
      data: updateData,
      include: {
        Grade: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        Teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: { 
            students: true,
            Lesson: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: updatedStream,
      message: "Stream updated successfully",
    });
  }
);

//delete stream
export const deleteStream = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    // Check if stream exists
    const existingStream = await prisma.stream.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            students: true,
            Lesson: true,
          },
        },
      },
    });

    if (!existingStream) {
      return next(new AppError("Stream not found", 404));
    }

    // Check if stream has students or lessons
    if (existingStream._count.students > 0) {
      return next(new AppError("Cannot delete stream with enrolled students", 400));
    }

    if (existingStream._count.Lesson > 0) {
      return next(new AppError("Cannot delete stream with scheduled lessons", 400));
    }

    await prisma.stream.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: "Stream deleted successfully",
    });
  }
);
