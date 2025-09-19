import express from 'express';
import {
  getProblems,
  getProblem,
  getProblemBySlug,
  createProblem,
  updateProblem,
  deleteProblem,
  getRandomProblem,
  getDailyChallenge,
  getTrendingProblems,
  getProblemStats,
  addHint,
  searchProblems,
  syncFromLeetCode,
  syncSpecificFromLeetCode
} from '../controllers/problemController.js';

const router = express.Router();

// @route   GET /api/problems/search
router.get('/search', searchProblems);

// @route   GET /api/problems/random
router.get('/random', getRandomProblem);

// @route   GET /api/problems/daily
router.get('/daily', getDailyChallenge);

// @route   GET /api/problems/trending
router.get('/trending', getTrendingProblems);

// @route   GET /api/problems
router.get('/', getProblems);

// @route   GET /api/problems/slug/:slug
router.get('/slug/:slug', getProblemBySlug);

// @route   GET /api/problems/:id
router.get('/:id', getProblem);

// @route   GET /api/problems/:id/stats
router.get('/:id/stats', getProblemStats);

// @route   POST /api/problems
router.post('/', createProblem);

// @route   POST /api/problems/sync
router.post('/sync', syncFromLeetCode);

// @route   POST /api/problems/sync/:slug
router.post('/sync/:slug', syncSpecificFromLeetCode);

// @route   POST /api/problems/:id/hints
router.post('/:id/hints', addHint);

// @route   PUT /api/problems/:id
router.put('/:id', updateProblem);

// @route   DELETE /api/problems/:id
router.delete('/:id', deleteProblem);

export default router;