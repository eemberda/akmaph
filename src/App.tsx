import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { SuperAdminView } from './components/SuperAdminView';
import { EducatorView } from './components/EducatorView';
import { StudentView } from './components/StudentView';
import {
  GraduationCap,
  Sparkles,
  ShieldCheck,
  BookOpen,
  UserCheck,
  LogIn,
  CheckCircle,
  Cpu,
  ArrowRight,
  AlertCircle,
  X
} from 'lucide-react';

const MainContent: React.FC = () => {
  const { currentUser, userProfile, activeRole, isSuperAdmin, signInWithGoogle, signInAsSuperAdmin, isDemoMode, loginAsDemo, authError, clearAuthError } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors flex flex-col font-sans">
      <Navbar />

      {/* Domain Restriction Error Banner */}
      {authError && (
        <div className="bg-rose-50 dark:bg-rose-950/80 border-b border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 px-4 py-3.5">
          <div className="max-w-6xl mx-auto flex items-start justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-sm">Signup / Sign-in Restricted to .edu.ph Accounts</span>
                <p className="mt-0.5 leading-relaxed">{authError}</p>
              </div>
            </div>
            <button
              onClick={clearAuthError}
              className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <main className="flex-1">
        {/* If logged in or in active workspace mode, show the role view */}
        {currentUser || isDemoMode ? (
          <div>
            {activeRole === 'superadmin' && <SuperAdminView />}
            {activeRole === 'educator' && <EducatorView />}
            {activeRole === 'student' && <StudentView />}
          </div>
        ) : (
          /* Landing Page for Unauthenticated Visitors */
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
            
            {/* Hero Section */}
            <div className="text-center space-y-6 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-800/80">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Powered by Gemini 3.6 Flash & Google Cloud Firestore</span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                <span className="text-blue-600 dark:text-blue-400">AKMA PH</span>: Adaptive Knowledge and Mastery Assessment
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                Philippine AI-Powered Adaptive Learning & Assessment Platform. Connect your <span className="font-semibold text-slate-900 dark:text-white font-mono">.edu.ph</span> Google Workspace account. Personalize curriculum challenges to each student's life dreams, brainstorm with pedagogical rigor, and guide learning with Socratic coaching.
              </p>

              {/* Main Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={signInWithGoogle}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/25 transition"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In with Google (.edu.ph)</span>
                </button>
                <button
                  onClick={signInAsSuperAdmin}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-sm font-semibold transition shadow-xs"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  <span>Log in as Super Admin</span>
                </button>
              </div>

              <div className="flex items-center justify-center gap-4 text-xs text-slate-500 pt-2">
                <span>Or explore interactive demo workspaces:</span>
                <button onClick={() => loginAsDemo('superadmin')} className="text-amber-600 dark:text-amber-400 font-semibold underline hover:opacity-80">
                  Super Admin
                </button>
                <span>&bull;</span>
                <button onClick={() => loginAsDemo('educator')} className="text-blue-600 dark:text-blue-400 font-semibold underline hover:opacity-80">
                  Educator
                </button>
                <span>&bull;</span>
                <button onClick={() => loginAsDemo('student')} className="text-emerald-600 dark:text-emerald-400 font-semibold underline hover:opacity-80">
                  Student
                </button>
              </div>
            </div>

            {/* 3 Pillars Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              
              {/* Pillar 1: Super Admin */}
              <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 space-y-3 shadow-sm hover:shadow-md transition">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Super Administrator Flow
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Authorized system administrator portal. Upload revised system prompts, audit real-time token telemetry across institutions, and govern pedagogical directives.
                </p>
                <div className="pt-2">
                  <button
                    onClick={signInAsSuperAdmin}
                    className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1 hover:gap-1.5 transition-all"
                  >
                    <span>Log in as Super Admin</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Pillar 2: Educator */}
              <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 space-y-3 shadow-sm hover:shadow-md transition">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Philippine Educator Flow
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Multi-turn curriculum exchange with Gemini grounded in Bloom's Taxonomy and CHED/DepEd standards. Import student rosters, auto-suggest grades from rubrics, and export PDF performance reports.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => loginAsDemo('educator')}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:gap-1.5 transition-all"
                  >
                    <span>Launch Educator Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Pillar 3: Student */}
              <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 space-y-3 shadow-sm hover:shadow-md transition">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Philippine Student Flow
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Gemini onboarding interview articulates your life dreams. Activities adapt dynamically so no two students have the same problem context. Socratic coaching guides you without giving answers.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => loginAsDemo('student')}
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:gap-1.5 transition-all"
                  >
                    <span>Enter Student Portal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-center text-xs text-slate-500 transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-slate-200">AKMA PH</span>
            <span>&bull;</span>
            <span>Adaptive Knowledge and Mastery Assessment Philippines</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] text-slate-400">Zero-Insecure ABAC Firestore &bull; Gemini 3.6 Flash</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
