'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { FileUploader } from '@/components/FileUploader';
import { ApiClient } from '@/lib/api';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Send, 
  Trash2, 
  Paperclip, 
  Calendar, 
  FileText, 
  Bold, 
  Italic, 
  List, 
  ListOrdered,
  Save,
  FileDown
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignees: string[];
  reviewerId?: string | null;
  workspaceId: string;
  projectId: string;
  labels: string[];
  aiSummary?: string;
  estimatedHours?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  activityLog: any[];
  comments: any[];
  submissions?: any[];
}

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const taskId = params.taskId as string;

  const [task, setTask] = useState<Task | null>(null);
  const [project, setProject] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'SUBMIT' | 'NOTES' | 'SUBMISSIONS' | 'COMMENTS'>('SUBMIT');
  const [workspaceMembers, setWorkspaceMembers] = useState<any[]>([]);

  // Submit Work States
  const [deliveryNote, setDeliveryNote] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<Array<{ name: string; url: string; size: number; type: string; path: string }>>([]);
  const [notifyAssigner, setNotifyAssigner] = useState(true);
  const [markCompleted, setMarkCompleted] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Review States
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  // Comments States
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  const convertTimestamp = (ts: any): string => {
    if (!ts) return '';
    if (typeof ts.toDate === 'function') {
      return ts.toDate().toISOString();
    }
    if (ts instanceof Date) {
      return ts.toISOString();
    }
    if (typeof ts === 'string') {
      return ts;
    }
    if (ts && typeof ts === 'object' && 'seconds' in ts) {
      return new Date(ts.seconds * 1000).toISOString();
    }
    return String(ts);
  };

  useEffect(() => {
    if (!taskId) return;

    setLoading(true);
    setError('');

    const unsubscribe = onSnapshot(
      doc(db, 'tasks', taskId),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const taskData: Task = {
            id: docSnap.id,
            title: data.title || '',
            description: data.description || '',
            status: data.status || 'TODO',
            priority: data.priority || 'MEDIUM',
            assignees: data.assignees || [],
            reviewerId: data.reviewerId || null,
            workspaceId: data.workspaceId || '',
            projectId: data.projectId || '',
            labels: data.labels || [],
            aiSummary: data.aiSummary || '',
            estimatedHours: data.estimatedHours,
            createdBy: data.createdBy || '',
            createdAt: convertTimestamp(data.createdAt),
            updatedAt: convertTimestamp(data.updatedAt),
            submissions: data.submissions?.map((s: any) => ({
              ...s,
              submittedAt: convertTimestamp(s.submittedAt),
              reviewedAt: convertTimestamp(s.reviewedAt),
            })) || [],
            comments: data.comments?.map((c: any) => ({
              ...c,
              createdAt: convertTimestamp(c.createdAt),
            })) || [],
            activityLog: data.activityLog?.map((l: any) => ({
              ...l,
              timestamp: convertTimestamp(l.timestamp),
            })) || [],
          };
          setTask(taskData);
        } else {
          setError('Task not found');
        }
        setLoading(false);
      },
      (err) => {
        console.error('❌ Error listening to task changes:', err);
        setError('Failed to load task in real-time');
        setLoading(false);
      }
    );

    const savedDraft = localStorage.getItem(`task_draft_${taskId}`);
    if (savedDraft) {
      setDeliveryNote(savedDraft);
    }

    return () => {
      unsubscribe();
    };
  }, [taskId]);

  useEffect(() => {
    if (!task) return;

    const loadAssociatedData = async () => {
      try {
        if (task.workspaceId && workspaceMembers.length === 0) {
          const membersRes = await ApiClient.getWorkspaceMembers(task.workspaceId);
          if (membersRes.success && membersRes.data) {
            setWorkspaceMembers(membersRes.data as any[]);
          }
        }
        if (task.projectId && !project) {
          const projectRes = await ApiClient.getProject(task.projectId);
          if (projectRes.success && projectRes.data) {
            setProject(projectRes.data);
          }
        }
      } catch (err) {
        console.error('❌ Error loading task metadata:', err);
      }
    };

    loadAssociatedData();
  }, [task?.workspaceId, task?.projectId, workspaceMembers.length, project]);

  const loadTask = async () => {
    // Handled in real-time by the Firestore onSnapshot listener
    console.log('🔄 loadTask called (handled by real-time listener)');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO': return 'bg-gray-600/30 text-gray-400 border border-gray-500/30';
      case 'IN_PROGRESS': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'REVIEW': return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
      case 'DONE': return 'bg-green-500/10 text-green-400 border border-green-500/20';
      default: return 'bg-gray-600/30 text-gray-400 border border-gray-500/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'HIGH': return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
      case 'MEDIUM': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      default: return 'bg-gray-600/10 text-gray-400 border border-gray-500/20';
    }
  };

  const getUserDisplayName = (userId: string | null | undefined) => {
    if (!userId) return 'Unassigned';
    if (userId === user?.uid) return 'You';
    const member = workspaceMembers.find(m => m.id === userId);
    return member ? member.displayName || member.email : 'Unknown User';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Rich Text helper for notes textarea
  const insertFormatting = (syntax: 'bold' | 'italic' | 'bullet' | 'number') => {
    const textarea = document.getElementById('delivery-note-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    let replacement = '';

    if (syntax === 'bold') {
      replacement = `**${selected || 'bold text'}**`;
    } else if (syntax === 'italic') {
      replacement = `*${selected || 'italic text'}*`;
    } else if (syntax === 'bullet') {
      replacement = `\n- ${selected || 'item'}`;
    } else if (syntax === 'number') {
      replacement = `\n1. ${selected || 'item'}`;
    }

    setDeliveryNote(text.substring(0, start) + replacement + text.substring(end));
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 50);
  };

  // Upload handler to append files to attached files list
  const handleUploadComplete = (metadata: any) => {
    setAttachedFiles((prev) => [...prev, {
      name: metadata.name,
      url: metadata.url,
      size: metadata.size,
      type: metadata.type,
      path: metadata.path
    }]);
  };

  const removeAttachment = (indexToRemove: number) => {
    setAttachedFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const saveDraft = () => {
    localStorage.setItem(`task_draft_${taskId}`, deliveryNote);
    alert('Draft saved locally.');
  };

  // Submit Work Flow
  const handleSubmitWork = async () => {
    if (!deliveryNote.trim() && attachedFiles.length === 0) {
      alert('Please add a delivery note or attach files before submitting.');
      return;
    }

    try {
      setSubmitLoading(true);
      const res = await ApiClient.submitTaskWork(taskId, {
        note: deliveryNote,
        files: attachedFiles
      });

      if (res.success) {
        alert('Work submitted successfully! Task moved to Review.');
        // Clean state
        setDeliveryNote('');
        setAttachedFiles([]);
        localStorage.removeItem(`task_draft_${taskId}`);
        
        // Reload task and switch to submissions tab
        await loadTask();
        setActiveTab('SUBMISSIONS');
      } else {
        alert(res.error || 'Failed to submit work');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred during submission');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Review Submission Flow
  const handleReviewSubmission = async (action: 'APPROVE' | 'REQUEST_REVISION') => {
    if (action === 'REQUEST_REVISION' && !reviewFeedback.trim()) {
      alert('Please provide feedback explaining the revision changes requested.');
      return;
    }

    try {
      setReviewLoading(true);
      const res = await ApiClient.reviewTaskSubmission(taskId, {
        action,
        feedback: reviewFeedback
      });

      if (res.success) {
        alert(action === 'APPROVE' ? 'Submission approved! Task marked as Done.' : 'Revision requested successfully. Task moved back to In Progress.');
        setReviewFeedback('');
        await loadTask();
      } else {
        alert(res.error || 'Failed to review submission');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred during review');
    } finally {
      setReviewLoading(false);
    }
  };

  // Add Comment Flow
  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      setCommentLoading(true);
      const res = await ApiClient.addTaskComment(taskId, newComment);
      if (res.success) {
        setNewComment('');
        await loadTask();
      } else {
        alert(res.error || 'Failed to add comment');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred posting comment');
    } finally {
      setCommentLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-32">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !task) {
    return (
      <DashboardLayout>
        <div className="bg-red-900/20 border border-red-800 text-red-400 px-6 py-4 rounded-xl max-w-4xl mx-auto mt-8 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          <span>{error || 'Task not found'}</span>
        </div>
      </DashboardLayout>
    );
  }

  const isReviewer = task.reviewerId === user?.uid;
  const isAssignee = task.assignees?.includes(user?.uid || '');

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Back navigation */}
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white transition flex items-center gap-2 text-sm font-medium"
        >
          ← Back to Board
        </button>

        {/* Task Header Details Card */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                {project && (
                  <Link href={`/projects/${project.id}`} className="hover:text-blue-400 hover:bg-gray-800 transition cursor-pointer text-gray-400 text-xs font-semibold uppercase tracking-wider bg-gray-800 px-2.5 py-1 rounded">
                    {project.name}
                  </Link>
                )}
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${getStatusColor(task.status)}`}>
                  {task.status.replace('_', ' ')}
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${getPriorityColor(task.priority)}`}>
                  {task.priority} Priority
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white mt-3 leading-snug">{task.title}</h1>
            </div>
            
            <button 
              onClick={() => alert('Editing is disabled in submission workflow mode.')}
              className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-xl text-sm transition font-medium border border-gray-700"
            >
              Edit Task
            </button>
          </div>

          <div className="border-t border-gray-800 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <p className="text-gray-500 font-medium">Assigned to</p>
              <p className="text-gray-300 font-semibold mt-1">
                {task.assignees?.map(uid => getUserDisplayName(uid)).join(', ') || 'Unassigned'}
              </p>
            </div>
            <div>
              <p className="text-gray-500 font-medium">Assigned by</p>
              <p className="text-gray-300 font-semibold mt-1">
                {getUserDisplayName(task.createdBy)}
              </p>
            </div>
            <div>
              <p className="text-gray-500 font-medium">Designated Reviewer</p>
              <p className="text-purple-400 font-semibold mt-1">
                {getUserDisplayName(task.reviewerId)}
              </p>
            </div>
            <div>
              <p className="text-gray-500 font-medium">Due Date</p>
              <p className="text-gray-300 font-semibold mt-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-500" />
                June 30, 2026
              </p>
            </div>
          </div>
        </div>

        {/* Tab Headers */}
        <div className="border-b border-gray-800">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'SUBMIT', label: 'Submit work' },
              { id: 'NOTES', label: 'Notes' },
              { id: 'SUBMISSIONS', label: `Submissions (${task.submissions?.length || 0})` },
              { id: 'COMMENTS', label: `Comments (${task.comments?.length || 0})` }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`whitespace-nowrap pb-4 px-1 border-b-2 font-semibold text-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Contents */}
        {activeTab === 'SUBMIT' && (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 shadow-xl space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white mb-2">DELIVERY NOTE</h2>
              <p className="text-gray-400 text-xs mb-4">
                Describe the completed deliverables, key decisions, or anything relevant for the reviewer.
              </p>

              {/* Formatting Toolbar */}
              <div className="flex items-center gap-1 bg-gray-850 p-2 rounded-t-xl border border-gray-800 border-b-0">
                <button 
                  type="button" 
                  onClick={() => insertFormatting('bold')}
                  className="p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition"
                  title="Bold"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button 
                  type="button" 
                  onClick={() => insertFormatting('italic')}
                  className="p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition"
                  title="Italic"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <div className="h-4 w-px bg-gray-800 mx-1"></div>
                <button 
                  type="button" 
                  onClick={() => insertFormatting('bullet')}
                  className="p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition"
                  title="Bullet List"
                >
                  <List className="w-4 h-4" />
                </button>
                <button 
                  type="button" 
                  onClick={() => insertFormatting('number')}
                  className="p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition"
                  title="Numbered List"
                >
                  <ListOrdered className="w-4 h-4" />
                </button>
              </div>

              <textarea
                id="delivery-note-textarea"
                value={deliveryNote}
                onChange={(e) => setDeliveryNote(e.target.value)}
                placeholder="Describe what you've completed, any decisions made, or notes for the reviewer..."
                className="w-full h-40 border border-gray-800 rounded-b-xl p-4 text-sm focus:border-blue-500 focus:outline-none transition placeholder-gray-500 resize-y"
                style={{ backgroundColor: '#1e293b', color: '#f8fafc' }}
              />
            </div>

            <div>
              <h2 className="text-lg font-bold text-white mb-2">ATTACH FILES</h2>
              <p className="text-gray-400 text-xs mb-4">
                Attach reference files, mockups, or documents related to this submission.
              </p>

              {/* Multiple Upload list */}
              <div className="space-y-4">
                <FileUploader
                  bucketName="teamsync_db"
                  folderPath={`submissions/${taskId}`}
                  onUploadComplete={handleUploadComplete}
                  maxSizeMB={25}
                />

                {attachedFiles.length > 0 && (
                  <div className="bg-gray-850 rounded-xl border border-gray-800 p-4 space-y-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Uploaded Attachments</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {attachedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2.5 bg-gray-900 rounded-lg border border-gray-800">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <Paperclip className="w-4 h-4 text-blue-400 flex-shrink-0" />
                            <div className="overflow-hidden">
                              <p className="text-xs text-white truncate font-medium">{file.name}</p>
                              <p className="text-[10px] text-gray-500">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeAttachment(index)}
                            className="p-1 text-gray-500 hover:text-red-400 transition"
                            title="Remove file"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Checkboxes & Actions */}
            <div className="border-t border-gray-800 pt-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <label className="flex items-center gap-2.5 text-xs text-gray-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={notifyAssigner}
                    onChange={(e) => setNotifyAssigner(e.target.checked)}
                    className="w-4 h-4 bg-gray-850 border border-gray-800 rounded focus:ring-0 focus:outline-none accent-blue-500"
                  />
                  Notify assigner when submitted
                </label>
                <label className="flex items-center gap-2.5 text-xs text-gray-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={markCompleted}
                    onChange={(e) => setMarkCompleted(e.target.checked)}
                    className="w-4 h-4 bg-gray-850 border border-gray-800 rounded focus:ring-0 focus:outline-none accent-blue-500"
                  />
                  Mark task as completed
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSubmitWork}
                  disabled={submitLoading}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/50 text-white font-medium text-sm px-6 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-blue-500/10"
                >
                  <Send className="w-4 h-4" />
                  {submitLoading ? 'Submitting...' : 'Submit work'}
                </button>
                <button
                  onClick={saveDraft}
                  className="bg-gray-800 hover:bg-gray-700 text-white font-medium text-sm px-6 py-2.5 rounded-xl transition flex items-center gap-2 border border-gray-700"
                >
                  <Save className="w-4 h-4" />
                  Save draft
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'NOTES' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-xl">
                <h3 className="text-white font-bold mb-3">Description</h3>
                <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">
                  {task.description || 'No description provided'}
                </p>
              </div>

              {task.aiSummary && (
                <div className="bg-purple-950/20 rounded-2xl p-6 border border-purple-800/30 shadow-xl">
                  <h3 className="text-purple-400 font-bold mb-2 flex items-center gap-2">
                    🤖 AI Analysis Summary
                  </h3>
                  <p className="text-purple-200 text-sm leading-relaxed">{task.aiSummary}</p>
                </div>
              )}

              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-xl">
                <h3 className="text-white font-bold mb-4">Task Activity Log</h3>
                {task.activityLog?.length === 0 ? (
                  <p className="text-gray-500 text-sm italic">No activity yet</p>
                ) : (
                  <div className="space-y-4">
                    {task.activityLog?.map((log, index) => (
                      <div key={index} className="text-gray-400 text-xs flex gap-3 items-start">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <div className="flex-1">
                          <p className="text-gray-300 font-medium">{log.details}</p>
                          <p className="text-gray-600 text-[10px] mt-0.5">
                            {log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {/* Labels configuration */}
              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-xl">
                <h3 className="text-white font-bold mb-3">Labels</h3>
                <div className="flex flex-wrap gap-2">
                  {task.labels?.length === 0 ? (
                    <span className="text-gray-500 text-xs italic">No labels assigned</span>
                  ) : (
                    task.labels?.map((label, i) => (
                      <span key={i} className="bg-gray-800 text-gray-300 px-2.5 py-1 rounded-md text-xs font-semibold border border-gray-700">
                        {label}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Reviewer select configuration */}
              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-xl space-y-4">
                <h3 className="text-white font-bold">Reviewer</h3>
                <p className="text-gray-500 text-xs">
                  Select a team member to act as the task reviewer. Only they can move it to DONE.
                </p>
                <select
                  value={task.reviewerId || ''}
                  onChange={async (e) => {
                    const newReviewerId = e.target.value;
                    try {
                      await ApiClient.updateTask(task.id, { reviewerId: newReviewerId || null });
                      setTask({ ...task, reviewerId: newReviewerId });
                      alert('Designated reviewer updated successfully.');
                    } catch (err) {
                      console.error('Failed to update reviewer', err);
                      alert('Failed to update reviewer');
                    }
                  }}
                  className="w-full bg-gray-850 text-gray-200 border border-gray-850 rounded-xl px-3 py-2.5 text-xs focus:border-blue-500 outline-none cursor-pointer"
                >
                  <option value="">No Reviewer Assigned</option>
                  {workspaceMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.displayName || member.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Metadata Details */}
              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-xl space-y-3 text-xs">
                <h3 className="text-white font-bold mb-1">Details</h3>
                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                  <span className="text-gray-500">Created</span>
                  <span className="text-gray-300 font-semibold">
                    {new Date(task.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                  <span className="text-gray-500">Last Updated</span>
                  <span className="text-gray-300 font-semibold">
                    {new Date(task.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Created By</span>
                  <span className="text-gray-300 font-semibold">
                    {getUserDisplayName(task.createdBy)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'SUBMISSIONS' && (
          <div className="space-y-6">
            {/* Reviewer Actions Board (Visible only to Reviewer when task status is REVIEW) */}
            {isReviewer && task.status === 'REVIEW' && (
              <div className="bg-purple-950/15 border border-purple-800/40 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-400" />
                  <h3 className="text-purple-300 font-bold text-base">Designated Reviewer Actions</h3>
                </div>
                <p className="text-gray-300 text-xs">
                  This work is submitted for your approval. Please review the delivery notes and files below, write feedback, and select an action.
                </p>
                <textarea
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  placeholder="Provide review feedback (mandatory for revision requests, optional for approvals)..."
                  className="w-full h-24 border border-gray-800 rounded-xl p-3.5 text-xs focus:border-purple-500 focus:outline-none transition resize-none placeholder-gray-500"
                  style={{ backgroundColor: '#1e293b', color: '#f8fafc' }}
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => handleReviewSubmission('APPROVE')}
                    disabled={reviewLoading}
                    className="bg-green-600 hover:bg-green-500 disabled:bg-green-800/50 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-green-500/10"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Approve & Close
                  </button>
                  <button
                    onClick={() => handleReviewSubmission('REQUEST_REVISION')}
                    disabled={reviewLoading}
                    className="bg-orange-600 hover:bg-orange-500 disabled:bg-orange-800/50 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-orange-500/10"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    Request Changes
                  </button>
                </div>
              </div>
            )}

            {/* Submissions List */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-xl space-y-6">
              <h3 className="text-lg font-bold text-white">Submissions History</h3>
              
              {!task.submissions || task.submissions.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <FileText className="w-8 h-8 text-gray-600 mx-auto" />
                  <p className="text-gray-500 text-sm italic">No submissions made yet.</p>
                  {isAssignee && (
                    <button 
                      onClick={() => setActiveTab('SUBMIT')}
                      className="text-blue-400 hover:underline text-xs font-semibold"
                    >
                      Click here to submit work
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-6 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-800">
                  {task.submissions.slice().reverse().map((sub) => (
                    <div key={sub.id} className="relative pl-10">
                      {/* Timeline node */}
                      <div className={`absolute left-0.5 top-0 w-6.5 h-6.5 rounded-full border-4 border-gray-900 flex items-center justify-center ${
                        sub.status === 'APPROVED' ? 'bg-green-500 text-white' : 
                        sub.status === 'NEEDS_REVISION' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'
                      }`}>
                        {sub.status === 'APPROVED' ? <CheckCircle className="w-3 h-3" /> : 
                         sub.status === 'NEEDS_REVISION' ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      </div>

                      <div className="bg-gray-850 rounded-xl p-5 border border-gray-800 space-y-4">
                        <div className="flex justify-between items-start flex-wrap gap-2">
                          <div>
                            <span className="text-xs text-gray-400 font-semibold">
                              {sub.submittedBy}
                            </span>
                            <span className="text-gray-600 text-[10px] ml-2">
                              {new Date(sub.submittedAt).toLocaleString()}
                            </span>
                          </div>

                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            sub.status === 'APPROVED' ? 'bg-green-500/10 text-green-400' :
                            sub.status === 'NEEDS_REVISION' ? 'bg-orange-500/10 text-orange-400' : 'bg-blue-500/10 text-blue-400'
                          }`}>
                            {sub.status === 'APPROVED' ? 'Approved' : 
                             sub.status === 'NEEDS_REVISION' ? 'Changes Requested' : 'Submitted'}
                          </span>
                        </div>

                        {sub.note && (
                          <div className="text-gray-300 text-xs leading-relaxed whitespace-pre-wrap border-l-2 border-gray-700 pl-3">
                            {sub.note}
                          </div>
                        )}

                        {/* Attachments */}
                        {sub.files && sub.files.length > 0 && (
                          <div className="space-y-1.5 pt-2">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Submitted Attachments</p>
                            <div className="flex flex-wrap gap-2">
                              {sub.files.map((file: any, fIdx: number) => (
                                <a 
                                  key={fIdx}
                                  href={file.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 px-3 py-2 bg-gray-900 hover:bg-gray-950 text-[11px] font-semibold text-gray-300 rounded-lg border border-gray-800 transition"
                                >
                                  <FileDown className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                                  <span className="max-w-[120px] truncate">{file.name}</span>
                                  {file.size && <span className="text-[9px] text-gray-600 font-normal">({formatFileSize(file.size)})</span>}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Reviewer Feedback bubble */}
                        {sub.feedback && (
                          <div className="mt-3 pt-3 border-t border-gray-800 bg-purple-950/5 p-3 rounded-lg border border-purple-900/10 space-y-1">
                            <div className="flex justify-between items-center text-[10px] text-purple-400 font-semibold">
                              <span>Review Feedback from {sub.reviewedBy}</span>
                              {sub.reviewedAt && <span>{new Date(sub.reviewedAt).toLocaleString()}</span>}
                            </div>
                            <p className="text-purple-200 text-xs leading-relaxed italic">"{sub.feedback}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'COMMENTS' && (
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-xl space-y-6">
            <h3 className="text-lg font-bold text-white">Task Discussion Comments</h3>
            
            {/* New Comment area */}
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs text-white flex-shrink-0 mt-1 uppercase border border-blue-500">
                {user?.email?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 space-y-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Join the discussion, write a comment..."
                  className="w-full h-20 border border-gray-800 rounded-xl p-3 text-xs focus:border-blue-500 focus:outline-none transition resize-none placeholder-gray-500"
                  style={{ backgroundColor: '#1e293b', color: '#f8fafc' }}
                />
                <button
                  onClick={handleAddComment}
                  disabled={commentLoading || !newComment.trim()}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/50 text-white font-medium text-xs px-4 py-2 rounded-lg transition flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {commentLoading ? 'Posting...' : 'Post comment'}
                </button>
              </div>
            </div>

            {/* Comments list */}
            <div className="border-t border-gray-800 pt-6 space-y-4">
              {!task.comments || task.comments.length === 0 ? (
                <p className="text-gray-500 text-sm italic text-center py-6">No comments posted yet.</p>
              ) : (
                <div className="space-y-4">
                  {task.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-4 p-3 hover:bg-gray-850/30 rounded-xl transition">
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center font-bold text-xs text-gray-300 flex-shrink-0 uppercase">
                        {comment.authorName?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs text-gray-300 font-semibold">{comment.authorName}</span>
                          <span className="text-gray-600 text-[10px]">
                            {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ''}
                          </span>
                        </div>
                        <p className="text-gray-400 text-xs mt-1 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
