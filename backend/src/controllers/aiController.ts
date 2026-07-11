// backend/src/controllers/aiController.ts
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { geminiModel } from '../config/gemini';
import { db } from '../config/firebase';

// Helper: Parse Gemini JSON response
function parseGeminiResponse(text: string) {
  try {
    // Try to parse as JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    return null;
  }
}

export const analyzeTask = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description } = req.body;
    
    if (!title) {
      return res.status(400).json({ 
        success: false, 
        error: 'Task title is required' 
      });
    }

    const prompt = `Analyze the following IT task and respond with a valid JSON object containing:
    - "summary": A brief summary in 1-2 sentences (max 50 words)
    - "suggestedPriority": Choose from "LOW", "MEDIUM", "HIGH", or "URGENT"
    - "estimatedHours": A number between 1 and 40 (reasonable estimate)
    - "suggestedLabels": An array of 1-3 relevant labels (e.g., "bug", "feature", "enhancement", "documentation")

    Task Title: ${title}
    Description: ${description || 'No description provided'}

    Return ONLY valid JSON. Example: {"summary": "Fix login bug", "suggestedPriority": "HIGH", "estimatedHours": 3, "suggestedLabels": ["bug", "backend"]}`;

    const result = await geminiModel.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse the response
    let parsedResponse = parseGeminiResponse(text);
    
    // If parsing failed, try a simpler approach
    if (!parsedResponse) {
      // Extract summary from the raw text
      const summaryMatch = text.match(/summary["']?\s*:\s*["']([^"']+)["']/i);
      const priorityMatch = text.match(/suggestedPriority["']?\s*:\s*["']([^"']+)["']/i);
      const hoursMatch = text.match(/estimatedHours["']?\s*:\s*(\d+)/i);
      
      parsedResponse = {
        summary: summaryMatch ? summaryMatch[1] : `Task: ${title}`,
        suggestedPriority: priorityMatch ? priorityMatch[1].toUpperCase() : 'MEDIUM',
        estimatedHours: hoursMatch ? parseInt(hoursMatch[1]) : 4,
        suggestedLabels: ['feature']
      };
    }

    // Validate and normalize priority
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    const priority = validPriorities.includes(parsedResponse.suggestedPriority) 
      ? parsedResponse.suggestedPriority 
      : 'MEDIUM';

    // Validate estimated hours
    const hours = Math.min(Math.max(parsedResponse.estimatedHours || 4, 1), 40);

    res.json({
      success: true,
      data: {
        summary: parsedResponse.summary || `Task: ${title}`,
        suggestedPriority: priority,
        estimatedHours: hours,
        suggestedLabels: Array.isArray(parsedResponse.suggestedLabels) 
          ? parsedResponse.suggestedLabels.slice(0, 3) 
          : ['feature']
      }
    });
  } catch (error) {
    console.error('Gemini API error:', error);
    // Fallback response
    res.json({
      success: true,
      data: {
        summary: `Task requires attention: ${req.body.title}`,
        suggestedPriority: 'MEDIUM',
        estimatedHours: 4,
        suggestedLabels: ['feature']
      }
    });
  }
};

export const getProjectMetrics = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    
    if (!projectId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Project ID is required' 
      });
    }

    const tasksSnapshot = await db.collection('tasks')
      .where('projectId', '==', projectId)
      .get();
    
    const tasks = tasksSnapshot.docs.map((doc: any) => ({ 
      id: doc.id, 
      ...doc.data() 
    }));
    
    const total = tasks.length;
    const completed = tasks.filter((t: any) => t.status === 'DONE').length;
    const inProgress = tasks.filter((t: any) => t.status === 'IN_PROGRESS').length;
    const todo = tasks.filter((t: any) => t.status === 'TODO').length;
    
    const priorityCount = {
      URGENT: tasks.filter((t: any) => t.priority === 'URGENT').length,
      HIGH: tasks.filter((t: any) => t.priority === 'HIGH').length,
      MEDIUM: tasks.filter((t: any) => t.priority === 'MEDIUM').length,
      LOW: tasks.filter((t: any) => t.priority === 'LOW').length,
    };
    
    res.json({
      success: true,
      data: {
        total,
        completed,
        inProgress,
        todo,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        priorityDistribution: priorityCount,
        tasks: tasks.slice(0, 20)
      }
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

export const generateProjectSummary = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        error: 'Project not found' 
      });
    }
    
    const project = projectDoc.data();
    
    const tasksSnapshot = await db.collection('tasks')
      .where('projectId', '==', projectId)
      .get();
    
    const tasks = tasksSnapshot.docs.map((doc: any) => doc.data());
    const completedTasks = tasks.filter((t: any) => t.status === 'DONE');

    const prompt = `Generate a brief project status summary (max 100 words) for the following IT project:

Project: ${project?.name}
Description: ${project?.description || 'No description'}
Total Tasks: ${tasks.length}
Completed Tasks: ${completedTasks.length}
Urgent Tasks: ${tasks.filter((t: any) => t.priority === 'URGENT').length}
High Priority Tasks: ${tasks.filter((t: any) => t.priority === 'HIGH').length}

Provide a professional, concise summary highlighting progress and challenges.`;

    const result = await geminiModel.generateContent(prompt);
    const response = result.response;
    const summary = response.text();

    res.json({
      success: true,
      data: {
        summary: summary || 'Project summary unavailable',
        metrics: {
          totalTasks: tasks.length,
          completedTasks: completedTasks.length,
          completionRate: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};