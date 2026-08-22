export const BASE_URL = 'http://localhost:5000/api';

export const getHeaders = () => {
  const token = sessionStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const handleResponse = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    // A 401 with a stored token means the session is dead (e.g. account deleted
    // or database reset) - clear it and return to the login screen.
    if (response.status === 401 && sessionStorage.getItem('token')) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      window.location.href = '/';
    }
    const errorMsg = data.error || `HTTP error! status: ${response.status}`;
    throw new Error(errorMsg);
  }
  return data;
};
