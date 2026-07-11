'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { ApiClient } from '@/lib/api';
import { FileUploader } from '@/components/FileUploader';
import { Trash2, Download, FileText, Folder, Plus, X } from 'lucide-react';

interface RepoFile {
  id: string;
  name: string;
  type: string;
  url: string | null;
  size: number;
  mimeType: string | null;
  createdAt: string;
}

interface Commit {
  id: string;
  action: string;
  message: string;
  timestamp: string;
  userId: string;
}

export default function RepositoryPage() {
  const { currentWorkspace, isLoading: workspaceLoading } = useWorkspace();
  
  const [files, setFiles] = useState<RepoFile[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'FILES' | 'COMMITS'>('FILES');

  useEffect(() => {
    if (!workspaceLoading) {
      if (currentWorkspace) {
        fetchRepositoryData();
      } else {
        setLoading(false);
      }
    }
  }, [currentWorkspace, workspaceLoading]);

  const fetchRepositoryData = async () => {
    if (!currentWorkspace) return;
    try {
      setLoading(true);
      const [filesRes, commitsRes] = await Promise.all([
        ApiClient.getRepositoryFiles(currentWorkspace.id),
        ApiClient.getRepositoryCommits(currentWorkspace.id)
      ]);

      if (filesRes.success && filesRes.data) {
        setFiles(filesRes.data as RepoFile[]);
      }
      if (commitsRes.success && commitsRes.data) {
        setCommits(commitsRes.data as Commit[]);
      }
    } catch (err) {
      console.error('Failed to fetch repository data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = async (metadata: any) => {
    if (!currentWorkspace) return;
    try {
      await ApiClient.createRepositoryFile(currentWorkspace.id, {
        name: metadata.name,
        type: 'FILE',
        url: metadata.url,
        size: metadata.size,
        mimeType: metadata.type
      });
      setShowUploadModal(false);
      fetchRepositoryData(); // Refresh list
    } catch (err) {
      console.error('Failed to save file metadata', err);
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!currentWorkspace || !confirm('Are you sure you want to delete this file?')) return;
    try {
      await ApiClient.deleteRepositoryFile(currentWorkspace.id, fileId);
      fetchRepositoryData(); // Refresh list
    } catch (err) {
      console.error('Failed to delete file', err);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Repository</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Manage workspace files and assets.</p>
          </div>
          {currentWorkspace && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2 font-medium"
            >
              <Plus className="w-5 h-5" />
              Upload File
            </button>
          )}
        </div>

        {loading || workspaceLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : !currentWorkspace ? (
          <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <p className="text-gray-500 dark:text-gray-400">Please select a workspace to view its repository.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-800 px-6">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('FILES')}
                  className={`whitespace-nowrap py-4 border-b-2 font-medium text-sm transition ${
                    activeTab === 'FILES'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  Files
                </button>
                <button
                  onClick={() => setActiveTab('COMMITS')}
                  className={`whitespace-nowrap py-4 border-b-2 font-medium text-sm transition ${
                    activeTab === 'COMMITS'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  Commit History
                </button>
              </nav>
            </div>

            {/* Content */}
            <div className="p-0">
              {activeTab === 'FILES' && (
                <div>
                  {files.length === 0 ? (
                    <div className="text-center py-16">
                      <Folder className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">Repository is empty</p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Upload files to get started.</p>
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                      <thead className="bg-gray-50 dark:bg-gray-800/50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Size</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                        {files.map((file) => (
                          <tr key={file.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <FileText className="flex-shrink-0 h-5 w-5 text-gray-400 dark:text-gray-500 mr-3" />
                                <span className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-500 dark:text-gray-400">{formatSize(file.size)}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {new Date(file.createdAt).toLocaleDateString()}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end gap-3">
                                {file.url && (
                                  <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                                    <Download className="w-5 h-5" />
                                  </a>
                                )}
                                <button onClick={() => handleDelete(file.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {activeTab === 'COMMITS' && (
                <div className="p-6">
                  {commits.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500 dark:text-gray-400">No commits yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {commits.map((commit) => (
                        <div key={commit.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 rounded-full bg-blue-500 mt-1.5"></div>
                            <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-800 -mb-4"></div>
                          </div>
                          <div className="pb-6">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{commit.message}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {new Date(commit.timestamp).toLocaleString()} by User {commit.userId.substring(0, 8)}...
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-lg w-full m-4 border border-gray-200 dark:border-gray-800 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Upload File</h2>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <FileUploader
              bucketName="attachments"
              folderPath={`workspaces/${currentWorkspace?.id}`}
              onUploadComplete={handleUploadComplete}
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
