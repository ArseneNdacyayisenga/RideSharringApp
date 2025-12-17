import axios from 'axios';

const API_BASE_URL = 'http://localhost:8081/api/auth';

export const authService = {
  // ===== LOGIN =====
  login: async (email, password) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/login`,
        { email, password },
        {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      const { token, user, requiresTwoFactor } = response.data;

      if (requiresTwoFactor) {
        return { requiresTwoFactor };
      }

      if (!user || !user.role) {
        throw new Error('User data or role missing from server response');
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      return { token, user };
    } catch (error) {
      console.error('Login error:', error.response || error);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  // ===== VERIFY 2FA =====
  verifyTwoFactor: async (email, code) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/2fa/verify`,
        { email, code },
        {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      return { token, user };
    } catch (error) {
      console.error('2FA verification error:', error.response || error);
      throw new Error(error.response?.data?.message || '2FA verification failed');
    }
  },

  // ===== REGISTER =====
  register: async (userData) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/register`,
        userData,
        {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      // Backend might return { message, userId } or { message, userId, driverId }
      return response.data;
    } catch (error) {
      console.error('Registration error:', error.response || error);
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  },

  // ===== GET CURRENT USER =====
  getCurrentUser: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const response = await axios.get(`${API_BASE_URL}/me`, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${token}` }
      });

      return response.data;
    } catch (error) {
      console.error('Get current user error:', error.response || error);
      throw new Error(error.response?.data?.message || 'Failed to get user info');
    }
  },

  // ===== FORGOT PASSWORD =====
  forgotPassword: async (email) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/forgot-password`,
        { email },
        {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Forgot password error:', error.response || error);
      throw new Error(error.response?.data?.message || 'Failed to send reset email');
    }
  },

  // ===== RESET PASSWORD =====
  resetPassword: async (token, newPassword) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/reset-password`,
        { token, newPassword },
        {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Reset password error:', error.response || error);
      throw new Error(error.response?.data?.message || 'Password reset failed');
    }
  }
};
