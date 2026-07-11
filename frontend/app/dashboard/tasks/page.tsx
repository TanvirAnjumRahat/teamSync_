'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import TaskCard from '@/components/dashboard/TaskCard';
import TaskForm from '@/components/dashboard/TaskForm';
import { Task, TaskStatus, TaskPriority } from '@/types';

type FilterType = 'all' | 'my-tasks' | 'status' | 'priority';

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch tasks in real-time from Firestore
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let q;
      if (filterType === 'my-tasks') {
        q = query(collection(db, 'tasks'), where('assigneeId', '==', user.uid));
      } else {
        q = query(collection(db, 'tasks'), where('createdById', '==', user.uid));
      }

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const tasksData: Task[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          tasksData.push({
            id: doc.id,
            projectId: data.projectId,
            title: data.title,
            description: data.description,
            assigneeId: data.assigneeId,
            status: data.status,
            priority: data.priority,
            aiSummary: data.aiSummary,
            estimatedHours: data.estimatedHours,
            createdById: data.createdById,
            createdAt: data.createdAt?.toDate?.() || new Date(),
            updatedAt: data.updatedAt?.toDate?.() || new Date(),
            updatedById: data.updatedById,
            dueDate: data.dueDate?.toDate?.(),
            labels: data.labels || [],
          } as Task);
        });

        setTasks(tasksData);
        setError('');
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
      setLoading(false);
    }
  }, [user?.uid, filterType]);

  // Filter and search tasks
  const filteredTasks = tasks.filter((task) => {
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
    if (
      searchTerm &&
      !task.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !task.description?.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  // Group tasks by status
  const groupedTasks = {
    TODO: filteredTasks.filter((t) => t.status === 'TODO'),
    IN_PROGRESS: filteredTasks.filter((t) => t.status === 'IN_PROGRESS'),
    DONE: filteredTasks.filter((t) => t.status === 'DONE'),
  };

  const stats = {
    total: filteredTasks.length,
    completed: groupedTasks.DONE.length,
    inProgress: groupedTasks.IN_PROGRESS.length,
    todo: groupedTasks.TODO.length,
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-100 mb-2">Tasks</h1>
                <p className="text-gray-400">Manage and track your team's work</p>
              </div>
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
              >
                {showForm ? '✕ Cancel' : '+ New Task'}
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <p className="text-gray-400 text-sm font-semibold">Total Tasks</p>
                <p className="text-3xl font-bold text-white mt-2">{stats.total}</p>
              </div>
              <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
                <p className="text-gray-400 text-sm font-semibold">In Progress</p>
                <p className="text-3xl font-bold text-blue-400 mt-2">{stats.inProgress}</p>
              </div>
              <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
                <p className="text-gray-400 text-sm font-semibold">Completed</p>
                <p className="text-3xl font-bold text-green-400 mt-2">{stats.completed}</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <p className="text-gray-400 text-sm font-semibold">Todo</p>
                <p className="text-3xl font-bold text-yellow-400 mt-2">{stats.todo}</p>
              </div>
            </div>
          </div>

          {/* Task Form */}
          {showForm && (
            <div className="mb-8 bg-gray-900 border border-gray-800 rounded-lg p-6">
              <TaskForm
                onSuccess={() => {
                  setShowForm(false);
                }}
              />
            </div>
          )}

          {/* Filters */}
          <div className="mb-6 space-y-4">
            {/* Search */}
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />

            {/* Filter buttons */}
            <div className="flex flex-wrap gap-3">
              <div>
                <label className="text-sm text-gray-400 block mb-2">Filter Type:</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                      filterType === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    All Tasks
                  </button>
                  <button
                    onClick={() => setFilterType('my-tasks')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                      filterType === 'my-tasks'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    My Tasks
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-2">Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'all')}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-800 text-gray-300 border border-gray-700 focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="TODO">Todo</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-2">Priority:</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'all')}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-800 text-gray-300 border border-gray-700 focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Priority</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="text-center py-12">
              <p className="text-gray-400">Loading tasks...</p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Tasks Grid - Kanban Style */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* TODO Column */}
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white">
                    📋 Todo <span className="text-gray-400 text-sm">({groupedTasks.TODO.length})</span>
                  </h2>
                </div>
                <div className="space-y-3">
                  {groupedTasks.TODO.map((task) => (
                    <TaskCard key={task.id} task={task} onUpdate={() => {}} />
                  ))}
                  {groupedTasks.TODO.length === 0 && (
                    <p className="text-gray-500 text-sm py-4 text-center">No tasks</p>
                  )}
                </div>
              </div>

              {/* IN PROGRESS Column */}
              <div className="bg-blue-900/10 border border-blue-700/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white">
                    🚀 In Progress <span className="text-gray-400 text-sm">({groupedTasks.IN_PROGRESS.length})</span>
                  </h2>
                </div>
                <div className="space-y-3">
                  {groupedTasks.IN_PROGRESS.map((task) => (
                    <TaskCard key={task.id} task={task} onUpdate={() => {}} />
                  ))}
                  {groupedTasks.IN_PROGRESS.length === 0 && (
                    <p className="text-gray-500 text-sm py-4 text-center">No tasks</p>
                  )}
                </div>
              </div>

              {/* DONE Column */}
              <div className="bg-green-900/10 border border-green-700/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white">
                    ✅ Done <span className="text-gray-400 text-sm">({groupedTasks.DONE.length})</span>
                  </h2>
                </div>
                <div className="space-y-3">
                  {groupedTasks.DONE.map((task) => (
                    <TaskCard key={task.id} task={task} onUpdate={() => {}} />
                  ))}
                  {groupedTasks.DONE.length === 0 && (
                    <p className="text-gray-500 text-sm py-4 text-center">No tasks</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && filteredTasks.length === 0 && !error && (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">No tasks found</p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition"
              >
                Create your first task
              </button>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
