import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { Project, ProjectStatus } from '../types';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Create a new project
 * POST /api/projects
 */
export const createProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, icon, color, teamMembers } = req.body;
    const userId = (req as any).userId;

    if (!name) {
      res.status(400).json({
        success: false,
        error: 'Project name is required',
      });
      return;
    }

    const newProject: Project = {
      name: name.trim(),
      description: description?.trim() || '',
      icon: icon || '📁',
      color: color || '#3b82f6',
      ownerId: userId,
      teamMembers: teamMembers && Array.isArray(teamMembers) ? teamMembers : [userId],
      status: 'ACTIVE',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      taskCount: 0,
      completedCount: 0,
      isArchived: false,
    };

    const docRef = await db.collection('projects').add(newProject);

    res.status(201).json({
      success: true,
      data: {
        id: docRef.id,
        ...newProject,
        createdAt: newProject.createdAt.toDate?.() || new Date(),
        updatedAt: newProject.updatedAt.toDate?.() || new Date(),
      },
      message: 'Project created successfully',
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create project',
    });
  }
};

/**
 * Get all projects for authenticated user
 * GET /api/projects
 */
export const getUserProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { status, archived } = req.query;

    let query: any = db.collection('projects').where('ownerId', '==', userId);

    if (status && status !== 'ALL') {
      query = query.where('status', '==', status);
    }

    if (archived !== undefined) {
      query = query.where('isArchived', '==', archived === 'true');
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    const projects = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
    }));

    res.status(200).json({
      success: true,
      data: projects,
      count: projects.length,
    });
  } catch (error) {
    console.error('Error fetching user projects:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch projects',
    });
  }
};

/**
 * Get single project by ID
 * GET /api/projects/:projectId
 */
export const getProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).userId;

    const doc = await db.collection('projects').doc(projectId).get();

    if (!doc.exists) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      });
      return;
    }

    const projectData = doc.data() as Project;

    // Check if user is owner or team member
    if (projectData.ownerId !== userId && !projectData.teamMembers?.includes(userId)) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: doc.id,
        ...projectData,
        createdAt: projectData.createdAt?.toDate?.() || new Date(),
        updatedAt: projectData.updatedAt?.toDate?.() || new Date(),
      },
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch project',
    });
  }
};

/**
 * Update project
 * PUT /api/projects/:projectId
 */
export const updateProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).userId;
    const { name, description, icon, color, status, teamMembers } = req.body;

    const doc = await db.collection('projects').doc(projectId).get();

    if (!doc.exists) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      });
      return;
    }

    const projectData = doc.data() as Project;

    // Check if user is owner
    if (projectData.ownerId !== userId) {
      res.status(403).json({
        success: false,
        error: 'Only project owner can update',
      });
      return;
    }

    const updates: any = {
      updatedAt: Timestamp.now(),
    };

    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description?.trim() || '';
    if (icon !== undefined) updates.icon = icon;
    if (color !== undefined) updates.color = color;
    if (status !== undefined && ['ACTIVE', 'PAUSED', 'ON_HOLD'].includes(status)) {
      updates.status = status;
    }
    if (teamMembers !== undefined && Array.isArray(teamMembers)) {
      updates.teamMembers = teamMembers;
    }

    await db.collection('projects').doc(projectId).update(updates);

    const updatedDoc = await db.collection('projects').doc(projectId).get();
    const updatedData = updatedDoc.data();

    res.status(200).json({
      success: true,
      data: {
        id: updatedDoc.id,
        ...updatedData,
        createdAt: updatedData?.createdAt?.toDate?.() || new Date(),
        updatedAt: updatedData?.updatedAt?.toDate?.() || new Date(),
      },
      message: 'Project updated successfully',
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update project',
    });
  }
};

/**
 * Archive project
 * PATCH /api/projects/:projectId/archive
 */
export const archiveProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).userId;

    const doc = await db.collection('projects').doc(projectId).get();

    if (!doc.exists) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      });
      return;
    }

    const projectData = doc.data() as Project;

    if (projectData.ownerId !== userId) {
      res.status(403).json({
        success: false,
        error: 'Only project owner can archive',
      });
      return;
    }

    await db.collection('projects').doc(projectId).update({
      isArchived: true,
      status: 'ARCHIVED',
      updatedAt: Timestamp.now(),
    });

    res.status(200).json({
      success: true,
      message: 'Project archived successfully',
    });
  } catch (error) {
    console.error('Error archiving project:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to archive project',
    });
  }
};

/**
 * Delete project
 * DELETE /api/projects/:projectId
 */
