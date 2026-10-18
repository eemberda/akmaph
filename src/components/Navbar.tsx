import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  GraduationCap,
  Sun,
  Moon,
  ShieldCheck,
  BookOpen,
  UserCheck,
  LogOut,
  LogIn,
  Menu,
  X,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { UserRole } from '../types';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    userProfile,
    activeRole,
    isSuperAdmin,
    signInWithGoogle,
    signOut,
    switchRole,
    isDemoMode,
    loginAsDemo
  } = useAuth();

  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const roles: { id: UserRole; label: string; icon: any; color: string }[] = [
    { id: 'superadmin', label: 'Super Admin', icon: ShieldCheck, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400' },
    { id: 'educator', label: 'Educator (.edu.ph)', icon: BookOpen, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400' },
    { id: 'student', label: 'Student (.edu.ph)', icon: UserCheck, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400' }
  ];

  const currentRoleObj = roles.find(r => r.id === activeRole) || roles[1];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">
                AKMA<span className="text-blue-600 dark:text-blue-400"> PH</span>
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                CHED &bull; DepEd
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Adaptive Knowledge and Mastery Assessment Philippines
            </p>
          </div>
        </div>

        {/* Desktop Controls */}
        <div className="hidden md:flex items-center gap-4">
          
          {/* Active Role Selector Badge */}
          {(currentUser || isDemoMode) && (
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 transition ${currentRoleObj.color}`}
              >
                <currentRoleObj.icon className="w-3.5 h-3.5" />
                <span>Viewing as: {currentRoleObj.label}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-50">
                  <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-700/60 text-[11px] font-medium text-slate-400">
                    Switch Workspace View
                  </div>
                  {roles.map(r => (
                    <button
                      key={r.id}
                      onClick={() => {
                        switchRole(r.id);
                        setRoleDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
                        activeRole === r.id ? 'font-bold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20' : 'text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <r.icon className="w-4 h-4" />
                      <span>{r.label}</span>
                      {activeRole === r.id && <span className="ml-auto text-blue-600 text-xs">&bull;</span>}
                    </button>
                  ))}
                  {isSuperAdmin && (
                    <div className="px-3 py-1.5 mt-1 border-t border-slate-100 dark:border-slate-700/60 text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Super Admin Privileges Active
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>

          {/* Auth State */}
          {currentUser || isDemoMode ? (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="text-right">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 max-w-[140px] truncate">
                  {currentUser?.displayName || userProfile?.displayName || 'Academic User'}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 max-w-[140px] truncate">
                  {currentUser?.email || userProfile?.email}
                </div>
              </div>
              <button
                onClick={signOut}
                title="Sign out"
                className="p-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={signInWithGoogle}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign in with Google</span>
              </button>
              <button
                onClick={() => loginAsDemo('educator')}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Demo Workspace
              </button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-4">
          {(currentUser || isDemoMode) && (
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Switch Role View</div>
              <div className="grid grid-cols-1 gap-1.5">
                {roles.map(r => (
                  <button
                    key={r.id}
                    onClick={() => {
                      switchRole(r.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
                      activeRole === r.id ? 'bg-blue-600 text-white font-bold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <r.icon className="w-4 h-4" />
                    <span>{r.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            {currentUser || isDemoMode ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                    {currentUser?.displayName || userProfile?.displayName}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {currentUser?.email || userProfile?.email}
                  </div>
                </div>
                <button
                  onClick={signOut}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 bg-rose-50 dark:bg-rose-950/40"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={signInWithGoogle}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-sm"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign in with Google (.edu.ph)</span>
                </button>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => { loginAsDemo('superadmin'); setMobileMenuOpen(false); }} className="px-2 py-1.5 text-[11px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded font-medium text-center">Demo Admin</button>
                  <button onClick={() => { loginAsDemo('educator'); setMobileMenuOpen(false); }} className="px-2 py-1.5 text-[11px] bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded font-medium text-center">Demo Educator</button>
                  <button onClick={() => { loginAsDemo('student'); setMobileMenuOpen(false); }} className="px-2 py-1.5 text-[11px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded font-medium text-center">Demo Student</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
