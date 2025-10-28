import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { User } from '../types';
import * as authService from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, additionalInfo?: {
    actualJobTitle?: string;
    dailyAvailableHours?: number;
    workingHoursStart?: string;
    workingHoursEnd?: string;
  }) => Promise<void>;
  signUpAsAdmin: (email: string, password: string, name: string, additionalInfo?: {
    actualJobTitle?: string;
    dailyAvailableHours?: number;
    workingHoursStart?: string;
    workingHoursEnd?: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 認証状態の監視
    const unsubscribe = authService.onAuthStateChange(async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        // Firestoreからユーザー情報を取得
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error('ユーザー情報の取得に失敗:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { user: userData, firebaseUser: fbUser } = await authService.signIn(email, password);
      setUser(userData);
      setFirebaseUser(fbUser);
    } catch (error) {
      throw error;
    }
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    additionalInfo?: {
      actualJobTitle?: string;
      dailyAvailableHours?: number;
      workingHoursStart?: string;
      workingHoursEnd?: string;
    }
  ) => {
    try {
      const { user: userData, firebaseUser: fbUser } = await authService.signUp(
        email,
        password,
        name,
        additionalInfo
      );
      setUser(userData);
      setFirebaseUser(fbUser);
    } catch (error) {
      throw error;
    }
  };

  const signUpAsAdmin = async (
    email: string,
    password: string,
    name: string,
    additionalInfo?: {
      actualJobTitle?: string;
      dailyAvailableHours?: number;
      workingHoursStart?: string;
      workingHoursEnd?: string;
    }
  ) => {
    try {
      const { user: userData, firebaseUser: fbUser } = await authService.signUpAsAdmin(
        email,
        password,
        name,
        additionalInfo
      );
      setUser(userData);
      setFirebaseUser(fbUser);
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await authService.signOut();
      setUser(null);
      setFirebaseUser(null);
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, signIn, signUp, signUpAsAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
