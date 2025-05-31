import { Role } from "@prisma/client";

// Define permissions for each resource and action
export interface Permission {
  resource: string;
  action: "create" | "read" | "update" | "delete";
  conditions?: Record<string, any>;
}

// Define role-based permissions
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    // Full access to all resources
    { resource: "*", action: "create" },
    { resource: "*", action: "read" },
    { resource: "*", action: "update" },
    { resource: "*", action: "delete" },
  ],
  
  TEACHER: [
    // Students - read and limited update
    { resource: "students", action: "read" },
    { resource: "students", action: "update", conditions: { field: "grades" } },
    
    // Performance - create and read access
    { resource: "performance", action: "create" },
    { resource: "performance", action: "read" },
    { resource: "performance", action: "update", conditions: { teacherId: "self" } },
    
    // Lessons - full access to own lessons
    { resource: "lessons", action: "create", conditions: { teacherId: "self" } },
    { resource: "lessons", action: "read" },
    { resource: "lessons", action: "update", conditions: { teacherId: "self" } },
    { resource: "lessons", action: "delete", conditions: { teacherId: "self" } },
    
    // Subjects - read access and limited update for assigned subjects
    { resource: "subjects", action: "read" },
    { resource: "subjects", action: "update", conditions: { teacherId: "self" } },
    
    // Grades and Streams - read access
    { resource: "grades", action: "read" },
    { resource: "streams", action: "read" },
    
    // Departments - read access
    { resource: "departments", action: "read" },
    
    // Time slots - read access
    { resource: "timeslots", action: "read" },
    
    // Own profile
    { resource: "profile", action: "read" },
    { resource: "profile", action: "update", conditions: { userId: "self" } },
    
    // Attendance
    { resource: "attendance", action: "create" },
    { resource: "attendance", action: "read" },
    { resource: "attendance", action: "update", conditions: { teacherId: "self" } },
  ],
  
  STUDENT: [
    // Own profile and data
    { resource: "profile", action: "read", conditions: { userId: "self" } },
    { resource: "profile", action: "update", conditions: { userId: "self", field: "limited" } },
    
    // Own grades and attendance
    { resource: "grades", action: "read", conditions: { studentId: "self" } },
    { resource: "attendance", action: "read", conditions: { studentId: "self" } },
    
    // Own performance data
    { resource: "performance", action: "read", conditions: { studentId: "self" } },
    
    // Lessons for own stream - read only
    { resource: "lessons", action: "read", conditions: { streamId: "self" } },
    
    // Subjects for own grade - read only
    { resource: "subjects", action: "read", conditions: { gradeId: "self" } },
    
    // Own stream and grade info
    { resource: "streams", action: "read", conditions: { streamId: "self" } },
    { resource: "grades", action: "read", conditions: { gradeId: "self" } },
  ],
  
  STAFF: [
    // Students - read access
    { resource: "students", action: "read" },
    
    // Teachers - read access
    { resource: "teachers", action: "read" },
    
    // Parents - read access
    { resource: "parents", action: "read" },
    
    // Performance - read access
    { resource: "performance", action: "read" },
    
    // Lessons - read access
    { resource: "lessons", action: "read" },
    
    // Subjects - read access
    { resource: "subjects", action: "read" },
    
    // Academic structure - read access
    { resource: "grades", action: "read" },
    { resource: "streams", action: "read" },
    { resource: "departments", action: "read" },
    { resource: "timeslots", action: "read" },
    
    // Own profile
    { resource: "profile", action: "read" },
    { resource: "profile", action: "update", conditions: { userId: "self" } },
    
    // Reports - read access
    { resource: "reports", action: "read" },
  ],
};

// Check if user has permission for a specific action
export function hasPermission(
  userRole: Role,
  resource: string,
  action: "create" | "read" | "update" | "delete",
  context?: Record<string, any>
): boolean {
  const permissions = ROLE_PERMISSIONS[userRole];
  
  // Check for wildcard permission (admin)
  const wildcardPermission = permissions.find(
    p => p.resource === "*" && p.action === action
  );
  if (wildcardPermission) return true;
  
  // Check for specific resource permission
  const resourcePermissions = permissions.filter(
    p => p.resource === resource && p.action === action
  );
  
  if (resourcePermissions.length === 0) return false;
  
  // If no context provided, allow if permission exists without conditions
  if (!context) {
    return resourcePermissions.some(p => !p.conditions);
  }
  
  // Check conditions
  return resourcePermissions.some(permission => {
    if (!permission.conditions) return true;
    
    return Object.entries(permission.conditions).every(([key, value]) => {
      if (value === "self") {
        // Handle self-reference conditions
        switch (key) {
          case "userId":
            return context.userId === context.currentUserId;
          case "teacherId":
            return context.teacherId === context.currentUserId;
          case "studentId":
            return context.studentId === context.currentUserId;
          case "streamId":
            return context.streamId === context.currentUserStreamId;
          case "gradeId":
            return context.gradeId === context.currentUserGradeId;
          default:
            return context[key] === context[`current${key.charAt(0).toUpperCase() + key.slice(1)}`];
        }
      }
      
      return context[key] === value;
    });
  });
}

// Get all permissions for a role
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

// Check if role can access resource at all
export function canAccessResource(role: Role, resource: string): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions.some(p => p.resource === "*" || p.resource === resource);
}

// Resource definitions for the school management system
export const RESOURCES = {
  STUDENTS: "students",
  TEACHERS: "teachers", 
  PARENTS: "parents",
  GRADES: "grades",
  STREAMS: "streams",
  SUBJECTS: "subjects",
  LESSONS: "lessons",
  DEPARTMENTS: "departments",
  TIMESLOTS: "timeslots",
  ATTENDANCE: "attendance",
  PERFORMANCE: "performance",
  PROFILE: "profile",
  REPORTS: "reports",
  USERS: "users",
} as const;

// Actions
export const ACTIONS = {
  CREATE: "create",
  READ: "read", 
  UPDATE: "update",
  DELETE: "delete",
} as const; 