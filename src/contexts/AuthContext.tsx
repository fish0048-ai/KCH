"use client";

import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { isTeacherEmail } from "@/lib/auth/teachers";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase/config";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isTeacher: boolean;
  configured: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = isFirebaseConfigured();

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(getFirebaseAuth(), (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
    return unsub;
  }, [configured]);

  const signInWithGoogle = useCallback(async () => {
    if (!configured) throw new Error("Firebase 尚未設定");
    const provider = new GoogleAuthProvider();
    await signInWithPopup(getFirebaseAuth(), provider);
  }, [configured]);

  const logout = useCallback(async () => {
    if (!configured) return;
    await signOut(getFirebaseAuth());
  }, [configured]);

  const value = useMemo(
    () => ({
      user,
      loading,
      isTeacher: isTeacherEmail(user?.email),
      configured,
      signInWithGoogle,
      logout,
    }),
    [user, loading, configured, signInWithGoogle, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth 必須在 AuthProvider 內使用");
  return ctx;
}
