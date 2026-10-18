import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { SystemPromptData, UsageLogItem } from '../types';
import {
  ShieldCheck,
  Cpu,
  BarChart3,
  Sliders,
  Save,
  CheckCircle2,
  RefreshCw,
  Users,
  Activity,
  AlertCircle,
  FileCode2,
  Zap,
  Sparkles
} from 'lucide-react';

export const SuperAdminView: React.FC = () => {
  const { userProfile, currentUser } = useAuth();
  const [prompts, setPrompts] = useState<SystemPromptData[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string>('educator_generator');
  const [editedPromptText, setEditedPromptText] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingPrompt, setSavingPrompt] = useState<boolean>(false);

  // Stats state
  const [stats, setStats] = useState<{
    totalTokens: number;
    totalRequests: number;
    roleCounts: Record<string, number>;
    modelCounts: Record<string, number>;
    uniqueUsers: number;
    recentLogs: UsageLogItem[];
  }>({
    totalTokens: 0,
    totalRequests: 0,
    roleCounts: {},
    modelCounts: {},
    uniqueUsers: 0,
    recentLogs: []
  });

  const fetchPromptsAndStats = async () => {
    setLoading(true);
    try {
      const [promptsRes, statsRes] = await Promise.all([
        fetch('/api/system-prompts'),
        fetch('/api/stats')
      ]);

      if (promptsRes.ok) {
        const pData = await promptsRes.json();
        if (pData.success && pData.prompts) {
          setPrompts(pData.prompts);
          const current = pData.prompts.find((p: SystemPromptData) => p.id === selectedPromptId) || pData.prompts[0];
          if (current) {
            setSelectedPromptId(current.id);
            setEditedPromptText(current.promptText);
          }
        }
      }

      if (statsRes.ok) {
        const sData = await statsRes.json();
        if (sData.success) {
          setStats(sData);
        }
      }
    } catch (err) {
      console.error('Failed to load admin telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromptsAndStats();
  }, []);

  const handleSelectPrompt = (id: string) => {
    setSelectedPromptId(id);
    const found = prompts.find(p => p.id === id);
    if (found) {
      setEditedPromptText(found.promptText);
      setSaveStatus(null);
    }
  };

  const handleSavePrompt = async () => {
    setSavingPrompt(true);
    setSaveStatus(null);
    const activePrompt = prompts.find(p => p.id === selectedPromptId);
    try {
      const res = await fetch('/api/system-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedPromptId,
          promptText: editedPromptText,
          name: activePrompt?.name,
          userEmail: currentUser?.email || userProfile?.email || 'eric.emberda@gmail.com'
        })
      });

      const data = await res.json();
      if (data.success) {
        setSaveStatus('System prompt updated successfully.');
        setPrompts(prev => prev.map(p => p.id === selectedPromptId ? data.prompt : p));
        setTimeout(() => setSaveStatus(null), 4000);
      } else {
        setSaveStatus(`Failed to update: ${data.error || 'Server error'}`);
      }
    } catch (err: any) {
      setSaveStatus(`Error saving prompt: ${err.message}`);
    } finally {
      setSavingPrompt(false);
    }
  };

  const currentPrompt = prompts.find(p => p.id === selectedPromptId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Super Admin Badge & Header */}
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 dark:from-amber-950/40 dark:via-orange-950/20 dark:to-slate-900 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/30 flex-shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Super Administrator Governance Console
                </h1>
                <span className="bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-700">
                  Authenticated: Super Administrator
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                Centrally manage AI system prompt guidelines and audit token usage across Philippine educational institutions.
              </p>
            </div>
          </div>
          <button
            onClick={fetchPromptsAndStats}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition self-start md:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>
        </div>
      </div>

      {/* Usage Analytics Grid */}
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span>Real-Time Cross-User Usage Statistics</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Total Tokens</span>
              <Cpu className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {stats.totalTokens.toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              <span>Gemini 3.6 Flash & Fallback Engine</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">AI Exchanges</span>
              <Activity className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {stats.totalRequests.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Pedagogical chats & personalizations
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Active Users</span>
              <Users className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {stats.uniqueUsers || 1}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Philippine .edu.ph educators & learners
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Role Breakdown</span>
              <Sliders className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
              <div className="flex justify-between">
                <span>Educators:</span>
                <span className="font-bold">{stats.roleCounts['educator'] || 0} reqs</span>
              </div>
              <div className="flex justify-between">
                <span>Students:</span>
                <span className="font-bold">{stats.roleCounts['student'] || 0} reqs</span>
              </div>
              <div className="flex justify-between">
                <span>Admin:</span>
                <span className="font-bold">{stats.roleCounts['superadmin'] || 0} reqs</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* System Prompt Management */}
      <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Revise AI System Prompts</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Super Administrator can adjust the underlying system directives governing Gemini's pedagogical behavior.
          </p>
        </div>

        {/* Prompt Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {prompts.map(p => (
            <button
              key={p.id}
              onClick={() => handleSelectPrompt(p.id)}
              className={`p-3 rounded-xl border text-left transition ${
                selectedPromptId === p.id
                  ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/30 text-blue-950 dark:text-blue-100 ring-2 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40 text-slate-800 dark:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>{p.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  v{p.version}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                {p.description}
              </p>
            </button>
          ))}
        </div>

        {/* Selected Prompt Editor */}
        {currentPrompt && (
          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{currentPrompt.name}</span>
                  <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                    (Target: {currentPrompt.target} &bull; v{currentPrompt.version})
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Last updated by: <span className="font-medium text-slate-700 dark:text-slate-300">{currentPrompt.updatedBy}</span> at {new Date(currentPrompt.updatedAt).toLocaleTimeString()}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSavePrompt}
                  disabled={savingPrompt}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingPrompt ? 'Saving Prompt...' : 'Publish Revised Prompt'}</span>
                </button>
              </div>
            </div>

            {saveStatus && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                saveStatus.includes('success')
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}>
                {saveStatus.includes('success') ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                <span>{saveStatus}</span>
              </div>
            )}

            <div className="relative">
              <textarea
                value={editedPromptText}
                onChange={(e) => setEditedPromptText(e.target.value)}
                rows={10}
                className="w-full p-4 rounded-xl font-mono text-xs text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-y"
                placeholder="Enter revised system prompt instructions..."
              />
              <div className="absolute right-3 bottom-3 text-[10px] text-slate-400 bg-white/80 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                {editedPromptText.length} characters
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent User Audits / Telemetry Table */}
      <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span>Recent User Exchanges & Ingestion Logs</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">User Email</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Engine Model</th>
                <th className="py-2.5 px-3 text-right">Est. Tokens</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-mono text-[11px]">
              {stats.recentLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-750">
                  <td className="py-2.5 px-3 whitespace-nowrap text-slate-400">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 px-3 font-sans font-medium text-slate-800 dark:text-slate-200">
                    {log.userEmail}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-semibold uppercase ${
                      log.role === 'superadmin' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                      log.role === 'educator' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' :
                      'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    }`}>
                      {log.role}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-sans text-slate-700 dark:text-slate-300">
                    {log.action}
                  </td>
                  <td className="py-2.5 px-3 text-indigo-600 dark:text-indigo-400">
                    {log.model}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                    {log.estimatedTokens}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
