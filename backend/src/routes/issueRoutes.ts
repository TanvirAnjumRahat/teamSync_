import { Router } from 'express';
import { verifyToken } from '../middleware/auth';
import {
  createIssue,
  getIssues,
  getIssue,
  updateIssue,
  deleteIssue,
  addComment,
  getIssueStats,
  assignIssue,
} from '../controllers/issueController';

const router = Router();

// Create new issue
router.post('/api/issues', verifyToken, createIssue);

// Get all issues (with filters)
router.get('/api/issues', verifyToken, getIssues);

// Get issue statistics
router.get('/api/issues/stats', verifyToken, getIssueStats);

// Get single issue
router.get('/api/issues/:issueId', verifyToken, getIssue);

// Update issue
router.put('/api/issues/:issueId', verifyToken, updateIssue);

// Delete issue
router.delete('/api/issues/:issueId', verifyToken, deleteIssue);

// Add comment to issue
router.post('/api/issues/:issueId/comments', verifyToken, addComment);

// Assign issue
router.patch('/api/issues/:issueId/assign', verifyToken, assignIssue);

export default router;
