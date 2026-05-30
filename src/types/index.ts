/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TaskStatus = 'Pendente' | 'Em andamento' | 'Concluído';
export type TaskPriority = 'Baixa' | 'Média' | 'Alta';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  status: TaskStatus;
  priority: TaskPriority;
  estimated_time: number; // in minutes
  created_at: string;
}

export interface UserSession {
  user: {
    id: string;
    email: string;
  } | null;
  loading: boolean;
  error: string | null;
}

export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  totalEstimatedTime: number; // in minutes of remaining or total tasks
}
