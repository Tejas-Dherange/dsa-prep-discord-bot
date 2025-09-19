import express from 'express';
import {
  getSubmissions,
  getSubmission,
  createSubmission,
  updateSubmission,
  deleteSubmission,
  getUserSubmissions,
  getProblemSubmissions,
  getSubmissionStats,
  getLanguageStats,
  getUserBestSubmissions,
  getSubmissionHistory,
  addSubmissionFeedback
} from '../controllers/submissionController.js';

const router = express.Router();

// @route   GET /api/submissions/stats/languages
router.get('/stats/languages', getLanguageStats);

// @route   GET /api/submissions/stats
router.get('/stats', getSubmissionStats);

// @route   GET /api/submissions/user/:userId/best
router.get('/user/:userId/best', getUserBestSubmissions);

// @route   GET /api/submissions/user/:userId
router.get('/user/:userId', getUserSubmissions);

// @route   GET /api/submissions/problem/:problemId
router.get('/problem/:problemId', getProblemSubmissions);

// @route   GET /api/submissions/history/:userId/:problemId
router.get('/history/:userId/:problemId', getSubmissionHistory);

// @route   GET /api/submissions
router.get('/', getSubmissions);

// @route   GET /api/submissions/:id
router.get('/:id', getSubmission);

// @route   POST /api/submissions
router.post('/', createSubmission);

// @route   POST /api/submissions/:id/feedback
router.post('/:id/feedback', addSubmissionFeedback);

// @route   PUT /api/submissions/:id
router.put('/:id', updateSubmission);

// @route   DELETE /api/submissions/:id
router.delete('/:id', deleteSubmission);

export default router;