import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "./Prisma";
import { AppError } from "./AppError";
import { hasPermission, RESOURCES, ACTIONS } from "./rbac";
import { Role } from "@prisma/client";

// Define user interface
export interface AuthUser {
  id: number;
  email: string;
  username: string;
  role: Role;
  image?: string | null;
}

// Authentication middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new AppError("Access token required", 401));
    }

    const token = authHeader.split(" ")[1];
    
    if (!token) {
      return next(new AppError("Access token required", 401));
    }

    // Use the same JWT_SECRET as in auth routes
    const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this-in-production";

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    
    // Validate decoded token structure
    if (!decoded || typeof decoded.userId !== 'number') {
      return next(new AppError("Invalid token format", 401));
    }
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        image: true,
        isActive: true,
      },
    });

    if (!user) {
      return next(new AppError("User not found", 401));
    }

    if (!user.isActive) {
      return next(new AppError("Account is deactivated", 401));
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Attach user to request with proper role typing
    (req as any).user = {
      ...user,
      role: user.role as Role
    };
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError("Invalid token", 401));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError("Token expired", 401));
    }
    next(new AppError("Authentication failed", 401));
  }
};

// Authorization middleware factory
export const authorize = (
  resource: string,
  action: "create" | "read" | "update" | "delete",
  getContext?: (req: Request) => Record<string, any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as AuthUser;
    if (!user) {
      return next(new AppError("Authentication required", 401));
    }

    const context = getContext ? getContext(req) : {};
    context.currentUserId = user.id;

    const hasAccess = hasPermission(user.role, resource, action, context);

    if (!hasAccess) {
      return next(new AppError("Insufficient permissions", 403));
    }

    next();
  };
};

// Role-based middleware
export const requireRole = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as AuthUser;
    if (!user) {
      return next(new AppError("Authentication required", 401));
    }

    if (!roles.includes(user.role)) {
      return next(new AppError("Insufficient permissions", 403));
    }

    next();
  };
};

// Admin only middleware
export const requireAdmin = requireRole("ADMIN");

// Teacher or Admin middleware
export const requireTeacherOrAdmin = requireRole("TEACHER", "ADMIN");

// Staff or Admin middleware  
export const requireStaffOrAdmin = requireRole("STAFF", "ADMIN");

// Self or Admin middleware (for profile operations)
export const requireSelfOrAdmin = (getUserId: (req: Request) => number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as AuthUser;
    if (!user) {
      return next(new AppError("Authentication required", 401));
    }

    const targetUserId = getUserId(req);
    const isOwner = user.id === targetUserId;
    const isAdmin = user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return next(new AppError("Can only access your own data", 403));
    }

    next();
  };
};

// Resource-specific authorization helpers
export const authorizeStudents = {
  create: authorize(RESOURCES.STUDENTS, ACTIONS.CREATE),
  read: authorize(RESOURCES.STUDENTS, ACTIONS.READ),
  update: authorize(RESOURCES.STUDENTS, ACTIONS.UPDATE, (req) => ({
    studentId: req.params.id,
  })),
  delete: authorize(RESOURCES.STUDENTS, ACTIONS.DELETE),
};

export const authorizeTeachers = {
  create: authorize(RESOURCES.TEACHERS, ACTIONS.CREATE),
  read: authorize(RESOURCES.TEACHERS, ACTIONS.READ),
  update: authorize(RESOURCES.TEACHERS, ACTIONS.UPDATE, (req) => ({
    teacherId: req.params.id,
  })),
  delete: authorize(RESOURCES.TEACHERS, ACTIONS.DELETE),
};

export const authorizeLessons = {
  create: authorize(RESOURCES.LESSONS, ACTIONS.CREATE, (req) => ({
    teacherId: req.body.teacherId,
  })),
  read: authorize(RESOURCES.LESSONS, ACTIONS.READ),
  update: authorize(RESOURCES.LESSONS, ACTIONS.UPDATE, (req) => ({
    teacherId: req.body.teacherId,
  })),
  delete: authorize(RESOURCES.LESSONS, ACTIONS.DELETE, (req) => ({
    teacherId: req.body.teacherId,
  })),
};

export const authorizeAttendance = {
  create: authorize(RESOURCES.ATTENDANCE, ACTIONS.CREATE),
  read: authorize(RESOURCES.ATTENDANCE, ACTIONS.READ, (req) => ({
    studentId: req.params.studentId,
  })),
  update: authorize(RESOURCES.ATTENDANCE, ACTIONS.UPDATE),
  delete: authorize(RESOURCES.ATTENDANCE, ACTIONS.DELETE),
};

// Optional authentication (for public endpoints that can benefit from user context)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.split(" ")[1];
    
    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        image: true,
      },
    });

    if (user) {
      (req as any).user = {
        ...user,
        role: user.role as Role
      };
    }
    
    next();
  } catch (error) {
    // Ignore auth errors for optional auth
    next();
  }
}; 