/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Play, Key, Mail, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signUp, isDemoMode } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password || !confirmPassword) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    const { error: signUpError } = await signUp(email, password);

    if (signUpError) {
      setError(signUpError.message || 'Erro ao realizar cadastro. Tente novamente.');
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative selection:bg-emerald-500 selection:text-black">
      {/* Background radial soft gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-950/20 via-zinc-950/90 to-zinc-950 pointer-events-none z-0" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center space-x-2"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 glow-neon border border-emerald-300/30">
            <Play className="h-5 w-5 text-zinc-950 fill-zinc-950 -mr-0.5" />
          </div>
          <span className="font-display text-2xl font-bold tracking-tight text-white">
            Focus<span className="text-emerald-400 text-glow-neon">Flow</span>
          </span>
        </motion.div>
        
        <h2 className="mt-6 text-center text-3xl font-display font-semibold tracking-tight text-zinc-100">
          Criar sua conta FocusFlow
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-400">
          Já tem acesso?{' '}
          <Link to="/login" className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
            Fazer login na sua conta
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-zinc-900 border border-zinc-800/80 py-8 px-4 shadow-xl rounded-2xl sm:px-10 overflow-hidden relative"
        >
          {isDemoMode && (
            <div className="mb-6 p-3 bg-zinc-800/40 border border-emerald-500/20 rounded-xl flex items-start space-x-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-zinc-300 leading-relaxed">
                <span className="font-semibold text-emerald-400">Modo de Teste Ativo (Offline)</span>
                <p className="mt-0.5">Qualquer endereço de e-mail e senha inseridos serão simulados e salvos localmente nesta máquina.</p>
              </div>
            </div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-5 p-3.5 bg-red-950/30 border border-red-500/30 rounded-xl flex items-start space-x-2.5"
            >
              <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <span className="text-xs text-red-300 font-medium leading-normal">{error}</span>
            </motion.div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs font-mono font-medium text-zinc-400 uppercase tracking-widest">
                Seu endereço de e-mail
              </label>
              <div className="mt-1.5 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-zinc-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@exemplo.com"
                  className="block w-full pl-10 pr-4 py-3 bg-zinc-800/50 border border-zinc-700/60 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400/80 hover:border-zinc-600 transition-all text-sm font-sans"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-mono font-medium text-zinc-400 uppercase tracking-widest">
                Crie uma senha forte (mínimo 6 dígitos)
              </label>
              <div className="mt-1.5 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Key className="h-4 w-4 text-zinc-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Selecione uma senha segura"
                  className="block w-full pl-10 pr-4 py-3 bg-zinc-800/50 border border-zinc-700/60 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400/80 hover:border-zinc-600 transition-all text-sm font-sans"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-mono font-medium text-zinc-400 uppercase tracking-widest">
                Confirme a senha anterior
              </label>
              <div className="mt-1.5 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Key className="h-4 w-4 text-zinc-500" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme sua senha"
                  className="block w-full pl-10 pr-4 py-3 bg-zinc-800/50 border border-zinc-700/60 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400/80 hover:border-zinc-600 transition-all text-sm font-sans"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-3.5 border border-transparent rounded-xl text-sm font-medium text-zinc-950 bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950 focus:ring-emerald-400 transition-all cursor-pointer shadow-lg shadow-emerald-500/10 active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-950 animate-ping" />
                    <span>Cadastrando...</span>
                  </span>
                ) : (
                  <span className="flex items-center font-semibold">
                    Cadastrar e Entrar <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
