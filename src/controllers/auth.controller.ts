import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { 
  SigninSchema, 
  SignupSchema, 
  ChangePasswordSchema, 
  ResetPasswordSchema,
  UpdateProfileSchema 
} from "../utils/validation";
import { AppError } from "../utils/AppError";
import bcrypt from "bcrypt";
import { prisma } from "../utils/Prisma";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { Role } from "@prisma/client";

// Extend Express Request interface
declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: number;
      email: string;
      username: string;
      role: string;
      image?: string;
    };
  }
}

const signJwt = (id: number) => {
  return jwt.sign(
    { userId: id },
    process.env.JWT_SECRET as Secret,
    {
      expiresIn: process.env.JWT_EXPIRE || "7d",
    } as SignOptions
  );
};

const createSendToken = (user: any, statusCode: number, res: Response) => {
  const token = signJwt(user.id);
  
  const cookieOptions = {
    expires: new Date(
      Date.now() + (parseInt(process.env.JWT_COOKIE_EXPIRES_IN || "7") * 24 * 60 * 60 * 1000)
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
  };

  res.cookie("jwtToken", token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    token,
    data: {
      user,
    },
  });
};

export const signup = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const validatedData = SignupSchema.safeParse(req.body);

    if (!validatedData.success) {
      return next(new AppError(validatedData.error.errors[0].message, 400));
    }

    const { email, password, username, role } = validatedData.data;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username },
        ],
      },
    });

    if (existingUser) {
      return next(new AppError("User with this email or username already exists", 409));
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        password: passwordHash,
        username,
        email,
        role: role as Role,
        firstName: "User",
        lastName: "Account",
      },
    });

    createSendToken(newUser, 201, res);
  }
);

export const signin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const validatedData = SigninSchema.safeParse(req.body);

    if (!validatedData.success) {
      return next(new AppError(validatedData.error.errors[0].message, 400));
    }
    
    const { password, username } = validatedData.data;

    const user = await prisma.user.findUnique({
      where: {
        username,
      },
    });

    if (!user) {
      return next(new AppError("Invalid credentials", 401));
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return next(new AppError("Invalid credentials", 401));
    }

    createSendToken(user, 200, res);
  }
);

export const logout = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    res.cookie("jwtToken", "loggedout", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  }
);

export const getMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  }
);

export const updateProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    const validatedData = UpdateProfileSchema.safeParse(req.body);

    if (!validatedData.success) {
      return next(new AppError(validatedData.error.errors[0].message, 400));
    }

    const { username, email, image } = validatedData.data;

    // Check if username or email already exists (excluding current user)
    if (username || email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: req.user.id } },
            {
              OR: [
                username ? { username } : {},
                email ? { email } : {},
              ].filter(obj => Object.keys(obj).length > 0),
            },
          ],
        },
      });

      if (existingUser) {
        return next(new AppError("Username or email already taken", 409));
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(username && { username }),
        ...(email && { email }),
        ...(image && { image }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        user: updatedUser,
      },
    });
  }
);

export const changePassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    const validatedData = ChangePasswordSchema.safeParse(req.body);

    if (!validatedData.success) {
      return next(new AppError(validatedData.error.errors[0].message, 400));
    }

    const { currentPassword, newPassword } = validatedData.data;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Check current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      return next(new AppError("Current password is incorrect", 400));
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: newPasswordHash },
    });

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  }
);

export const resetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const validatedData = ResetPasswordSchema.safeParse(req.body);

    if (!validatedData.success) {
      return next(new AppError(validatedData.error.errors[0].message, 400));
    }

    const { email } = validatedData.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists or not
      return res.status(200).json({
        success: true,
        message: "If an account with that email exists, a password reset link has been sent.",
      });
    }

    // TODO: Implement email sending logic here
    // For now, just return success message
    res.status(200).json({
      success: true,
      message: "If an account with that email exists, a password reset link has been sent.",
    });
  }
);

export const refreshToken = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    // Generate new token
    const token = signJwt(req.user.id);

    res.status(200).json({
      success: true,
      token,
    });
  }
);

// Admin only: Get all users
export const getAllUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { page = 1, limit = 10, role, search } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { username: { contains: search as string, mode: "insensitive" } },
        { email: { contains: search as string, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          image: true,
          createdAt: true,
          updatedAt: true,
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  }
);

// Admin only: Update user role
export const updateUserRole = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role || !["ADMIN", "TEACHER", "STUDENT", "STAFF"].includes(role)) {
      return next(new AppError("Valid role is required", 400));
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
    });

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    const updatedUser = await prisma.user.update({
      where: { id: Number(userId) },
      data: { role },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        user: updatedUser,
      },
    });
  }
);

// Get activity logs
export const getActivityLogs = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { startDate, endDate, userId, limit = 50 } = req.query;

    const where: any = {};

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    if (userId) {
      where.userId = Number(userId);
    }

    // For now, we'll generate mock activity logs since we don't have a real activity logging system
    // In a real application, you would have an ActivityLog model/table
    const mockActivities = [
      {
        id: 1,
        action: "User Login",
        userId: req.user?.id,
        user: {
          firstName: "John",
          lastName: "Doe",
        },
        details: "Successful login from web browser",
        status: "SUCCESS",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        id: 2,
        action: "Profile Updated",
        userId: req.user?.id,
        user: {
          firstName: "Jane",
          lastName: "Smith",
        },
        details: "Updated profile information",
        status: "SUCCESS",
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      },
      {
        id: 3,
        action: "Password Changed",
        userId: req.user?.id,
        user: {
          firstName: "Admin",
          lastName: "User",
        },
        details: "Password successfully changed",
        status: "SUCCESS",
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      },
      {
        id: 4,
        action: "Failed Login Attempt",
        userId: null,
        user: null,
        details: "Invalid credentials provided",
        status: "FAILED",
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      },
      {
        id: 5,
        action: "User Registration",
        userId: req.user?.id,
        user: {
          firstName: "New",
          lastName: "Teacher",
        },
        details: "New teacher account created",
        status: "SUCCESS",
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      },
    ];

    // Filter by date range if provided
    let filteredActivities = mockActivities;
    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      filteredActivities = mockActivities.filter(
        activity => activity.createdAt >= start && activity.createdAt <= end
      );
    }

    // Limit results
    const limitedActivities = filteredActivities.slice(0, Number(limit));

    res.status(200).json({
      success: true,
      data: limitedActivities,
    });
  }
);
