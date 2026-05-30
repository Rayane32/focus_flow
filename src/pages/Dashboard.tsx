/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { taskService } from '../services/taskService';
import { Task, TaskStatus, TaskPriority, DashboardStats } from '../types';
import {
  LogOut,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  SlidersHorizontal,
  Edit,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  Tag,
  Calendar,
  Layers,
  X,
  Database,
  Cloud,
  Check,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Dashboard() {
  const { user, signOut, isDemoMode } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [priorityFilter, setPriorityFilter] = useState<string>('Todos');
  const [categoryFilter, setCategoryFilter] = useState<string>('Todos');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isConfigDrawerOpen, setIsConfigDrawerOpen] = useState(false);

  // Form States (Create & Edit)
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('Geral');
  const [formStatus, setFormStatus] = useState<TaskStatus>('Pendente');
  const [formPriority, setFormPriority] = useState<TaskPriority>('Média');
  const [formEstimatedTime, setFormEstimatedTime] = useState<number>(30); // minutes

  // Pomodoro Timer States
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(1500); // 25 * 60 = 1500 secs
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<'foco' | 'pausa'>('foco');
  const [timerSessionCount, setTimerSessionCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch tasks on mount
  useEffect(() => {
    loadTasks();
  }, [user]);

  const loadTasks = async () => {
    if (!user) return;
    try {
      setDbLoading(true);
      setFetchError(null);
      const data = await taskService.getTasks(user.id);
      setTasks(data);
    } catch (err: any) {
      console.error(err);
      setFetchError('Houve um erro ao carregar as tarefas do banco de dados.');
    } finally {
      setDbLoading(false);
    }
  };

  // Timer interval Hook
  useEffect(() => {
    if (isTimerRunning) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Timer Finished! Let's notify and switch rounds
            setIsTimerRunning(false);
            if (timerMode === 'foco') {
              alert('⏰ Ciclo de Foco Concluído! Excelente trabalho! Tire uma breve pausa.');
              setTimerMode('pausa');
              setTimerSessionCount((c) => c + 1);
              return 300; // 5 minute rest
            } else {
              alert('⚡ Pausa concluída! Hora de voltar ao foco.');
              setTimerMode('foco');
              return 1500; // 25 minutes pomodoro
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isTimerRunning, timerMode]);

  // Form submission: Create
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formTitle.trim()) return;

    try {
      setFetchError(null);
      await taskService.createTask(user.id, {
        title: formTitle,
        description: formDescription,
        category: formCategory.trim() || 'Geral',
        status: formStatus,
        priority: formPriority,
        estimated_time: Number(formEstimatedTime) || 15,
      });

      // Clear form
      setFormTitle('');
      setFormDescription('');
      setFormCategory('Geral');
      setFormStatus('Pendente');
      setFormPriority('Média');
      setFormEstimatedTime(30);
      setIsCreateOpen(false);

      // Reload
      await loadTasks();
    } catch (err: any) {
      setFetchError('Erro ao criar nova tarefa. Tente novamente.');
    }
  };

  // Form submission: Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingTask) return;

    try {
      setFetchError(null);
      await taskService.updateTask(user.id, editingTask.id, {
        title: formTitle,
        description: formDescription,
        category: formCategory,
        status: formStatus,
        priority: formPriority,
        estimated_time: Number(formEstimatedTime) || 15,
      });

      setIsEditOpen(false);
      setEditingTask(null);
      await loadTasks();
    } catch (err: any) {
      setFetchError('Erro ao salvar as edições da tarefa.');
    }
  };

  // Directly toggle status from the main screen card
  const handleToggleStatus = async (task: Task) => {
    if (!user) return;
    const nextStatuses: Record<TaskStatus, TaskStatus> = {
      'Pendente': 'Em andamento',
      'Em andamento': 'Concluído',
      'Concluído': 'Pendente'
    };

    const updatedStatus = nextStatuses[task.status];
    try {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: updatedStatus } : t));
      await taskService.updateTask(user.id, task.id, { status: updatedStatus });
    } catch (err) {
      loadTasks(); // roll back on error
    }
  };

  // Trigger Edit Modal setup
  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormDescription(task.description || '');
    setFormCategory(task.category);
    setFormStatus(task.status);
    setFormPriority(task.priority);
    setFormEstimatedTime(task.estimated_time);
    setIsEditOpen(true);
  };

  // Handle task deletion
  const handleDeleteTask = async (taskId: string) => {
    if (!user || !confirm('Tem certeza que deseja excluir esta tarefa?')) return;

    try {
      setFetchError(null);
      // Optimistic delete
      setTasks(prev => prev.filter(t => t.id !== taskId));
      if (activeTaskId === taskId) {
        setActiveTaskId(null);
        setIsTimerRunning(false);
        setTimeRemaining(1500);
      }
      await taskService.deleteTask(user.id, taskId);
    } catch (err: any) {
      setFetchError('Não foi possível excluir a tarefa.');
      await loadTasks();
    }
  };

  // Timer controls
  const handleToggleTimer = (taskId: string) => {
    if (activeTaskId !== taskId) {
      setActiveTaskId(taskId);
      setTimeRemaining(1500); // Reset countdown for the newly chosen task
      setTimerMode('foco');
      setIsTimerRunning(true);
    } else {
      setIsTimerRunning(!isTimerRunning);
    }
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setTimeRemaining(timerMode === 'foco' ? 1500 : 300);
  };

  // Generate dynamic categories list
  const categoriesList = ['Todos', ...Array.from(new Set(tasks.map(t => t.category)))];

  // Filtering Logic
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'Todos' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'Todos' || task.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'Todos' || task.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  // Calculate statistics metrics
  const stats: DashboardStats = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'Concluído').length,
    pendingTasks: tasks.filter(t => t.status === 'Pendente').length,
    inProgressTasks: tasks.filter(t => t.status === 'Em andamento').length,
    totalEstimatedTime: tasks.reduce((sum, t) => sum + (t.status !== 'Concluído' ? t.estimated_time : 0), 0)
  };

  const activeTask = tasks.find(t => t.id === activeTaskId);

  const formatTimerDisplay = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex selection:bg-emerald-500 selection:text-black">
      {/* Background soft glow accents */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-950/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-emerald-900/5 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* ====================================================
          SIDEBAR SECTION
      ==================================================== */}
      <aside className="hidden lg:flex flex-col w-72 bg-zinc-900 border-r border-zinc-800/80 z-20 sticky top-0 h-screen overflow-y-auto">
        {/* Brand Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center glow-neon">
              <Play className="h-4 w-4 text-zinc-950 fill-zinc-950 -mr-0.5" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-white">
              Focus<span className="text-emerald-400 text-glow-neon">Flow</span>
            </span>
          </div>
        </div>

        {/* Categories Fast Filter Panel */}
        <div className="p-6 flex-1 space-y-6">
          <div>
            <h3 className="text-xs font-mono font-medium text-zinc-400 uppercase tracking-widest mb-3.5 flex items-center">
              <SlidersHorizontal className="h-3 w-3 mr-2 text-emerald-400" />
              Sua Produtividade
            </h3>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-zinc-800/40 p-2.5 rounded-xl border border-zinc-800">
                <p className="text-[10px] font-mono text-zinc-500">CONCLUÍDO</p>
                <p className="text-lg font-bold font-display text-emerald-400 mt-1">{stats.completedTasks}</p>
              </div>
              <div className="bg-zinc-800/40 p-2.5 rounded-xl border border-zinc-800">
                <p className="text-[10px] font-mono text-zinc-500">PENDENTES</p>
                <p className="text-lg font-bold font-display text-zinc-300 mt-1">{stats.pendingTasks + stats.inProgressTasks}</p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono font-medium text-zinc-400 uppercase tracking-widest flex items-center">
                <Tag className="h-3 w-3 mr-2 text-emerald-400" />
                Categorias Ativas
              </h3>
            </div>
            <div className="space-y-1.5">
              {categoriesList.slice(0, 7).map((category, idx) => (
                <button
                  key={idx}
                  onClick={() => setCategoryFilter(category)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-medium rounded-xl transition-all ${
                    categoryFilter === category
                      ? 'bg-emerald-500/15 border border-emerald-500/25 text-emerald-400'
                      : 'bg-transparent border border-transparent text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                  }`}
                >
                  <span className="truncate">{category === 'Todos' ? '📂 Todas Categorias' : `🏷️ ${category}`}</span>
                  {categoryFilter === category && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Connected DB Banner (Mock / Real) */}
        <div className="p-4 m-4 bg-zinc-800/30 border border-zinc-800/80 rounded-2xl">
          <div className="flex items-start space-x-3">
            <span className={`p-1.5 rounded-lg shrink-0 ${isDemoMode ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-400'}`}>
              <Cloud className="h-4.5 w-4.5" />
            </span>
            <div className="text-xs">
              <span className="font-semibold text-zinc-200">{isDemoMode ? 'Modo Demonstrativo' : 'Banco Conectado'}</span>
              <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                {isDemoMode ? 'Salvando localmente.' : 'Segurança e RLS ativos.'}
              </p>
              <button
                onClick={() => setIsConfigDrawerOpen(true)}
                className="mt-2 text-[11px] font-mono font-medium text-emerald-400 hover:text-emerald-300 underline flex items-center transition-all bg-transparent border-0 cursor-pointer"
              >
                Configurar banco <ChevronDown className="h-3 w-3 ml-0.5 rotate-270" />
              </button>
            </div>
          </div>
        </div>

        {/* User Segment */}
        <div className="p-6 border-t border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-emerald-400 font-bold font-mono text-sm shadow-sm">
              {user?.email ? user.email.slice(0, 2).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-zinc-200 truncate">{user?.email || 'Usuário'}</p>
              <p className="text-[10px] text-zinc-500 truncate font-mono">Assinante SaaS</p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-xl border border-zinc-800 hover:border-red-500/30 text-zinc-400 hover:text-red-400 hover:bg-red-500/5 transition-all text-xs font-semibold bg-transparent cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sair do Sistema</span>
          </button>
        </div>
      </aside>

      {/* ====================================================
          MAIN HUB WORKSPACE
      ==================================================== */}
      <main className="flex-1 flex flex-col min-w-0 relative z-10">
        
        {/* ====================================================
            UPPER NAVBAR SECTION
        ==================================================== */}
        <header className="sticky top-0 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900/80 z-20 py-4 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-3 lg:space-x-0">
            {/* Logo on small screens */}
            <div className="lg:hidden flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center glow-neon">
                <Play className="h-4 w-4 text-zinc-950 fill-zinc-950" />
              </div>
              <span className="font-display font-bold text-white text-md">FocusFlow</span>
            </div>
            <div className="hidden lg:block">
              <h1 className="text-lg font-display font-semibold tracking-tight text-zinc-100 flex items-center">
                📊 Workspace Geral
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Quick Actions */}
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-950 bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 transition-all cursor-pointer shadow-md shadow-emerald-500/5 hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus className="h-4 w-4 stroke-[2.5px]" />
              <span>Adicionar Tarefa</span>
            </button>

            {/* Config drawer toggle for mobile */}
            {isDemoMode && (
              <button
                onClick={() => setIsConfigDrawerOpen(true)}
                className="lg:hidden p-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-900 transition-colors bg-transparent"
              >
                <Database className="h-4 w-4" />
              </button>
            )}

            {/* Logout on small screens */}
            <button
              onClick={() => signOut()}
              title="Sair do Sistema"
              className="p-2 lg:hidden rounded-xl border border-zinc-800 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all bg-transparent cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Demo Mode Floating Announcement */}
        {isDemoMode && (
          <div className="mx-4 sm:mx-6 lg:mx-8 mt-4 p-3 bg-zinc-900 border border-emerald-500/20 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-2.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <p className="text-xs text-zinc-300">
                <span className="text-emerald-400 font-semibold uppercase tracking-wider text-[10px] mr-1.5 border border-emerald-400/25 bg-emerald-400/5 px-1 rounded">Offline Mode</span>
                Você está explorando o FocusFlow no banco de testes local. Todas as alterações serão persistidas no seu navegador.
              </p>
            </div>
            <button
              onClick={() => setIsConfigDrawerOpen(true)}
              className="text-xs font-mono font-medium text-emerald-400 hover:text-emerald-300 whitespace-nowrap bg-transparent cursor-pointer border-0"
            >
              Conectar meu Supabase &rarr;
            </button>
          </div>
        )}

        <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 space-y-8 select-none">

          {/* ====================================================
              CARDS DE ESTATÍSTICA (KPI)
          ==================================================== */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-zinc-900 border border-zinc-800/80 p-5 rounded-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3 text-zinc-400">
                <span className="text-xs font-mono font-medium uppercase tracking-wider">Total de Tarefas</span>
                <Layers className="h-4.5 w-4.5 text-zinc-500" />
              </div>
              <p className="text-3xl font-bold font-display text-white">{stats.totalTasks}</p>
              <p className="text-[11px] text-zinc-500 mt-1 font-mono">cadastradas no painel</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="bg-zinc-900 border border-zinc-800/80 p-5 rounded-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3 text-emerald-400">
                <span className="text-xs font-mono font-medium uppercase tracking-wider">Metas Concluídas</span>
                <CheckCircle className="h-4.5 w-4.5 text-emerald-400 text-glow-neon" />
              </div>
              <p className="text-3xl font-bold font-display text-white">{stats.completedTasks}</p>
              <p className="text-[11px] text-zinc-500 mt-1 font-mono">
                {stats.totalTasks > 0
                  ? `${Math.round((stats.completedTasks / stats.totalTasks) * 100)}% de taxa de conclusão`
                  : 'Nenhuma tarefa pendente'}
              </p>
              <div className="h-1 bg-zinc-800 absolute bottom-0 left-0 right-0">
                <div
                  className="h-full bg-emerald-400 transition-all duration-500"
                  style={{ width: `${stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0}%` }}
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-zinc-900 border border-zinc-800/80 p-5 rounded-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3 text-zinc-400">
                <span className="text-xs font-mono font-medium uppercase tracking-wider">Carga Pendente</span>
                <AlertCircle className="h-4.5 w-4.5 text-zinc-500" />
              </div>
              <p className="text-3xl font-bold font-display text-white">{stats.pendingTasks + stats.inProgressTasks}</p>
              <p className="text-[11px] text-zinc-500 mt-1 font-mono">
                {stats.inProgressTasks} em andamento ativo
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="bg-zinc-900 border border-zinc-800/80 p-5 rounded-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3 text-zinc-400">
                <span className="text-xs font-mono font-medium uppercase tracking-wider">Tempo Estimado Restante</span>
                <Clock className="h-4.5 w-4.5 text-zinc-500" />
              </div>
              <p className="text-3xl font-bold font-display text-white">
                {stats.totalEstimatedTime >= 60
                  ? `${Math.floor(stats.totalEstimatedTime / 60)}h ${stats.totalEstimatedTime % 60}m`
                  : `${stats.totalEstimatedTime}m`}
              </p>
              <p className="text-[11px] text-zinc-500 mt-1 font-mono">para completar tarefas restantes</p>
            </motion.div>
          </section>

          {/* ====================================================
              POMODORO CLOCK COMPONENT (CONTROLE DE TEMPO)
          ==================================================== */}
          <section className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden">
            {/* Visual background pattern */}
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-emerald-950/10 to-transparent pointer-events-none" />

            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center lg:text-left flex-1">
                <div className="flex items-center justify-center lg:justify-start space-x-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase ${
                    timerMode === 'foco'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-400/25'
                      : 'bg-zinc-800 text-zinc-300'
                  }`}>
                    {timerMode === 'foco' ? '⚡ Período de Foco' : '☕ Pausa e Descanso'}
                  </span>
                  <span className="text-zinc-500 text-xs font-mono">• Ciclos: {timerSessionCount} h</span>
                </div>
                
                <h3 className="text-xl font-display font-medium text-zinc-100">
                  {activeTaskId && activeTask ? (
                    <span className="text-zinc-200">Focado em: <b className="text-white underline decoration-emerald-400 decoration-2">{activeTask.title}</b></span>
                  ) : (
                    "Escolha uma tarefa abaixo para cronometrar"
                  )}
                </h3>
                <p className="text-xs text-zinc-400 max-w-xl">
                  {timerMode === 'foco'
                    ? 'Aumente o rendimento mantendo a concentração total durante os 25 minutos. Evite distrações.'
                    : 'Aproveite para se alongar, beber água ou fazer uma pausa rápida antes do próximo ciclo.'}
                </p>
              </div>

              {/* Graphical countdown clock */}
              <div className="flex flex-col items-center justify-center space-y-3 px-6">
                <div className="text-5xl font-mono font-bold text-white tracking-widest text-glow-neon bg-zinc-950/50 px-5 py-3 rounded-2xl border border-zinc-800 relative min-w-[190px] text-center">
                  {formatTimerDisplay(timeRemaining)}
                  <div className={`absolute bottom-0 left-0 h-1 bg-emerald-400 transition-all duration-1000 ${isTimerRunning ? 'animate-pulse' : ''}`} style={{ width: `${timerMode === 'foco' ? (timeRemaining / 1500) * 100 : (timeRemaining / 300) * 100}%` }} />
                </div>

                <div className="flex items-center space-x-2.5">
                  <button
                    onClick={() => {
                      if (activeTaskId) {
                        setIsTimerRunning(!isTimerRunning);
                      } else {
                        // Prompt to choose or choose first available task
                        const firstTask = tasks[0];
                        if (firstTask) {
                          setActiveTaskId(firstTask.id);
                          setIsTimerRunning(true);
                        } else {
                          alert('Crie e selecione uma tarefa na lista abaixo para iniciar o cronômetro.');
                        }
                      }
                    }}
                    className={`flex items-center justify-center p-3 rounded-xl cursor-pointer transition-all ${
                      isTimerRunning
                        ? 'bg-zinc-800 border border-zinc-700/80 text-orange-400 hover:text-orange-300'
                        : 'bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-bold glow-neon'
                    }`}
                  >
                    {isTimerRunning ? <Pause className="h-4.5 w-4.5" /> : <Play className="h-4.5 w-4.5 fill-current" />}
                  </button>

                  <button
                    onClick={handleResetTimer}
                    title="Reiniciar Tempo"
                    className="p-3 bg-zinc-800 border border-zinc-700/80 hover:border-zinc-600 rounded-xl text-zinc-300 hover:text-white transition-colors"
                  >
                    <RotateCcw className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ====================================================
              FILTROS SIMPLES & GRID CABEÇALHO
          ==================================================== */}
          <section className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-xl font-display font-medium text-zinc-100">Suas Tarefas</h2>
                <p className="text-xs text-zinc-400">Total de {filteredTasks.length} tarefas encontradas no filtro</p>
              </div>

              {/* Full Filter controllers bar */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Search */}
                <div className="relative rounded-xl w-full sm:w-56 shrink-0">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-3.5 w-3.5 text-zinc-500" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Pesquisar..."
                    className="block w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 rounded-xl focus:outline-none focus:border-emerald-400 transition-colors"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-2 top-2.5 text-zinc-500 hover:text-zinc-300 bg-transparent">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {/* Status Filter Toggle */}
                <div className="flex items-center space-x-1.5 bg-zinc-900 border border-zinc-850 p-1 rounded-xl">
                  {['Todos', 'Pendente', 'Em andamento', 'Concluído'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-3 py-1.5 text-[11px] font-medium rounded-lg transition-all ${
                        statusFilter === status
                          ? 'bg-zinc-850 text-emerald-400 border border-zinc-700/60 font-semibold'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>

                {/* Priority Filter Toggle */}
                <div className="flex items-center space-x-1.5 bg-zinc-900 border border-zinc-850 p-1 rounded-xl">
                  {['Todos', 'Baixa', 'Média', 'Alta'].map((prio) => (
                    <button
                      key={prio}
                      onClick={() => setPriorityFilter(prio)}
                      className={`px-3 py-1.5 text-[11px] font-medium rounded-lg transition-all ${
                        priorityFilter === prio
                          ? 'bg-zinc-850 text-emerald-400 border border-zinc-700/60 font-semibold'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {prio === 'Todos' ? 'Prioridade' : prio}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ERROR RETRIEVING DATA BANNER */}
            {fetchError && (
              <div className="p-4 bg-red-950/30 border border-red-500/20 text-red-300 rounded-2xl flex items-center space-x-3 text-xs">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{fetchError}</span>
              </div>
            )}

            {/* ====================================================
                TAREFA CARD LIST
            ==================================================== */}
            {dbLoading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3">
                <span className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                <p className="text-zinc-500 text-xs font-mono">Buscando do arquivo Supabase...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="border border-dashed border-zinc-800 rounded-3xl py-20 px-4 text-center space-y-4">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 shadow-sm">
                  <Filter className="h-5 w-5" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="text-md font-display font-medium text-zinc-200">Nenhuma tarefa encontrada</h3>
                  <p className="text-xs text-zinc-500">
                    Nenhuma tarefa coincide com os filtros aplicados de pesquisa, status ou categorias. Teste redefinir os filtros ou clique abaixo para criar uma tarefa.
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="px-4 py-2 bg-zinc-900 border border-zinc-700 hover:border-emerald-400 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer"
                >
                  Criar Tarefa
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {filteredTasks.map((task) => {
                    const isTaskFocusedByTimer = activeTaskId === task.id;
                    const priorityStyles = {
                      'Baixa': 'bg-blue-500/10 text-blue-400 border-blue-500/15',
                      'Média': 'bg-amber-500/10 text-amber-400 border-amber-500/15',
                      'Alta': 'bg-red-500/10 text-red-400 border-red-500/15'
                    };

                    const statusStyles = {
                      'Pendente': 'bg-zinc-800 border-zinc-700/60 text-zinc-400',
                      'Em andamento': 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
                      'Concluído': 'bg-zinc-900 border-emerald-500/35 text-zinc-500 line-through'
                    };

                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        key={task.id}
                        className={`bg-zinc-900 border rounded-2xl p-5 flex flex-col justify-between relative group hover:border-zinc-700/80 transition-all ${
                          isTaskFocusedByTimer ? 'ring-1 ring-emerald-400/50 border-emerald-500/30' : 'border-zinc-800/80'
                        }`}
                      >
                        <div>
                          {/* Card Category and Priority Tags */}
                          <div className="flex items-center justify-between gap-2 mb-3.5">
                            <span className="px-2.5 py-1 text-[10px] font-bold tracking-wide text-zinc-400 bg-zinc-800 border border-zinc-700/60 rounded-lg max-w-[120px] truncate">
                              🏷️ {task.category || 'Geral'}
                            </span>
                            <div className="flex items-center space-x-1.5">
                              <span className={`px-2.5 py-1 text-[10px] font-medium border rounded-lg ${priorityStyles[task.priority]}`}>
                                {task.priority}
                              </span>
                            </div>
                          </div>

                          {/* Card Header & Checkbox */}
                          <div className="flex items-start space-x-3 mb-2">
                            <button
                              onClick={() => handleToggleStatus(task)}
                              title="Alterar Status"
                              className={`mt-0.5 w-[18px] h-[18px] rounded-md border flex items-center justify-center shrink-0 transition-all focus:outline-none bg-transparent cursor-pointer ${
                                task.status === 'Concluído'
                                  ? 'border-emerald-400 bg-emerald-400/10 text-emerald-400'
                                  : 'border-zinc-700 group-hover:border-zinc-500 text-transparent'
                              }`}
                            >
                              <Check className="h-3.5 w-3.5 stroke-[3px]" />
                            </button>

                            <div className="flex-1 min-w-0">
                              <h4 className={`text-sm font-semibold text-zinc-100 truncate ${task.status === 'Concluído' ? 'line-through text-zinc-500 font-medium' : ''}`}>
                                {task.title}
                              </h4>
                            </div>
                          </div>

                          {/* Card Description */}
                          {task.description && (
                            <p className="text-zinc-400 text-xs leading-relaxed mb-4 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                        </div>

                        {/* Footer indicators and quick triggers */}
                        <div className="pt-4 border-t border-zinc-800/80 mt-auto flex items-center justify-between">
                          <div className="flex items-center space-x-3 text-zinc-500 text-[11px] font-mono">
                            <span className="flex items-center text-zinc-400">
                              <Clock className="h-3.5 w-3.5 mr-1 text-zinc-500" />
                              {task.estimated_time}m
                            </span>
                            <span className="hidden md:inline text-zinc-600">
                              {new Date(task.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            {/* Focus tracking button */}
                            {task.status !== 'Concluído' && (
                              <button
                                onClick={() => handleToggleTimer(task.id)}
                                title={isTaskFocusedByTimer && isTimerRunning ? 'Pausar foco' : 'Começar foco'}
                                className={`p-1.5 rounded-lg border text-xs flex items-center transition-all bg-transparent ${
                                  isTaskFocusedByTimer
                                    ? 'border-emerald-400 text-emerald-400 bg-emerald-400/5 glow-neon'
                                    : 'border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-emerald-400'
                                }`}
                              >
                                {isTaskFocusedByTimer && isTimerRunning ? (
                                  <Pause className="h-3.5 w-3.5" />
                                ) : (
                                  <Play className="h-3.5 w-3.5 fill-current" />
                                )}
                              </button>
                            )}

                            {/* Edit Button */}
                            <button
                              onClick={() => openEditModal(task)}
                              title="Editar tarefa"
                              className="p-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 text-zinc-500 hover:text-zinc-300 bg-transparent cursor-pointer"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              title="Excluir tarefa"
                              className="p-1.5 rounded-lg border border-zinc-800 hover:border-red-500/20 text-zinc-500 hover:text-red-400 hover:bg-red-500/5 bg-transparent cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* ====================================================
          MODAL: ADICIONAR NOVA TAREFA
      ==================================================== */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col"
            >
              <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
                <h3 className="font-display font-medium text-lg text-white">Criar Nova Tarefa</h3>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="p-1 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white transition-colors bg-transparent"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-widest mb-1.5">Título da Tarefa *</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="ex: Planejar escopo do sprint"
                    className="w-full px-4 py-2.5 bg-zinc-800/60 border border-zinc-700/80 rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:border-emerald-400 hover:border-zinc-650 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-widest mb-1.5">Descrição Detalhada</label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Adicione anotações ou passos específicos deste projeto..."
                    rows={3}
                    className="w-full px-4 py-2.5 bg-zinc-800/60 border border-zinc-700/80 rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:border-emerald-400 hover:border-zinc-650 transition-all font-sans resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-widest mb-1.5">Categoria</label>
                    <input
                      type="text"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      placeholder="ex: Trabalho, Estudos..."
                      className="w-full px-4 py-2.5 bg-zinc-800/60 border border-zinc-700/80 rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:border-emerald-400 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-widest mb-1.5">Tempo Estimado (min)</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={formEstimatedTime}
                      onChange={(e) => setFormEstimatedTime(Number(e.target.value))}
                      placeholder="30"
                      className="w-full px-4 py-2.5 bg-zinc-800/60 border border-zinc-700/80 rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:border-emerald-400 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-widest mb-1.5">Prioridade</label>
                    <select
                      value={formPriority}
                      onChange={(e) => setFormPriority(e.target.value as TaskPriority)}
                      className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700/80 rounded-xl text-zinc-100 text-sm focus:outline-none focus:border-emerald-400 transition-all"
                    >
                      <option value="Baixa">🟢 Baixa</option>
                      <option value="Média">🟡 Média</option>
                      <option value="Alta">🔴 Alta</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-widest mb-1.5">Status Inicial</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as TaskStatus)}
                      className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700/80 rounded-xl text-zinc-100 text-sm focus:outline-none focus:border-emerald-400 transition-all"
                    >
                      <option value="Pendente">⏱️ Pendente</option>
                      <option value="Em andamento">🚀 Em andamento</option>
                      <option value="Concluído">✅ Concluído</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-800 flex items-center justify-end space-x-2.5">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2.5 border border-zinc-800 hover:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors bg-transparent cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 text-zinc-950 rounded-xl text-xs font-bold transition-all glow-neon cursor-pointer"
                  >
                    Cadastrar Tarefa
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ====================================================
          MODAL: EDITAR TAREFA EXISTENTE
      ==================================================== */}
      <AnimatePresence>
        {isEditOpen && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col"
            >
              <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
                <h3 className="font-display font-medium text-lg text-white">Editar Tarefa</h3>
                <button
                  onClick={() => {
                    setIsEditOpen(false);
                    setEditingTask(null);
                  }}
                  className="p-1 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white transition-colors bg-transparent cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-widest mb-1.5">Título da Tarefa *</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Título da tarefa..."
                    className="w-full px-4 py-2.5 bg-zinc-800/60 border border-zinc-700/80 rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:border-emerald-400 hover:border-zinc-650 transition-all font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-widest mb-1.5">Descrição Detalhada</label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Descrição..."
                    rows={3}
                    className="w-full px-4 py-2.5 bg-zinc-800/60 border border-zinc-700/80 rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:border-emerald-400 hover:border-zinc-650 transition-all font-sans resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-widest mb-1.5">Categoria</label>
                    <input
                      type="text"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-4 py-2.5 bg-zinc-800/60 border border-zinc-700/80 rounded-xl text-zinc-100 text-sm focus:outline-none focus:border-emerald-400 transition-all font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-widest mb-1.5">Tempo Estimado (min)</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={formEstimatedTime}
                      onChange={(e) => setFormEstimatedTime(Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-zinc-800/60 border border-zinc-700/80 rounded-xl text-zinc-100 text-sm focus:outline-none focus:border-emerald-400 transition-all font-sans"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-widest mb-1.5">Prioridade</label>
                    <select
                      value={formPriority}
                      onChange={(e) => setFormPriority(e.target.value as TaskPriority)}
                      className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700/80 rounded-xl text-zinc-100 text-sm focus:outline-none focus:border-emerald-400 transition-all"
                    >
                      <option value="Baixa">🟢 Baixa</option>
                      <option value="Média">🟡 Média</option>
                      <option value="Alta">🔴 Alta</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-widest mb-1.5">Status</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as TaskStatus)}
                      className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700/80 rounded-xl text-zinc-100 text-sm focus:outline-none focus:border-emerald-400 transition-all"
                    >
                      <option value="Pendente">⏱️ Pendente</option>
                      <option value="Em andamento">🚀 Em andamento</option>
                      <option value="Concluído">✅ Concluído</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-800 flex items-center justify-end space-x-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditOpen(false);
                      setEditingTask(null);
                    }}
                    className="px-4 py-2.5 border border-zinc-800 hover:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors bg-transparent cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 text-zinc-950 rounded-xl text-xs font-bold transition-all glow-neon cursor-pointer"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ====================================================
          DRAWER DIALOG: CONFIGURAR SUPABASE MANUAL
      ==================================================== */}
      <AnimatePresence>
        {isConfigDrawerOpen && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex justify-end">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-zinc-900 border-l border-zinc-850 w-full max-w-md h-full flex flex-col shadow-2xl relative"
            >
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="font-display font-semibold text-lg text-white flex items-center">
                    <Database className="h-5 w-5 mr-2 text-emerald-400" />
                    Conectar ao Supabase
                  </h3>
                  <p className="text-[11px] text-zinc-500 font-mono mt-0.5">Siga as instruções abaixo</p>
                </div>
                <button
                  onClick={() => setIsConfigDrawerOpen(false)}
                  className="p-1 rounded-lg border border-zinc-850 text-zinc-400 hover:text-white bg-transparent"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <div className="flex-1 p-6 overflow-y-auto space-y-6 text-xs text-zinc-300 leading-relaxed font-sans">
                <div className="space-y-2">
                  <p className="font-semibold text-white">1. Crie seu projeto no Supabase</p>
                  <p className="text-zinc-400 text-[11px]">
                    Acesse <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-400 underline font-medium">supabase.com</a> e crie um projeto gratuito em sua conta.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="font-semibold text-white">2. Execute o Schema SQL</p>
                  <p className="text-zinc-400 text-[11px]">
                    Navegue até a seção <b className="text-zinc-200">SQL Editor</b> no painel do Supabase. Copie todo o conteúdo de nosso arquivo <code className="text-emerald-400 px-1 py-0.5 bg-zinc-800 rounded">schema.sql</code>, cole, e clique em "Run" para provisionar as tabelas e políticas de segurança RLS.
                  </p>
                </div>

                <div className="space-y-4">
                  <p className="font-semibold text-white">3. Configure suas Chaves do Projeto</p>
                  <p className="text-zinc-400 text-[11px] mb-3">
                    Obtenha sua <b className="text-zinc-100">Project URL</b> e sua <b className="text-zinc-100">Anon Public Key</b> na aba "Project Settings &rarr; API". Substitua-os no arquivo <code className="text-emerald-400">.env</code> de seu projeto:
                  </p>
                  
                  <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl font-mono text-[10px] text-emerald-400 space-y-1.5">
                    <p className="text-zinc-500"># Chaves do Supabase no .env</p>
                    <p>VITE_SUPABASE_URL="https://seu-id.supabase.co"</p>
                    <p>VITE_SUPABASE_ANON_KEY="sua-anon-key-aqui..."</p>
                  </div>
                </div>

                <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl">
                  <p className="font-semibold text-emerald-400 mb-1 flex items-center">
                    <Check className="h-4 w-4 mr-1 stroke-[3px]" />
                    Segurança de Linha (RLS) Ativa
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    Ao conectar o banco real, as políticas que criamos garantem que cada usuário cadastrado possa visualizar, criar, editar e excluir apenas suas próprias tarefas. Nada é exposto!
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-zinc-800 bg-zinc-900/60">
                <button
                  onClick={() => setIsConfigDrawerOpen(false)}
                  className="w-full py-3 bg-zinc-800 hover:bg-zinc-750 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  Entendi, fechar painel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
