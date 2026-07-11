'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
  addRecentActivity,
  removeProjectFromRegistry,
  upsertProjectRegistry,
} from '@/lib/workspaceStore';

interface Space {
  id: string;
  name: string;
  type: 'team-managed' | 'company-managed';
  description: string;
  icon: string;
  color: string;
  ownerId: string;
  createdAt: Date;
}

type ProjectType = 'Software' | 'Service Management' | 'Business';

interface SpaceProject {
  id: string;
  name: string;
  key: string;
  description: string;
  icon: string;
  color: string;
  type: ProjectType;
  lead: string;
  members: number;
  createdAt: Date;
  spaceId: string;
}

interface ProjectTask {
  id: string;
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  projectId: string;
  createdAt: Date;
}

interface ProjectFormState {
  name: string;
  key: string;
  description: string;
  type: ProjectType;
  lead: string;
}

interface TaskFormState {
  title: string;
  status: ProjectTask['status'];
  priority: ProjectTask['priority'];
}

const createDefaultProjectForm = (): ProjectFormState => ({
  name: '',
  key: '',
  description: '',
  type: 'Software',
  lead: '',
});

const createDefaultTaskForm = (): TaskFormState => ({
  title: '',
  status: 'TODO',
  priority: 'MEDIUM',
});

const projectTypeIcon = (type: ProjectType): string => {
  switch (type) {
    case 'Software':
      return '💻';
    case 'Service Management':
      return '🛠️';
    default:
      return '📊';
  }
};

const projectTypeColor = (type: ProjectType): string => {
  switch (type) {
    case 'Software':
      return 'bg-blue-500';
    case 'Service Management':
      return 'bg-orange-500';
    default:
      return 'bg-emerald-500';
  }
};

