import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { dbService } from '../services/db';

interface AuthContextType {
  currentUser: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  login: (username: string, password?: string, remember?: boolean) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  switchRoleDirect: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'mm_auth_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check remembered session
    const saved = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
    if (saved) {
      try {
        const user = JSON.parse(saved);
        setCurrentUser(user);
      } catch (e) {
        console.error('Failed to parse user session', e);
      }
    } else {
      // Default to admin for immediate convenience, or require login
      const defaultAdmin: User = {
        id: 'u1',
        username: 'admin',
        name: 'مولانا منتظم اعلیٰ (ایڈمن)',
        role: 'admin',
        phone: '0300-1112233'
      };
      setCurrentUser(defaultAdmin);
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password?: string, remember: boolean = true) => {
    const users = await dbService.getAll<User>('users');
    const cleanUser = username.trim().toLowerCase();
    
    // Check credentials
    const found = users.find(u => u.username.toLowerCase() === cleanUser);
    
    if (found) {
      // Verify password if needed, or allow default 'admin123', 'teacher123', 'viewer123', or match username
      if (password && password.length > 0) {
        const expected = found.username + '123';
        if (password !== expected && password !== '123456' && password !== 'admin' && password !== 'teacher' && password !== 'viewer') {
          return { success: false, message: 'غلط پاس ورڈ! برائے مہربانی درست پاس ورڈ درج کریں۔' };
        }
      }
      
      setCurrentUser(found);
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem(SESSION_KEY, JSON.stringify(found));
      return { success: true };
    }

    return { success: false, message: 'صارف کا نام (Username) درست نہیں ہے۔' };
  };

  const switchRoleDirect = async (role: UserRole) => {
    const users = await dbService.getAll<User>('users');
    const userForRole = users.find(u => u.role === role) || {
      id: `u-${role}`,
      username: role,
      name: role === 'admin' ? 'مولانا منتظم اعلیٰ (ایڈمن)' : role === 'teacher' ? 'قاری عبد السمیع (استاد)' : 'ناظر و مبصر (صرف معائنہ)',
      role
    };
    setCurrentUser(userForRole);
    localStorage.setItem(SESSION_KEY, JSON.stringify(userForRole));
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white font-naskh">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-lg">مدرسہ عربیہ مدینۃ العلوم سافٹ ویئر لوڈ ہو رہا ہے...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: currentUser?.role || 'viewer',
        isAuthenticated: !!currentUser,
        login,
        logout,
        switchRoleDirect
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
