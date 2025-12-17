import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, User, Phone, AlertCircle } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'RIDER',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[0-9]{10,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Phone number is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      await register(formData);
      // Navigation is handled in the auth context
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full card slide-up">
      <div className="card-body">
        <h2 className="text-2xl font-bold text-white mb-6">Create an Account</h2>
        
        <form onSubmit={handleSubmit}>
          {/* Name Input */}
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-dark-300 mb-1">
              Full Name
            </label>
            <div className="relative">
              <input
                id="name"
                name="name"
                type="text"
                className={`input pl-10 ${errors.name ? 'border-error' : ''}`}
                placeholder="Your full name"
                value={formData.name}
                onChange={handleChange}
              />
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" size={18} />
            </div>
            {errors.name && (
              <p className="text-error text-sm mt-1 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Email Input */}
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-dark-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                id="email"
                name="email"
                type="email"
                className={`input pl-10 ${errors.email ? 'border-error' : ''}`}
                placeholder="Your email address"
                value={formData.email}
                onChange={handleChange}
              />
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" size={18} />
            </div>
            {errors.email && (
              <p className="text-error text-sm mt-1 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {errors.email}
              </p>
            )}
          </div>

          {/* Phone Input */}
          <div className="mb-4">
            <label htmlFor="phone" className="block text-sm font-medium text-dark-300 mb-1">
              Phone Number
            </label>
            <div className="relative">
              <input
                id="phone"
                name="phone"
                type="tel"
                className={`input pl-10 ${errors.phone ? 'border-error' : ''}`}
                placeholder="+250 7XX XXX XXX"
                value={formData.phone}
                onChange={handleChange}
              />
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" size={18} />
            </div>
            {errors.phone && (
              <p className="text-error text-sm mt-1 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {errors.phone}
              </p>
            )}
          </div>

          {/* Password Input */}
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-dark-300 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                className={`input pl-10 ${errors.password ? 'border-error' : ''}`}
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
              />
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" size={18} />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-dark-300"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-error text-sm mt-1 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {errors.password}
              </p>
            )}
          </div>

          {/* Confirm Password Input */}
          <div className="mb-4">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-dark-300 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                className={`input pl-10 ${errors.confirmPassword ? 'border-error' : ''}`}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" size={18} />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-dark-300"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-error text-sm mt-1 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Account Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-dark-300 mb-2">
              I want to:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className={`btn ${
                  formData.role === 'RIDER' ? 'btn-primary' : 'btn-secondary'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, role: 'RIDER' }))}
              >
                Book Rides
              </button>
              <button
                type="button"
                className={`btn ${
                  formData.role === 'DRIVER' ? 'btn-primary' : 'btn-secondary'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, role: 'DRIVER' }))}
              >
                Drive & Earn
              </button>
            </div>
          </div>

          {/* Register Button */}
          <button
            type="submit"
            className="btn btn-primary w-full mb-4"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="loader border-t-white"></div>
                <span>Creating Account...</span>
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Login Link */}
        <p className="text-center text-dark-400">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-500 hover:text-primary-400">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;