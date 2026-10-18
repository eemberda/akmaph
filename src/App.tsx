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
  const { currentUser, userProfile, activeRole, isSuperAdmin, signInWithGoogle, isDemoMode, loginAsDemo, authError, clearAuthError } = useAuth();

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
                Technology integration works best when it solves real classroom struggles. Right now, teachers fight a losing battle against AI cheating and copied homework. <strong className="text-slate-900 dark:text-white font-semibold">AKMA PH changes the game</strong>: it adapts each lesson and assessment to each student's unique background. Everyone gets a different version of the task—so students cannot just share answers or ask a basic AI tool to do the work for them.
              </p>

              {/* Trust & Real Classroom Value Card */}
              <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <div>
                    <span className="font-bold block text-sm">Empowering Philippine Educators with Student-Centric Lessons</span>
                    <span className="text-[11px] text-slate-600 dark:text-slate-300">
                      Eliminates homework copying, fosters genuine mastery, and provides step-by-step AI coaching.
                    </span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-blue-600 text-white font-semibold text-[10px] whitespace-nowrap">
                  Anti-Copying Architecture
                </span>
              </div>

              {/* Main Actions - Single Sign in with Google Button */}
              <div className="flex items-center justify-center pt-2">
                <button
                  onClick={signInWithGoogle}
                  className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 transition cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign in with Google</span>
                </button>
              </div>

              <div className="flex items-center justify-center gap-4 text-xs text-slate-500 pt-2">
                <span>Or explore interactive demo workspaces:</span>
                <button onClick={() => loginAsDemo('educator')} className="text-blue-600 dark:text-blue-400 font-semibold underline hover:opacity-80">
                  Educator
                </button>
                <span>&bull;</span>
                <button onClick={() => loginAsDemo('student')} className="text-emerald-600 dark:text-emerald-400 font-semibold underline hover:opacity-80">
                  Student
                </button>
              </div>
            </div>

            {/* Core Educational Pillars Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">

              {/* Pillar 2: Educator */}
              <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 space-y-3 shadow-sm hover:shadow-md transition">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Philippine Educator Flow
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Author a single master lesson and let Gemini tailor unique variations for each student. Prevent copied homework, auto-suggest grades from rubrics, and export PDF performance reports.
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
                  Your background transforms each lesson into a challenge personal to your dreams. No generic answers or copy-pasting—supported by interactive AI coaching that guides your mastery.
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
