'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useRouter } from 'next/navigation';
import { ApiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignees: string[];
  reviewerId?: string | null;
  labels: string[];
  aiSummary?: string;
  estimatedHours?: number;
  createdAt: Date;
  createdBy: string;
}

interface TaskBoardProps {
  projectId: string;
  searchQuery?: string;
}

const COLUMNS = [
  { id: 'TODO', title: 'To Do', color: 'bg-gray-600' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-blue-500' },
  { id: 'REVIEW', title: 'Review', color: 'bg-yellow-500' },
  { id: 'DONE', title: 'Done', color: 'bg-green-500' },
];

export function TaskBoard({ projectId, searchQuery }: TaskBoardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (projectId) {
      loadTasks();
    } else {
      setLoading(false);
    }
  }, [projectId]);

  const loadTasks = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError('');
      console.log(`📡 Fetching tasks for project: ${projectId}`);
      const response = await ApiClient.getTasks(projectId);
      console.log('📦 Tasks API response:', response);
      if (response.success && response.data) {
        const tasksData = response.data as Task[];
        console.log(`✅ Loaded ${tasksData.length} tasks`);
        // Log statuses for debugging
        const statuses = tasksData.map((t: Task) => t.status);
        console.log('📊 Statuses:', statuses);
        setTasks(tasksData);
      } else {
        setError(response.error || 'Failed to load tasks');
      }
    } catch (err) {
      console.error('❌ Error loading tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const getTasksByStatus = (status: string) => {
    let filtered = tasks.filter(task => task.status === status);
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(query) || 
        task.description.toLowerCase().includes(query)
      );
    }
    console.log(`📊 getTasksByStatus(${status}) -> ${filtered.length} tasks`);
    return filtered;
  };

  const handleDragEnd = async (result: DropResult) => {
    console.log('🔥 DragEnd called', result);
    const { destination, source, draggableId } = result;
    if (!destination) {
      console.log('❌ No destination');
      return;
    }
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      console.log('ℹ️ Dropped in same place');
      return;
    }
    const task = tasks.find(t => t.id === draggableId);
    if (!task) {
      console.log('❌ Task not found');
      return;
    }

    if (source.droppableId === 'REVIEW' && destination.droppableId === 'DONE') {
      if (!task.reviewerId) {
        alert('A reviewer must be assigned to approve/move this task to Done.');
        return;
      }
      if (task.reviewerId !== user?.uid) {
        alert('Only the designated reviewer can move this task from Review to Done.');
        return;
      }
    }

    console.log(`🔄 Moving task "${task.title}" from ${source.droppableId} to ${destination.droppableId}`);

    // Optimistic update
    const newTasks = tasks.map(t => {
      if (t.id === draggableId) {
        return { ...t, status: destination.droppableId as Task['status'] };
      }
      return t;
    });
    setTasks(newTasks);

    // Persist change
    try {
      await ApiClient.updateTask(draggableId, {
        status: destination.droppableId,
      });
    } catch (err) {
      console.error('Failed to update task status:', err);
      await loadTasks();
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-900/50 text-red-400 border-red-700';
      case 'HIGH': return 'bg-orange-900/50 text-orange-400 border-orange-700';
      case 'MEDIUM': return 'bg-blue-900/50 text-blue-400 border-blue-700';
      default: return 'bg-gray-700 text-gray-400 border-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-700 text-red-400 px-4 py-3 rounded-lg">
        ❌ {error}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-gray-900 rounded-xl p-12 text-center border border-gray-800">
        <p className="text-gray-400">No tasks yet. Create your first task!</p>
      </div>
    );
  }

  console.log('🔁 Rendering TaskBoard with tasks:', tasks.length);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Task Board</h2>
        <span className="text-gray-400 text-sm">{tasks.length} tasks</span>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {COLUMNS.map((column) => (
            <div key={column.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-medium flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${column.color}`}></span>
                  {column.title}
                </h3>
                <span className="text-gray-500 text-xs bg-gray-800 px-2 py-0.5 rounded-full">
                  {getTasksByStatus(column.id).length}
                </span>
              </div>

              <Droppable
                droppableId={column.id}
                isDropDisabled={false}
                isCombineEnabled={false}
                ignoreContainerClipping={false}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[200px] space-y-2 transition-colors ${
                      snapshot.isDraggingOver ? 'bg-gray-800/50 rounded-lg' : ''
                    }`}
                  >
                    {getTasksByStatus(column.id).map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => router.push(`/tasks/${task.id}`)}
                            className={`bg-gray-800 rounded-lg p-3 border transition-all cursor-pointer hover:bg-gray-750 hover:border-gray-600 ${
                              snapshot.isDragging
                                ? 'border-blue-500 shadow-lg shadow-blue-500/20 scale-[1.02]'
                                : 'border-gray-700'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <h4 className="text-white text-sm font-medium line-clamp-2 flex-1">
                                {task.title}
                              </h4>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full border ml-2 flex-shrink-0 ${getPriorityColor(
                                  task.priority
                                )}`}
                              >
                                {task.priority}
                              </span>
                            </div>

                            {task.aiSummary && (
                              <p className="text-gray-400 text-xs mt-1 line-clamp-2">
                                {task.aiSummary}
                              </p>
                            )}

                            <div className="flex items-center gap-2 mt-2">
                              {task.labels && task.labels.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {task.labels.slice(0, 2).map((label, i) => (
                                    <span
                                      key={i}
                                      className="text-xs bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded"
                                    >
                                      {label}
                                    </span>
                                  ))}
                                  {task.labels.length > 2 && (
                                    <span className="text-xs text-gray-500">
                                      +{task.labels.length - 2}
                                    </span>
                                  )}
                                </div>
                              )}
                              {task.estimatedHours && (
                                <span className="text-xs text-gray-500 ml-auto">
                                  ⏱ {task.estimatedHours}h
                                </span>
                              )}
                              {task.reviewerId && (
                                <span className="text-xs bg-purple-900/50 text-purple-400 px-1.5 py-0.5 rounded border border-purple-800" title="Reviewer Assigned">
                                  👁️ Rev
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
