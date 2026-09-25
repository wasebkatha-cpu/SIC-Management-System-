import React, { createContext, useContext, useEffect, useState } from 'react';
import { Permission } from '../lib/mockDb';
import { apiFetch } from '../lib/apiConfig';

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
    const initAuth = async () => {
      const storedUserId = localStorage.getItem('mock_session');
      if (storedUserId) {
        try {
          const res = await apiFetch('/api/users');
          if (res.ok) {
            const users = await res.json();
            const found = users.find((u: any) => u.id === storedUserId);
            if (found) {
              setUser({
                uid: found.id,
                username: found.username,
                role: found.role,
                name: found.name,
                permissions: Array.isArray(found.permissions) ? found.permissions : (typeof found.permissions === 'string' ? JSON.parse(found.permissions) : []),
                assignedReaderId: found.assigned_reader_id || found.assignedReaderId,
                avatarUrl: found.avatar_url || found.avatarUrl
              });
            } else {
              localStorage.removeItem('mock_session');
            }
          }
        } catch (e) {
          console.error('Failed to init auth:', e);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);


  const login = async (appUser: AppUser) => {
    try {
      const res = await apiFetch('/api/users');
      if (res.ok) {
        const users = await res.json();
        const dbUser = users.find((u: any) => u.id === appUser.uid);
        if (dbUser && (dbUser.avatar_url || dbUser.avatarUrl)) {
          appUser.avatarUrl = dbUser.avatar_url || dbUser.avatarUrl;
        }
      }
    } catch (e) {
      console.error('Failed to fetch user on login:', e);
    }
    
    setUser(appUser);
    localStorage.setItem('mock_session', appUser.uid);
    await logActivityLocal(appUser, 'Logged in');
  };

  const logActivityLocal = async (currentUser: AppUser, activity: string) => {
    try {
      await apiFetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.uid,
          username: currentUser.username,
          role: currentUser.role,
          activity
        })
      });
    } catch (e) {
      console.error("Failed to log activity", e);
    }
  };

  const updateAvatar = async (avatarUrl: string) => {
    if (!user) return;
    try {
      await apiFetch(`/api/users/${user.uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl })
      });
      setUser(prev => prev ? { ...prev, avatarUrl } : null);
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('mock_users_update'));
      await logActivity('Updated profile picture');
    } catch (e) {
      console.error('Failed to update avatar:', e);
    }
  };

  const updateName = async (name: string) => {
    if (!user) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      await apiFetch(`/api/users/${user.uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed })
      });
      setUser(prev => prev ? { ...prev, name: trimmed } : null);
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('mock_users_update'));
      await logActivity(`Updated display name to "${trimmed}"`);
    } catch (e) {
      console.error('Failed to update name:', e);
    }
  };

  const updateProfile = async (updates: { name?: string; avatarUrl?: string }) => {
    if (!user) return;
    try {
      await apiFetch(`/api/users/${user.uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      setUser(prev => prev ? { ...prev, ...updates } : null);
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('mock_users_update'));
      await logActivity('Updated profile details');
    } catch (e) {
      console.error('Failed to update profile:', e);
    }
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
    await logActivityLocal(user, activity);
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
