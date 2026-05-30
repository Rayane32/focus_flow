/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Task } from '../types';

export const taskService = {
  // Fetch all tasks for a specific user
  async getTasks(userId: string): Promise<Task[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      return data as Task[];
    } else {
      // LocalStorage fall-back
      const stored = localStorage.getItem('focusflow_tasks');
      if (!stored) {
        // Return default task list for user if they are new, to show a rich UI
        const defaultTasks: Task[] = [
          {
            id: 'task-1',
            user_id: userId,
            title: '🚀 Configurar chaves do Supabase',
            description: 'Substitua as chaves no arquivo `.env` para sincronizar suas tarefas com o banco de dados em nuvem.',
            category: 'Projeto',
            status: 'Pendente',
            priority: 'Alta',
            estimated_time: 15,
            created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
          },
          {
            id: 'task-2',
            user_id: userId,
            title: '✍️ Criar primeira tarefa do FocusFlow',
            description: 'Experimente adicionar, editar ou trocar de status suas tarefas utilizando os controles na tela.',
            category: 'Pessoal',
            status: 'Em andamento',
            priority: 'Média',
            estimated_time: 5,
            created_at: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: 'task-3',
            user_id: userId,
            title: '⏱️ Usar temporizador Pomodoro integrado',
            description: 'Grave ciclos de foco e melhore sua produtividade diária organizada por projetos.',
            category: 'Estudos',
            status: 'Concluído',
            priority: 'Média',
            estimated_time: 25,
            created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
          }
        ];
        localStorage.setItem('focusflow_tasks', JSON.stringify(defaultTasks));
        return defaultTasks;
      }
      try {
        const parsed: Task[] = JSON.parse(stored);
        return parsed.filter(t => t.user_id === userId);
      } catch (e) {
        return [];
      }
    }
  },

  // Create a new task
  async createTask(
    userId: string,
    taskData: Omit<Task, 'id' | 'user_id' | 'created_at'>
  ): Promise<Task> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            user_id: userId,
            title: taskData.title,
            description: taskData.description,
            category: taskData.category,
            status: taskData.status,
            priority: taskData.priority,
            estimated_time: taskData.estimated_time,
          },
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }
      return data as Task;
    } else {
      const stored = localStorage.getItem('focusflow_tasks');
      const tasks: Task[] = stored ? JSON.parse(stored) : [];

      const newTask: Task = {
        id: Math.random().toString(36).substring(2, 11),
        user_id: userId,
        title: taskData.title,
        description: taskData.description,
        category: taskData.category || 'Geral',
        status: taskData.status || 'Pendente',
        priority: taskData.priority || 'Média',
        estimated_time: Number(taskData.estimated_time) || 0,
        created_at: new Date().toISOString(),
      };

      tasks.unshift(newTask);
      localStorage.setItem('focusflow_tasks', JSON.stringify(tasks));
      return newTask;
    }
  },

  // Update an existing task
  async updateTask(
    userId: string,
    taskId: string,
    taskData: Partial<Omit<Task, 'id' | 'user_id' | 'created_at'>>
  ): Promise<Task> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          title: taskData.title,
          description: taskData.description,
          category: taskData.category,
          status: taskData.status,
          priority: taskData.priority,
          estimated_time: taskData.estimated_time,
        })
        .eq('id', taskId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }
      return data as Task;
    } else {
      const stored = localStorage.getItem('focusflow_tasks');
      if (!stored) throw new Error('Tarefa não encontrada.');

      const tasks: Task[] = JSON.parse(stored);
      const index = tasks.findIndex(t => t.id === taskId && t.user_id === userId);
      if (index === -1) throw new Error('Tarefa não encontrada.');

      const updatedTask: Task = {
        ...tasks[index],
        ...taskData,
        // Ensure some fields retain correct type check
        estimated_time: taskData.estimated_time !== undefined ? Number(taskData.estimated_time) : tasks[index].estimated_time,
      };

      tasks[index] = updatedTask;
      localStorage.setItem('focusflow_tasks', JSON.stringify(tasks));
      return updatedTask;
    }
  },

  // Delete an existing task
  async deleteTask(userId: string, taskId: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }
    } else {
      const stored = localStorage.getItem('focusflow_tasks');
      if (!stored) return;

      const tasks: Task[] = JSON.parse(stored);
      const filtered = tasks.filter(t => !(t.id === taskId && t.user_id === userId));
      localStorage.setItem('focusflow_tasks', JSON.stringify(filtered));
    }
  },
};
