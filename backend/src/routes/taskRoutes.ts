import express, { Router } from 'express';
import {
  createTask,
  getProjectTasks,
  getUserTasks,
  getTask,
  updateTask,
  deleteTask,
  getProjectAnalytics,
} from '../controllers/taskController';
import { analyzeTask, getProjectMetrics } from '../controllers/aiController';
import { verifyToken } from '../middleware/auth';

const router = Router();

/**
 * Task Management Routes
 */

/**
 * POST /api/tasks
 * Create a new task with AI analysis
 * Requires authentication
 */
router.post('/tasks', verifyToken, createTask);

/**
 * GET /api/tasks/user
 * Get all tasks assigned to current user
 * Requires authentication
 */
router.get('/tasks/user', verifyToken, getUserTasks);

/**
 * GET /api/tasks/:taskId
 * Get single task by ID
 * Requires authentication
 */
router.get('/tasks/:taskId', verifyToken, getTask);

/**
 * PUT /api/tasks/:taskId
 * Update task
 * Requires authentication
 */
router.put('/tasks/:taskId', verifyToken, updateTask);

/**
 * DELETE /api/tasks/:taskId
 * Delete task
 * Requires authentication
 */
router.delete('/tasks/:taskId', verifyToken, deleteTask);

/**
 * GET /api/projects/:projectId/tasks
 * Get all tasks for a project
 * Requires authentication
 */
router.get('/projects/:projectId/tasks', verifyToken, getProjectTasks);

/**
 * GET /api/projects/:projectId/analytics
 * Get analytics for project tasks
 * Requires authentication
 */
router.get('/projects/:projectId/analytics', verifyToken, getProjectAnalytics);

/**
 * POST /api/ai/analyze-task
 * Analyze task using OpenAI (existing endpoint)
 * Requires authentication
 */
router.post('/ai/analyze-task', verifyToken, analyzeTask);

/**
 * GET /api/projects/:projectId/metrics
 * Get project metrics (existing endpoint)
 * Requires authentication
 */
router.get('/projects/:projectId/metrics', verifyToken, getProjectMetrics);

export default router;
