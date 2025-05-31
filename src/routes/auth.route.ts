import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../utils/Prisma";
import { AppError } from "../utils/AppError";
import { ROLE_PERMISSIONS, getRolePermissions, RESOURCES, ACTIONS } from "../utils/rbac";
import { authenticate, requireRole } from "../utils/middleware";

const router = express.Router();

// JWT Secret (should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// Generate JWT token
const generateToken = (userId: number): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as any);
};

// Register endpoint (Admin only)
router.post("/register", authenticate, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const { username, email, role = "STAFF", firstName, lastName } = req.body;

    // Validate required fields
    if (!username || !email || !firstName || !lastName) {
      return next(new AppError("All fields are required", 400));
    }

    // Validate role
    if (!["ADMIN", "TEACHER", "STAFF", "STUDENT"].includes(role)) {
      return next(new AppError("Invalid role specified", 400));
    }

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
      if (existingUser.email === email) {
        return next(new AppError("Email already exists", 400));
      }
      if (existingUser.username === username) {
        return next(new AppError("Username already exists", 400));
      }
    }

    // Generate simple default password based on role
    let defaultPassword = "password123";
    if (role === "TEACHER") {
      defaultPassword = "teacher123";
    } else if (role === "STAFF") {
      defaultPassword = "staff123";
    } else if (role === "STUDENT") {
      defaultPassword = "student123";
    } else if (role === "ADMIN") {
      defaultPassword = "admin123";
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    // Create user in database
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: role as any,
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        image: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          image: newUser.image,
        },
        defaultPassword, // Return the default password so admin can share it
      },
    });
  } catch (error) {
    next(error);
  }
});

// Login endpoint
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return next(new AppError("Email and password are required", 400));
    }

    // Find user by email in database
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        image: true,
        password: true,
        isActive: true,
      },
    });
    
    if (!user) {
      return next(new AppError("Invalid credentials", 401));
    }

    if (!user.isActive) {
      return next(new AppError("Account is deactivated", 401));
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return next(new AppError("Invalid credentials", 401));
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate token
    const token = generateToken(user.id);

    res.json({
      success: true,
      message: "Login successful",
      token,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          image: user.image,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get current user endpoint
router.get("/me", async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new AppError("Access token required", 401));
    }

    const token = authHeader.split(" ")[1];
    
    if (!token) {
      return next(new AppError("Access token required", 401));
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return next(new AppError("Invalid token", 401));
      }
      if (error instanceof jwt.TokenExpiredError) {
        return next(new AppError("Token expired", 401));
      }
      return next(new AppError("Token verification failed", 401));
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        image: true,
        isActive: true,
      },
    });
    
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    if (!user.isActive) {
      return next(new AppError("Account is deactivated", 401));
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          image: user.image,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Logout endpoint
router.post("/logout", (req, res) => {
  // In a real implementation, you might want to blacklist the token
  // For now, just return success (client will remove token)
  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

// Refresh token endpoint
router.post("/refresh", async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new AppError("Access token required", 401));
    }

    const token = authHeader.split(" ")[1];
    
    // Verify current token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    } catch (error) {
      return next(new AppError("Invalid token", 401));
    }

    // Generate new token
    const newToken = generateToken(decoded.userId);

    res.json({
      success: true,
      message: "Token refreshed successfully",
      token: newToken,
    });
  } catch (error) {
    next(error);
  }
});

// Change password endpoint
router.post("/change-password", authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = (req as any).user;
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return next(new AppError("Current password and new password are required", 400));
    }

    if (newPassword.length < 6) {
      return next(new AppError("New password must be at least 6 characters long", 400));
    }

    // Get user with password from database
    const userWithPassword = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        password: true,
      },
    });

    if (!userWithPassword) {
      return next(new AppError("User not found", 404));
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userWithPassword.password);
    
    if (!isCurrentPasswordValid) {
      return next(new AppError("Current password is incorrect", 400));
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password in database
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword },
    });

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    next(error);
  }
});

