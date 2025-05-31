import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { catchAsync } from "../utils/catchAsync";
import { prisma } from "../utils/Prisma";
import { z } from "zod";

// Validation schemas
const lessonSchema = z.object({
  name: z.string().min(1, "Lesson name is required"),
  description: z.string().optional(),
  day: z.string().min(1, "Day is required"),
  teacherId: z.string().min(1, "Teacher is required"),
  subjectId: z.string().min(1, "Subject is required"),
  streamId: z.string().min(1, "Stream is required"),
  timeSlotId: z.string().min(1, "Time slot is required"),
});

const updateLessonSchema = lessonSchema.partial();

// Helper function to check for lesson conflicts
const checkLessonConflicts = async (
  teacherId: string,
  streamId: string,
  timeSlotId: string,
  day: string,
  excludeLessonId?: string
) => {
  const conflicts = [];

  // Check teacher conflict
  const teacherConflict = await prisma.lesson.findFirst({
    where: {
      teacherId,
      timeSlotId,
      day,
      ...(excludeLessonId && { id: { not: excludeLessonId } }),
    },
    include: {
      Subject: true,
      Stream: { include: { Grade: true } },
    },
  });

  if (teacherConflict) {
    conflicts.push({
      type: "teacher",
      message: `Teacher is already scheduled for ${teacherConflict.Subject.name} with ${teacherConflict.Stream.Grade.name} ${teacherConflict.Stream.name} at this time`,
      conflictingLesson: teacherConflict,
    });
  }

  // Check stream conflict
  const streamConflict = await prisma.lesson.findFirst({
    where: {
      streamId,
      timeSlotId,
      day,
      ...(excludeLessonId && { id: { not: excludeLessonId } }),
    },
    include: {
      Subject: true,
      Teacher: true,
    },
  });

  if (streamConflict) {
    conflicts.push({
      type: "stream",
      message: `Stream already has ${streamConflict.Subject.name} with ${streamConflict.Teacher.firstName} ${streamConflict.Teacher.lastName} at this time`,
      conflictingLesson: streamConflict,
    });
  }

  return conflicts;
};

