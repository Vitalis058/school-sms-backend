import { prisma } from './Prisma';

export class SystemSettingsService {
  private static instance: SystemSettingsService;
  private settingsCache: Map<string, any> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): SystemSettingsService {
    if (!SystemSettingsService.instance) {
      SystemSettingsService.instance = new SystemSettingsService();
    }
    return SystemSettingsService.instance;
  }

  // Get settings for a specific category
  async getSettings(category: string): Promise<any> {
    const cacheKey = category;
    const now = Date.now();

    // Check cache first
    if (this.settingsCache.has(cacheKey) && this.cacheExpiry.get(cacheKey)! > now) {
      return this.settingsCache.get(cacheKey);
    }

    try {
      const settingRecord = await prisma.systemSettings.findUnique({
        where: { category },
      });

      const settings = settingRecord?.settings || {};
      
      // Update cache
      this.settingsCache.set(cacheKey, settings);
      this.cacheExpiry.set(cacheKey, now + this.CACHE_DURATION);

      return settings;
    } catch (error) {
      console.error(`Error fetching settings for category ${category}:`, error);
      return {};
    }
  }

  // Get a specific setting value
  async getSetting(category: string, key: string, defaultValue?: any): Promise<any> {
    const settings = await this.getSettings(category);
    return settings[key] !== undefined ? settings[key] : defaultValue;
  }

  // Clear cache for a category
  clearCache(category?: string): void {
    if (category) {
      this.settingsCache.delete(category);
      this.cacheExpiry.delete(category);
    } else {
      this.settingsCache.clear();
      this.cacheExpiry.clear();
    }
  }

  // Convenience methods for common settings
  async getGeneralSettings() {
    return this.getSettings('general');
  }

  async getSecuritySettings() {
    return this.getSettings('security');
  }

  async getLibrarySettings() {
    return this.getSettings('library');
  }

  async getTransportSettings() {
    return this.getSettings('transport');
  }

  async getCommunicationSettings() {
    return this.getSettings('communication');
  }

  async getAcademicSettings() {
    return this.getSettings('academic');
  }

  async getNotificationSettings() {
    return this.getSettings('notifications');
  }

  async getBackupSettings() {
    return this.getSettings('backup');
  }

  async getMaintenanceSettings() {
    return this.getSettings('maintenance');
  }

  // Check if maintenance mode is enabled
  async isMaintenanceModeEnabled(): Promise<boolean> {
    return this.getSetting('maintenance', 'maintenanceMode', false);
  }

  // Check if a communication channel is enabled
  async isEmailEnabled(): Promise<boolean> {
    return this.getSetting('communication', 'emailEnabled', true);
  }

  async isSmsEnabled(): Promise<boolean> {
    return this.getSetting('communication', 'smsEnabled', true);
  }

  // Get password policy settings
  async getPasswordPolicy() {
    const security = await this.getSecuritySettings();
    return {
      minLength: security.passwordMinLength || 8,
      requireUppercase: security.passwordRequireUppercase || true,
      requireLowercase: security.passwordRequireLowercase || true,
      requireNumbers: security.passwordRequireNumbers || true,
      requireSpecialChars: security.passwordRequireSpecialChars || true,
    };
  }

  // Get session settings
  async getSessionSettings() {
    const security = await this.getSecuritySettings();
    return {
      timeout: security.sessionTimeout || 30,
      maxLoginAttempts: security.maxLoginAttempts || 5,
      lockoutDuration: security.lockoutDuration || 15,
    };
  }

  // Get library policies
  async getLibraryPolicies() {
    const library = await this.getLibrarySettings();
    return {
      maxBooksPerStudent: library.maxBooksPerStudent || 3,
      maxBooksPerTeacher: library.maxBooksPerTeacher || 5,
      loanDurationStudent: library.loanDurationStudent || 14,
      loanDurationTeacher: library.loanDurationTeacher || 30,
      finePerDayStudent: library.finePerDayStudent || 1.0,
      finePerDayTeacher: library.finePerDayTeacher || 2.0,
      autoRenewal: library.autoRenewal || false,
      emailReminders: library.emailReminders || true,
    };
  }

  // Get transport policies
  async getTransportPolicies() {
    const transport = await this.getTransportSettings();
    return {
      maxCapacityPerVehicle: transport.maxCapacityPerVehicle || 50,
      bookingAdvanceDays: transport.bookingAdvanceDays || 7,
      cancellationHours: transport.cancellationHours || 24,
      gpsTracking: transport.gpsTracking || true,
      parentNotifications: transport.parentNotifications || true,
    };
  }
}

// Export singleton instance
export const systemSettings = SystemSettingsService.getInstance(); 