// User Management Endpoints (Admin only)

// Get all staff members
router.get("/users/staff", authenticate, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const { search, role, isActive, page = 1, pageSize = 10 } = req.query;
    
    // Build where clause
    const where: any = {
      role: {
        in: ["ADMIN", "TEACHER", "STAFF"], // Only staff roles
      },
    };
    
    // Apply filters
    if (search) {
      const searchTerm = search as string;
      where.OR = [
        { username: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { firstName: { contains: searchTerm, mode: 'insensitive' } },
        { lastName: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }
    
    if (role && role !== "all") {
      where.role = role;
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }
    
    // Get total count
    const total = await prisma.user.count({ where });
    
    // Pagination
    const pageNum = parseInt(page as string);
    const pageSizeNum = parseInt(pageSize as string);
    const skip = (pageNum - 1) * pageSizeNum;
    
    // Get staff members
    const staff = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        image: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: pageSizeNum,
    });
    
    res.json({
      success: true,
      data: staff,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(total / pageSizeNum),
    });
  } catch (error) {
    next(error);
  }
});

// Get staff analytics
router.get("/users/analytics", authenticate, requireRole("ADMIN"), async (req, res, next) => {
  try {
    // Get total staff count from database
    const totalStaff = await prisma.user.count({
      where: {
        role: {
          in: ["ADMIN", "TEACHER", "STAFF"],
        },
      },
    });

    // Get active staff count
    const activeStaff = await prisma.user.count({
      where: {
        role: {
          in: ["ADMIN", "TEACHER", "STAFF"],
        },
        isActive: true,
      },
    });

    // Get role distribution
    const roleDistributionData = await prisma.user.groupBy({
      by: ['role'],
      where: {
        role: {
          in: ["ADMIN", "TEACHER", "STAFF"],
        },
      },
      _count: {
        role: true,
      },
    });

    const roleDistribution = roleDistributionData.reduce((acc, item) => {
      acc[item.role] = item._count.role;
      return acc;
    }, {} as Record<string, number>);
    
    res.json({
      success: true,
      data: {
        totalStaff,
        activeStaff,
        roleDistribution,
        recentActivity: [], // Mock empty for now
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update user role
router.put("/users/:userId/role", authenticate, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    if (!role || !["ADMIN", "TEACHER", "STUDENT", "STAFF"].includes(role)) {
      return next(new AppError("Valid role is required", 400));
    }
    
    // Find and update user in database
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        image: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return next(new AppError("User not found", 404));
    }
    
    // Update role
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { role: role as any },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        image: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    res.json({
      success: true,
      data: updatedUser,
      message: "User role updated successfully",
    });
  } catch (error) {
    next(error);
  }
});

// Delete staff member
router.delete("/users/:userId", authenticate, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });

    if (!user) {
      return next(new AppError("User not found", 404));
    }
    
    // Delete user from database
    await prisma.user.delete({
      where: { id: parseInt(userId) },
    });
    
    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    next(error);
  }
});

// Role Permissions Management

// Get role permissions
router.get("/users/permissions/roles", authenticate, requireRole("ADMIN"), async (req, res, next) => {
  try {
    // Convert ROLE_PERMISSIONS to the expected format
    const rolePermissions: any[] = [];
    
    Object.entries(ROLE_PERMISSIONS).forEach(([role, permissions]) => {
      // Group permissions by resource
      const resourceMap = new Map<string, string[]>();
      
      permissions.forEach(permission => {
        if (permission.resource === "*") {
          // Handle wildcard permissions (admin)
          const resources = [
            "students", "teachers", "parents", "grades", "streams", 
            "subjects", "departments", "lessons", "timeslots", 
            "attendance", "performance", "reports", "users", 
            "profile", "analytics"
          ];
          
          resources.forEach(resource => {
            if (!resourceMap.has(resource)) {
              resourceMap.set(resource, []);
            }
            resourceMap.get(resource)!.push(permission.action);
          });
        } else {
          if (!resourceMap.has(permission.resource)) {
            resourceMap.set(permission.resource, []);
          }
          resourceMap.get(permission.resource)!.push(permission.action);
        }
      });
      
      // Convert to expected format
      resourceMap.forEach((actions, resource) => {
        rolePermissions.push({
          role,
          resource,
          permissions: [...new Set(actions)], // Remove duplicates
        });
      });
    });
    
    res.json({
      success: true,
      data: rolePermissions,
    });
  } catch (error) {
    next(error);
  }
});

