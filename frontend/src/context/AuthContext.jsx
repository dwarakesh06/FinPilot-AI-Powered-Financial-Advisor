import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const res = await api.get('/api/auth/me');
        if (res.data.success) {
          setUser(res.data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Session validation failed:', error.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUserSession();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', { email, password });
      if (res.data.success) {
        const { user: userData } = res.data;
        setUser(userData);
        return userData;
      }
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password, currency = 'USD') => {
    setLoading(true);
    try {
      const res = await api.post('/api/auth/register', { name, email, password, currency });
      if (res.data.success) {
        const { user: userData } = res.data;
        setUser(userData);
        return userData;
      }
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.get('/api/auth/logout');
    } catch (e) {
      console.error(e);
    }
    setUser(null);
  };

  const updateSettings = async (currency) => {
    try {
      const res = await api.put('/api/auth/settings', { currency });
      if (res.data.success) {
        const updatedUser = res.data.user;
        setUser(updatedUser);
        return updatedUser;
      }
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateSettings }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