export const deleteProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).userId;

    const doc = await db.collection('projects').doc(projectId).get();

    if (!doc.exists) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      });
      return;
    }

    const projectData = doc.data() as Project;

    if (projectData.ownerId !== userId) {
      res.status(403).json({
        success: false,
        error: 'Only project owner can delete',
      });
      return;
    }

    // Delete all associated tasks
    const tasksSnapshot = await db
      .collection('tasks')
      .where('projectId', '==', projectId)
      .get();

    const batch = db.batch();

    tasksSnapshot.docs.forEach((taskDoc) => {
      batch.delete(taskDoc.ref);
    });

    batch.delete(db.collection('projects').doc(projectId));
    await batch.commit();

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete project',
    });
  }
};

/**
 * Get project statistics
 * GET /api/projects/:projectId/stats
 */
export const getProjectStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).userId;

    const projectDoc = await db.collection('projects').doc(projectId).get();

    if (!projectDoc.exists) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      });
      return;
    }

    const projectData = projectDoc.data() as Project;

    if (projectData.ownerId !== userId && !projectData.teamMembers?.includes(userId)) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
      });
      return;
    }

    // Get all tasks for this project
    const tasksSnapshot = await db
      .collection('tasks')
      .where('projectId', '==', projectId)
      .get();

    const tasks = tasksSnapshot.docs.map((doc) => doc.data());

    // Calculate statistics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t: any) => t.status === 'DONE').length;
    const inProgressTasks = tasks.filter((t: any) => t.status === 'IN_PROGRESS').length;
    const todoTasks = tasks.filter((t: any) => t.status === 'TODO').length;

    const priorityBreakdown = {
      LOW: tasks.filter((t: any) => t.priority === 'LOW').length,
      MEDIUM: tasks.filter((t: any) => t.priority === 'MEDIUM').length,
      HIGH: tasks.filter((t: any) => t.priority === 'HIGH').length,
      URGENT: tasks.filter((t: any) => t.priority === 'URGENT').length,
    };

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const avgTasksPerMember = projectData.teamMembers?.length
      ? Math.round(totalTasks / projectData.teamMembers.length)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        projectId,
        totalTasks,
        completedTasks,
        inProgressTasks,
        todoTasks,
        completionRate,
        priorityBreakdown,
        teamMembersCount: projectData.teamMembers?.length || 0,
        avgTasksPerMember,
      },
    });
  } catch (error) {
    console.error('Error fetching project stats:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch project stats',
    });
  }
};

/**
 * Add team member to project
 * POST /api/projects/:projectId/members
 */
export const addTeamMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { memberId } = req.body;
    const userId = (req as any).userId;

    if (!memberId) {
      res.status(400).json({
        success: false,
        error: 'Member ID is required',
      });
      return;
    }

    const doc = await db.collection('projects').doc(projectId).get();

    if (!doc.exists) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      });
      return;
    }

    const projectData = doc.data() as Project;

    if (projectData.ownerId !== userId) {
      res.status(403).json({
        success: false,
        error: 'Only project owner can add members',
      });
      return;
    }

    if (projectData.teamMembers?.includes(memberId)) {
      res.status(400).json({
        success: false,
        error: 'Member already in project',
      });
      return;
    }

    const updatedMembers = [...(projectData.teamMembers || []), memberId];

    await db.collection('projects').doc(projectId).update({
      teamMembers: updatedMembers,
      updatedAt: Timestamp.now(),
    });

    res.status(200).json({
      success: true,
      data: updatedMembers,
      message: 'Team member added successfully',
    });
  } catch (error) {
    console.error('Error adding team member:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add team member',
    });
  }
};

/**
 * Remove team member from project
 * DELETE /api/projects/:projectId/members/:memberId
 */
export const removeTeamMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, memberId } = req.params;
    const userId = (req as any).userId;

    const doc = await db.collection('projects').doc(projectId).get();

    if (!doc.exists) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      });
      return;
    }

    const projectData = doc.data() as Project;

    if (projectData.ownerId !== userId) {
      res.status(403).json({
        success: false,
        error: 'Only project owner can remove members',
      });
      return;
    }

    const updatedMembers = (projectData.teamMembers || []).filter((m: string) => m !== memberId);

    await db.collection('projects').doc(projectId).update({
      teamMembers: updatedMembers,
      updatedAt: Timestamp.now(),
    });

    res.status(200).json({
      success: true,
      data: updatedMembers,
      message: 'Team member removed successfully',
    });
  } catch (error) {
    console.error('Error removing team member:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove team member',
    });
  }
};
