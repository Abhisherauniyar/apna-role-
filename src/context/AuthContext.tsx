import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  BOOTSTRAP_ADMIN_EMAIL,
  OperationType,
  handleFirestoreError,
} from '../lib/firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextValue {
  firebaseUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  loginWithGoogle: (preferredRole?: UserRole) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (
    name: string,
    email: string,
    password: string,
    role: UserRole
  ) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  reloadAuthUser: () => Promise<boolean>;
  logout: () => Promise<void>;
  updateUserProfile: (patch: Partial<UserProfile>) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadUserProfile = useCallback(async (user: User, preferredRole: UserRole = 'job_seeker') => {
    const userRef = doc(db, 'users', user.uid);
    try {
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        if (data.emailVerified !== user.emailVerified) {
          await updateDoc(userRef, {
            emailVerified: user.emailVerified,
            updatedAt: serverTimestamp(),
          });
        }
        setUserProfile({ ...data, emailVerified: user.emailVerified });
      } else {
        const newProfile: Record<string, unknown> = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || user.email?.split('@')[0] || 'Apna Role User',
          role: preferredRole,
          phone: '',
          location: '',
          headline: preferredRole === 'employer' ? 'Talent Acquisition & Hiring Lead' : 'Job Seeker on Apna Role',
          bio: '',
          skills: [],
          education: [],
          experience: [],
          photoUrl: user.photoURL || '',
          resumeUrl: '',
          resumeFileName: '',
          emailVerified: user.emailVerified,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await setDoc(userRef, newProfile);
        setUserProfile(newProfile as unknown as UserProfile);

        if (preferredRole === 'employer') {
          const empRef = doc(db, 'employers', user.uid);
          await setDoc(empRef, {
            id: user.uid,
            userId: user.uid,
            designation: 'Recruiter',
            workEmail: user.email || '',
            verified: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      }

      // Check admin status
      let adminFlag =
        user.email === BOOTSTRAP_ADMIN_EMAIL && user.emailVerified === true;
      if (!adminFlag) {
        try {
          const adminSnap = await getDoc(doc(db, 'admins', user.uid));
          if (adminSnap.exists()) {
            adminFlag = true;
          }
        } catch {
          // Non-admin user
        }
      }
      setIsAdmin(adminFlag);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const pendingRole = (sessionStorage.getItem('apnarole_pending_role') as UserRole | null) || 'job_seeker';
          sessionStorage.removeItem('apnarole_pending_role');
          await loadUserProfile(user, pendingRole);
        } catch (err) {
          console.error('Failed loading user profile:', err);
        }
      } else {
        setUserProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [loadUserProfile]);

  const loginWithGoogle = async (preferredRole: UserRole = 'job_seeker') => {
    sessionStorage.setItem('apnarole_pending_role', preferredRole);
    const cred = await signInWithPopup(auth, googleProvider);
    await loadUserProfile(cred.user, preferredRole);
  };

  const loginWithEmail = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await loadUserProfile(cred.user, 'job_seeker');
  };

  const registerWithEmail = async (
    name: string,
    email: string,
    password: string,
    role: UserRole
  ) => {
    sessionStorage.setItem('apnarole_pending_role', role);
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    try {
      await sendEmailVerification(cred.user);
    } catch (err) {
      console.warn('Email verification send skipped/failed:', err);
    }
    await loadUserProfile(cred.user, role);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const resendVerificationEmail = async () => {
    if (!auth.currentUser) throw new Error('Not signed in');
    await sendEmailVerification(auth.currentUser);
  };

  const reloadAuthUser = async () => {
    if (!auth.currentUser) return false;
    await auth.currentUser.reload();
    setFirebaseUser(auth.currentUser);
    await loadUserProfile(auth.currentUser, userProfile?.role || 'job_seeker');
    return auth.currentUser.emailVerified;
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
    setIsAdmin(false);
  };

  const updateUserProfile = async (patch: Partial<UserProfile>) => {
    if (!auth.currentUser) throw new Error('Authentication required.');
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const allowedPatch: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };
    const allowedKeys: Array<keyof UserProfile> = [
      'displayName',
      'phone',
      'location',
      'headline',
      'bio',
      'skills',
      'education',
      'experience',
      'photoUrl',
      'resumeUrl',
      'resumeFileName',
      'emailVerified',
    ];
    for (const key of allowedKeys) {
      if (patch[key] !== undefined) {
        allowedPatch[key] = patch[key];
      }
    }
    try {
      await updateDoc(userRef, allowedPatch);
      setUserProfile((prev) => (prev ? { ...prev, ...patch } : prev));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    }
  };

  const refreshUserProfile = async () => {
    if (auth.currentUser) {
      await loadUserProfile(auth.currentUser, userProfile?.role || 'job_seeker');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        userProfile,
        loading,
        isAdmin,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        resetPassword,
        resendVerificationEmail,
        reloadAuthUser,
        logout,
        updateUserProfile,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
