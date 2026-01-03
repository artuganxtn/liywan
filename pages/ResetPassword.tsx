import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, Button, Input } from '../components/UI';
import { IventiaLogo } from '../components/UI';
import { Lock, Eye, EyeOff, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { auth } from '../services/api';
import { useToast } from '../components/ui/Toast';
import { Link, useNavigate, useParams } from 'react-router-dom';

export default function ResetPassword() {
  const { resetToken } = useParams<{ resetToken: string }>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    feedback: string;
  }>({ score: 0, feedback: '' });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!resetToken) {
      toast.error('Invalid reset token');
      navigate('/forgot-password');
    }
  }, [resetToken, navigate, toast]);

  const validatePassword = (pwd: string): { score: number; feedback: string } => {
    let score = 0;
    const feedback: string[] = [];

    if (pwd.length >= 8) score += 1;
    else feedback.push('At least 8 characters');

    if (/[a-z]/.test(pwd)) score += 1;
    else feedback.push('One lowercase letter');

    if (/[A-Z]/.test(pwd)) score += 1;
    else feedback.push('One uppercase letter');

    if (/[0-9]/.test(pwd)) score += 1;
    else feedback.push('One number');

    if (/[^a-zA-Z0-9]/.test(pwd)) score += 1;
    else feedback.push('One special character');

    return {
      score,
      feedback: feedback.length > 0 ? `Add: ${feedback.join(', ')}` : 'Strong password!',
    };
  };

  useEffect(() => {
    if (password) {
      setPasswordStrength(validatePassword(password));
    } else {
      setPasswordStrength({ score: 0, feedback: '' });
    }
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!resetToken) {
      toast.error('Invalid reset token');
      return;
    }

    setIsLoading(true);
    try {
      const response = await auth.resetPassword(resetToken, password);
      if (response.success) {
        setIsSuccess(true);
        toast.success('Password reset successful!');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        toast.error(response.error || 'Failed to reset password');
      }
    } catch (error: any) {
      console.error('Reset password error:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to reset password';
      toast.error(errorMessage);
      
      if (errorMessage.includes('expired') || errorMessage.includes('Invalid')) {
        setTimeout(() => {
          navigate('/forgot-password');
        }, 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Password Reset Successful!</h1>
              <p className="text-gray-600">
                Your password has been changed successfully. You can now log in with your new password.
              </p>
            </div>

            <Link to="/login">
              <Button className="w-full">
                Go to Login
              </Button>
            </Link>
          </Card>
        </motion.div>
      </div>
    );
  }

  const getStrengthColor = () => {
    if (passwordStrength.score <= 2) return 'bg-red-500';
    if (passwordStrength.score <= 3) return 'bg-amber-500';
    if (passwordStrength.score <= 4) return 'bg-blue-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="p-8">
          <div className="text-center mb-8">
            <IventiaLogo className="mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h1>
            <p className="text-gray-600">
              Enter your new password below.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Input
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                required
                icon={<Lock size={18} />}
                disabled={isLoading}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />
              
              {password && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${getStrengthColor()}`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600">
                      {passwordStrength.score}/5
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {passwordStrength.feedback}
                  </p>
                </div>
              )}
            </div>

            <Input
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              icon={<Lock size={18} />}
              disabled={isLoading}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />

            {confirmPassword && password !== confirmPassword && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <XCircle size={16} />
                <span>Passwords do not match</span>
              </div>
            )}

            {confirmPassword && password === confirmPassword && password.length >= 6 && (
              <div className="flex items-center gap-2 text-emerald-600 text-sm">
                <CheckCircle size={16} />
                <span>Passwords match</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !password || !confirmPassword || password !== confirmPassword || password.length < 6}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Resetting Password...
                </>
              ) : (
                <>
                  <Lock size={18} className="mr-2" />
                  Reset Password
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900 flex items-center justify-center gap-1">
              <ArrowLeft size={14} />
              Back to Login
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

