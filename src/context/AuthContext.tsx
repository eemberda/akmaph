import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut
} from 'firebase/auth';
import { auth, googleProvider, getUserProfile, saveUserProfile } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  activeRole: UserRole;
  isSuperAdmin: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  switchRole: (role: UserRole) => void;
  setUserRole: (role: UserRole, institution?: string) => Promise<void>;
  isDemoMode: boolean;
  loginAsDemo: (role: UserRole) => void;
  signInAsSuperAdmin: () => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
}

const SUPER_ADMIN_EMAIL = 'eric.emberda@gmail.com';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole>('educator');
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const isSuperAdmin = (currentUser?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) || (userProfile?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const userEmail = fbUser.email?.toLowerCase() || '';
        const isEric = userEmail === SUPER_ADMIN_EMAIL.toLowerCase();
        const hasEduPh = userEmail.includes('.edu.ph');

        // STRICT REQUIREMENT: Restrict educator and student signup to only allow emails with .edu.ph in them
        if (!isEric && !hasEduPh) {
          setAuthError('Access Restricted: Registration and sign-in are strictly restricted to Philippine academic Google Workspace accounts containing ".edu.ph". The provided account is not an authorized .edu.ph institutional account.');
          await fbSignOut(auth);
          setCurrentUser(null);
          setUserProfile(null);
          setLoading(false);
          return;
        }

        setAuthError(null);
        setCurrentUser(fbUser);
        setIsDemoMode(false);
        try {
          let profile = await getUserProfile(fbUser.uid);

          if (!profile) {
            // Initial default profile for verified .edu.ph user
            const defaultRole: UserRole = isEric ? 'superadmin' : 'educator';
            const domainParts = userEmail.split('@')[1] || 'philippines.edu.ph';

            profile = {
              uid: fbUser.uid,
              email: fbUser.email || '',
              displayName: fbUser.displayName || (isEric ? 'Eric Emberda (Super Admin)' : 'Philippine Academic User'),
              role: defaultRole,
              isSuperAdmin: isEric,
              institution: isEric ? 'Commission on Higher Education / AI Governance' : domainParts,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            await saveUserProfile(profile);
          }

          setUserProfile(profile);
          setActiveRole(profile.role);
        } catch (err) {
          console.error('Error fetching/saving user profile:', err);
        }
      } else {
        if (!isDemoMode) {
          setCurrentUser(null);
          setUserProfile(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isDemoMode]);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Sign-in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
      setIsDemoMode(false);
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  const switchRole = (newRole: UserRole) => {
    setActiveRole(newRole);
    if (userProfile) {
      setUserProfile({
        ...userProfile,
        role: newRole
      });
    }
  };

  const setUserRole = async (newRole: UserRole, institution?: string) => {
    if (!currentUser && !isDemoMode) return;
    const uid = currentUser?.uid || userProfile?.uid || 'demo-user';
    const updated: UserProfile = {
      uid,
      email: currentUser?.email || userProfile?.email || 'user@up.edu.ph',
      displayName: currentUser?.displayName || userProfile?.displayName || 'Academic User',
      role: newRole,
      isSuperAdmin: (currentUser?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) || newRole === 'superadmin',
      institution: institution || userProfile?.institution || 'Philippine Educational Institution',
      updatedAt: new Date().toISOString()
    };

    if (currentUser) {
      await saveUserProfile(updated);
    }
    setUserProfile(updated);
    setActiveRole(newRole);
  };

  const signInAsSuperAdmin = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user?.email?.toLowerCase() || '';
      if (email !== SUPER_ADMIN_EMAIL.toLowerCase()) {
        await fbSignOut(auth);
        setCurrentUser(null);
        setUserProfile(null);
        setAuthError('Access Denied: Only the authorized system super administrator account is permitted to access the administrative console.');
        return;
      }
      setActiveRole('superadmin');
    } catch (error: any) {
      console.error('Super Admin sign-in error:', error);
      if (!error.message?.includes('closed-by-user')) {
        setAuthError('Failed to complete Super Admin sign-in.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo sign-in for seamless verification or test users
  const loginAsDemo = (role: UserRole) => {
    setIsDemoMode(true);
    const mockEmail = role === 'superadmin'
      ? 'superadmin@akma.ph'
      : (role === 'educator' ? 'prof.delacruz@up.edu.ph' : 'student.santos@ust.edu.ph');

    const mockProfile: UserProfile = {
      uid: `demo-${role}-123`,
      email: mockEmail,
      displayName: role === 'superadmin' ? 'Super Administrator' : (role === 'educator' ? 'Prof. Maria Dela Cruz' : 'Juan Santos'),
      role,
      isSuperAdmin: role === 'superadmin',
      institution: role === 'superadmin' ? 'CHED / AI Governance' : (role === 'educator' ? 'University of the Philippines' : 'University of Santo Tomas'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setUserProfile(mockProfile);
    setActiveRole(role);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        activeRole,
        isSuperAdmin,
        loading,
        signInWithGoogle,
        signOut,
        switchRole,
        setUserRole,
        isDemoMode,
        loginAsDemo,
        signInAsSuperAdmin,
        authError,
        clearAuthError: () => setAuthError(null)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
