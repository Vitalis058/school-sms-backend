import { Request, Response, NextFunction } from 'express';
import { systemSettings } from './systemSettings.service';
import { AppError } from './AppError';

// Middleware to check if system is in maintenance mode
export const checkMaintenanceMode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isMaintenanceMode = await systemSettings.isMaintenanceModeEnabled();
    
    if (isMaintenanceMode) {
      const maintenanceSettings = await systemSettings.getMaintenanceSettings();
      const allowedIPs = maintenanceSettings.allowedIPs || ['127.0.0.1'];
      const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
      
      // Allow access for whitelisted IPs
      if (!allowedIPs.includes(clientIP)) {
        const message = maintenanceSettings.maintenanceMessage || 
          'System is under maintenance. Please try again later.';
        
        return res.status(503).json({
          status: 'error',
          message,
          maintenanceMode: true,
        });
      }
    }
    
    next();
  } catch (error) {
    console.error('Error checking maintenance mode:', error);
    next(); // Continue if there's an error checking maintenance mode
  }
};

// Middleware to validate password against system policies
export const validatePasswordPolicy = async (password: string): Promise<{ valid: boolean; errors: string[] }> => {
  try {
    const policy = await systemSettings.getPasswordPolicy();
    const errors: string[] = [];

    if (password.length < policy.minLength) {
      errors.push(`Password must be at least ${policy.minLength} characters long`);
    }

    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (policy.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  } catch (error) {
    console.error('Error validating password policy:', error);
    return { valid: true, errors: [] }; // Default to valid if there's an error
  }
};

// Middleware to check session timeout
export const checkSessionTimeout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return next();
    }

    const sessionSettings = await systemSettings.getSessionSettings();
    const sessionTimeout = sessionSettings.timeout * 60 * 1000; // Convert minutes to milliseconds
    
    const lastActivity = (req.session as any)?.lastActivity || Date.now();
    const now = Date.now();
    
    if (now - lastActivity > sessionTimeout) {
      return res.status(401).json({
        status: 'error',
        message: 'Session expired due to inactivity',
        sessionExpired: true,
      });
    }

    // Update last activity
    if (req.session) {
      (req.session as any).lastActivity = now;
    }
    
    next();
  } catch (error) {
    console.error('Error checking session timeout:', error);
    next(); // Continue if there's an error
  }
}; 