import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AlertCircle, ArrowLeft } from 'lucide-react';

const VerifyTwoFactor = () => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef([]);
  
  const { verifyTwoFactor, needsTwoFactor, tempEmail } = useAuth();

  // Focus the first input when component mounts
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index, value) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;
    
    // Update the code array
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    
    // Clear error
    setError('');
    
    // Move to next input if value is entered
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Move to previous input on backspace if current input is empty
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
    
    // Move to next input on right arrow
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1].focus();
    }
    
    // Move to previous input on left arrow
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    
    const pastedData = e.clipboardData.getData('text/plain').trim();
    
    // Check if pasted content is a 6-digit number
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setCode(digits);
      
      // Focus the last input
      if (inputRefs.current[5]) {
        inputRefs.current[5].focus();
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const verificationCode = code.join('');
    
    if (verificationCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await verifyTwoFactor(verificationCode);
      // Navigation is handled in the auth context
    } catch (error) {
      console.error('Verification error:', error);
      setError('Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  // If 2FA is not required, redirect to login
  if (!needsTwoFactor) {
    return (
      <div className="text-center">
        <p className="text-dark-300 mb-4">Two-factor authentication is not required.</p>
        <Link to="/login" className="btn btn-primary">
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full card slide-up">
      <div className="card-body">
        <Link to="/login" className="inline-flex items-center text-primary-500 hover:text-primary-400 mb-6">
          <ArrowLeft size={16} className="mr-1" />
          Back to login
        </Link>
        
        <h2 className="text-2xl font-bold text-white mb-2">Two-Factor Authentication</h2>
        <p className="text-dark-300 mb-6">
          Enter the 6-digit verification code sent to your email or authentication app.
          <br />
          <span className="text-primary-400">
            {tempEmail ? `Email: ${tempEmail}` : ''}
          </span>
        </p>
        
        <form onSubmit={handleSubmit}>
          {/* Verification Code Input */}
          <div className="mb-6">
            <label htmlFor="code" className="block text-sm font-medium text-dark-300 mb-1">
              Verification Code
            </label>
            <div 
              className="flex justify-between gap-2 mb-2" 
              onPaste={handlePaste}
            >
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength={1}
                  className={`w-12 h-14 text-center text-xl font-bold bg-dark-800 border ${
                    error ? 'border-error' : 'border-dark-700'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600`}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                />
              ))}
            </div>
            {error && (
              <p className="text-error text-sm flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {error}
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
                <span>Verifying...</span>
              </>
            ) : (
              'Verify'
            )}
          </button>
          
          <p className="text-center text-dark-400 text-sm">
            Didn't receive the code?{' '}
            <button type="button" className="text-primary-500 hover:text-primary-400">
              Resend code
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default VerifyTwoFactor;