import { useEffect, useState } from 'react';
import { api } from '../api';

export function useAuthSession() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const cachedToken = sessionStorage.getItem('token');
    const cachedUser = api.auth.getCurrentUser();
    if (cachedToken && cachedUser) {
      setUser(cachedUser);
    }
  }, []);

  const login = (loggedInUser) => setUser(loggedInUser);

  const logout = () => {
    api.auth.logout();
    setUser(null);
  };

  return { user, login, logout };
}
