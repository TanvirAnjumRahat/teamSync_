import { Router } from 'express';
import { verifyToken } from '../middleware/auth';
import {
  createProject,
  getUserProjects,
  getProject,
  updateProject,
  archiveProject,
  deleteProject,
  getProjectStats,
  addTeamMember,
  removeTeamMember,
} from '../controllers/projectController';

const router = Router();

// Create new project
router.post('/api/projects', verifyToken, createProject);

// Get all user projects
router.get('/api/projects', verifyToken, getUserProjects);

// Get project stats
router.get('/api/projects/:projectId/stats', verifyToken, getProjectStats);

// Get single project
router.get('/api/projects/:projectId', verifyToken, getProject);

// Update project
router.put('/api/projects/:projectId', verifyToken, updateProject);

// Archive project
router.patch('/api/projects/:projectId/archive', verifyToken, archiveProject);

// Delete project
router.delete('/api/projects/:projectId', verifyToken, deleteProject);

// Add team member
router.post('/api/projects/:projectId/members', verifyToken, addTeamMember);

// Remove team member
router.delete('/api/projects/:projectId/members/:memberId', verifyToken, removeTeamMember);

export default router;
