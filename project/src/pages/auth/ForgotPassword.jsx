import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, AlertCircle, ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const { forgotPassword } = useAuth();

  const validateForm = () => {
    const newErrors = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
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
      await forgotPassword(email);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Forgot password error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full card slide-up">
      <div className="card-body">
        <Link to="/login" className="inline-flex items-center text-primary-500 hover:text-primary-400 mb-6">
          <ArrowLeft size={16} className="mr-1" />
          Back to login
        </Link>
        
        <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
        <p className="text-dark-300 mb-6">
          Enter your email address and we'll send you a link to reset your password.
        </p>
        
        {isSubmitted ? (
          <div className="bg-accent-600/20 p-4 rounded-lg text-accent-400 mb-6">
            <h3 className="font-medium mb-2">Check your email</h3>
            <p className="text-sm">
              We've sent a password reset link to <span className="font-semibold">{email}</span>.
              Please check your inbox and follow the instructions.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Email Input */}
            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-medium text-dark-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  className={`input pl-10 ${errors.email ? 'border-error' : ''}`}
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary w-full mb-4"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="loader border-t-white"></div>
                  <span>Sending Link...</span>
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>
        )}
        
        <p className="text-center text-dark-400">
          Remember your password?{' '}
          <Link to="/login" className="text-primary-500 hover:text-primary-400">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;