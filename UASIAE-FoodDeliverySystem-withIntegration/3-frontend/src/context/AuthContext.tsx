import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { authAPI, userAPI } from '../services/api';

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role?: string;
}

interface JWTPayload {
  id: number;
  email: string;
  role: string;
  exp?: number;
  iat?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ role: string }>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<{ role: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isDriver: boolean;
  isCustomer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    
    if (storedToken) {
      try {
        const decoded = jwtDecode<JWTPayload>(storedToken);
        
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          return;
        }
        
        setToken(storedToken);
        
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            // Fallback jika json parse error
            setUser({ id: decoded.id, email: decoded.email, name: 'User', role: decoded.role });
          }
        }
        
        // Refresh profile di background
        userAPI.getProfile().then((data: any) => {
            // Support kedua format response (jaga-jaga)
            const userData = data.data || data; 
            if (userData && userData.id) {
              setUser(userData);
              localStorage.setItem('user', JSON.stringify(userData));
            }
          }).catch(() => {});
      } catch (error) {
        localStorage.removeItem('token');
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Panggil API
      const response = await authAPI.login({ email, password }) as any;
      console.log('✅ Login response:', response);
      
      // --- PERBAIKAN LOGIKA DISINI ---
      // Backend mengirim { token: "...", user: {...} }
      // Jadi kita cek langsung properti 'token'
      if (response && response.token) {
        const token = response.token;
        const decoded = jwtDecode<JWTPayload>(token);
        
        setToken(token);
        localStorage.setItem('token', token);

        // Ambil data user dari response login jika ada
        let userData: User;
        if (response.user) {
            userData = response.user;
        } else {
            userData = {
                id: decoded.id,
                email: decoded.email,
                name: decoded.email.split('@')[0],
                role: decoded.role,
            };
        }
        
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));

        return { role: decoded.role };
      } else {
        throw new Error('Login failed: Invalid server response (No Token)');
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);
      // Ambil pesan error dari backend FastAPI (biasanya di error.response.data.detail)
      const msg = error.response?.data?.detail || error.message || 'Login failed';
      throw new Error(msg);
    }
  };

  const register = async (name: string, email: string, password: string, phone?: string) => {
    try {
      const response = await authAPI.register({ name, email, password, phone }) as any;
      console.log('✅ Register response:', response);
      
      // Sama seperti login, cek token langsung
      if (response && response.token) {
        const token = response.token;
        setToken(token);
        localStorage.setItem('token', token);
        
        if (response.user) {
            setUser(response.user);
            localStorage.setItem('user', JSON.stringify(response.user));
        }
        
        const decoded = jwtDecode<JWTPayload>(token);
        return { role: decoded.role || 'CUSTOMER' };
      } else {
        throw new Error('Registration failed: No token returned');
      }
    } catch (error: any) {
      const msg = error.response?.data?.detail || error.message || 'Registration failed';
      throw new Error(msg);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const userRole = user?.role?.toUpperCase();
  
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated: !!token,
        isAdmin: userRole === 'ADMIN',
        isDriver: userRole === 'DRIVER',
        isCustomer: userRole === 'CUSTOMER' || (!userRole && !!token),
      }}
    >
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