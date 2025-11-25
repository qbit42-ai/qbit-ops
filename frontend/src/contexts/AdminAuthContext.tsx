import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/utils/api';

interface Admin {
  id: string;
  email: string;
  role: string;
}

interface AdminAuthContextType {
  admin: Admin | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('adminToken');
    if (storedToken) {
      setToken(storedToken);
      // Verify token and get admin info
      api
        .get('/admin/auth/me')
        .then((res) => {
          setAdmin(res.data.admin);
        })
        .catch(() => {
          localStorage.removeItem('adminToken');
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post('/admin/auth/login', { email, password });
    const { token: newToken, admin: adminData } = response.data;
    localStorage.setItem('adminToken', newToken);
    setToken(newToken);
    setAdmin(adminData);
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    setToken(null);
    setAdmin(null);
    api.post('/admin/auth/logout').catch(() => {
      // Ignore errors on logout
    });
  };

  return (
    <AdminAuthContext.Provider value={{ admin, token, login, logout, loading }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
