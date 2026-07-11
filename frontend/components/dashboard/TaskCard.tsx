'use client';

import React, { useState } from 'react';
import { Task, TaskStatus, TaskPriority } from '@/types';
import { db } from '@/lib/firebase';
import { updateDoc, doc, deleteDoc } from 'firebase/firestore';

interface TaskCardProps {
  task: Task;
  onUpdate?: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onUpdate }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const getPrioritylColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'LOW':
        return 'text-blue-400 bg-blue-900/30';
      case 'MEDIUM':
        return 'text-yellow-400 bg-yellow-900/30';
      case 'HIGH':
        return 'text-orange-400 bg-orange-900/30';
      case 'URGENT':
        return 'text-red-400 bg-red-900/30';
      default:
        return 'text-gray-400 bg-gray-900/30';
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'TODO':
        return 'text-gray-400';
      case 'IN_PROGRESS':
        return 'text-blue-400';
      case 'DONE':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'TODO':
        return '○';
      case 'IN_PROGRESS':
        return '⟳';
      case 'DONE':
        return '✓';
      default:
        return '○';
    }
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    try {
      setIsUpdating(true);
      const taskRef = doc(db, 'tasks', task.id);
      await updateDoc(taskRef, { status: newStatus });
      onUpdate?.();
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      setIsUpdating(true);
      const taskRef = doc(db, 'tasks', task.id);
      await deleteDoc(taskRef);
      onUpdate?.();
    } catch (error) {
      console.error('Failed to delete task:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-white font-semibold text-sm leading-tight hover:text-blue-400 cursor-pointer transition">
            {task.title}
          </h3>
          <p className={`text-xs mt-1 ${getStatusColor(task.status)}`}>
            {getStatusIcon(task.status)} {task.status.replace('_', ' ')}
          </p>
        </div>
        <div className={`px-2 py-1 rounded text-xs font-semibold ${getPrioritylColor(task.priority)}`}>
          {task.priority}
        </div>
      </div>

      {/* Description/AI Summary */}
      {task.aiSummary && (
        <p className="text-xs text-gray-400 mb-3 line-clamp-2 leading-relaxed">
          <span className="text-blue-400">✨ AI:</span> {task.aiSummary}
        </p>
      )}

      {/* Project ID */}
      <div className="mb-3">
        <p className="text-xs text-gray-500">
          📁 <span className="text-gray-400">{task.projectId}</span>
        </p>
      </div>

      {/* Due Date */}
      {task.dueDate && (
        <div className="mb-3">
          <p className="text-xs text-gray-500">
            📅 {new Date(task.dueDate).toLocaleDateString()}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
        {task.status !== 'DONE' && (
          <button
            onClick={() => handleStatusChange('IN_PROGRESS')}
            disabled={isUpdating}
            className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition disabled:opacity-50"
          >
            Move
          </button>
        )}
        {task.status !== 'DONE' && (
          <button
            onClick={() => handleStatusChange('DONE')}
            disabled={isUpdating}
            className="text-xs px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition disabled:opacity-50"
          >
            Done
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={isUpdating}
          className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default TaskCard;
