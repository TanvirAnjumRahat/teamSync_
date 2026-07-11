import express from 'express';
import { authenticate } from '../middleware/auth';
import { analyzeTask } from '../controllers/aiController';
import admin, { db } from '../config/firebase';
import repositoryRoutes from './repositoryRoutes';
import crypto from 'crypto';
import { sendInviteEmail } from '../services/email';

const router = express.Router();

// ===== HEALTH CHECK =====
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'TeamSync AI API is running', timestamp: new Date().toISOString() });
});


// ===== AI ROUTES =====
router.post('/ai/analyze-task', authenticate, analyzeTask);

// ===== REPOSITORY ROUTES =====
router.use('/repository', repositoryRoutes);

// ===== USER ROUTES =====
router.get('/users/me', authenticate, async (req: any, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, data: { id: userDoc.id, ...userDoc.data() } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ===== WORKSPACE ROUTES =====
// ============================================

// Get detailed workspaces for 'My Workspaces' page
router.get('/my-workspaces', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.uid;
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData?.workspaces) {
      return res.json({ success: true, data: [] });
    }

    const workspaceIds = Object.keys(userData.workspaces);
    const workspaces = [];

    for (const workspaceId of workspaceIds) {
      const workspaceDoc = await db.collection('workspaces').doc(workspaceId).get();
      if (workspaceDoc.exists) {
        const data = workspaceDoc.data();
        const memberIds = Object.keys(data?.members || {});
        const isOnlyOwner = memberIds.length === 1 && memberIds[0] === userId && data?.members[userId].role === 'OWNER';

        // Fetch recent activity
        const activitySnapshot = await db.collection('workspace_activity')
          .where('workspaceId', '==', workspaceId)
          .get();

        const recentActivity: any[] = [];
        activitySnapshot.forEach((doc: any) => {
          recentActivity.push({ id: doc.id, ...doc.data() });
        });

        // Sort in memory using timestamp correctly
        recentActivity.sort((a: any, b: any) => {
          const dateA = a.timestamp?.toDate?.() || new Date(a.timestamp || 0);
          const dateB = b.timestamp?.toDate?.() || new Date(b.timestamp || 0);
          return dateB.getTime() - dateA.getTime();
        });

        // Limit to 5
        const topRecentActivity = recentActivity.slice(0, 5);

        workspaces.push({
          id: workspaceDoc.id,
          ...data,
          isOnlyOwner,
          recentActivity: topRecentActivity
        });
      }
    }

    res.json({ success: true, data: workspaces });
  } catch (error: any) {
    console.error('❌ Error in GET /my-workspaces:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all workspaces for the current user
router.get('/workspaces', authenticate, async (req: any, res) => {
  try {
    console.log('📡 GET /workspaces - User:', req.user.uid);
    const userId = req.user.uid;

    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData?.workspaces) {
      return res.json({ success: true, data: [] });
    }

    const workspaceIds = Object.keys(userData.workspaces);
    const workspaces = [];

    for (const workspaceId of workspaceIds) {
      const workspaceDoc = await db.collection('workspaces').doc(workspaceId).get();
      if (workspaceDoc.exists) {
        workspaces.push({
          id: workspaceDoc.id,
          ...workspaceDoc.data()
        });
      }
    }

    res.json({ success: true, data: workspaces });
  } catch (error: any) {
    console.error('❌ Error in GET /workspaces:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create a new workspace
router.post('/workspaces', authenticate, async (req: any, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.uid;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Workspace name is required' });
    }

    const workspaceData = {
      name,
      description: description || '',
      createdBy: userId,
      createdAt: new Date(),
      members: {
        [userId]: {
          role: 'OWNER',
          joinedAt: new Date(),
          invitedBy: userId,
        }
      },
      isActive: true,
      settings: {
        allowMemberInvites: true,
        defaultRole: 'MEMBER',
      },
      metrics: {
        totalProjects: 0,
        totalTasks: 0,
        totalMembers: 1,
        completionRate: 0,
      }
    };

    const workspaceRef = await db.collection('workspaces').add(workspaceData);

    await db.collection('users').doc(userId).set({
      workspaces: {
        [workspaceRef.id]: {
          role: 'OWNER',
          joinedAt: new Date(),
          invitedBy: userId,
        }
      }
    }, { merge: true });

    res.json({
      success: true,
      data: {
        id: workspaceRef.id,
        ...workspaceData
      }
    });
  } catch (error: any) {
    console.error('❌ Error in POST /workspaces:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get a single workspace
router.get('/workspaces/:workspaceId', authenticate, async (req: any, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.uid;

    const workspaceDoc = await db.collection('workspaces').doc(workspaceId).get();

    if (!workspaceDoc.exists) {
      return res.status(404).json({ success: false, error: 'Workspace not found' });
    }

    const workspaceData = workspaceDoc.data();

    if (!workspaceData || !workspaceData.members || !workspaceData.members[userId]) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    res.json({
      success: true,
      data: { id: workspaceDoc.id, ...workspaceData }
    });
  } catch (error: any) {
    console.error('❌ Error in GET /workspaces/:workspaceId:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update workspace
router.put('/workspaces/:workspaceId', authenticate, async (req: any, res) => {
  try {
    const { workspaceId } = req.params;
    const { name, description, settings } = req.body;
    const userId = req.user.uid;

    const workspaceDoc = await db.collection('workspaces').doc(workspaceId).get();

    if (!workspaceDoc.exists) {
      return res.status(404).json({ success: false, error: 'Workspace not found' });
    }

    const workspaceData = workspaceDoc.data();

    if (!workspaceData || !workspaceData.members) {
      return res.status(404).json({ success: false, error: 'Workspace data not found' });
    }

    const userRole = workspaceData.members[userId]?.role;
    if (userRole !== 'OWNER' && userRole !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }

    const updates: any = {};
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (settings) updates.settings = settings;
    updates.updatedAt = new Date();

    await db.collection('workspaces').doc(workspaceId).update(updates);

    const updatedDoc = await db.collection('workspaces').doc(workspaceId).get();
    res.json({
      success: true,
      data: { id: updatedDoc.id, ...updatedDoc.data() }
    });
  } catch (error: any) {
    console.error('❌ Error in PUT /workspaces/:workspaceId:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Invite a member to a workspace
router.post('/workspaces/:workspaceId/invite', authenticate, async (req: any, res) => {
  try {
    const { workspaceId } = req.params;
    const { email, role } = req.body;
    const userId = req.user.uid;

    if (!email || !role) {
      return res.status(400).json({ success: false, error: 'Email and role are required' });
    }

    const workspaceDoc = await db.collection('workspaces').doc(workspaceId).get();
    if (!workspaceDoc.exists) {
      return res.status(404).json({ success: false, error: 'Workspace not found' });
    }

    const workspaceData = workspaceDoc.data();
    const userRole = workspaceData?.members?.[userId]?.role;

    if (userRole !== 'OWNER' && userRole !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Only owners and admins can invite members' });
    }

    // Generate a secure invite token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Valid for 7 days

    const inviteData = {
      workspaceId,
      email: email.toLowerCase(),
      role,
      invitedBy: userId,
      token: hashedToken, // Store hashed token
      status: 'PENDING',
      createdAt: new Date(),
      expiresAt,
    };

    // Save invitation to Firestore
    await db.collection('invitations').add(inviteData);

    // Add invite activity to workspace_activity
    await db.collection('workspace_activity').add({
      workspaceId,
      userId,
      action: 'INVITE',
      details: `Invited ${email} to the workspace as ${role}`,
      timestamp: new Date()
    });

    // Send email
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const inviteLink = `${frontendUrl}/invite?token=${rawToken}`; // Send raw token in email

    await sendInviteEmail(email, inviteLink, workspaceData?.name || 'Workspace', role);

    res.json({
      success: true,
      message: 'Invitation sent successfully',
      data: {
        token: rawToken, // Optional: return raw token for debugging
        inviteLink
      }
    });
  } catch (error: any) {
    console.error('❌ Error in POST /workspaces/:workspaceId/invite:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ===== INVITATION ACCEPT/DECLINE ROUTES =====
// ============================================

// Get detailed invitation preview by token
router.get('/invitations/:token', async (req: any, res) => {
  try {
    const { token } = req.params;
    console.log(`📡 GET /invitations/:token - Requested Token: "${token}"`);

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const invitationsSnapshot = await db.collection('invitations')
      .where('token', '==', hashedToken)
      .limit(1)
      .get();

    console.log(`📡 GET /invitations/:token - Found matching docs: ${invitationsSnapshot.size}`);

    if (invitationsSnapshot.empty) {
      return res.status(404).json({ success: false, error: 'Invitation not found' });
    }

    const inviteDoc = invitationsSnapshot.docs[0];
    const inviteData = inviteDoc.data();

    if (inviteData.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: 'This invitation has already been accepted or declined' });
    }

    const expiresAtDate = inviteData.expiresAt.toDate ? inviteData.expiresAt.toDate() : new Date(inviteData.expiresAt);
    if (expiresAtDate < new Date()) {
      return res.status(400).json({ success: false, error: 'This invitation has expired' });
    }

    // Fetch workspace name
    const workspaceDoc = await db.collection('workspaces').doc(inviteData.workspaceId).get();
    const workspaceName = workspaceDoc.exists ? workspaceDoc.data()?.name : 'Workspace';

    // Fetch inviter display name/email
    const inviterDoc = await db.collection('users').doc(inviteData.invitedBy).get();
    const inviterName = inviterDoc.exists ? inviterDoc.data()?.displayName || inviterDoc.data()?.email : 'Workspace Administrator';

    res.json({
      success: true,
      data: {
        id: inviteDoc.id,
        workspaceId: inviteData.workspaceId,
        workspaceName,
        role: inviteData.role,
        invitedBy: inviterName,
        email: inviteData.email
      }
    });
  } catch (error: any) {
    console.error('❌ Error in GET /invitations/:token:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Accept invitation
router.post('/invitations/:token/accept', authenticate, async (req: any, res) => {
  try {
    const { token } = req.params;
    const userId = req.user.uid;
    const userEmail = req.user.email;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const invitationsSnapshot = await db.collection('invitations')
      .where('token', '==', hashedToken)
      .limit(1)
      .get();

    if (invitationsSnapshot.empty) {
      return res.status(404).json({ success: false, error: 'Invitation not found' });
    }

    const inviteDoc = invitationsSnapshot.docs[0];
    const inviteData = inviteDoc.data();

    if (inviteData.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: 'This invitation has already been processed' });
    }

    const expiresAtDate = inviteData.expiresAt.toDate ? inviteData.expiresAt.toDate() : new Date(inviteData.expiresAt);
    if (expiresAtDate < new Date()) {
      return res.status(400).json({ success: false, error: 'This invitation has expired' });
    }

    // Optional email safety check
    if (inviteData.email.toLowerCase() !== userEmail.toLowerCase()) {
      return res.status(400).json({ success: false, error: 'This invitation was sent to a different email address' });
    }

    // 1. Update invitation status to ACCEPTED
    await inviteDoc.ref.update({
      status: 'ACCEPTED',
      acceptedAt: new Date(),
      acceptedBy: userId
    });

    // 2. Add user to the workspace's members map and update metrics
    const workspaceRef = db.collection('workspaces').doc(inviteData.workspaceId);
    const workspaceDoc = await workspaceRef.get();
    if (workspaceDoc.exists) {
      await workspaceRef.update({
        [`members.${userId}`]: {
          role: inviteData.role,
          joinedAt: new Date(),
          invitedBy: inviteData.invitedBy
        },
        'metrics.totalMembers': admin.firestore.FieldValue.increment(1)
      });
    }

    await db.collection('users').doc(userId).set({
      workspaces: {
        [inviteData.workspaceId]: {
          role: inviteData.role,
          joinedAt: new Date(),
          invitedBy: inviteData.invitedBy
        }
      }
    }, { merge: true });

    // 4. Log JOIN activity in workspace_activity
    await db.collection('workspace_activity').add({
      workspaceId: inviteData.workspaceId,
      userId,
      action: 'JOIN',
      details: `${req.user.displayName || userEmail} joined the workspace`,
      timestamp: new Date()
    });

    res.json({ success: true, message: 'Invitation accepted successfully' });
  } catch (error: any) {
    console.error('❌ Error in POST /invitations/:token/accept:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Decline invitation
router.post('/invitations/:token/decline', authenticate, async (req: any, res) => {
  try {
    const { token } = req.params;
    const userEmail = req.user.email;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const invitationsSnapshot = await db.collection('invitations')
      .where('token', '==', hashedToken)
      .limit(1)
      .get();

    if (invitationsSnapshot.empty) {
      return res.status(404).json({ success: false, error: 'Invitation not found' });
    }

    const inviteDoc = invitationsSnapshot.docs[0];
    const inviteData = inviteDoc.data();

    if (inviteData.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: 'This invitation has already been processed' });
    }

    if (inviteData.email.toLowerCase() !== userEmail.toLowerCase()) {
      return res.status(400).json({ success: false, error: 'This invitation belongs to another email address' });
    }

    // Update status to DECLINED
    await inviteDoc.ref.update({
      status: 'DECLINED',
      declinedAt: new Date()
    });

    res.json({ success: true, message: 'Invitation declined successfully' });
  } catch (error: any) {
    console.error('❌ Error in POST /invitations/:token/decline:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get workspace members with details
router.get('/workspaces/:workspaceId/members', authenticate, async (req: any, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.uid;

    const workspaceDoc = await db.collection('workspaces').doc(workspaceId).get();
    if (!workspaceDoc.exists) {
      return res.status(404).json({ success: false, error: 'Workspace not found' });
    }

    const workspaceData = workspaceDoc.data();
    if (!workspaceData?.members || !workspaceData.members[userId]) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const memberIds = Object.keys(workspaceData.members);
    const membersData: any[] = [];

    // Fetch user details for each member
    for (const memberId of memberIds) {
      const userDoc = await db.collection('users').doc(memberId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        membersData.push({
          id: memberId,
          email: userData?.email,
          displayName: userData?.displayName,
          role: workspaceData.members[memberId].role,
          joinedAt: workspaceData.members[memberId].joinedAt,
        });
      }
    }

    res.json({ success: true, data: membersData });
  } catch (error: any) {
    console.error('❌ Error in GET /workspaces/:workspaceId/members:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ===== PROJECT ROUTES =====
// ============================================

// Get all projects in a workspace
router.get('/workspaces/:workspaceId/projects', authenticate, async (req: any, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.uid;

    console.log(`📡 GET /workspaces/${workspaceId}/projects - User: ${userId}`);

    const workspaceDoc = await db.collection('workspaces').doc(workspaceId).get();
    if (!workspaceDoc.exists) {
      return res.status(404).json({ success: false, error: 'Workspace not found' });
    }

    const workspaceData = workspaceDoc.data();
    if (!workspaceData?.members || !workspaceData.members[userId]) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const projectsSnapshot = await db.collection('projects')
      .where('workspaceId', '==', workspaceId)
      .orderBy('createdAt', 'desc')
      .get();

    const projects: any[] = [];
    projectsSnapshot.forEach((doc: any) => {
      projects.push({ id: doc.id, ...doc.data() });
    });

    console.log(`✅ Found ${projects.length} projects`);
    res.json({ success: true, data: projects });
  } catch (error: any) {
    console.error('❌ Error in GET /workspaces/:workspaceId/projects:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create a new project
router.post('/workspaces/:workspaceId/projects', authenticate, async (req: any, res) => {
  try {
    const { workspaceId } = req.params;
    const { name, description, status, deadline } = req.body;
    const userId = req.user.uid;

    console.log(`📡 POST /workspaces/${workspaceId}/projects - User: ${userId}`);

    if (!name) {
      return res.status(400).json({ success: false, error: 'Project name is required' });
    }

    const workspaceDoc = await db.collection('workspaces').doc(workspaceId).get();
    if (!workspaceDoc.exists) {
      return res.status(404).json({ success: false, error: 'Workspace not found' });
    }

    const workspaceData = workspaceDoc.data();
    const userRole = workspaceData?.members?.[userId]?.role;
    if (!userRole || !['OWNER', 'ADMIN', 'MANAGER'].includes(userRole)) {
      return res.status(403).json({ success: false, error: 'Only workspace OWNER, ADMIN, or MANAGER can create projects' });
    }

    const projectData = {
      name,
      description: description || '',
      status: status || 'ACTIVE',
      workspaceId,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      deadline: deadline ? new Date(deadline) : null,
      members: {
        [userId]: {
          role: 'OWNER',
          assignedAt: new Date(),
        }
      },
      isActive: true,
      isArchived: false,
      metrics: {
        totalTasks: 0,
        completedTasks: 0,
        completionRate: 0,
      },
      settings: {
        allowTaskCreation: true,
        allowMemberInvites: true,
      }
    };

    const projectRef = await db.collection('projects').add(projectData);
    console.log(`✅ Project created with ID: ${projectRef.id}`);

    await db.collection('workspaces').doc(workspaceId).update({
      'metrics.totalProjects': (workspaceData.metrics?.totalProjects || 0) + 1,
    });

    res.json({
      success: true,
      data: { id: projectRef.id, ...projectData }
    });
  } catch (error: any) {
    console.error('❌ Error in POST /workspaces/:workspaceId/projects:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get a single project
router.get('/projects/:projectId', authenticate, async (req: any, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.uid;

    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const projectData = projectDoc.data();

    const workspaceDoc = await db.collection('workspaces').doc(projectData?.workspaceId).get();
    if (!workspaceDoc.exists) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const workspaceData = workspaceDoc.data();
    if (!workspaceData?.members || !workspaceData.members[userId]) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    res.json({
      success: true,
      data: { id: projectDoc.id, ...projectData }
    });
  } catch (error: any) {
    console.error('❌ Error in GET /projects/:projectId:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update a project
router.put('/projects/:projectId', authenticate, async (req: any, res) => {
  try {
    const { projectId } = req.params;
    const { name, description, status, deadline } = req.body;
    const userId = req.user.uid;

    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const projectData = projectDoc.data();

    // Check workspace-level permissions
    const workspaceDoc = await db.collection('workspaces').doc(projectData?.workspaceId).get();
    const workspaceData = workspaceDoc.data();
    const workspaceRole = workspaceData?.members?.[userId]?.role;

    if (workspaceRole !== 'OWNER' && workspaceRole !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Only workspace OWNER or ADMIN can edit projects' });
    }

    const updates: any = {
      updatedAt: new Date(),
    };
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (status) updates.status = status;
    if (deadline) updates.deadline = new Date(deadline);

    await db.collection('projects').doc(projectId).update(updates);

    const updatedDoc = await db.collection('projects').doc(projectId).get();
    res.json({
      success: true,
      data: { id: updatedDoc.id, ...updatedDoc.data() }
    });
  } catch (error: any) {
    console.error('❌ Error in PUT /projects/:projectId:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update project members
router.put('/projects/:projectId/members', authenticate, async (req: any, res) => {
  try {
    const { projectId } = req.params;
    const { memberIds } = req.body;
    const userId = req.user.uid;

    if (!Array.isArray(memberIds)) {
      return res.status(400).json({ success: false, error: 'memberIds must be an array' });
    }

    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const projectData = projectDoc.data();

    // Check workspace-level permissions
    const workspaceDoc = await db.collection('workspaces').doc(projectData?.workspaceId).get();
    const workspaceData = workspaceDoc.data();
    const workspaceRole = workspaceData?.members?.[userId]?.role;

    if (workspaceRole !== 'OWNER' && workspaceRole !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Only workspace OWNER or ADMIN can edit projects' });
    }

    // Build the new members object
    const currentMembers = projectData?.members || {};
    const newMembers: Record<string, any> = {};

    // Always keep the owner/creator
    if (projectData?.createdBy && currentMembers[projectData.createdBy]) {
      newMembers[projectData.createdBy] = currentMembers[projectData.createdBy];
    }

    // Add selected members
    for (const memberId of memberIds) {
      if (currentMembers[memberId]) {
        newMembers[memberId] = currentMembers[memberId];
      } else {
        newMembers[memberId] = {
          role: 'DEVELOPER',
          joinedAt: new Date(),
          invitedBy: userId
        };
      }
    }

    await db.collection('projects').doc(projectId).update({
      members: newMembers,
      updatedAt: new Date(),
    });

    res.json({ success: true, message: 'Project members updated successfully' });
  } catch (error: any) {
    console.error('❌ Error in PUT /projects/:projectId/members:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete/Archive a project
router.delete('/projects/:projectId', authenticate, async (req: any, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.uid;

    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const projectData = projectDoc.data();

    if (projectData?.createdBy !== userId) {
      return res.status(403).json({ success: false, error: 'Only the project owner can delete this project' });
    }

    await db.collection('projects').doc(projectId).update({
      isArchived: true,
      archivedAt: new Date(),
      status: 'ARCHIVED',
    });

    res.json({ success: true, message: 'Project archived successfully' });
  } catch (error: any) {
    console.error('❌ Error in DELETE /projects/:projectId:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ===== TASK ROUTES =====
// ============================================

// Get all tasks in a workspace
router.get('/workspaces/:workspaceId/tasks', authenticate, async (req: any, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.uid;

    const workspaceDoc = await db.collection('workspaces').doc(workspaceId).get();
    if (!workspaceDoc.exists) {
      return res.status(404).json({ success: false, error: 'Workspace not found' });
    }

    const workspaceData = workspaceDoc.data();
    if (!workspaceData?.members || !workspaceData.members[userId]) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const tasksSnapshot = await db.collection('tasks')
      .where('workspaceId', '==', workspaceId)
      .get();

    const tasks: any[] = [];
    tasksSnapshot.forEach((doc: any) => {
      tasks.push({ id: doc.id, ...doc.data() });
    });

    tasks.sort((a: any, b: any) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    });

    res.json({ success: true, data: tasks });
  } catch (error: any) {
    console.error('❌ Error in GET /workspaces/:workspaceId/tasks:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all tasks in a project
router.get('/projects/:projectId/tasks', authenticate, async (req: any, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.uid;

    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const projectData = projectDoc.data();
    const workspaceDoc = await db.collection('workspaces').doc(projectData?.workspaceId).get();

    if (!workspaceDoc.exists) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const workspaceData = workspaceDoc.data();
    if (!workspaceData?.members || !workspaceData.members[userId]) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const tasksSnapshot = await db.collection('tasks')
      .where('projectId', '==', projectId)
      .get();

    const tasks: any[] = [];
    tasksSnapshot.forEach((doc: any) => {
      tasks.push({ id: doc.id, ...doc.data() });
    });

    tasks.sort((a: any, b: any) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    });

    res.json({ success: true, data: tasks });
  } catch (error: any) {
    console.error('❌ Error in GET /projects/:projectId/tasks:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create a new task
router.post('/projects/:projectId/tasks', authenticate, async (req: any, res) => {
  try {
    const { projectId } = req.params;
    const {
      title,
      description,
      priority,
      status,
      assignees,
      labels,
      estimatedHours,
      aiSummary,
      workspaceId,
      reviewerId
    } = req.body;
    const userId = req.user.uid;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Task title is required' });
    }

    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const projectData = projectDoc.data();

    // Check permission
    const isProjectMember = projectData?.members?.[userId];

    const workspaceDoc = await db.collection('workspaces').doc(workspaceId).get();
    const workspaceRole = workspaceDoc.data()?.members?.[userId]?.role;
    const isWorkspaceManagerPlus = ['OWNER', 'ADMIN', 'MANAGER'].includes(workspaceRole);

    if (!isProjectMember && !isWorkspaceManagerPlus) {
      return res.status(403).json({ success: false, error: '❌ You are not a member of this project or lack permissions to create tasks' });
    }

    const taskData = {
      title,
      description: description || '',
      priority: priority || 'MEDIUM',
      status: status || 'TODO',
      projectId,
      workspaceId,
      createdBy: userId,
      assignees: assignees || [userId],
      reviewerId: reviewerId || null,
      labels: labels || [],
      estimatedHours: estimatedHours || 4,
      aiSummary: aiSummary || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      isArchived: false,
      comments: [],
      activityLog: [
        {
          userId,
          action: 'created',
          timestamp: new Date(),
          details: `Task "${title}" was created`
        }
      ]
    };

    const taskRef = await db.collection('tasks').add(taskData);
    console.log(`✅ Task created with ID: ${taskRef.id}`);

    const currentMetrics = projectData?.metrics || { totalTasks: 0, completedTasks: 0, completionRate: 0 };
    await db.collection('projects').doc(projectId).update({
      'metrics.totalTasks': (currentMetrics.totalTasks || 0) + 1,
    });

    res.json({
      success: true,
      data: { id: taskRef.id, ...taskData }
    });
  } catch (error: any) {
    console.error('❌ Error in POST /projects/:projectId/tasks:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get a single task
router.get('/tasks/:taskId', authenticate, async (req: any, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.uid;

    const taskDoc = await db.collection('tasks').doc(taskId).get();
    if (!taskDoc.exists) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const taskData = taskDoc.data();

    // Check access permissions
    const workspaceDoc = await db.collection('workspaces').doc(taskData?.workspaceId).get();
    if (!workspaceDoc.exists) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const workspaceData = workspaceDoc.data();
    if (!workspaceData?.members || !workspaceData.members[userId]) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    res.json({
      success: true,
      data: { id: taskDoc.id, ...taskData }
    });
  } catch (error: any) {
    console.error('❌ Error in GET /tasks/:taskId:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update a task
router.put('/tasks/:taskId', authenticate, async (req: any, res) => {
  try {
    const { taskId } = req.params;
    const updates = req.body;
    const userId = req.user.uid;

    const taskDoc = await db.collection('tasks').doc(taskId).get();
    if (!taskDoc.exists) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const taskData = taskDoc.data();

    const projectDoc = await db.collection('projects').doc(taskData?.projectId).get();
    if (!projectDoc.exists) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const isAssignee = taskData?.assignees?.includes(userId);
    const isCreator = taskData?.createdBy === userId;
    const isReviewer = taskData?.reviewerId === userId;

    if (!isAssignee && !isCreator && !isReviewer) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }

    // Enforce reviewer rules if status is changing
    if (updates.status) {
      if (taskData?.status === 'REVIEW' && updates.status === 'DONE') {
        if (!taskData?.reviewerId) {
          return res.status(400).json({ success: false, error: 'A reviewer must be assigned before moving this task to DONE' });
        }
        if (!isReviewer) {
          return res.status(403).json({ success: false, error: 'Only the designated reviewer can move this task from REVIEW to DONE' });
        }
      } else if (taskData?.status === 'DONE' && updates.status === 'REVIEW') {
        if (!isReviewer) {
          return res.status(403).json({ success: false, error: 'Only the designated reviewer can move this task from DONE to REVIEW' });
        }
      }
    }

    const activityLog = taskData?.activityLog || [];
    activityLog.push({
      userId,
      action: 'updated',
      timestamp: new Date(),
      details: `Task "${taskData?.title}" was updated`
    });

    updates.updatedAt = new Date();
    updates.activityLog = activityLog;

    await db.collection('tasks').doc(taskId).update(updates);

    // Recalculate project metrics
    if (updates.status && updates.status !== taskData?.status) {
      const allProjectTasksSnapshot = await db.collection('tasks')
        .where('projectId', '==', taskData?.projectId)
        .where('isArchived', '==', false)
        .get();

      const allTasks = allProjectTasksSnapshot.docs.map((doc: any) => doc.data());
      const totalTasks = allTasks.length;
      const completedTasks = allTasks.filter((t: any) => t.status === 'DONE').length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      await db.collection('projects').doc(taskData?.projectId).update({
        'metrics.totalTasks': totalTasks,
        'metrics.completedTasks': completedTasks,
        'metrics.completionRate': completionRate,
      });
    }

    const updatedDoc = await db.collection('tasks').doc(taskId).get();
    res.json({
      success: true,
      data: { id: updatedDoc.id, ...updatedDoc.data() }
    });
  } catch (error: any) {
    console.error('❌ Error in PUT /tasks/:taskId:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Submit work for a task
router.post('/tasks/:taskId/submissions', authenticate, async (req: any, res) => {
  try {
    const { taskId } = req.params;
    const { note, files } = req.body;
    const userId = req.user.uid;

    const taskDoc = await db.collection('tasks').doc(taskId).get();
    if (!taskDoc.exists) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const taskData = taskDoc.data();
    const isAssignee = taskData?.assignees?.includes(userId);
    const isCreator = taskData?.createdBy === userId;

    if (!isAssignee && !isCreator) {
      return res.status(403).json({ success: false, error: 'Only task assignees or creators can submit work' });
    }

    const submissionId = crypto.randomBytes(8).toString('hex');
    const submission = {
      id: submissionId,
      note: note || '',
      files: files || [],
      status: 'SUBMITTED',
      submittedBy: req.user.displayName || req.user.email || 'Unknown User',
      submittedById: userId,
      submittedAt: new Date()
    };

    const submissions = taskData?.submissions || [];
    submissions.push(submission);

    const activityLog = taskData?.activityLog || [];
    activityLog.push({
      userId,
      action: 'submitted',
      timestamp: new Date(),
      details: `${req.user.displayName || req.user.email} submitted work for review`
    });

    const updates: any = {
      status: 'REVIEW',
      submissions,
      activityLog,
      updatedAt: new Date(),
      updatedById: userId
    };

    await db.collection('tasks').doc(taskId).update(updates);

    // Update project metrics if status changed to REVIEW
    if (taskData?.status !== 'REVIEW') {
      const allProjectTasksSnapshot = await db.collection('tasks')
        .where('projectId', '==', taskData?.projectId)
        .where('isArchived', '==', false)
        .get();

      const allTasks = allProjectTasksSnapshot.docs.map((doc: any) => doc.data());
      const updatedTasks = allTasks.map((t: any) => t.id === taskId ? { ...t, status: 'REVIEW' } : t);

      const totalTasks = updatedTasks.length;
      const completedTasks = updatedTasks.filter((t: any) => t.status === 'DONE').length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      await db.collection('projects').doc(taskData?.projectId).update({
        'metrics.totalTasks': totalTasks,
        'metrics.completedTasks': completedTasks,
        'metrics.completionRate': completionRate,
      });
    }

    const updatedDoc = await db.collection('tasks').doc(taskId).get();
    res.json({
      success: true,
      data: { id: updatedDoc.id, ...updatedDoc.data() },
      message: 'Work submitted successfully'
    });
  } catch (error: any) {
    console.error('❌ Error in POST /tasks/:taskId/submissions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Review a task submission
router.post('/tasks/:taskId/reviews', authenticate, async (req: any, res) => {
  try {
    const { taskId } = req.params;
    const { action, feedback } = req.body;
    const userId = req.user.uid;

    if (!action || !['APPROVE', 'REQUEST_REVISION'].includes(action)) {
      return res.status(400).json({ success: false, error: 'Invalid action. Must be APPROVE or REQUEST_REVISION' });
    }

    const taskDoc = await db.collection('tasks').doc(taskId).get();
    if (!taskDoc.exists) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const taskData = taskDoc.data();

    // Check if user is the designated reviewer
    if (taskData?.reviewerId !== userId) {
      return res.status(403).json({ success: false, error: 'Only the designated reviewer can review task submissions' });
    }

    const submissions = taskData?.submissions || [];
    if (submissions.length === 0) {
      return res.status(400).json({ success: false, error: 'No submissions found to review' });
    }

    // Get the latest submission
    const latestSubmission = submissions[submissions.length - 1];

    // Update its status and reviewer info
    latestSubmission.status = action === 'APPROVE' ? 'APPROVED' : 'NEEDS_REVISION';
    latestSubmission.feedback = feedback || '';
    latestSubmission.reviewedBy = req.user.displayName || req.user.email || 'Unknown Reviewer';
    latestSubmission.reviewedById = userId;
    latestSubmission.reviewedAt = new Date();

    const activityLog = taskData?.activityLog || [];
    const reviewerName = req.user.displayName || req.user.email;

    let newStatus = taskData?.status;
    if (action === 'APPROVE') {
      newStatus = 'DONE';
      activityLog.push({
        userId,
        action: 'approved',
        timestamp: new Date(),
        details: `${reviewerName} approved the task work submission`
      });
    } else {
      newStatus = 'IN_PROGRESS';
      activityLog.push({
        userId,
        action: 'requested_changes',
        timestamp: new Date(),
        details: `${reviewerName} requested changes: "${feedback || 'No feedback provided'}"`
      });
    }

    const updates: any = {
      status: newStatus,
      submissions,
      activityLog,
      updatedAt: new Date(),
      updatedById: userId
    };

    await db.collection('tasks').doc(taskId).update(updates);

    // Update project metrics
    if (newStatus !== taskData?.status) {
      const allProjectTasksSnapshot = await db.collection('tasks')
        .where('projectId', '==', taskData?.projectId)
        .where('isArchived', '==', false)
        .get();

      const allTasks = allProjectTasksSnapshot.docs.map((doc: any) => doc.data());
      const updatedTasks = allTasks.map((t: any) => t.id === taskId ? { ...t, status: newStatus } : t);

      const totalTasks = updatedTasks.length;
      const completedTasks = updatedTasks.filter((t: any) => t.status === 'DONE').length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      await db.collection('projects').doc(taskData?.projectId).update({
        'metrics.totalTasks': totalTasks,
        'metrics.completedTasks': completedTasks,
        'metrics.completionRate': completionRate,
      });
    }

    const updatedDoc = await db.collection('tasks').doc(taskId).get();
    res.json({
      success: true,
      data: { id: updatedDoc.id, ...updatedDoc.data() },
      message: action === 'APPROVE' ? 'Submission approved successfully' : 'Changes requested successfully'
    });
  } catch (error: any) {
    console.error('❌ Error in POST /tasks/:taskId/reviews:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add comment to a task
router.post('/tasks/:taskId/comments', authenticate, async (req: any, res) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;
    const userId = req.user.uid;

    if (!content) {
      return res.status(400).json({ success: false, error: 'Comment content is required' });
    }

    const taskDoc = await db.collection('tasks').doc(taskId).get();
    if (!taskDoc.exists) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const taskData = taskDoc.data();
    const comment = {
      id: crypto.randomBytes(8).toString('hex'),
      content,
      authorId: userId,
      authorName: req.user.displayName || req.user.email || 'Unknown User',
      createdAt: new Date()
    };

    const comments = taskData?.comments || [];
    comments.push(comment);

    await db.collection('tasks').doc(taskId).update({
      comments,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      data: comment,
      message: 'Comment added successfully'
    });
  } catch (error: any) {
    console.error('❌ Error in POST /tasks/:taskId/comments:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete/Archive a task
router.delete('/tasks/:taskId', authenticate, async (req: any, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.uid;

    const taskDoc = await db.collection('tasks').doc(taskId).get();
    if (!taskDoc.exists) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const taskData = taskDoc.data();

    if (taskData?.createdBy !== userId) {
      return res.status(403).json({ success: false, error: 'Only the task creator can delete this task' });
    }

    await db.collection('tasks').doc(taskId).update({
      isActive: false,
      isArchived: true,
      archivedAt: new Date(),
    });

    res.json({ success: true, message: 'Task archived successfully' });
  } catch (error: any) {
    console.error('❌ Error in DELETE /tasks/:taskId:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ===== DASHBOARD ROUTES =====
// ============================================

router.get('/dashboard/summary', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.uid;

    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData?.workspaces) {
      return res.json({
        success: true,
        data: {
          totalProjects: 0,
          totalTasks: 0,
          todoCount: 0,
          inProgressCount: 0,
          doneCount: 0,
          completionRate: 0,
          recentProjects: [],
          recentTasks: [],
          projects: []
        }
      });
    }

    const workspaceIds = Object.keys(userData.workspaces);
    let allTasks: any[] = [];
    let allProjects: any[] = [];

    for (const workspaceId of workspaceIds) {
      const projectsSnapshot = await db.collection('projects')
        .where('workspaceId', '==', workspaceId)
        .get();

      projectsSnapshot.forEach((doc: any) => {
        allProjects.push({ id: doc.id, ...doc.data() });
      });

      const tasksSnapshot = await db.collection('tasks')
        .where('assignees', 'array-contains', userId)
        .get();

      tasksSnapshot.forEach((doc: any) => {
        allTasks.push({ id: doc.id, ...doc.data() });
      });
    }

    const todoTasks = allTasks.filter((t: any) => t.status === 'TODO');
    const inProgressTasks = allTasks.filter((t: any) => t.status === 'IN_PROGRESS');
    const doneTasks = allTasks.filter((t: any) => t.status === 'DONE');

    res.json({
      success: true,
      data: {
        totalProjects: allProjects.length,
        totalTasks: allTasks.length,
        todoCount: todoTasks.length,
        inProgressCount: inProgressTasks.length,
        doneCount: doneTasks.length,
        completionRate: allTasks.length > 0 ? Math.round((doneTasks.length / allTasks.length) * 100) : 0,
        recentProjects: allProjects.slice(0, 3),
        recentTasks: allTasks.slice(0, 5),
        projects: allProjects
      }
    });
  } catch (error: any) {
    console.error('❌ Error in GET /dashboard/summary:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;