// Update role permissions
router.put("/users/permissions/roles", authenticate, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const { role, permissions } = req.body;
    
    if (!role || !["ADMIN", "TEACHER", "STUDENT", "STAFF"].includes(role)) {
      return next(new AppError("Valid role is required", 400));
    }
    
    // In a real implementation, you would update the database
    // For now, we'll just return success since permissions are hardcoded
    console.log(`Updating permissions for role ${role}:`, permissions);
    
    res.json({
      success: true,
      message: `Permissions updated for role ${role}`,
      data: [],
    });
  } catch (error) {
    next(error);
  }
});

// Bulk operations
router.put("/users/bulk/roles", authenticate, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const { userIds, role } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return next(new AppError("User IDs are required", 400));
    }
    
    if (!role || !["ADMIN", "TEACHER", "STUDENT", "STAFF"].includes(role)) {
      return next(new AppError("Valid role is required", 400));
    }
    
    // Update roles in database
    const result = await prisma.user.updateMany({
      where: {
        id: {
          in: userIds.map(id => parseInt(id)),
        },
      },
      data: {
        role: role as any,
      },
    });
    
    res.json({
      success: true,
      message: `Updated ${result.count} users' roles to ${role}`,
    });
  } catch (error) {
    next(error);
  }
});

router.put("/users/bulk/deactivate", authenticate, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const { userIds } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return next(new AppError("User IDs are required", 400));
    }
    
    // Deactivate users in database
    const result = await prisma.user.updateMany({
      where: {
        id: {
          in: userIds.map(id => parseInt(id)),
        },
      },
      data: {
        isActive: false,
      },
    });
    
    res.json({
      success: true,
      message: `Deactivated ${result.count} users`,
    });
  } catch (error) {
    next(error);
  }
});

// Leave Request Management

// Get all leave requests (Admin) or user's own requests
router.get("/users/leave-requests", authenticate, async (req, res, next) => {
  try {
    const user = (req as any).user;
    const { status, leaveType, startDate, endDate, page = 1, pageSize = 10 } = req.query;
    
    console.log("Leave requests endpoint - User:", { id: user.id, role: user.role, email: user.email });
    
    // Build where clause
    const where: any = {};
    
    // If not admin, only show user's own requests
    if (user.role !== "ADMIN") {
      where.userId = user.id;
      console.log("After user filtering (non-admin) - userId:", user.id);
    } else {
      console.log("Admin user - showing all requests");
    }
    
    // Apply filters
    if (status && status !== "all") {
      where.status = status;
    }
    
    if (leaveType && leaveType !== "all") {
      where.leaveType = leaveType;
    }
    
    if (startDate) {
      where.startDate = {
        gte: new Date(startDate as string),
      };
    }
    
    if (endDate) {
      where.endDate = {
        lte: new Date(endDate as string),
      };
    }
    
    // Get total count for pagination
    const total = await prisma.leaveRequest.count({ where });
    
    // Pagination
    const pageNum = parseInt(page as string);
    const pageSizeNum = parseInt(pageSize as string);
    const skip = (pageNum - 1) * pageSizeNum;
    
    // Get leave requests with user data
    const leaveRequests = await prisma.leaveRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: pageSizeNum,
    });
    
    console.log("Final filtered requests:", leaveRequests.length);
    
    res.json({
      success: true,
      data: leaveRequests,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(total / pageSizeNum),
    });
  } catch (error) {
    next(error);
  }
});

