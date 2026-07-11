export type UserRole = 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: Date;
  isActive: boolean;
  photoURL?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  members: Record<string, { email: string; displayName: string; role: UserRole; joinedAt: Date }>;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assigneeId?: string;
  reviewerId?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  aiSummary?: string;
  estimatedHours?: number;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  labels?: string[];
  dueDate?: Date;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'TASK_ASSIGNED' | 'TASK_UPDATED' | 'PROJECT_INVITE' | 'SYSTEM';
  read: boolean;
  readAt?: Date;
  createdAt: Date;
  data?: Record<string, any>;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ASSIGN' | 'COMPLETE';
  entityType: 'TASK' | 'PROJECT' | 'COMMENT';
  entityId: string;
  details: Record<string, any>;
  timestamp: Date;
}

export interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  todoCount: number;
  inProgressCount: number;
  doneCount: number;
  completionRate: number;
  recentProjects?: any[];
  recentTasks?: any[];
}