const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class ApiClient {
  private static authToken: string | null = null;
  private static tokenExpiry: number | null = null;

  private static async getAuthToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    
    try {
      // Import dynamically to avoid circular dependencies
      const { auth } = await import('./firebase');
      
      // Wait for auth to be ready
      let user = auth.currentUser;
      
      // If no user, wait for auth state change
      if (!user) {
        console.log('⏳ Waiting for user authentication...');
        await new Promise((resolve) => {
          const unsubscribe = auth.onAuthStateChanged((authUser) => {
            if (authUser) {
              user = authUser;
              unsubscribe();
              resolve(true);
            }
          });
          // Timeout after 5 seconds
          setTimeout(() => {
            unsubscribe();
            resolve(false);
          }, 5000);
        });
      }
      
      if (!user) {
        console.log('❌ No user logged in');
        return null;
      }
      
      // Check if token is cached and not expired
      if (this.authToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        console.log('✅ Using cached token');
        return this.authToken;
      }
      
      // Get fresh token
      const token = await user.getIdToken(true);
      this.authToken = token;
      this.tokenExpiry = Date.now() + 55 * 60 * 1000; // 55 minutes
      
      console.log('✅ Auth token obtained');
      return token;
    } catch (error) {
      console.error('❌ Failed to get auth token:', error);
      return null;
    }
  }

  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const token = await this.getAuthToken();
      
      console.log(`📡 ${options.method || 'GET'} ${endpoint} ${token ? '🔑 With token' : '❌ No token'}`);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error(`❌ API Error ${response.status}:`, data);
        throw new Error(data.error || `API request failed: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error(`❌ Request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // ===== AUTH =====
  static async getCurrentUser() {
    return this.request('/users/me');
  }

  // ===== WORKSPACES =====
  static async getWorkspaces() {
    return this.request('/workspaces');
  }

  static async getMyWorkspaces() {
    return this.request('/my-workspaces');
  }

  static async getWorkspaceMembers(workspaceId: string) {
    return this.request(`/workspaces/${workspaceId}/members`);
  }

  static async createWorkspace(data: { name: string; description: string }) {
    return this.request('/workspaces', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async getWorkspace(workspaceId: string) {
    return this.request(`/workspaces/${workspaceId}`);
  }

  static async updateWorkspace(workspaceId: string, data: any) {
    return this.request(`/workspaces/${workspaceId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // ===== PROJECTS =====
  static async getProjects(workspaceId: string) {
    return this.request(`/workspaces/${workspaceId}/projects`);
  }

  static async getWorkspaceTasks(workspaceId: string) {
    return this.request(`/workspaces/${workspaceId}/tasks`);
  }

  static async createProject(workspaceId: string, data: { 
    name: string; 
    description?: string; 
    status?: string; 
    deadline?: string; 
  }) {
    return this.request(`/workspaces/${workspaceId}/projects`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async createUserProject(data: any) {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async getProject(projectId: string) {
    return this.request(`/projects/${projectId}`);
  }

  static async updateProject(projectId: string, data: any) {
    return this.request(`/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async archiveProject(projectId: string) {
    return this.request(`/projects/${projectId}/archive`, {
      method: 'PATCH',
    });
  }

  static async updateProjectMembers(projectId: string, memberIds: string[]) {
    return this.request(`/projects/${projectId}/members`, {
      method: 'PUT',
      body: JSON.stringify({ memberIds }),
    });
  }

  static async deleteProject(projectId: string) {
    return this.request(`/projects/${projectId}`, {
      method: 'DELETE',
    });
  }

  // ===== TASKS =====
  static async getTasks(projectId: string) {
    return this.request(`/projects/${projectId}/tasks`);
  }

  static async getTask(taskId: string) {
    return this.request(`/tasks/${taskId}`);
  }

  static async createTask(projectId: string, data: any) {
    return this.request(`/projects/${projectId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateTask(taskId: string, data: any) {
    return this.request(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async submitTaskWork(taskId: string, data: { note: string; files: any[] }) {
    return this.request(`/tasks/${taskId}/submissions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async reviewTaskSubmission(taskId: string, data: { action: 'APPROVE' | 'REQUEST_REVISION'; feedback?: string }) {
    return this.request(`/tasks/${taskId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async deleteTask(taskId: string) {
    return this.request(`/tasks/${taskId}`, {
      method: 'DELETE',
    });
  }

  // ===== COMMENTS =====
  static async addTaskComment(taskId: string, content: string) {
    return this.request(`/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  // ===== REPOSITORY =====
  static async getRepositoryFiles(workspaceId: string) {
    return this.request(`/repository/${workspaceId}`);
  }

  static async createRepositoryFile(workspaceId: string, data: any) {
    return this.request(`/repository/${workspaceId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async deleteRepositoryFile(workspaceId: string, fileId: string) {
    return this.request(`/repository/${workspaceId}/${fileId}`, {
      method: 'DELETE',
    });
  }

  static async getRepositoryCommits(workspaceId: string) {
    return this.request(`/repository/${workspaceId}/commits`);
  }

  // ===== AI =====
  static async analyzeTask(title: string, description?: string) {
    return this.request('/ai/analyze-task', {
      method: 'POST',
      body: JSON.stringify({ title, description }),
    });
  }

  // ===== DASHBOARD =====
  static async getDashboardSummary() {
    return this.request('/dashboard/summary');
  }

  // ===== ISSUES =====
  static async createIssue(data: any) {
    return this.request('/issues', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateIssue(issueId: string, data: any) {
    return this.request(`/issues/${issueId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async deleteIssue(issueId: string) {
    return this.request(`/issues/${issueId}`, {
      method: 'DELETE',
    });
  }

  // ===== INVITATIONS =====
  static async inviteMember(workspaceId: string, data: { email: string; role: string; projectId?: string }) {
    return this.request(`/workspaces/${workspaceId}/invite`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async getInvitation(token: string) {
    return this.request(`/invitations/${token}`);
  }

  static async acceptInvitation(token: string) {
    return this.request(`/invitations/${token}/accept`, {
      method: 'POST',
    });
  }

  static async declineInvitation(token: string) {
    return this.request(`/invitations/${token}/decline`, {
      method: 'POST',
    });
  }
}

export default ApiClient;