export default function SpacesPage() {
  const { user } = useAuth();

  // State Management
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [projectsBySpace, setProjectsBySpace] = useState<Record<string, SpaceProject[]>>({});
  const [tasksByProject, setTasksByProject] = useState<Record<string, ProjectTask[]>>({});

  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [spaceProjects, setSpaceProjects] = useState<SpaceProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<SpaceProject | null>(null);
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([]);

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFormError, setProjectFormError] = useState<string | null>(null);

  const [projectForm, setProjectForm] = useState<ProjectFormState>(createDefaultProjectForm());

  const [taskForm, setTaskForm] = useState<TaskFormState>(createDefaultTaskForm());

  // Initialize spaces and data maps
  useEffect(() => {
    const now = new Date();

    const mockSpaces: Space[] = [
      {
        id: '1',
        name: 'Cross-Team Projects',
        type: 'team-managed',
        description: 'Collaborative space for cross-functional projects',
        icon: '×',
        color: 'bg-red-600',
        ownerId: user?.uid || '',
        createdAt: now,
      },
      {
        id: '2',
        name: 'Product Development',
        type: 'company-managed',
        description: 'Main product development and feature roadmap',
        icon: '🚀',
        color: 'bg-blue-600',
        ownerId: user?.uid || '',
        createdAt: now,
      },
    ];

    const initialProjectsBySpace: Record<string, SpaceProject[]> = {
      '1': [
        {
          id: 's1-p1',
          name: 'Website Redesign',
          key: 'WR',
          description: 'Complete redesign of the main website',
          icon: '🌐',
          color: 'bg-blue-500',
          type: 'Software',
          lead: 'John Doe',
          members: 5,
          createdAt: now,
          spaceId: '1',
        },
        {
          id: 's1-p2',
          name: 'Mobile App',
          key: 'MA',
          description: 'React Native mobile application',
          icon: '📱',
          color: 'bg-green-500',
          type: 'Software',
          lead: 'Jane Smith',
          members: 8,
          createdAt: now,
          spaceId: '1',
        },
      ],
      '2': [
        {
          id: 's2-p1',
          name: 'Release Roadmap',
          key: 'RR',
          description: 'Quarterly release planning and execution tracking',
          icon: '🗺️',
          color: 'bg-purple-500',
          type: 'Business',
          lead: 'Ariana Kim',
          members: 6,
          createdAt: now,
          spaceId: '2',
        },
        {
          id: 's2-p2',
          name: 'Customer Portal',
          key: 'CP',
          description: 'Self-service support and customer account experience',
          icon: '🧭',
          color: 'bg-cyan-500',
          type: 'Service Management',
          lead: 'Rahim Patel',
          members: 4,
          createdAt: now,
          spaceId: '2',
        },
      ],
    };

    const initialTasksByProject: Record<string, ProjectTask[]> = {
      's1-p1': [
        {
          id: 'task-s1p1-1',
          title: 'Design homepage layout',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          projectId: 's1-p1',
          createdAt: now,
        },
        {
          id: 'task-s1p1-2',
          title: 'Set up design token library',
          status: 'TODO',
          priority: 'MEDIUM',
          projectId: 's1-p1',
          createdAt: now,
        },
      ],
      's1-p2': [
        {
          id: 'task-s1p2-1',
          title: 'Implement onboarding screens',
          status: 'DONE',
          priority: 'HIGH',
          projectId: 's1-p2',
          createdAt: now,
        },
      ],
      's2-p1': [
        {
          id: 'task-s2p1-1',
          title: 'Finalize Q3 release goals',
          status: 'IN_PROGRESS',
          priority: 'URGENT',
          projectId: 's2-p1',
          createdAt: now,
        },
      ],
      's2-p2': [
        {
          id: 'task-s2p2-1',
          title: 'Create ticket routing flow',
          status: 'TODO',
          priority: 'MEDIUM',
          projectId: 's2-p2',
          createdAt: now,
        },
      ],
    };

    setSpaces(mockSpaces);
    setProjectsBySpace(initialProjectsBySpace);
    setTasksByProject(initialTasksByProject);

    Object.values(initialProjectsBySpace)
      .flat()
      .forEach((project) => {
        upsertProjectRegistry({
          id: project.id,
          name: project.name,
          key: project.key,
          spaceId: project.spaceId,
        });
      });
  }, [user?.uid]);

  // Load projects for selected space from state map
  useEffect(() => {
    if (!selectedSpace) {
      setSpaceProjects([]);
      return;
    }

    setSpaceProjects(projectsBySpace[selectedSpace.id] || []);
  }, [selectedSpace, projectsBySpace]);

  // Load tasks for selected project from state map
  useEffect(() => {
    if (!selectedProject) {
      setProjectTasks([]);
      return;
    }

    setProjectTasks(tasksByProject[selectedProject.id] || []);
  }, [selectedProject, tasksByProject]);

  // Utility functions
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'LOW':
        return 'bg-blue-500/20 text-blue-400';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-400';
      case 'URGENT':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'TODO':
        return 'bg-gray-500/20 text-gray-400';
      case 'IN_PROGRESS':
        return 'bg-blue-500/20 text-blue-400';
      case 'DONE':
        return 'bg-green-500/20 text-green-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const openSpace = (space: Space): void => {
    setSelectedSpace(space);
    setSelectedProject(null);
    setShowProjectModal(false);
    setShowTaskModal(false);
    setSearchTerm('');

    addRecentActivity({
      title: space.name,
      type: 'space',
      action: 'visited',
      route: '/dashboard/spaces',
      context: 'Opened space',
    });
  };

  const openProject = (project: SpaceProject): void => {
    setSelectedProject(project);
    setShowTaskModal(false);

    addRecentActivity({
      title: project.name,
      type: 'project',
      action: 'worked',
      route: '/dashboard/spaces',
      context: `Project ${project.key}`,
    });
  };

  const openCreateProjectModal = (): void => {
    setEditingProjectId(null);
    setProjectForm(createDefaultProjectForm());
    setProjectFormError(null);
    setShowProjectModal(true);
  };

  const openEditProjectModal = (project: SpaceProject): void => {
    setEditingProjectId(project.id);
    setProjectFormError(null);
    setProjectForm({
      name: project.name,
      key: project.key,
      description: project.description,
      type: project.type,
      lead: project.lead,
    });
    setShowProjectModal(true);
  };

  const closeProjectModal = (): void => {
    setShowProjectModal(false);
    setEditingProjectId(null);
    setProjectFormError(null);
    setProjectForm(createDefaultProjectForm());
  };

  // Handlers
  const handleSaveProject = (): void => {
    if (!selectedSpace) return;

    const name = projectForm.name.trim();
    const key = projectForm.key.trim().toUpperCase();

    if (!name || !key) {
      setProjectFormError('Project name and key are required.');
      return;
    }

    const currentProjects = projectsBySpace[selectedSpace.id] || [];
    const duplicateKey = currentProjects.some(
      (project) => project.key === key && project.id !== editingProjectId
    );

    if (duplicateKey) {
      setProjectFormError('Project key already exists in this space.');
      return;
    }

    if (editingProjectId) {
      const existing = currentProjects.find((project) => project.id === editingProjectId);
      if (!existing) return;

      const updatedProject: SpaceProject = {
        ...existing,
        name,
        key,
        description: projectForm.description,
        type: projectForm.type,
        lead: projectForm.lead,
        icon: projectTypeIcon(projectForm.type),
        color: projectTypeColor(projectForm.type),
      };

      const nextProjects = currentProjects.map((project) =>
        project.id === editingProjectId ? updatedProject : project
      );

      setProjectsBySpace((prev) => ({
        ...prev,
        [selectedSpace.id]: nextProjects,
      }));

      if (selectedProject?.id === updatedProject.id) {
        setSelectedProject(updatedProject);
      }

      upsertProjectRegistry({
        id: updatedProject.id,
        name: updatedProject.name,
        key: updatedProject.key,
        spaceId: updatedProject.spaceId,
      });

      addRecentActivity({
        title: updatedProject.name,
        type: 'project',
        action: 'updated',
        route: '/dashboard/spaces',
        context: selectedSpace.name,
      });
    } else {
      const newProject: SpaceProject = {
        id: `${selectedSpace.id}-${Date.now()}`,
        name,
        key,
        description: projectForm.description,
        icon: projectTypeIcon(projectForm.type),
        color: projectTypeColor(projectForm.type),
        type: projectForm.type,
        lead: projectForm.lead || user?.displayName || 'Unassigned',
        members: 1,
        createdAt: new Date(),
        spaceId: selectedSpace.id,
      };

      const nextProjects = [newProject, ...currentProjects];

      setProjectsBySpace((prev) => ({
        ...prev,
        [selectedSpace.id]: nextProjects,
      }));

      upsertProjectRegistry({
        id: newProject.id,
        name: newProject.name,
        key: newProject.key,
        spaceId: newProject.spaceId,
      });

      addRecentActivity({
        title: newProject.name,
        type: 'project',
        action: 'created',
        route: '/dashboard/spaces',
        context: selectedSpace.name,
      });
    }

    closeProjectModal();
  };

  const handleDeleteProject = (projectId: string): void => {
    if (!selectedSpace) return;

    const targetProject = (projectsBySpace[selectedSpace.id] || []).find(
      (project) => project.id === projectId
    );

    setProjectsBySpace((prev) => ({
      ...prev,
      [selectedSpace.id]: (prev[selectedSpace.id] || []).filter(
        (project) => project.id !== projectId
      ),
    }));

    setTasksByProject((prev) => {
      const next = { ...prev };
      delete next[projectId];
      return next;
    });

    if (selectedProject?.id === projectId) {
      setSelectedProject(null);
      setProjectTasks([]);
    }

    removeProjectFromRegistry(projectId);

    if (targetProject) {
      addRecentActivity({
        title: targetProject.name,
        type: 'project',
        action: 'deleted',
        route: '/dashboard/spaces',
        context: selectedSpace.name,
      });
    }
  };

  const handleCreateTask = (): void => {
    if (!taskForm.title.trim() || !selectedProject) return;

    const newTask: ProjectTask = {
      id: `${selectedProject.id}-${Date.now()}`,
      title: taskForm.title,
      status: taskForm.status,
      priority: taskForm.priority,
      projectId: selectedProject.id,
      createdAt: new Date(),
    };

    setTasksByProject((prev) => ({
      ...prev,
      [selectedProject.id]: [newTask, ...(prev[selectedProject.id] || [])],
    }));

    setTaskForm(createDefaultTaskForm());
    setShowTaskModal(false);

    addRecentActivity({
      title: newTask.title,
      type: 'task',
      action: 'created',
      route: '/dashboard/spaces',
      context: selectedProject.name,
    });
  };

  const handleDeleteTask = (taskId: string): void => {
    if (!selectedProject) return;

    const task = (tasksByProject[selectedProject.id] || []).find((item) => item.id === taskId);

    setTasksByProject((prev) => ({
      ...prev,
      [selectedProject.id]: (prev[selectedProject.id] || []).filter(
        (item) => item.id !== taskId
      ),
    }));

    if (task) {
      addRecentActivity({
        title: task.title,
        type: 'task',
        action: 'deleted',
        route: '/dashboard/spaces',
        context: selectedProject.name,
      });
    }
  };

  // Render: All Spaces View
  if (!selectedProject && !selectedSpace) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex-1 overflow-auto bg-gray-950">
            <div className="bg-gray-950 border-b border-gray-800 p-6 sticky top-0 z-10">
              <h1 className="text-3xl font-bold text-white">Spaces</h1>
              <p className="text-gray-400 mt-2">Select a space to manage projects</p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {spaces.map((space) => (
                  <div
                    key={space.id}
                    onClick={() => openSpace(space)}
                    className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden hover:border-blue-500 transition cursor-pointer group"
                  >
                    <div className={`${space.color} h-12 flex items-center justify-center`}>
                      <span className="text-2xl">{space.icon}</span>
                    </div>

                    <div className="p-5">
                      <h3 className="text-lg font-semibold text-white mb-1">{space.name}</h3>
                      <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">{space.type}</p>
                      <p className="text-sm text-gray-400 mb-4 line-clamp-2">{space.description}</p>
                      <button className="w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-sm font-medium transition">
                        Open Space →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  // Render: Projects View for Selected Space
  if (!selectedProject && selectedSpace) {
    const filteredProjects = spaceProjects.filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.key.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex-1 overflow-auto bg-gray-950">
            {/* Header */}
            <div className="bg-gray-950 border-b border-gray-800 p-6 sticky top-0 z-10">
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={() => setSelectedSpace(null)}
                  className="px-3 py-1 text-gray-400 hover:text-white transition text-sm flex items-center gap-1"
                >
                  ← Back to Spaces
                </button>
              </div>

              <h1 className="text-3xl font-bold text-white">{selectedSpace.name}</h1>
              <p className="text-gray-400 mt-2">{selectedSpace.description}</p>

              <div className="flex gap-3 items-center mt-6">
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-900 border border-gray-800 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />

                <div className="flex border border-gray-800 rounded">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-2 text-sm font-medium transition ${
                      viewMode === 'list' ? 'bg-gray-800 text-blue-400' : 'text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    ≡ List
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-2 text-sm font-medium transition border-l border-gray-800 ${
                      viewMode === 'grid' ? 'bg-gray-800 text-blue-400' : 'text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    ⊞ Grid
                  </button>
                </div>

                <button
                  onClick={openCreateProjectModal}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition"
                >
                  + New Project
                </button>
              </div>
            </div>

            {/* Projects List/Grid View */}
            <div className="p-6">
              {viewMode === 'list' ? (
                <div className="space-y-3">
                  {filteredProjects.map((project) => (
                    <div
                      key={project.id}
                      onClick={() => openProject(project)}
                      className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-blue-500 transition cursor-pointer group flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`${project.color} rounded-lg w-10 h-10 flex items-center justify-center text-white text-lg`}>
                          {project.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-sm">{project.name}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {project.key} • {project.type}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">{project.members} members</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-2 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditProjectModal(project);
                          }}
                          className="px-2 py-1 rounded text-xs bg-blue-900/40 text-blue-300 hover:bg-blue-900/70"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(project.id);
                          }}
                          className="px-2 py-1 rounded text-xs bg-red-900/40 text-red-300 hover:bg-red-900/70"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProjects.map((project) => (
                    <div
                      key={project.id}
                      onClick={() => openProject(project)}
                      className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden hover:border-blue-500 transition cursor-pointer group"
                    >
                      <div className={`${project.color} h-12 flex items-center justify-center`}>
                        <span className="text-2xl">{project.icon}</span>
                      </div>

                      <div className="p-5">
                        <h3 className="text-lg font-semibold text-white mb-1">{project.name}</h3>
                        <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">{project.key}</p>
                        <p className="text-sm text-gray-400 mb-4 line-clamp-2">{project.description}</p>

                        <div className="flex justify-between items-center gap-2">
                          <span className="text-xs text-gray-400">{project.members} members</span>

                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditProjectModal(project);
                              }}
                              className="px-2 py-1 rounded text-xs bg-blue-900/40 text-blue-300 hover:bg-blue-900/70"
                            >
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteProject(project.id);
                              }}
                              className="px-2 py-1 rounded text-xs bg-red-900/40 text-red-300 hover:bg-red-900/70"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Project Modal */}
            {showProjectModal && (
              <div className="fixed inset-0 bg-white/50 dark:bg-white/50 dark:bg-black/50 flex items-center justify-center z-50">
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
                  <h2 className="text-xl font-bold text-white mb-4">
                    {editingProjectId ? 'Edit Project' : 'Create Project'}
                  </h2>

                  {projectFormError && (
                    <p className="text-sm text-red-300 bg-red-900/40 border border-red-800 rounded px-3 py-2 mb-3">
                      {projectFormError}
                    </p>
                  )}

                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Project name"
                      value={projectForm.name}
                      onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Project key (e.g., WR)"
                      value={projectForm.key}
                      onChange={(e) => setProjectForm({ ...projectForm, key: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                    <textarea
                      placeholder="Description"
                      value={projectForm.description}
                      onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
                      rows={2}
                    />
                    <select
                      value={projectForm.type}
                      onChange={(e) =>
                        setProjectForm({
                          ...projectForm,
                          type: e.target.value as ProjectType,
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="Software">Software</option>
                      <option value="Service Management">Service Management</option>
                      <option value="Business">Business</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Project lead"
                      value={projectForm.lead}
                      onChange={(e) => setProjectForm({ ...projectForm, lead: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveProject}
                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition"
                      >
                        {editingProjectId ? 'Update' : 'Create'}
                      </button>
                      <button
                        onClick={closeProjectModal}
                        className="flex-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-sm transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  // Render: Tasks View for Selected Project
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex-1 overflow-auto bg-gray-950">
          {/* Header */}
          <div className="bg-gray-950 border-b border-gray-800 p-6 sticky top-0 z-10">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => setSelectedProject(null)}
                className="px-3 py-1 text-gray-400 hover:text-white transition text-sm flex items-center gap-1"
              >
                ← Back to Projects
              </button>
            </div>

            <h1 className="text-3xl font-bold text-white">{selectedProject?.name}</h1>
            <p className="text-gray-400 mt-2">{selectedProject?.description}</p>

            <button
              onClick={() => setShowTaskModal(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition mt-6"
            >
              + Add Task
            </button>
          </div>

          {/* Tasks List */}
          <div className="p-6">
            {projectTasks.length > 0 ? (
              <div className="space-y-3">
                {projectTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition group flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm">{task.title}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1 hover:bg-red-900 rounded text-gray-400 hover:text-red-400 text-sm opacity-0 group-hover:opacity-100 transition"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400">No tasks yet. Create one to get started!</p>
              </div>
            )}
          </div>

          {/* Task Modal */}
          {showTaskModal && (
            <div className="fixed inset-0 bg-white/50 dark:bg-white/50 dark:bg-black/50 flex items-center justify-center z-50">
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
                <h2 className="text-xl font-bold text-white mb-4">Add Task</h2>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Task title"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                  <select
                    value={taskForm.status}
                    onChange={(e) =>
                      setTaskForm({
                        ...taskForm,
                        status: e.target.value as ProjectTask['status'],
                      })
                    }
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="TODO">TODO</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                  </select>
                  <select
                    value={taskForm.priority}
                    onChange={(e) =>
                      setTaskForm({
                        ...taskForm,
                        priority: e.target.value as ProjectTask['priority'],
                      })
                    }
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateTask}
                      className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition"
                    >
                      Add Task
                    </button>
                    <button
                      onClick={() => setShowTaskModal(false)}
                      className="flex-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-sm transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
