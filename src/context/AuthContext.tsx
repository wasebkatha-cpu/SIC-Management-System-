import React, { createContext, useContext, useEffect, useState } from 'react';
import { MockDB, Permission } from '../lib/mockDb';

export type Role = 'superUser' | 'admin' | null;

interface AppUser {
  uid: string;
  email?: string;
  role: Role;
  username: string;
  name: string;
  permissions?: Permission[];
  assignedReaderId?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (user: AppUser) => Promise<void>;
  logout: () => Promise<void>;
  logActivity: (activity: string) => Promise<void>;
  hasPermission: (perm: Permission) => boolean;
  updateAvatar: (avatarUrl: string) => Promise<void>;
  updateName: (name: string) => Promise<void>;
  updateProfile: (updates: { name?: string; avatarUrl?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session in localStorage
    const storedUserId = localStorage.getItem('mock_session');
    if (storedUserId) {
      const users = MockDB.getUsers();
      const found = users.find(u => u.id === storedUserId);
      if (found) {
        setUser({
          uid: found.id,
          username: found.username,
          role: found.role,
          name: found.name,
          permissions: found.permissions,
          assignedReaderId: found.assignedReaderId,
          avatarUrl: found.avatarUrl
        });
      } else {
        // Clear dangling session
        localStorage.removeItem('mock_session');
      }
    }
    setLoading(false);
  }, []);


  const login = async (appUser: AppUser) => {
    const dbUsers = MockDB.getUsers();
    const dbUser = dbUsers.find(u => u.id === appUser.uid);
    if (dbUser && dbUser.avatarUrl) {
      appUser.avatarUrl = dbUser.avatarUrl;
    }
    
    setUser(appUser);

    localStorage.setItem('mock_session', appUser.uid);
    await MockDB.addLog({
      userId: appUser.uid,
      username: appUser.username,
      role: appUser.role as string,
      activity: 'Logged in'
    });
  };

  const updateAvatar = async (avatarUrl: string) => {
    if (!user) return;
    MockDB.updateUser(user.uid, { avatarUrl });
    setUser(prev => prev ? { ...prev, avatarUrl } : null);
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('mock_users_update'));
    await logActivity('Updated profile picture');
  };

  const updateName = async (name: string) => {
    if (!user) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    MockDB.updateUser(user.uid, { name: trimmed });
    setUser(prev => prev ? { ...prev, name: trimmed } : null);
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('mock_users_update'));
    await logActivity(`Updated display name to "${trimmed}"`);
  };

  const updateProfile = async (updates: { name?: string; avatarUrl?: string }) => {
    if (!user) return;
    MockDB.updateUser(user.uid, updates);
    setUser(prev => prev ? { ...prev, ...updates } : null);
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('mock_users_update'));
    await logActivity('Updated profile details');
  };

  const logout = async () => {
    if (user) {
      await logActivity('Logged out');
    }
    setUser(null);
    localStorage.removeItem('mock_session');
  };

  const logActivity = async (activity: string) => {
    if (!user) return;
    try {
      await MockDB.addLog({
        userId: user.uid,
        username: user.username,
        role: user.role as string,
        activity
      });
    } catch (e) {
      console.error("Failed to log activity", e);
    }
  };

  const hasPermission = (perm: Permission): boolean => {
    if (!user) return false;
    if (user.role === 'superUser') return true;
    if (user.role === 'admin') {
      if (!user.permissions || user.permissions.length === 0) return true;
      return user.permissions.includes(perm);
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, logActivity, hasPermission, updateAvatar, updateName, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
