import { NextFunction, Request, Response } from "express";
import slugify from "slugify";
import { z } from "zod";
import { AppError } from "../utils/AppError";
import { catchAsync } from "../utils/catchAsync";
import { prisma } from "../utils/Prisma";

// Validation schemas
const subjectSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  subjectCode: z.string().min(1, "Subject code is required"),
  shortname: z.string().min(1, "Short name is required"),
  departmentId: z.string().min(1, "Department is required"),
  active: z.boolean().optional().default(true),
  optional: z.boolean().optional().default(false),
  fieldtrips: z.boolean().optional().default(false),
  labRequired: z.boolean().optional().default(false),
});

const updateSubjectSchema = subjectSchema.partial();

// Get all subjects with filtering
export const getSubjects = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { departmentId, active, optional, search } = req.query;

    const whereClause: any = {};

    if (departmentId) whereClause.departmentId = departmentId as string;
    if (active !== undefined) whereClause.active = active === 'true';
    if (optional !== undefined) whereClause.optional = optional === 'true';
    if (search) {
      whereClause.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { subjectCode: { contains: search as string, mode: 'insensitive' } },
        { shortname: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const subjects = await prisma.subject.findMany({
      where: whereClause,
      include: {
        Department: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        teachers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            teachers: true,
            Lesson: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.status(200).json({
      success: true,
      data: subjects,
      count: subjects.length,
    });
  }
);

// Get subject by ID
export const getSubjectById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const subject = await prisma.subject.findUnique({
      where: { id },
      include: {
        Department: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        teachers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            specialization: true,
          },
        },
        Lesson: {
          include: {
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
        },
        _count: {
          select: {
            teachers: true,
            Lesson: true,
          },
        },
      },
    });

    if (!subject) {
      return next(new AppError("Subject not found", 404));
    }

    res.status(200).json({
      success: true,
      data: subject,
    });
  }
);

// Create subject
export const createSubject = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const validatedData = subjectSchema.safeParse(req.body);

    if (!validatedData.success) {
      return next(new AppError("Invalid subject data", 400));
    }

    const data = validatedData.data;

    // Check if subject code already exists
    const existingSubject = await prisma.subject.findUnique({
      where: { subjectCode: data.subjectCode },
    });

    if (existingSubject) {
      return next(new AppError("Subject code already exists", 400));
    }

    // Check if subject name already exists
    const existingName = await prisma.subject.findUnique({
      where: { name: data.name },
    });

    if (existingName) {
      return next(new AppError("Subject name already exists", 400));
    }

    // Verify department exists
    const department = await prisma.department.findUnique({
      where: { id: data.departmentId },
    });

    if (!department) {
      return next(new AppError("Department not found", 404));
    }

    const newSubject = await prisma.subject.create({
      data: {
        ...data,
        slug: slugify(data.name, { lower: true }),
      },
      include: {
        Department: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: newSubject,
      message: "Subject created successfully",
    });
  }
);

// Update subject
export const updateSubject = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const validatedData = updateSubjectSchema.safeParse(req.body);

    if (!validatedData.success) {
      return next(new AppError("Invalid subject data", 400));
    }

    const updateData: any = { ...validatedData.data };

    // Check if subject exists
    const existingSubject = await prisma.subject.findUnique({
      where: { id },
    });

    if (!existingSubject) {
      return next(new AppError("Subject not found", 404));
    }

    // Check for duplicate subject code if being updated
    if (updateData.subjectCode && updateData.subjectCode !== existingSubject.subjectCode) {
      const duplicateCode = await prisma.subject.findUnique({
        where: { subjectCode: updateData.subjectCode },
      });

      if (duplicateCode) {
        return next(new AppError("Subject code already exists", 400));
      }
    }

    // Check for duplicate subject name if being updated
    if (updateData.name && updateData.name !== existingSubject.name) {
      const duplicateName = await prisma.subject.findUnique({
        where: { name: updateData.name },
      });

      if (duplicateName) {
        return next(new AppError("Subject name already exists", 400));
      }
    }

    // Update slug if name is being updated
    if (updateData.name) {
      updateData.slug = slugify(updateData.name, { lower: true });
    }

    const updatedSubject = await prisma.subject.update({
      where: { id },
      data: updateData,
      include: {
        Department: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        teachers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            teachers: true,
            Lesson: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: updatedSubject,
      message: "Subject updated successfully",
    });
  }
);

// Delete subject
export const deleteSubject = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const subject = await prisma.subject.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            Lesson: true,
            teachers: true,
          },
        },
      },
    });

    if (!subject) {
      return next(new AppError("Subject not found", 404));
    }

    // Check if subject has lessons or teachers assigned
    if (subject._count.Lesson > 0) {
      return next(new AppError("Cannot delete subject with existing lessons", 400));
    }

    if (subject._count.teachers > 0) {
      return next(new AppError("Cannot delete subject with assigned teachers", 400));
    }

    await prisma.subject.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: "Subject deleted successfully",
    });
  }
);

// Assign teacher to subject
export const assignTeacherToSubject = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { teacherId } = req.body;

    if (!teacherId) {
      return next(new AppError("Teacher ID is required", 400));
    }

    // Check if subject exists
    const subject = await prisma.subject.findUnique({
      where: { id },
    });

    if (!subject) {
      return next(new AppError("Subject not found", 404));
    }

    // Check if teacher exists
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      return next(new AppError("Teacher not found", 404));
    }

    // Check if teacher is already assigned to this subject
    const existingAssignment = await prisma.teacher.findFirst({
      where: {
        id: teacherId,
        subjects: {
          some: {
            id: id,
          },
        },
      },
    });

    if (existingAssignment) {
      return next(new AppError("Teacher is already assigned to this subject", 400));
    }

    // Assign teacher to subject
    await prisma.teacher.update({
      where: { id: teacherId },
      data: {
        subjects: {
          connect: { id: id },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Teacher assigned to subject successfully",
    });
  }
);

// Remove teacher from subject
export const removeTeacherFromSubject = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { teacherId } = req.body;

    if (!teacherId) {
      return next(new AppError("Teacher ID is required", 400));
    }

    // Check if subject exists
    const subject = await prisma.subject.findUnique({
      where: { id },
    });

    if (!subject) {
      return next(new AppError("Subject not found", 404));
    }

    // Check if teacher is assigned to this subject
    const existingAssignment = await prisma.teacher.findFirst({
      where: {
        id: teacherId,
        subjects: {
          some: {
            id: id,
          },
        },
      },
    });

    if (!existingAssignment) {
      return next(new AppError("Teacher is not assigned to this subject", 400));
    }

    // Check if teacher has lessons for this subject
    const hasLessons = await prisma.lesson.findFirst({
      where: {
        teacherId: teacherId,
        subjectId: id,
      },
    });

    if (hasLessons) {
      return next(new AppError("Cannot remove teacher who has lessons for this subject", 400));
    }

    // Remove teacher from subject
    await prisma.teacher.update({
      where: { id: teacherId },
      data: {
        subjects: {
          disconnect: { id: id },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Teacher removed from subject successfully",
    });
  }
);
