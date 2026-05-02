import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSession, logout as svcLogout } from '../services/authService';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (session) setUser(session.user);
    setReady(true);
  }, []);

  const login  = (u) => setUser(u);
  const logout = () => { svcLogout(user?.id); setUser(null); };

  return (
    <AuthContext.Provider value={{ user, login, logout, ready }}>
      {ready ? children : null}
    </AuthContext.Provider>
  );
}
