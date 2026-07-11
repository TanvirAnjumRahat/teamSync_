'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

interface TaskData {
  id: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  projectId: string;
  createdAt: Date;
}

interface ProjectData {
  id: string;
  taskCount: number;
  completedCount: number;
  teamMembers: string[];
  name: string;
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');

  // Fetch tasks in real-time
  useEffect(() => {
    if (!user?.uid) return;

    setLoading(true);
    const q = query(collection(db, 'tasks'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData: TaskData[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        tasksData.push({
          id: doc.id,
          status: data.status || 'TODO',
          priority: data.priority || 'MEDIUM',
          projectId: data.projectId,
          createdAt: data.createdAt?.toDate?.() || new Date(),
        });
      });
      setTasks(tasksData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Fetch projects
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(collection(db, 'projects'), where('ownerId', '==', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData: ProjectData[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        projectsData.push({
          id: doc.id,
          taskCount: data.taskCount || 0,
          completedCount: data.completedCount || 0,
          teamMembers: data.teamMembers || [],
          name: data.name,
        });
      });
      setProjects(projectsData);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Calculate metrics
  const metrics = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter((t) => t.status === 'DONE').length,
    inProgressTasks: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
    todoTasks: tasks.filter((t) => t.status === 'TODO').length,
    completionRate:
      tasks.length > 0 ? Math.round((tasks.filter((t) => t.status === 'DONE').length / tasks.length) * 100) : 0,
    highPriorityTasks: tasks.filter((t) => t.priority === 'HIGH' || t.priority === 'URGENT').length,
    totalProjects: projects.length,
    totalTeamMembers: new Set(projects.flatMap((p) => p.teamMembers)).size,
  };

  // Calculate priority distribution
  const priorityData = {
    LOW: tasks.filter((t) => t.priority === 'LOW').length,
    MEDIUM: tasks.filter((t) => t.priority === 'MEDIUM').length,
    HIGH: tasks.filter((t) => t.priority === 'HIGH').length,
    URGENT: tasks.filter((t) => t.priority === 'URGENT').length,
  };

  // Calculate trend (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  const trendData = last7Days.map((day) => {
    const dayDate = new Date(day);
    return {
      day,
      completed: tasks.filter(
        (t) =>
          t.status === 'DONE' &&
          t.createdAt.toLocaleDateString() === dayDate.toLocaleDateString()
      ).length,
    };
  });

  // Simple bar chart component
  const BarChart = ({ data, maxValue }: { data: number[]; maxValue: number }) => {
    const chartHeight = 100;
    return (
      <div className="flex items-end gap-1 h-24">
        {data.map((value, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full bg-blue-500 rounded-t transition"
              style={{ height: `${(value / maxValue) * chartHeight}px`, minHeight: '2px' }}
            ></div>
            <span className="text-xs text-gray-500 mt-2">{value}</span>
          </div>
        ))}
      </div>
    );
  };

  // Pie chart representation using bars
  const PriorityChart = () => {
    const total = Object.values(priorityData).reduce((a, b) => a + b, 0);
    if (total === 0) return <p className="text-gray-400 text-sm">No tasks yet</p>;

    return (
      <div className="space-y-2">
        {Object.entries(priorityData).map(([priority, count]) => {
          const percentage = (count / total) * 100;
          const colors = {
            LOW: 'bg-blue-500',
            MEDIUM: 'bg-yellow-500',
            HIGH: 'bg-orange-500',
            URGENT: 'bg-red-500',
          };
          return (
            <div key={priority}>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{priority}</span>
                <span>{count}</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition ${colors[priority as keyof typeof colors]}`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-100 mb-2">Analytics</h1>
                <p className="text-gray-400">Team productivity insights and metrics</p>
              </div>
              <div className="flex gap-2">
                {(['week', 'month', 'all'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                      timeRange === range
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {range === 'week' ? 'Week' : range === 'month' ? 'Month' : 'All Time'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Loading analytics...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Tasks */}
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                  <p className="text-gray-400 text-sm font-semibold">Total Tasks</p>
                  <p className="text-4xl font-bold text-blue-400 mt-3">{metrics.totalTasks}</p>
                  <p className="text-xs text-gray-500 mt-2">across all projects</p>
                </div>

                {/* Completion Rate */}
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                  <p className="text-gray-400 text-sm font-semibold">Completion Rate</p>
                  <p className="text-4xl font-bold text-green-400 mt-3">{metrics.completionRate}%</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {metrics.completedTasks} of {metrics.totalTasks} completed
                  </p>
                </div>

                {/* In Progress */}
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                  <p className="text-gray-400 text-sm font-semibold">In Progress</p>
                  <p className="text-4xl font-bold text-yellow-400 mt-3">{metrics.inProgressTasks}</p>
                  <p className="text-xs text-gray-500 mt-2">active tasks</p>
                </div>

                {/* High Priority */}
                <div className="bg-gray-900 border border-red-900/20 rounded-lg p-6">
                  <p className="text-gray-400 text-sm font-semibold">High Priority</p>
                  <p className="text-4xl font-bold text-red-400 mt-3">{metrics.highPriorityTasks}</p>
                  <p className="text-xs text-gray-500 mt-2">urgent tasks</p>
                </div>
              </div>

              {/* Team & Project Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                  <p className="text-gray-400 text-sm font-semibold mb-4">Projects</p>
                  <p className="text-3xl font-bold text-purple-400">{metrics.totalProjects}</p>
                  <p className="text-xs text-gray-500 mt-2">active projects</p>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                  <p className="text-gray-400 text-sm font-semibold mb-4">Team Members</p>
                  <p className="text-3xl font-bold text-cyan-400">{metrics.totalTeamMembers}</p>
                  <p className="text-xs text-gray-500 mt-2">collaborators</p>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Priority Distribution */}
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                  <h3 className="text-white font-semibold mb-6">Task Priority Distribution</h3>
                  <PriorityChart />
                </div>

                {/* Completion Trend */}
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                  <h3 className="text-white font-semibold mb-6">Completion Trend (Last 7 Days)</h3>
                  <BarChart
                    data={trendData.map((d) => d.completed)}
                    maxValue={Math.max(...trendData.map((d) => d.completed), 1)}
                  />
                </div>
              </div>

              {/* Task Status Breakdown */}
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <h3 className="text-white font-semibold mb-6">Task Status Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* TODO */}
                  <div className="flex flex-col items-center p-4 bg-gray-800/50 rounded-lg">
                    <span className="text-3xl mb-2">📋</span>
                    <p className="text-gray-400 text-sm mb-2">To Do</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-gray-400">{metrics.todoTasks}</span>
                      <span className="text-xs text-gray-500">
                        ({metrics.totalTasks > 0 ? Math.round((metrics.todoTasks / metrics.totalTasks) * 100) : 0}%)
                      </span>
                    </div>
                  </div>

                  {/* IN_PROGRESS */}
                  <div className="flex flex-col items-center p-4 bg-gray-800/50 rounded-lg">
                    <span className="text-3xl mb-2">⚙️</span>
                    <p className="text-gray-400 text-sm mb-2">In Progress</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-yellow-400">{metrics.inProgressTasks}</span>
                      <span className="text-xs text-gray-500">
                        ({metrics.totalTasks > 0 ? Math.round((metrics.inProgressTasks / metrics.totalTasks) * 100) : 0}%)
                      </span>
                    </div>
                  </div>

                  {/* DONE */}
                  <div className="flex flex-col items-center p-4 bg-gray-800/50 rounded-lg">
                    <span className="text-3xl mb-2">✅</span>
                    <p className="text-gray-400 text-sm mb-2">Completed</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-green-400">{metrics.completedTasks}</span>
                      <span className="text-xs text-gray-500">
                        ({metrics.totalTasks > 0 ? Math.round((metrics.completedTasks / metrics.totalTasks) * 100) : 0}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Projects Summary */}
              {projects.length > 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                  <h3 className="text-white font-semibold mb-6">Project Performance</h3>
                  <div className="space-y-4">
                    {projects.map((project) => {
                      const rate = project.taskCount > 0 ? Math.round((project.completedCount / project.taskCount) * 100) : 0;
                      return (
                        <div
                          key={project.id}
                          className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition"
                        >
                          <div>
                            <p className="text-white font-semibold">{project.name}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {project.taskCount} tasks • {project.teamMembers?.length || 0} members
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-700 rounded-full h-2">
                                <div
                                  className="h-2 bg-green-500 rounded-full transition"
                                  style={{ width: `${rate}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-semibold text-green-400 w-12 text-right">{rate}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
