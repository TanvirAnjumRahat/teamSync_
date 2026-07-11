'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { ApiClient } from '@/lib/api';

interface WorkspaceMember {
  role: string;
  joinedAt: Date;
  invitedBy: string;
}

interface Workspace {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: Date;
  members: Record<string, WorkspaceMember>;
  isActive: boolean;
  settings: {
    allowMemberInvites: boolean;
    defaultRole: string;
  };
  metrics: {
    totalProjects: number;
    totalTasks: number;
    totalMembers: number;
    completionRate: number;
  };
}

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  isLoading: boolean;
  error: string | null;
  createWorkspace: (name: string, description: string) => Promise<string>;
  switchWorkspace: (workspaceId: string) => void;
  refreshWorkspaces: () => Promise<void>;
  hasWorkspaces: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }
  return context;
};

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWorkspaces = async () => {
    if (!user) {
      console.log('ℹ️ No user, skipping workspace load');
      setWorkspaces([]);
      setCurrentWorkspace(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log('🔄 Loading workspaces for user:', user.uid);

      const response = await ApiClient.getWorkspaces();
      console.log('📦 Workspaces response:', response);
      
      if (response.success && response.data) {
        const loadedWorkspaces = response.data as Workspace[];
        console.log(`✅ Loaded ${loadedWorkspaces.length} workspaces`);
        setWorkspaces(loadedWorkspaces);

        if (loadedWorkspaces.length > 0) {
          const savedWorkspace = localStorage.getItem('lastWorkspace');
          let defaultWorkspace = loadedWorkspaces[0];
          
          if (savedWorkspace) {
            const found = loadedWorkspaces.find(w => w.id === savedWorkspace);
            if (found) defaultWorkspace = found;
          }
          
          console.log('📌 Setting current workspace:', defaultWorkspace.name);
          setCurrentWorkspace(defaultWorkspace);
        } else {
          console.log('ℹ️ No workspaces found');
          setCurrentWorkspace(null);
        }
      } else {
        console.error('❌ Failed to load workspaces:', response);
        setError(response.error || 'Failed to load workspaces');
      }
    } catch (err) {
      console.error('❌ Error loading workspaces:', err);
      setError(err instanceof Error ? err.message : 'Failed to load workspaces');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaces();
  }, [user]);

  const createWorkspace = async (name: string, description: string): Promise<string> => {
    if (!user) {
      console.error('❌ No user logged in');
      throw new Error('Must be logged in');
    }

    console.log(`🔄 Creating workspace: "${name}" for user: ${user.uid}`);

    try {
      const response = await ApiClient.createWorkspace({ name, description });
      console.log('📦 Create workspace response:', response);
      
      if (response.success && response.data) {
        const newWorkspace = response.data as Workspace;
        console.log(`✅ Workspace created: ${newWorkspace.id}`);
        
        // Update local state
        setWorkspaces(prev => [...prev, newWorkspace]);
        setCurrentWorkspace(newWorkspace);
        localStorage.setItem('lastWorkspace', newWorkspace.id);
        
        return newWorkspace.id;
      }
      console.error('❌ Workspace creation failed:', response);
      throw new Error(response.error || 'Failed to create workspace');
    } catch (err) {
      console.error('❌ Error creating workspace:', err);
      throw err;
    }
  };

  const switchWorkspace = (workspaceId: string) => {
    console.log(`🔄 Switching to workspace: ${workspaceId}`);
    const workspace = workspaces.find(w => w.id === workspaceId);
    if (workspace) {
      setCurrentWorkspace(workspace);
      localStorage.setItem('lastWorkspace', workspaceId);
      console.log(`✅ Switched to: ${workspace.name}`);
    } else {
      console.error(`❌ Workspace not found: ${workspaceId}`);
    }
  };

  const refreshWorkspaces = async () => {
    console.log('🔄 Refreshing workspaces...');
    await loadWorkspaces();
  };

  const value = {
    workspaces,
    currentWorkspace,
    isLoading,
    error,
    createWorkspace,
    switchWorkspace,
    refreshWorkspaces,
    hasWorkspaces: workspaces.length > 0,
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};
