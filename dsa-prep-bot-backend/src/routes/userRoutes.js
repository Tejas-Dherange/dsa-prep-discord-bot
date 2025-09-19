import express from 'express';
import {
  getUsers,
  getUser,
  getUserByDiscordId,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
  getLeaderboard,
  updateUserProgress
} from '../controllers/userController.js';

const router = express.Router();

// @route   GET /api/users
router.get('/', getUsers);

// @route   GET /api/users/leaderboard
router.get('/leaderboard', getLeaderboard);

// @route   GET /api/users/discord/:discordId
router.get('/discord/:discordId', getUserByDiscordId);

// @route   GET /api/users/:id
router.get('/:id', getUser);

// @route   GET /api/users/:id/stats
router.get('/:id/stats', getUserStats);

// @route   POST /api/users
router.post('/', createUser);

// @route   POST /api/users/:id/progress
router.post('/:id/progress', updateUserProgress);

// @route   PUT /api/users/:id
router.put('/:id', updateUser);

// @route   DELETE /api/users/:id
router.delete('/:id', deleteUser);

export default router;