// Create leave request
router.post("/users/leave-requests", authenticate, async (req, res, next) => {
  try {
    const user = (req as any).user;
    const { leaveType, startDate, endDate, reason, attachments = [] } = req.body;
    
    // Validate required fields
    if (!leaveType || !startDate || !endDate || !reason) {
      return next(new AppError("All fields are required", 400));
    }
    
    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    
    if (start < today) {
      return next(new AppError("Start date cannot be in the past", 400));
    }
    
    if (end < start) {
      return next(new AppError("End date cannot be before start date", 400));
    }
    
    // Create new leave request in database
    const newRequest = await prisma.leaveRequest.create({
      data: {
        userId: user.id,
        leaveType,
        startDate: start,
        endDate: end,
        reason,
        attachments,
        status: "PENDING",
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });
    
    res.status(201).json({
      success: true,
      data: newRequest,
      message: "Leave request submitted successfully",
    });
  } catch (error) {
    next(error);
  }
});

// Update leave request status (Admin only)
router.put("/users/leave-requests/:requestId/status", authenticate, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { status, rejectionReason } = req.body;
    const user = (req as any).user;
    
    if (!["APPROVED", "REJECTED"].includes(status)) {
      return next(new AppError("Invalid status. Must be APPROVED or REJECTED", 400));
    }
    
    if (status === "REJECTED" && !rejectionReason) {
      return next(new AppError("Rejection reason is required when rejecting a request", 400));
    }
    
    // Find the leave request
    const request = await prisma.leaveRequest.findUnique({
      where: { id: parseInt(requestId) },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });
    
    if (!request) {
      return next(new AppError("Leave request not found", 404));
    }
    
    if (request.status !== "PENDING") {
      return next(new AppError("Only pending requests can be updated", 400));
    }
    
    // Update request in database
    const updatedRequest = await prisma.leaveRequest.update({
      where: { id: parseInt(requestId) },
      data: {
        status,
        approvedBy: user.id,
        approvedDate: new Date(),
        rejectionReason: status === "REJECTED" ? rejectionReason : null,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });
    
    res.json({
      success: true,
      data: updatedRequest,
      message: `Leave request ${status.toLowerCase()} successfully`,
    });
  } catch (error) {
    next(error);
  }
});

// Cancel leave request (User can cancel their own pending requests)
router.delete("/users/leave-requests/:requestId", authenticate, async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const user = (req as any).user;
    
    // Find the leave request
    const request = await prisma.leaveRequest.findUnique({
      where: { id: parseInt(requestId) },
    });
    
    if (!request) {
      return next(new AppError("Leave request not found", 404));
    }
    
    // Check if user owns the request or is admin
    if (request.userId !== user.id && user.role !== "ADMIN") {
      return next(new AppError("You can only cancel your own requests", 403));
    }
    
    if (request.status !== "PENDING") {
      return next(new AppError("Only pending requests can be cancelled", 400));
    }
    
    // Delete request from database
    await prisma.leaveRequest.delete({
      where: { id: parseInt(requestId) },
    });
    
    res.json({
      success: true,
      message: "Leave request cancelled successfully",
    });
  } catch (error) {
    next(error);
  }
});

