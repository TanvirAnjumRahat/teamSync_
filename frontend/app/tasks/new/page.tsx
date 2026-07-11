'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/dashboard/MainLayout';
import { AIAnalyzeButton } from '@/components/tasks/AIAnalyzeButton';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';
import { ApiClient } from '@/lib/api';

interface Project {
  id: string;
  name: string;
  workspaceId: string;
}

export default function CreateTaskPage() {
  const { workspaces, currentWorkspace, switchWorkspace } = useWorkspace();
  const { user } = useAuth();
  const router = useRouter();

  // State
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [loadingProjects, setLoadingProjects] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [status, setStatus] = useState('TODO');
  const [aiSummary, setAiSummary] = useState('');
  const [aiPriority, setAiPriority] = useState('MEDIUM');
  const [estimatedHours, setEstimatedHours] = useState(4);
  const [labels, setLabels] = useState<string[]>([]);
  const [assigneeId, setAssigneeId] = useState('');
  const [reviewerId, setReviewerId] = useState('');
  const [workspaceMembers, setWorkspaceMembers] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isFadingOut, setIsFadingOut] = useState(false);

  const showError = (msg: string) => {
    setError(msg);
    setIsFadingOut(false);
    setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        setError('');
        setIsFadingOut(false);
      }, 1000); // 1s fade duration
    }, 4000); // Show for 4s before fading
  };

  // Set default workspace
  useEffect(() => {
    if (currentWorkspace) {
      setSelectedWorkspaceId(currentWorkspace.id);
    } else if (workspaces.length > 0) {
      setSelectedWorkspaceId(workspaces[0].id);
    }
  }, [currentWorkspace, workspaces]);

  // Load projects and members when workspace changes
  useEffect(() => {
    if (selectedWorkspaceId) {
      loadProjects(selectedWorkspaceId);
      loadWorkspaceMembers(selectedWorkspaceId);
    } else {
      setProjects([]);
      setSelectedProjectId('');
      setWorkspaceMembers([]);
    }
  }, [selectedWorkspaceId]);

  const loadWorkspaceMembers = async (workspaceId: string) => {
    try {
      const response = await ApiClient.getWorkspaceMembers(workspaceId);
      if (response.success && response.data) {
        setWorkspaceMembers(response.data as any[]);
      }
    } catch (err) {
      console.error('Failed to load workspace members:', err);
    }
  };

  const loadProjects = async (workspaceId: string) => {
    try {
      setLoadingProjects(true);
      const response = await ApiClient.getProjects(workspaceId);
      if (response.success && response.data) {
        const projectsData = response.data as any[];
        setProjects(projectsData);
        // Auto-select first project if available
        if (projectsData.length > 0) {
          setSelectedProjectId(projectsData[0].id);
        } else {
          setSelectedProjectId('');
        }
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleWorkspaceChange = (workspaceId: string) => {
    setSelectedWorkspaceId(workspaceId);
    setSelectedProjectId('');
    // Switch workspace context
    const workspace = workspaces.find(w => w.id === workspaceId);
    if (workspace && workspace.id !== currentWorkspace?.id) {
      switchWorkspace(workspace.id);
    }
  };

  const handleAIAnalysisComplete = (result: any) => {
    setAiSummary(result.summary);
    setAiPriority(result.suggestedPriority);
    setEstimatedHours(result.estimatedHours);
    setLabels(result.suggestedLabels);
    setPriority(result.suggestedPriority);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedWorkspaceId) {
      showError('Please select a workspace');
      return;
    }

    if (!selectedProjectId) {
      showError('Please select a project');
      return;
    }

    setLoading(true);
    setError('');
    setIsFadingOut(false);

    try {
      await ApiClient.createTask(selectedProjectId, {
        title,
        description,
        priority,
        status,
        aiSummary,
        estimatedHours,
        labels,
        assignees: assigneeId ? [assigneeId] : [user?.uid],
        reviewerId: reviewerId || null,
        workspaceId: selectedWorkspaceId,
        createdBy: user?.uid,
      });
      
      router.push('/tasks');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Create New Task</h1>
            <p className="text-gray-400 text-sm mt-1">Add a new task to your project</p>
          </div>
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white transition"
          >
            ← Back
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-gray-900 rounded-xl p-6 border border-gray-800">
          {/* Workspace Selection */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Workspace <span className="text-red-400">*</span>
            </label>
            <select
              value={selectedWorkspaceId}
              onChange={(e) => handleWorkspaceChange(e.target.value)}
              className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 outline-none"
              required
            >
              <option value="">Select a workspace</option>
              {workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
            </select>
          </div>

          {/* Project Selection */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Project <span className="text-red-400">*</span>
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 outline-none"
              required
              disabled={!selectedWorkspaceId || loadingProjects}
            >
              <option value="">
                {loadingProjects ? 'Loading projects...' : 'Select a project'}
              </option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            {selectedWorkspaceId && projects.length === 0 && !loadingProjects && (
              <p className="text-yellow-400 text-xs mt-1">
                No projects in this workspace. Create a project first.
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Task Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="Enter task title"
              required
            />
          </div>

          {/* AI Analyze Button */}
          {title.trim() && (
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <p className="text-sm text-gray-400 mb-3">🤖 Use AI to analyze your task:</p>
              <AIAnalyzeButton
                title={title}
                description={description}
                onResult={handleAIAnalysisComplete}
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
              placeholder="Describe the task in detail"
              style={{ backgroundColor: '#1e293b', color: '#f8fafc' }}
            />
          </div>

          {/* Assignee & Reviewer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Assignee
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 outline-none"
              >
                <option value="">Unassigned</option>
                {workspaceMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.displayName || member.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Reviewer
              </label>
              <select
                value={reviewerId}
                onChange={(e) => setReviewerId(e.target.value)}
                className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 outline-none"
              >
                <option value="">No Reviewer</option>
                {workspaceMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.displayName || member.email}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 outline-none"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 outline-none"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="REVIEW">Review</option>
                <option value="DONE">Done</option>
              </select>
            </div>
          </div>

          {/* Estimated Hours & Labels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Estimated Hours
              </label>
              <input
                type="number"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(Number(e.target.value))}
                min={1}
                max={40}
                className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Labels (comma separated)
              </label>
              <input
                type="text"
                value={labels.join(', ')}
                onChange={(e) => setLabels(e.target.value.split(',').map(l => l.trim()).filter(Boolean))}
                className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 outline-none"
                placeholder="bug, frontend, authentication"
              />
            </div>
          </div>

          {/* AI Summary Display */}
          {aiSummary && (
            <div className="bg-purple-900/20 border border-purple-800/30 rounded-lg p-4">
              <p className="text-xs text-purple-400 font-medium mb-1">🤖 AI SUMMARY</p>
              <p className="text-gray-200 text-sm">{aiSummary}</p>
              <div className="flex gap-4 mt-2">
                <p className="text-xs text-gray-500">
                  Priority: <span className="text-gray-300">{aiPriority}</span>
                </p>
                <p className="text-xs text-gray-500">
                  Hours: <span className="text-gray-300">{estimatedHours}h</span>
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className={`bg-red-900/20 border border-red-700 text-red-400 px-4 py-3 rounded-lg text-sm transition-opacity duration-1000 ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}>
              {error.startsWith('❌') ? error : `❌ ${error}`}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !selectedWorkspaceId || !selectedProjectId}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition"
          >
            {loading ? 'Creating Task...' : 'Create Task'}
          </button>
        </form>
      </div>
    </MainLayout>
  );
}
