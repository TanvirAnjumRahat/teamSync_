import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { geminiModel } from '../config/gemini';
import { TaskPriority, TaskStatus } from '../types';

/**
 * Create a new task with AI analysis
 * POST /api/tasks
 */
export const createTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, title, description, assigneeId, priority, dueDate } = req.body;
    const userId = (req as any).userId;

    if (!projectId || !title) {
      res.status(400).json({
        success: false,
        error: 'Project ID and title are required',
      });
      return;
    }

    // AI Analysis - Generate summary and suggest priority
    let aiSummary = '';
    let suggestedPriority = priority || 'MEDIUM';

    try {
      const prompt = `Analyze this task and provide a brief summary and priority recommendation:
Title: ${title}
Description: ${description || 'No description provided'}

Respond in JSON format: {"summary": "brief summary under 100 words", "suggestedPriority": "LOW|MEDIUM|HIGH|URGENT"}`;

      const result = await geminiModel.generateContent(prompt);
      const aiContent = result.response.text();
      if (aiContent) {
        try {
          const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
          const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : aiContent);
          aiSummary = parsed.summary || '';
          suggestedPriority = parsed.suggestedPriority || 'MEDIUM';
        } catch (e) {
          console.warn('⚠️ Failed to parse Gemini JSON response, using fallback');
          aiSummary = aiContent.substring(0, 100);
        }
      }
    } catch (aiError) {
      console.error('AI Analysis failed:', aiError);
      aiSummary = description || '';
    }

    // Create task in Firestore
    const taskRef = db.collection('tasks').doc();
    const taskData = {
      id: taskRef.id,
      projectId,
      title,
      description: description || '',
      assigneeId: assigneeId || null,
      status: 'TODO' as TaskStatus,
      priority: suggestedPriority as TaskPriority,
      aiSummary,
      estimatedHours: null,
      createdById: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedById: userId,
      dueDate: dueDate ? new Date(dueDate) : null,
      labels: [],
    };

    await taskRef.set(taskData);

    res.json({
      success: true,
      data: taskData,
      message: 'Task created successfully with AI analysis',
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create task',
    });
  }
};

/**
 * Get all tasks for a project
 * GET /api/projects/:projectId/tasks
 */
export const getProjectTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;

    const snapshot = await db
      .collection('tasks')
      .where('projectId', '==', projectId)
      .orderBy('createdAt', 'desc')
      .get();

    const tasks = snapshot.docs.map((doc) => ({
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.(),
      updatedAt: doc.data().updatedAt?.toDate?.(),
      dueDate: doc.data().dueDate?.toDate?.(),
    }));

    res.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error('Get project tasks error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch tasks',
    });
  }
};

/**
 * Get tasks assigned to user
 * GET /api/tasks/user
 */
export const getUserTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;

    const snapshot = await db
      .collection('tasks')
      .where('assigneeId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const tasks = snapshot.docs.map((doc) => ({
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.(),
      updatedAt: doc.data().updatedAt?.toDate?.(),
      dueDate: doc.data().dueDate?.toDate?.(),
    }));

    res.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error('Get user tasks error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch user tasks',
    });
  }
};

/**
 * Get single task
 * GET /api/tasks/:taskId
 */
export const getTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;

    const doc = await db.collection('tasks').doc(taskId).get();

    if (!doc.exists) {
      res.status(404).json({
        success: false,
        error: 'Task not found',
      });
      return;
    }

    const task = {
      ...doc.data(),
      createdAt: doc.data()?.createdAt?.toDate?.(),
      updatedAt: doc.data()?.updatedAt?.toDate?.(),
      dueDate: doc.data()?.dueDate?.toDate?.(),
    };

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch task',
    });
  }
};

/**
 * Update task
 * PUT /api/tasks/:taskId
 */
export const updateTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;
    const { title, description, status, priority, assigneeId, dueDate, labels } = req.body;
    const userId = (req as any).userId;

    const taskRef = db.collection('tasks').doc(taskId);
    const doc = await taskRef.get();

    if (!doc.exists) {
      res.status(404).json({
        success: false,
        error: 'Task not found',
      });
      return;
    }

    const updateData: any = {
      updatedAt: new Date(),
      updatedById: userId,
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (labels !== undefined) updateData.labels = labels;

    await taskRef.update(updateData);

    const updated = await taskRef.get();
    const task = {
      ...updated.data(),
      createdAt: updated.data()?.createdAt?.toDate?.(),
      updatedAt: updated.data()?.updatedAt?.toDate?.(),
      dueDate: updated.data()?.dueDate?.toDate?.(),
    };

    res.json({
      success: true,
      data: task,
      message: 'Task updated successfully',
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update task',
    });
  }
};

/**
 * Delete task
 * DELETE /api/tasks/:taskId
 */
export const deleteTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;

    const doc = await db.collection('tasks').doc(taskId).get();

    if (!doc.exists) {
      res.status(404).json({
        success: false,
        error: 'Task not found',
      });
      return;
    }

    await db.collection('tasks').doc(taskId).delete();

    res.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete task',
    });
  }
};

/**
 * Get task analytics for project
 * GET /api/projects/:projectId/analytics
 */
export const getProjectAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;

    const snapshot = await db
      .collection('tasks')
      .where('projectId', '==', projectId)
      .get();

    const tasks = snapshot.docs.map((doc) => doc.data());

    const metrics = {
      total: tasks.length,
      completed: tasks.filter((t) => t.status === 'DONE').length,
      inProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
      todo: tasks.filter((t) => t.status === 'TODO').length,
      completionRate: tasks.length > 0
        ? Math.round(
            (tasks.filter((t) => t.status === 'DONE').length / tasks.length) * 100
          )
        : 0,
      byPriority: {
        LOW: tasks.filter((t) => t.priority === 'LOW').length,
        MEDIUM: tasks.filter((t) => t.priority === 'MEDIUM').length,
        HIGH: tasks.filter((t) => t.priority === 'HIGH').length,
        URGENT: tasks.filter((t) => t.priority === 'URGENT').length,
      },
    };

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch analytics',
    });
  }
};
