-- FocusFlow Database Schema
-- Execute this script in SQL Editor on Supabase dashboard (https://supabase.com)

-- 1. Create Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) DEFAULT 'Geral' NOT NULL,
    status VARCHAR(50) DEFAULT 'Pendente' NOT NULL CHECK (status IN ('Pendente', 'Em andamento', 'Concluído')),
    priority VARCHAR(50) DEFAULT 'Média' NOT NULL CHECK (priority IN ('Baixa', 'Média', 'Alta')),
    estimated_time INTEGER DEFAULT 0 NOT NULL CHECK (estimated_time >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies

-- Select Policy: Each user can only view their own tasks
CREATE POLICY "Users can view their own tasks" 
    ON public.tasks 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Insert Policy: Users can only add tasks for themselves
CREATE POLICY "Users can create their own tasks" 
    ON public.tasks 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Update Policy: Users can only update their own tasks
CREATE POLICY "Users can edit their own tasks" 
    ON public.tasks 
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Delete Policy: Users can only delete their own tasks
CREATE POLICY "Users can delete their own tasks" 
    ON public.tasks 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- 4. Indexes for better performance
CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON public.tasks (user_id);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON public.tasks (status);
CREATE INDEX IF NOT EXISTS tasks_created_at_idx ON public.tasks (created_at DESC);
