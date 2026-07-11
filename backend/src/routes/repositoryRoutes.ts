import express from 'express';
import { authenticate } from '../middleware/auth';
import { db } from '../config/firebase';

const router = express.Router();

// Get all files and folders in a workspace/project repository
router.get('/:workspaceId', authenticate, async (req: any, res) => {
  try {
    const { workspaceId } = req.params;
    
    // Check workspace access
    const workspaceDoc = await db.collection('workspaces').doc(workspaceId).get();
    if (!workspaceDoc.exists) {
      return res.status(404).json({ success: false, error: 'Workspace not found' });
    }

    const filesSnapshot = await db.collection('repository_files')
      .where('workspaceId', '==', workspaceId)
      .get();
      
    const items: any[] = [];
    filesSnapshot.forEach(doc => {
      items.push({ id: doc.id, ...doc.data() });
    });

    res.json({ success: true, data: items });
  } catch (error: any) {
    console.error('❌ Error getting repository files:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create a file or folder
router.post('/:workspaceId', authenticate, async (req: any, res) => {
  try {
    const { workspaceId } = req.params;
    const { name, type, parentId, url, size, mimeType } = req.body;
    const userId = req.user.uid;

    const newItem = {
      workspaceId,
      name,
      type, // 'FILE' or 'FOLDER'
      parentId: parentId || null,
      url: url || null,
      size: size || 0,
      mimeType: mimeType || null,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await db.collection('repository_files').add(newItem);
    
    // Log commit/activity
    await db.collection('repository_commits').add({
      workspaceId,
      fileId: docRef.id,
      action: 'CREATE',
      userId,
      message: `Created ${type.toLowerCase()} ${name}`,
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, data: { id: docRef.id, ...newItem } });
  } catch (error: any) {
    console.error('❌ Error creating repository item:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete a file or folder
router.delete('/:workspaceId/:fileId', authenticate, async (req: any, res) => {
  try {
    const { workspaceId, fileId } = req.params;
    const userId = req.user.uid;

    const fileRef = db.collection('repository_files').doc(fileId);
    const fileDoc = await fileRef.get();

    if (!fileDoc.exists) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    const fileData = fileDoc.data();

    await fileRef.delete();

    // Log commit/activity
    await db.collection('repository_commits').add({
      workspaceId,
      fileId,
      action: 'DELETE',
      userId,
      message: `Deleted ${fileData?.type.toLowerCase()} ${fileData?.name}`,
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error: any) {
    console.error('❌ Error deleting repository item:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get commit history for a workspace
router.get('/:workspaceId/commits', authenticate, async (req: any, res) => {
  try {
    const { workspaceId } = req.params;
    
    const commitsSnapshot = await db.collection('repository_commits')
      .where('workspaceId', '==', workspaceId)
      .get();
      
    const commits: any[] = [];
    commitsSnapshot.forEach(doc => {
      commits.push({ id: doc.id, ...doc.data() });
    });

    // Sort in memory to avoid composite index requirement
    commits.sort((a, b) => {
      const tA = a.timestamp || '';
      const tB = b.timestamp || '';
      return tB.localeCompare(tA);
    });

    res.json({ success: true, data: commits });
  } catch (error: any) {
    console.error('❌ Error getting repository commits:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