// Create lesson with conflict checking
export const createLesson = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const validatedData = lessonSchema.safeParse(req.body);

    if (!validatedData.success) {
      return next(new AppError("Invalid lesson data", 400));
    }

    const { teacherId, subjectId, streamId, timeSlotId, day, name, description } = validatedData.data;

    // Check for conflicts
    const conflicts = await checkLessonConflicts(teacherId, streamId, timeSlotId, day);

    if (conflicts.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Lesson conflicts detected",
        conflicts,
      });
    }

    // Verify that teacher can teach the subject
    const teacherSubject = await prisma.teacher.findFirst({
      where: {
        id: teacherId,
        subjects: {
          some: {
            id: subjectId,
          },
        },
      },
    });

    if (!teacherSubject) {
      return next(new AppError("Teacher is not qualified to teach this subject", 400));
    }

    const newLesson = await prisma.lesson.create({
      data: {
        name,
        description,
        day,
        teacherId,
        subjectId,
        streamId,
        timeSlotId,
      },
      include: {
        Teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        Subject: {
          select: {
            id: true,
            name: true,
            subjectCode: true,
            shortname: true,
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
        TimeSlot: {
          select: {
            id: true,
            name: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: newLesson,
      message: "Lesson created successfully",
    });
  }
);

// Get lessons with filtering and timetable view
export const getLessons = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { streamId, teacherId, subjectId, day, view } = req.query;

    const whereClause: any = {};

    if (streamId) whereClause.streamId = streamId as string;
    if (teacherId) whereClause.teacherId = teacherId as string;
    if (subjectId) whereClause.subjectId = subjectId as string;
    if (day) whereClause.day = day as string;

    const lessons = await prisma.lesson.findMany({
      where: whereClause,
      include: {
        Teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        Subject: {
          select: {
            id: true,
            name: true,
            subjectCode: true,
            shortname: true,
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
        TimeSlot: {
          select: {
            id: true,
            name: true,
            startTime: true,
            endTime: true,
          },
        },
      },
      orderBy: [
        { day: 'asc' },
        { TimeSlot: { startTime: 'asc' } },
      ],
    });

    // If timetable view is requested, format data accordingly
    if (view === 'timetable') {
      const timetable = formatTimetableData(lessons);
      return res.status(200).json({
        success: true,
        data: timetable,
        view: 'timetable',
      });
    }

    res.status(200).json({
      success: true,
      data: lessons,
      count: lessons.length,
    });
  }
);

// Get lesson by ID
export const getLessonById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        Teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        Subject: {
          select: {
            id: true,
            name: true,
            subjectCode: true,
            shortname: true,
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
        TimeSlot: {
          select: {
            id: true,
            name: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    if (!lesson) {
      return next(new AppError("Lesson not found", 404));
    }

    res.status(200).json({
      success: true,
      data: lesson,
    });
  }
);

// Update lesson
export const updateLesson = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const validatedData = updateLessonSchema.safeParse(req.body);

    if (!validatedData.success) {
      return next(new AppError("Invalid lesson data", 400));
    }

    const updateData = validatedData.data;

    // Check if lesson exists
    const existingLesson = await prisma.lesson.findUnique({
      where: { id },
    });

    if (!existingLesson) {
      return next(new AppError("Lesson not found", 404));
    }

    // If updating schedule-related fields, check for conflicts
    if (updateData.teacherId || updateData.streamId || updateData.timeSlotId || updateData.day) {
      const teacherId = updateData.teacherId || existingLesson.teacherId;
      const streamId = updateData.streamId || existingLesson.streamId;
      const timeSlotId = updateData.timeSlotId || existingLesson.timeSlotId;
      const day = updateData.day || existingLesson.day;

      const conflicts = await checkLessonConflicts(teacherId, streamId, timeSlotId, day, id);

      if (conflicts.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Lesson conflicts detected",
          conflicts,
        });
      }
    }

    const updatedLesson = await prisma.lesson.update({
      where: { id },
      data: updateData,
      include: {
        Teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        Subject: {
          select: {
            id: true,
            name: true,
            subjectCode: true,
            shortname: true,
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
        TimeSlot: {
          select: {
            id: true,
            name: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: updatedLesson,
      message: "Lesson updated successfully",
    });
  }
);

// Delete lesson
export const deleteLesson = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const lesson = await prisma.lesson.findUnique({
      where: { id },
    });

    if (!lesson) {
      return next(new AppError("Lesson not found", 404));
    }

    await prisma.lesson.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: "Lesson deleted successfully",
    });
  }
);

// Get timetable for a specific stream
export const getStreamTimetable = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { streamId } = req.params;

    const lessons = await prisma.lesson.findMany({
      where: { streamId },
      include: {
        Teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        Subject: {
          select: {
            id: true,
            name: true,
            subjectCode: true,
            shortname: true,
          },
        },
        TimeSlot: {
          select: {
            id: true,
            name: true,
            startTime: true,
            endTime: true,
          },
        },
      },
      orderBy: [
        { day: 'asc' },
        { TimeSlot: { startTime: 'asc' } },
      ],
    });

    const timetable = formatTimetableData(lessons);

    res.status(200).json({
      success: true,
      data: timetable,
    });
  }
);

// Get teacher's timetable
export const getTeacherTimetable = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { teacherId } = req.params;

    const lessons = await prisma.lesson.findMany({
      where: { teacherId },
      include: {
        Subject: {
          select: {
            id: true,
            name: true,
            subjectCode: true,
            shortname: true,
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
        TimeSlot: {
          select: {
            id: true,
            name: true,
            startTime: true,
            endTime: true,
          },
        },
      },
      orderBy: [
        { day: 'asc' },
        { TimeSlot: { startTime: 'asc' } },
      ],
    });

    const timetable = formatTimetableData(lessons);

    res.status(200).json({
      success: true,
      data: timetable,
    });
  }
);

// Helper function to format timetable data
function formatTimetableData(lessons: any[]) {
  const days = ['1', '2', '3', '4', '5']; // Monday to Friday
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
  const timetable = days.map((day, index) => ({
    day,
    dayName: dayNames[index],
    lessons: lessons
      .filter(lesson => lesson.day === day)
      .sort((a, b) => a.TimeSlot.startTime.localeCompare(b.TimeSlot.startTime)),
  }));

  // Get all unique time slots for the grid
  const timeSlots = [...new Set(lessons.map(lesson => lesson.TimeSlot.id))]
    .map(id => lessons.find(lesson => lesson.TimeSlot.id === id)?.TimeSlot)
    .filter(Boolean)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return {
    timetable,
    timeSlots,
    totalLessons: lessons.length,
  };
}
