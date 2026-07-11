import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { Issue, IssuePriority, IssueStatus } from '../types';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Create a new issue
 * POST /api/issues
 */
export const createIssue = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, title, description, priority, assigneeId, type } = req.body;
    const userId = (req as any).userId;

    if (!projectId || !title) {
      res.status(400).json({
        success: false,
        error: 'Project ID and title are required',
      });
      return;
    }

    const newIssue: Issue = {
      projectId,
      title: title.trim(),
      description: description?.trim() || '',
      status: 'OPEN',
      priority: priority || 'MEDIUM',
      type: type || 'BUG',
      assigneeId: assigneeId || null,
      reportedById: userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      comments: [],
      attachments: [],
    };

    const docRef = await db.collection('issues').add(newIssue);

    res.status(201).json({
      success: true,
      data: {
        id: docRef.id,
        ...newIssue,
        createdAt: newIssue.createdAt.toDate?.() || new Date(),
        updatedAt: newIssue.updatedAt.toDate?.() || new Date(),
      },
      message: 'Issue created successfully',
    });
  } catch (error) {
    console.error('Error creating issue:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create issue',
    });
  }
};

/**
 * Get all issues for a project
 * GET /api/issues?projectId=xxx&assigned=true
 */
export const getIssues = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { projectId, status, priority, assigned } = req.query;

    let query: any = db.collection('issues');

    if (projectId) {
      query = query.where('projectId', '==', projectId);
    }

    if (status && status !== 'ALL') {
      query = query.where('status', '==', status);
    }

    if (priority && priority !== 'ALL') {
      query = query.where('priority', '==', priority);
    }

    let snapshot = await query.orderBy('createdAt', 'desc').get();
    let issues = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
    }));

    // Filter assigned to me
    if (assigned === 'true') {
      issues = issues.filter((issue: any) => issue.assigneeId === userId);
    }

    res.status(200).json({
      success: true,
      data: issues,
      count: issues.length,
    });
  } catch (error) {
    console.error('Error fetching issues:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch issues',
    });
  }
};

/**
 * Get single issue by ID
 * GET /api/issues/:issueId
 */
export const getIssue = async (req: Request, res: Response): Promise<void> => {
  try {
    const { issueId } = req.params;

    const doc = await db.collection('issues').doc(issueId).get();

    if (!doc.exists) {
      res.status(404).json({
        success: false,
        error: 'Issue not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data()?.createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data()?.updatedAt?.toDate?.() || new Date(),
      },
    });
  } catch (error) {
    console.error('Error fetching issue:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch issue',
    });
  }
};

/**
 * Update issue
 * PUT /api/issues/:issueId
 */
export const updateIssue = async (req: Request, res: Response): Promise<void> => {
  try {
    const { issueId } = req.params;
    const { title, description, status, priority, assigneeId, type } = req.body;

    const doc = await db.collection('issues').doc(issueId).get();

    if (!doc.exists) {
      res.status(404).json({
        success: false,
        error: 'Issue not found',
      });
      return;
    }

    const updates: any = {
      updatedAt: Timestamp.now(),
    };

    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description?.trim() || '';
    if (status !== undefined && ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(status)) {
      updates.status = status;
    }
    if (priority !== undefined && ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(priority)) {
      updates.priority = priority;
    }
    if (type !== undefined && ['BUG', 'FEATURE', 'ENHANCEMENT', 'DOCUMENTATION'].includes(type)) {
      updates.type = type;
    }
    if (assigneeId !== undefined) {
      updates.assigneeId = assigneeId || null;
    }

    await db.collection('issues').doc(issueId).update(updates);

    const updatedDoc = await db.collection('issues').doc(issueId).get();
    const updatedData = updatedDoc.data();

    res.status(200).json({
      success: true,
      data: {
        id: updatedDoc.id,
        ...updatedData,
        createdAt: updatedData?.createdAt?.toDate?.() || new Date(),
        updatedAt: updatedData?.updatedAt?.toDate?.() || new Date(),
      },
      message: 'Issue updated successfully',
    });
  } catch (error) {
    console.error('Error updating issue:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update issue',
    });
  }
};

/**
 * Delete issue
 * DELETE /api/issues/:issueId
 */
export const deleteIssue = async (req: Request, res: Response): Promise<void> => {
  try {
    const { issueId } = req.params;

    const doc = await db.collection('issues').doc(issueId).get();

    if (!doc.exists) {
      res.status(404).json({
        success: false,
        error: 'Issue not found',
      });
      return;
    }

    await db.collection('issues').doc(issueId).delete();

    res.status(200).json({
      success: true,
      message: 'Issue deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting issue:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete issue',
    });
  }
};

/**
 * Add comment to issue
 * POST /api/issues/:issueId/comments
 */
export const addComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { issueId } = req.params;
    const { content } = req.body;
    const userId = (req as any).userId;

    if (!content?.trim()) {
      res.status(400).json({
        success: false,
        error: 'Comment content is required',
      });
      return;
    }

    const doc = await db.collection('issues').doc(issueId).get();

    if (!doc.exists) {
      res.status(404).json({
        success: false,
        error: 'Issue not found',
      });
      return;
    }

    const comment = {
      authorId: userId,
      content: content.trim(),
      createdAt: Timestamp.now(),
    };

    await db.collection('issues').doc(issueId).update({
      comments: (doc.data()?.comments || []).concat(comment),
      updatedAt: Timestamp.now(),
    });

    res.status(201).json({
      success: true,
      data: comment,
      message: 'Comment added successfully',
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add comment',
    });
  }
};

/**
 * Get issue statistics
 * GET /api/issues/stats?projectId=xxx
 */
export const getIssueStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.query;

    let query: any = db.collection('issues');

    if (projectId) {
      query = query.where('projectId', '==', projectId);
    }

    const snapshot = await query.get();
    const issues = snapshot.docs.map((doc: any) => doc.data());

    const stats = {
      total: issues.length,
      open: issues.filter((i: any) => i.status === 'OPEN').length,
      inProgress: issues.filter((i: any) => i.status === 'IN_PROGRESS').length,
      resolved: issues.filter((i: any) => i.status === 'RESOLVED').length,
      closed: issues.filter((i: any) => i.status === 'CLOSED').length,
      highPriority: issues.filter((i: any) => i.priority === 'HIGH' || i.priority === 'URGENT').length,
      byType: {
        BUG: issues.filter((i: any) => i.type === 'BUG').length,
        FEATURE: issues.filter((i: any) => i.type === 'FEATURE').length,
        ENHANCEMENT: issues.filter((i: any) => i.type === 'ENHANCEMENT').length,
        DOCUMENTATION: issues.filter((i: any) => i.type === 'DOCUMENTATION').length,
      },
    };

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching issue stats:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch issue stats',
    });
  }
};

/**
 * Assign issue to user
 * PATCH /api/issues/:issueId/assign
 */
export const assignIssue = async (req: Request, res: Response): Promise<void> => {
  try {
    const { issueId } = req.params;
    const { assigneeId } = req.body;

    const doc = await db.collection('issues').doc(issueId).get();

    if (!doc.exists) {
      res.status(404).json({
        success: false,
        error: 'Issue not found',
      });
      return;
    }

    await db.collection('issues').doc(issueId).update({
      assigneeId: assigneeId || null,
      updatedAt: Timestamp.now(),
    });

    res.status(200).json({
      success: true,
      data: { assigneeId },
      message: 'Issue assigned successfully',
    });
  } catch (error) {
    console.error('Error assigning issue:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to assign issue',
    });
  }
};
