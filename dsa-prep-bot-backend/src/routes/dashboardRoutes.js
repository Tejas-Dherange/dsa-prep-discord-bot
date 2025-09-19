import express from 'express';
import {
  getDashboardStats,
  getSystemHealth,
  triggerDailyChallenge
} from '../controllers/dashboardController.js';

const router = express.Router();

// @route   GET /api/dashboard/stats
router.get('/stats', getDashboardStats);

// @route   GET /api/dashboard/health
router.get('/health', getSystemHealth);

// @route   POST /api/dashboard/daily-challenge/trigger
router.post('/daily-challenge/trigger', triggerDailyChallenge);

export default router;