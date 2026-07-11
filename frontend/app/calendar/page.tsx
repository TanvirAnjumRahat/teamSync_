'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { ApiClient } from '@/lib/api';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string; // Stored as ISO string or timestamp
}

export default function CalendarPage() {
  const { currentWorkspace, isLoading: workspaceLoading } = useWorkspace();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTasks() {
      if (!currentWorkspace) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await ApiClient.getWorkspaceTasks(currentWorkspace.id);
        if (res.success && res.data) {
          setTasks(res.data as Task[]);
        }
      } catch (err) {
        console.error('Failed to fetch tasks for calendar', err);
      } finally {
        setLoading(false);
      }
    }

    if (!workspaceLoading) {
      fetchTasks();
    }
  }, [currentWorkspace, workspaceLoading]);

  const getEventColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return '#ef4444'; // red-500
      case 'HIGH': return '#f97316'; // orange-500
      case 'MEDIUM': return '#3b82f6'; // blue-500
      case 'LOW':
      default: return '#6b7280'; // gray-500
    }
  };

  const events = tasks
    .filter((task) => task.dueDate) // Only show tasks with due dates
    .map((task) => {
      // Assuming dueDate could be a string or a Firestore Timestamp { _seconds, _nanoseconds }
      let dateStr = task.dueDate;
      if (typeof task.dueDate === 'object' && (task.dueDate as any)._seconds) {
        dateStr = new Date((task.dueDate as any)._seconds * 1000).toISOString();
      }

      return {
        id: task.id,
        title: task.title,
        date: dateStr,
        backgroundColor: getEventColor(task.priority),
        borderColor: getEventColor(task.priority),
        extendedProps: {
          status: task.status,
          priority: task.priority
        }
      };
    });

  const handleEventClick = (info: any) => {
    router.push(`/tasks/${info.event.id}`);
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto w-full">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Calendar</h1>
        
        {loading || workspaceLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
          </div>
        ) : !currentWorkspace ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-12 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
            Please select a workspace to view its calendar.
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 calendar-container text-gray-900 dark:text-white">
            <style jsx global>{`
              .dark .fc {
                color: #e5e7eb; /* text-gray-200 */
              }
              .dark .fc-theme-standard td, .dark .fc-theme-standard th, .dark .fc-theme-standard .fc-scrollgrid {
                border-color: #374151; /* border-gray-700 */
              }
              .dark .fc-button-primary {
                background-color: #374151 !important;
                border-color: #4b5563 !important;
              }
              .dark .fc-button-primary:hover {
                background-color: #4b5563 !important;
              }
              .dark .fc-button-active {
                background-color: #2563eb !important; /* blue-600 */
                border-color: #1d4ed8 !important; /* blue-700 */
              }
              .dark .fc-day-today {
                background-color: #1f2937 !important; /* bg-gray-800 */
              }
              .fc-event {
                cursor: pointer;
              }
            `}</style>
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin, timeGridPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              events={events}
              eventClick={handleEventClick}
              height="auto"
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