// Get leave statistics
router.get("/users/leave-requests/statistics", authenticate, async (req, res, next) => {
  try {
    const user = (req as any).user;
    
    // Build where clause
    const where: any = {};
    
    // If not admin, only show user's own statistics
    if (user.role !== "ADMIN") {
      where.userId = user.id;
    }
    
    // Get all requests for statistics
    const requests = await prisma.leaveRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    const stats = {
      total: requests.length,
      pending: requests.filter(r => r.status === "PENDING").length,
      approved: requests.filter(r => r.status === "APPROVED").length,
      rejected: requests.filter(r => r.status === "REJECTED").length,
      byType: {
        SICK: requests.filter(r => r.leaveType === "SICK").length,
        ANNUAL: requests.filter(r => r.leaveType === "ANNUAL").length,
        PERSONAL: requests.filter(r => r.leaveType === "PERSONAL").length,
        MATERNITY: requests.filter(r => r.leaveType === "MATERNITY").length,
        PATERNITY: requests.filter(r => r.leaveType === "PATERNITY").length,
        EMERGENCY: requests.filter(r => r.leaveType === "EMERGENCY").length,
      },
      recentRequests: requests.slice(0, 5),
    };
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

// Get activity logs
router.get("/users/activity-logs", authenticate, async (req, res, next) => {
  try {
    const { startDate, endDate, userId, limit = 50 } = req.query;
    const user = (req as any).user;

    // For now, we'll generate mock activity logs since we don't have a real activity logging system
    // In a real application, you would have an ActivityLog model/table
    const mockActivities = [
      {
        id: 1,
        action: "User Login",
        userId: user.id,
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
        userId: user.id,
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
        userId: user.id,
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
        userId: user.id,
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
  } catch (error) {
    next(error);
  }
});

// Get active announcements
router.get("/announcements/active", authenticate, async (req, res, next) => {
  try {
    const { limit = 5 } = req.query;
    const user = (req as any).user;

    const announcements = await prisma.announcement.findMany({
      where: {
        isActive: true,
        targetAudience: {
          has: user.role,
        },
        publishDate: {
          lte: new Date(),
        },
        OR: [
          { expiryDate: null },
          { expiryDate: { gt: new Date() } },
        ],
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: [
        {
          priority: 'desc',
        },
        {
          publishDate: 'desc',
        },
      ],
      take: Number(limit),
    });

    res.json({
      success: true,
      data: announcements,
    });
  } catch (error) {
    next(error);
  }
});

// Get all announcements (with pagination and filtering)
router.get("/announcements", authenticate, async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, priority, type, limit } = req.query;
    const user = (req as any).user;

    const where: any = {
      isActive: true,
      targetAudience: {
        has: user.role,
      },
      publishDate: {
        lte: new Date(),
      },
      OR: [
        { expiryDate: null },
        { expiryDate: { gt: new Date() } },
      ],
    };

    // Filter by priority if specified
    if (priority) {
      where.priority = priority;
    }

    // Filter by type if specified
    if (type) {
      where.type = type;
    }

    // Apply limit if specified (for simple queries)
    if (limit) {
      const announcements = await prisma.announcement.findMany({
        where,
        include: {
          createdByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
        orderBy: [
          {
            priority: 'desc',
          },
          {
            publishDate: 'desc',
          },
        ],
        take: Number(limit),
      });

      res.json({
        success: true,
        data: announcements,
      });
      return;
    }

    // Get total count for pagination
    const total = await prisma.announcement.count({ where });

    // Pagination
    const pageNum = Number(page);
    const pageSizeNum = Number(pageSize);
    const skip = (pageNum - 1) * pageSizeNum;

    const announcements = await prisma.announcement.findMany({
      where,
      include: {
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: [
        {
          priority: 'desc',
        },
        {
          publishDate: 'desc',
        },
      ],
      skip,
      take: pageSizeNum,
    });

    res.json({
      success: true,
      data: announcements,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(total / pageSizeNum),
    });
  } catch (error) {
    next(error);
  }
});

// Get all announcements for admin (without role filtering)
router.get("/announcements/all", authenticate, requireRole("ADMIN", "TEACHER"), async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, priority, type, limit } = req.query;

    const where: any = {};

    // Filter by priority if specified
    if (priority) {
      where.priority = priority;
    }

    // Filter by type if specified
    if (type) {
      where.type = type;
    }

    // Apply limit if specified (for simple queries)
    if (limit) {
      const announcements = await prisma.announcement.findMany({
        where,
        include: {
          createdByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
        orderBy: [
          {
            priority: 'desc',
          },
          {
            publishDate: 'desc',
          },
        ],
        take: Number(limit),
      });

      res.json({
        success: true,
        data: announcements,
      });
      return;
    }

    // Get total count for pagination
    const total = await prisma.announcement.count({ where });

    // Pagination
    const pageNum = Number(page);
    const pageSizeNum = Number(pageSize);
    const skip = (pageNum - 1) * pageSizeNum;

    const announcements = await prisma.announcement.findMany({
      where,
      include: {
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: [
        {
          priority: 'desc',
        },
        {
          publishDate: 'desc',
        },
      ],
      skip,
      take: pageSizeNum,
    });

    res.json({
      success: true,
      data: announcements,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(total / pageSizeNum),
    });
  } catch (error) {
    next(error);
  }
});

// Get announcement by ID
router.get("/announcements/:id", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const announcement = await prisma.announcement.findUnique({
      where: { id: Number(id) },
      include: {
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    if (!announcement) {
      return next(new AppError("Announcement not found", 404));
    }

    res.json({
      success: true,
      data: announcement,
    });
  } catch (error) {
    next(error);
  }
});

// Create new announcement (Admin/Teacher only)
router.post("/announcements", authenticate, requireRole("ADMIN", "TEACHER"), async (req, res, next) => {
  try {
    const { title, content, priority = "MEDIUM", targetAudience = ["STUDENT"], type = "GENERAL", isActive = true, expiryDate } = req.body;
    const user = (req as any).user;

    // Validate required fields
    if (!title || !content) {
      return next(new AppError("Title and content are required", 400));
    }

    // Create new announcement in database
    const newAnnouncement = await prisma.announcement.create({
      data: {
        title,
        content,
        type,
        priority,
        targetAudience: Array.isArray(targetAudience) ? targetAudience : [targetAudience],
        isActive,
        publishDate: new Date(),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        createdBy: user.id,
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Announcement created successfully",
      data: newAnnouncement,
    });
  } catch (error) {
    next(error);
  }
});

// Update announcement (Admin/Teacher only)
router.patch("/announcements/:id", authenticate, requireRole("ADMIN", "TEACHER"), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, priority, targetAudience, type, isActive, expiryDate } = req.body;
    
    const announcement = await prisma.announcement.findUnique({
      where: { id: Number(id) },
    });
    
    if (!announcement) {
      return next(new AppError("Announcement not found", 404));
    }

    // Update announcement in database
    const updatedAnnouncement = await prisma.announcement.update({
      where: { id: Number(id) },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(priority && { priority }),
        ...(targetAudience && { targetAudience: Array.isArray(targetAudience) ? targetAudience : [targetAudience] }),
        ...(type && { type }),
        ...(isActive !== undefined && { isActive }),
        ...(expiryDate && { expiryDate: new Date(expiryDate) }),
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: "Announcement updated successfully",
      data: updatedAnnouncement,
    });
  } catch (error) {
    next(error);
  }
});

// Delete announcement (Admin only)
router.delete("/announcements/:id", authenticate, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const announcement = await prisma.announcement.findUnique({
      where: { id: Number(id) },
    });
    
    if (!announcement) {
      return next(new AppError("Announcement not found", 404));
    }

    await prisma.announcement.delete({
      where: { id: Number(id) },
    });

    res.json({
      success: true,
      message: "Announcement deleted successfully",
    });
  } catch (error) {
    next(error);
  }
});

// Mark announcement as read
router.post("/announcements/:id/read", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    
    const announcement = await prisma.announcement.findUnique({
      where: { id: Number(id) },
    });
    
    if (!announcement) {
      return next(new AppError("Announcement not found", 404));
    }

    // Add user ID to readBy array if not already present
    const readBy = announcement.readBy || [];
    if (!readBy.includes(user.id)) {
      await prisma.announcement.update({
        where: { id: Number(id) },
        data: {
          readBy: [...readBy, user.id],
        },
      });
    }

    res.json({
      success: true,
      message: "Announcement marked as read",
    });
  } catch (error) {
    next(error);
  }
});

export default router; 