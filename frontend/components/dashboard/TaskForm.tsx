'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { TaskPriority } from '@/types';

interface TaskFormProps {
  onSuccess?: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: 'default-project',
    priority: 'MEDIUM' as TaskPriority,
    dueDate: '',
  });
  const [aiSuggestions, setAiSuggestions] = useState<{
    summary: string;
    suggestedPriority: TaskPriority;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  // Get AI analysis/suggestions
  const handleAnalyze = async () => {
    if (!formData.title || !formData.description) {
      setError('Please enter both title and description first');
      return;
    }

    setAnalyzing(true);
    setError('');

    try {
      const response = await fetch('/api/ai/analyze-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await auth.currentUser?.getIdToken()}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI analysis');
      }

      const data = await response.json();
      if (data.success) {
        setAiSuggestions({
          summary: data.data.summary,
          suggestedPriority: data.data.suggestedPriority,
        });
      }
    } catch (err) {
      console.error('AI Analysis error:', err);
      setError('Could not analyze task. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Submit task
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const taskData = {
        title: formData.title,
        description: formData.description,
        projectId: formData.projectId,
        status: 'TODO' as const,
        priority: aiSuggestions?.suggestedPriority || formData.priority,
        aiSummary: aiSuggestions?.summary || '',
        assigneeId: null,
        createdById: user?.uid || '',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        updatedById: user?.uid || '',
        dueDate: formData.dueDate ? Timestamp.fromDate(new Date(formData.dueDate)) : null,
        labels: [],
        estimatedHours: null,
      };

      await addDoc(collection(db, 'tasks'), taskData);

      // Reset form
      setFormData({
        title: '',
        description: '',
        projectId: 'default-project',
        priority: 'MEDIUM',
        dueDate: '',
      });
      setAiSuggestions(null);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">Task Title *</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter task title"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the task details..."
          rows={4}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">💡 Better descriptions help AI provide better analysis</p>
      </div>

      {/* AI Analysis Section */}
      {!aiSuggestions && (
        <div>
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={analyzing || !formData.title}
            className="w-full bg-blue-700 hover:bg-blue-600 disabled:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
          >
            {analyzing ? (
              <>
                <span className="animate-spin">⟳</span> Analyzing with AI...
              </>
            ) : (
              <>
                <span>✨</span> Get AI Suggestions
              </>
            )}
          </button>
        </div>
      )}

      {/* AI Suggestions Display */}
      {aiSuggestions && (
        <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 space-y-3">
          <div>
            <p className="text-sm font-semibold text-blue-300 mb-1">📝 AI Summary:</p>
            <p className="text-sm text-gray-300">{aiSuggestions.summary}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-300 mb-1">🎯 Suggested Priority:</p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold px-3 py-1 bg-blue-600 text-white rounded">
                {aiSuggestions.suggestedPriority}
              </span>
              <button
                type="button"
                onClick={() => setAiSuggestions(null)}
                className="text-xs text-gray-400 hover:text-gray-300"
              >
                Clear suggestions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project ID */}
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">Project</label>
        <input
          type="text"
          value={formData.projectId}
          onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
          placeholder="default-project"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Priority */}
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">Priority</label>
        <select
          value={aiSuggestions?.suggestedPriority || formData.priority}
          onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
        >
          <option value="LOW">🔵 Low</option>
          <option value="MEDIUM">🟡 Medium</option>
          <option value="HIGH">🟠 High</option>
          <option value="URGENT">🔴 Urgent</option>
        </select>
      </div>

      {/* Due Date */}
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">Due Date</label>
        <input
          type="date"
          value={formData.dueDate}
          onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition"
      >
        {loading ? 'Creating task...' : 'Create Task'}
      </button>
    </form>
  );
};

export default TaskForm;
