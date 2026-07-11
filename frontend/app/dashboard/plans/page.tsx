'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
  addRecentActivity,
  getProjectRegistry,
  ProjectRegistryItem,
} from '@/lib/workspaceStore';

type PlanStatus = 'planning' | 'in-progress' | 'completed';

interface Plan {
  id: string;
  name: string;
  projectId: string;
  status: PlanStatus;
  progress: number;
  tasks: number;
  completedTasks: number;
  deadline: Date;
  owner: string;
}

interface PlanFormState {
  name: string;
  projectId: string;
  status: PlanStatus;
  tasks: string;
  completedTasks: string;
  deadline: string;
}

const toDateInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const createInitialPlanForm = (projectId: string): PlanFormState => ({
  name: '',
  projectId,
  status: 'planning',
  tasks: '10',
  completedTasks: '0',
  deadline: toDateInput(new Date(Date.now() + 14 * 86400000)),
});

export default function PlansPage() {
  const { user } = useAuth();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [projectOptions, setProjectOptions] = useState<ProjectRegistryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState<PlanFormState>(createInitialPlanForm(''));

  useEffect(() => {
    const projects = getProjectRegistry();
    const fallbackProjectId = projects[0]?.id || '';

    setProjectOptions(projects);
    setPlanForm(createInitialPlanForm(fallbackProjectId));

    setLoading(true);

    const mockPlans: Plan[] = [
      {
        id: '1',
        name: 'Q2 Development Sprint',
        projectId: projects[0]?.id || fallbackProjectId,
        status: 'in-progress',
        progress: 65,
        tasks: 24,
        completedTasks: 16,
        deadline: new Date(Date.now() + 14 * 86400000),
        owner: user?.displayName || 'Team',
      },
      {
        id: '2',
        name: 'Mobile App MVP',
        projectId: projects[1]?.id || fallbackProjectId,
        status: 'planning',
        progress: 20,
        tasks: 45,
        completedTasks: 9,
        deadline: new Date(Date.now() + 60 * 86400000),
        owner: user?.displayName || 'Team',
      },
      {
        id: '3',
        name: 'API Optimization',
        projectId: projects[2]?.id || fallbackProjectId,
        status: 'completed',
        progress: 100,
        tasks: 15,
        completedTasks: 15,
        deadline: new Date(Date.now() - 7 * 86400000),
        owner: user?.displayName || 'Team',
      },
    ];

    setPlans(mockPlans);
    setLoading(false);
  }, [user?.displayName]);

  const projectNameById = useMemo(() => {
    return projectOptions.reduce<Record<string, string>>((acc, project) => {
      acc[project.id] = `${project.name} (${project.key})`;
      return acc;
    }, {});
  }, [projectOptions]);

  const filteredPlans = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) {
      return plans;
    }

    return plans.filter((plan) => {
      const projectName = projectNameById[plan.projectId] || 'unassigned';
      return (
        plan.name.toLowerCase().includes(term) ||
        projectName.toLowerCase().includes(term) ||
        plan.status.toLowerCase().includes(term) ||
        plan.owner.toLowerCase().includes(term)
      );
    });
  }, [plans, projectNameById, searchTerm]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400';
      case 'in-progress':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-yellow-500/20 text-yellow-400';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    return 'bg-yellow-500';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const resetForm = (): void => {
    const defaultProjectId = projectOptions[0]?.id || '';
    setPlanForm(createInitialPlanForm(defaultProjectId));
    setEditingPlanId(null);
    setFormError(null);
  };

  const openCreateForm = (): void => {
    resetForm();
    setShowPlanForm(true);
  };

  const openEditForm = (plan: Plan): void => {
    setEditingPlanId(plan.id);
    setFormError(null);
    setPlanForm({
      name: plan.name,
      projectId: plan.projectId,
      status: plan.status,
      tasks: String(plan.tasks),
      completedTasks: String(plan.completedTasks),
      deadline: toDateInput(plan.deadline),
    });
    setShowPlanForm(true);
  };

  const closeForm = (): void => {
    setShowPlanForm(false);
    resetForm();
  };

  const handleSavePlan = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    const name = planForm.name.trim();
    const tasks = Number(planForm.tasks);
    const completedTasks = Number(planForm.completedTasks);

    if (!name) {
      setFormError('Plan name is required.');
      return;
    }

    if (!planForm.projectId) {
      setFormError('Please select a project for this plan.');
      return;
    }

    if (!Number.isFinite(tasks) || tasks < 0) {
      setFormError('Tasks must be a valid non-negative number.');
      return;
    }

    if (!Number.isFinite(completedTasks) || completedTasks < 0) {
      setFormError('Completed tasks must be a valid non-negative number.');
      return;
    }

    if (completedTasks > tasks) {
      setFormError('Completed tasks cannot be greater than total tasks.');
      return;
    }

    let normalizedCompleted = completedTasks;
    let progress = tasks === 0 ? 0 : Math.round((completedTasks / tasks) * 100);

    if (planForm.status === 'completed') {
      normalizedCompleted = tasks;
      progress = 100;
    }

    const nextPlan: Plan = {
      id: editingPlanId || `${Date.now()}`,
      name,
      projectId: planForm.projectId,
      status: planForm.status,
      progress,
      tasks,
      completedTasks: normalizedCompleted,
      deadline: new Date(planForm.deadline),
      owner: user?.displayName || 'Team',
    };

    if (editingPlanId) {
      setPlans((prev) => prev.map((plan) => (plan.id === editingPlanId ? nextPlan : plan)));
      addRecentActivity({
        title: nextPlan.name,
        type: 'plan',
        action: 'updated',
        route: '/dashboard/plans',
        context: projectNameById[nextPlan.projectId] || 'Plan module',
      });
    } else {
      setPlans((prev) => [nextPlan, ...prev]);
      addRecentActivity({
        title: nextPlan.name,
        type: 'plan',
        action: 'created',
        route: '/dashboard/plans',
        context: projectNameById[nextPlan.projectId] || 'Plan module',
      });
    }

    closeForm();
  };

  const handleDeletePlan = (planId: string): void => {
    const target = plans.find((plan) => plan.id === planId);
    setPlans((prev) => prev.filter((plan) => plan.id !== planId));

    if (target) {
      addRecentActivity({
        title: target.name,
        type: 'plan',
        action: 'deleted',
        route: '/dashboard/plans',
        context: projectNameById[target.projectId] || 'Plan module',
      });
    }

    if (editingPlanId === planId) {
      closeForm();
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex-1 overflow-auto">
          {/* Header */}
          <div className="bg-gray-950 border-b border-gray-800 p-6 sticky top-0 z-10">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white">Plans</h1>
                <p className="text-gray-400 mt-2">Manage project roadmaps and timelines</p>
              </div>
              <button
                onClick={openCreateForm}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium"
              >
                + New Plan
              </button>
            </div>

            <div className="mt-4">
              <input
                type="text"
                placeholder="Search plans by name, project, owner, or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-2/3 px-4 py-2 bg-gray-900 border border-gray-800 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* New Plan Form */}
          {showPlanForm && (
            <div className="bg-gray-900 border-b border-gray-800 p-6">
              <form
                onSubmit={handleSavePlan}
                className="max-w-2xl space-y-4"
              >
                <h2 className="text-white text-lg font-semibold">
                  {editingPlanId ? 'Edit Plan' : 'Create Plan'}
                </h2>

                {formError && (
                  <p className="text-sm text-red-300 bg-red-900/40 border border-red-800 rounded px-3 py-2">
                    {formError}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Plan name"
                    value={planForm.name}
                    onChange={(e) =>
                      setPlanForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                  <select
                    value={planForm.projectId}
                    onChange={(e) =>
                      setPlanForm((prev) => ({ ...prev, projectId: e.target.value }))
                    }
                    className="px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                  >
                    {projectOptions.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name} ({project.key})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <select
                    value={planForm.status}
                    onChange={(e) =>
                      setPlanForm((prev) => ({
                        ...prev,
                        status: e.target.value as PlanStatus,
                      }))
                    }
                    className="px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="planning">Planning</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  <input
                    type="number"
                    min={0}
                    placeholder="Number of tasks"
                    value={planForm.tasks}
                    onChange={(e) =>
                      setPlanForm((prev) => ({ ...prev, tasks: e.target.value }))
                    }
                    className="px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    min={0}
                    placeholder="Completed tasks"
                    value={planForm.completedTasks}
                    onChange={(e) =>
                      setPlanForm((prev) => ({
                        ...prev,
                        completedTasks: e.target.value,
                      }))
                    }
                    className="px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="date"
                    value={planForm.deadline}
                    onChange={(e) =>
                      setPlanForm((prev) => ({ ...prev, deadline: e.target.value }))
                    }
                    className="px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium"
                  >
                    {editingPlanId ? 'Update Plan' : 'Create Plan'}
                  </button>
                  <button
                    type="button"
                    onClick={closeForm}
                    className="px-4 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-400">Loading plans...</p>
              </div>
            ) : filteredPlans.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg mb-2">No plans match your search</p>
                <p className="text-gray-500 text-sm">
                  Try a different search term or create a new plan
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPlans.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => {
                      addRecentActivity({
                        title: plan.name,
                        type: 'plan',
                        action: 'visited',
                        route: '/dashboard/plans',
                        context: projectNameById[plan.projectId] || 'Plan module',
                      });
                    }}
                    className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {plan.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {projectNameById[plan.projectId] || 'Unassigned project'}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded font-medium ${getStatusColor(
                          plan.status
                        )}`}
                      >
                        {plan.status}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-gray-400">Progress</span>
                          <span className="text-sm font-medium text-white">
                            {plan.progress}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${getProgressColor(
                              plan.progress
                            )}`}
                            style={{ width: `${plan.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-gray-800 rounded p-2">
                          <p className="text-gray-500 text-xs">Tasks</p>
                          <p className="text-white font-semibold">
                            {plan.completedTasks}/{plan.tasks}
                          </p>
                        </div>
                        <div className="bg-gray-800 rounded p-2">
                          <p className="text-gray-500 text-xs">Deadline</p>
                          <p className="text-white font-semibold text-xs">
                            {formatDate(plan.deadline)}
                          </p>
                        </div>
                      </div>

                      {/* Owner */}
                      <div className="pt-2 border-t border-gray-700">
                        <p className="text-xs text-gray-500">Owner</p>
                        <p className="text-sm text-white">{plan.owner}</p>
                      </div>

                      <div className="pt-2 border-t border-gray-700 flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditForm(plan);
                          }}
                          className="flex-1 px-3 py-1.5 text-xs font-medium rounded bg-blue-900/40 text-blue-300 hover:bg-blue-900/70 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePlan(plan.id);
                          }}
                          className="flex-1 px-3 py-1.5 text-xs font-medium rounded bg-red-900/40 text-red-300 hover:bg-red-900/70 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
