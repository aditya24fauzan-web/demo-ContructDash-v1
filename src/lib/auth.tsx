import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut, User as FirebaseUser, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, updatePassword as firebaseUpdatePassword } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { googleProvider } from './firebase';

export type Role = 'admin' | 'manager' | 'pc' | 'owner';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  tenantId: string;
  isOnboarded?: boolean;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
      if (firebaseUser) {
        const docRef = doc(db, 'users', firebaseUser.uid);
        unsubscribeProfile = onSnapshot(docRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            if (!data.tenantId) {
              const newTenantId = firebaseUser.uid;
              data.tenantId = newTenantId;
              await setDoc(docRef, { 
                uid: firebaseUser.uid,
                name: data.name || firebaseUser.displayName || 'Unknown User',
                email: data.email || firebaseUser.email || '',
                role: data.role || 'owner',
                createdAt: data.createdAt || new Date().toISOString(),
                tenantId: newTenantId 
              }, { merge: true }).catch(e => console.error("Error setting fallback tenantId:", e));
            }
            setProfile(data);
          } else {
            setProfile(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error fetching profile:", error);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const initNewUser = async (firebaseUser: FirebaseUser, name?: string) => {
    const docRef = doc(db, 'users', firebaseUser.uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return; // Not a new user
    }

    const newTenantId = firebaseUser.uid;
    const createdAt = new Date().toISOString();
    
    // Create new Tenant entity
    await setDoc(doc(db, 'tenants', newTenantId), {
      id: newTenantId,
      name: `${firebaseUser.displayName || name || 'Perusahaan'}`,
      createdAt,
      ownerId: firebaseUser.uid,
    });

    // Create User Profile and assign owner
    const profileData: UserProfile = {
      uid: firebaseUser.uid,
      name: firebaseUser.displayName || name || 'Unknown User',
      email: firebaseUser.email || '',
      role: 'owner', // Self-service always become owner initially
      createdAt,
      tenantId: newTenantId,
      isOnboarded: false,
    };

    await setDoc(docRef, profileData);
  };

  const signIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      await initNewUser(firebaseUser);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        return;
      }
      console.error("Error signing in:", error);
      alert(`Gagal login: ${error.message || 'Silakan coba lagi.'}`);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Let the onAuthStateChanged handle the profile fetching
    } catch (error: any) {
      console.error("Error signing in with email:", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await initNewUser(result.user, name);
    } catch (error: any) {
      console.error("Error signing up:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error("Error resetting password:", error);
      throw error;
    }
  };

  const updatePassword = async (newPassword: string) => {
    if (!auth.currentUser) throw new Error("Tidak ada user yang login.");
    try {
      await firebaseUpdatePassword(auth.currentUser, newPassword);
    } catch (error: any) {
      console.error("Error updating password:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signInWithEmail, signUpWithEmail, signOut, resetPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

