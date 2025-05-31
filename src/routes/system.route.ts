import express from 'express';
import {
  getSystemSettings,
  getSettingsCategory,
  updateSystemSettings,
  resetSettingsCategory,
  getSystemHealth,
  exportSettings,
  importSettings,
  getSystemLogs,
} from '../controllers/system.controller';
import { authenticate } from '../utils/middleware';

const router = express.Router();

// Protect all routes
router.use(authenticate);

// System settings routes
router.get('/settings', getSystemSettings);
router.get('/settings/:category', getSettingsCategory);
router.put('/settings/:category', updateSystemSettings);
router.post('/settings/:category/reset', resetSettingsCategory);

// System health and monitoring
router.get('/health', getSystemHealth);
router.get('/logs', getSystemLogs);

// Settings import/export
router.get('/export', exportSettings);
router.post('/import', importSettings);

export default router; 