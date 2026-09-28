import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserAccount, UserRole, RolePermissions, INITIAL_USERS, getRolePermissions } from '../types/auth';

interface AuthContextType {
  currentUser: UserAccount;
  users: UserAccount[];
  permissions: RolePermissions;
  switchUser: (userId: string) => void;
  addUser: (user: Omit<UserAccount, 'id'>) => void;
  updateUser: (user: UserAccount) => void;
  deleteUser: (userId: string) => void;
  toggleUserStatus: (userId: string) => void;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}

const USERS_STORAGE_KEY = 'aref_oriental_users';
const CURRENT_USER_ID_KEY = 'aref_oriental_current_user_id';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load users from storage or fallback to INITIAL_USERS
  const [users, setUsers] = useState<UserAccount[]>(() => {
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load users from localStorage', e);
    }
    return INITIAL_USERS;
  });

  // Current active user ID
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(CURRENT_USER_ID_KEY);
      if (stored && INITIAL_USERS.some(u => u.id === stored)) {
        return stored;
      }
    } catch (e) {
      console.error('Failed to load current user ID', e);
    }
    // Default to dev admin or aref_director
    return INITIAL_USERS[0].id;
  });

  // Persist users
  useEffect(() => {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Failed to persist users', e);
    }
  }, [users]);

  // Persist current user ID
  useEffect(() => {
    try {
      localStorage.setItem(CURRENT_USER_ID_KEY, currentUserId);
    } catch (e) {
      console.error('Failed to persist current user ID', e);
    }
  }, [currentUserId]);

  const currentUser = users.find(u => u.id === currentUserId) || users[0] || INITIAL_USERS[0];
  const permissions = getRolePermissions(currentUser.role);

  const switchUser = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (target) {
      setCurrentUserId(userId);
      // update last login
      const updated = users.map(u => 
        u.id === userId 
          ? { ...u, lastLogin: new Date().toLocaleString('ar-MA', { dateStyle: 'short', timeStyle: 'short' }) }
          : u
      );
      setUsers(updated);
    }
  };

  const addUser = (newUser: Omit<UserAccount, 'id'>) => {
    const id = `user-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`;
    const created: UserAccount = {
      ...newUser,
      id,
      isActive: true,
      lastLogin: new Date().toLocaleString('ar-MA', { dateStyle: 'short', timeStyle: 'short' })
    };
    setUsers(prev => [created, ...prev]);
  };

  const updateUser = (updated: UserAccount) => {
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
  };

  const deleteUser = (userId: string) => {
    if (users.length <= 1) {
      alert('لا يمكن حذف المستخدم الأخير بالنظام');
      return;
    }
    setUsers(prev => prev.filter(u => u.id !== userId));
    if (currentUserId === userId) {
      const remaining = users.filter(u => u.id !== userId);
      if (remaining.length > 0) {
        setCurrentUserId(remaining[0].id);
      }
    }
  };

  const toggleUserStatus = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !u.isActive } : u));
  };

  const hasRole = (roles: UserRole | UserRole[]) => {
    if (Array.isArray(roles)) {
      return roles.includes(currentUser.role);
    }
    return currentUser.role === roles;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        permissions,
        switchUser,
        addUser,
        updateUser,
        deleteUser,
        toggleUserStatus,
        hasRole
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
