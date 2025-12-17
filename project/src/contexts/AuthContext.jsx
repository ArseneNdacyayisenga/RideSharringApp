import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsTwoFactor, setNeedsTwoFactor] = useState(false);
  const [tempEmail, setTempEmail] = useState('');
  const navigate = useNavigate();

  // Fetch current user on mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const userData = await authService.getCurrentUser();
          setUser(userData);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  // ===== LOGIN =====
  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);

      if (response.requiresTwoFactor) {
        setNeedsTwoFactor(true);
        setTempEmail(email);
        navigate('/verify-2fa');
        return;
      }

      setUser({ ...response.user, driver: response.driver });
      toast.success('Login successful!');

      // Navigate based on role
      switch (response.user?.role) {
        case 'RIDER':
          navigate('/rider/dashboard');
          break;
        case 'DRIVER':
          navigate('/driver/dashboard');
          break;
        default:
          navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login failed:', error);
      toast.error(error.message || 'Login failed. Please try again.');
    }
  };

  // ===== VERIFY 2FA =====
  const verifyTwoFactor = async (code) => {
    try {
      if (!tempEmail) throw new Error('Temporary email not set');

      const response = await authService.verifyTwoFactor(tempEmail, code);

      setUser({ ...response.user, driver: response.driver });
      setNeedsTwoFactor(false);
      setTempEmail('');

      toast.success('Verification successful!');

      switch (response.user?.role) {
        case 'RIDER':
          navigate('/rider/dashboard');
          break;
        case 'DRIVER':
          navigate('/driver/dashboard');
          break;
        default:
          navigate('/dashboard');
      }
    } catch (error) {
      console.error('2FA verification failed:', error);
      toast.error(error.message || 'Verification failed. Please try again.');
    }
  };

  // ===== REGISTER =====
  const register = async (userData) => {
    try {
      const response = await authService.register(userData);

      toast.success('Registration successful! Please log in.');

      // Optionally, store new user ID or driver ID if needed
      console.log('Registration response:', response);

      navigate('/login');
    } catch (error) {
      console.error('Registration failed:', error);
      toast.error(error.message || 'Registration failed. Please try again.');
    }
  };

  // ===== LOGOUT =====
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    toast.success('Logged out successfully!');
    navigate('/login');
  };

  // ===== FORGOT PASSWORD =====
  const forgotPassword = async (email) => {
    try {
      await authService.forgotPassword(email);
      toast.success('Password reset link sent to your email!');
      navigate('/login');
    } catch (error) {
      console.error('Forgot password failed:', error);
      toast.error(error.message || 'Request failed. Please try again.');
    }
  };

  // ===== RESET PASSWORD =====
  const resetPassword = async (token, newPassword) => {
    try {
      await authService.resetPassword(token, newPassword);
      toast.success('Password reset successful! Please log in with your new password.');
      navigate('/login');
    } catch (error) {
      console.error('Password reset failed:', error);
      toast.error(error.message || 'Password reset failed. Please try again.');
    }
  };

  // ===== GOOGLE LOGIN (placeholder) =====
  const loginWithGoogle = async () => {
    toast.error('Google login is not implemented in this demo');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        needsTwoFactor,
        login,
        verifyTwoFactor,
        register,
        logout,
        forgotPassword,
        resetPassword,
        loginWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
