import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  UserPlus, 
  Shield,
  CheckCircle,
  AlertCircle,
  Star,
  Crown,
  Zap,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';

// ============================================
// INTERFACES
// ============================================

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  subscription: 'free' | 'premium' | 'pro';
  createdAt: Date;
  avatar?: string;
}

interface AuthFormData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  confirmPassword?: string;
}

// ============================================
// MAIN AUTH COMPONENT
// ============================================

export const AuthSystem: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'signup';
}> = ({ isOpen, onClose, defaultMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(defaultMode);
  const [formData, setFormData] = useState<AuthFormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const { login, signup, user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode);
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        confirmPassword: ''
      });
      setErrors({});
    }
  }, [isOpen, defaultMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      if (mode === 'login') {
        await login(formData.email, formData.password);
      } else if (mode === 'signup') {
        const validationErrors = validateSignupForm();
        if (Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors);
          return;
        }
        
        await signup({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName || '',
          lastName: formData.lastName || ''
        });
      }
      onClose();
    } catch (error: any) {
      setErrors({ general: error.message || 'Authentication failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const validateSignupForm = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.firstName) {
      errors.firstName = 'First name is required';
    }
    
    if (!formData.lastName) {
      errors.lastName = 'Last name is required';
    }
    
    return errors;
  };

  const updateFormData = (field: keyof AuthFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <AnimatePresence mode="wait">
          {mode === 'login' && (
            <LoginForm
              key="login"
              formData={formData}
              updateFormData={updateFormData}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              errors={errors}
              isLoading={isLoading}
              onSubmit={handleSubmit}
              onSwitchToSignup={() => setMode('signup')}
              onForgotPassword={() => setMode('forgot')}
            />
          )}
          
          {mode === 'signup' && (
            <SignupForm
              key="signup"
              formData={formData}
              updateFormData={updateFormData}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              errors={errors}
              isLoading={isLoading}
              onSubmit={handleSubmit}
              onSwitchToLogin={() => setMode('login')}
            />
          )}
          
          {mode === 'forgot' && (
            <ForgotPasswordForm
              key="forgot"
              formData={formData}
              updateFormData={updateFormData}
              errors={errors}
              isLoading={isLoading}
              onBack={() => setMode('login')}
            />
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

// ============================================
// LOGIN FORM
// ============================================

const LoginForm: React.FC<{
  formData: AuthFormData;
  updateFormData: (field: keyof AuthFormData, value: string) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  errors: Record<string, string>;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onSwitchToSignup: () => void;
  onForgotPassword: () => void;
}> = ({
  formData,
  updateFormData,
  showPassword,
  setShowPassword,
  errors,
  isLoading,
  onSubmit,
  onSwitchToSignup,
  onForgotPassword
}) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
  >
    <DialogHeader>
      <DialogTitle className="text-center text-2xl font-bold text-slate-900">
        Welcome Back
      </DialogTitle>
      <p className="text-center text-slate-600">
        Sign in to access detailed civic insights
      </p>
    </DialogHeader>

    <form onSubmit={onSubmit} className="space-y-4">
      {errors.general && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{errors.general}</span>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={(e) => updateFormData('email', e.target.value)}
            className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
          />
        </div>
        {errors.email && (
          <p className="text-sm text-red-600">{errors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            value={formData.password}
            onChange={(e) => updateFormData('password', e.target.value)}
            className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-red-600">{errors.password}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
        ) : (
          <>
            <LogIn className="h-4 w-4 mr-2" />
            Sign In
          </>
        )}
      </Button>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-blue-600 hover:underline"
        >
          Forgot password?
        </button>
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="text-blue-600 hover:underline"
        >
          Create account
        </button>
      </div>
    </form>

    <Separator className="my-6" />
    
    <div className="text-center">
      <p className="text-sm text-slate-500 mb-3">New to Stoneclough Hub?</p>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1 text-slate-600">
          <CheckCircle className="h-3 w-3 text-green-600" />
          Real-time civic data
        </div>
        <div className="flex items-center gap-1 text-slate-600">
          <CheckCircle className="h-3 w-3 text-green-600" />
          Service directory
        </div>
      </div>
    </div>
  </motion.div>
);

// ============================================
// SIGNUP FORM
// ============================================

const SignupForm: React.FC<{
  formData: AuthFormData;
  updateFormData: (field: keyof AuthFormData, value: string) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  errors: Record<string, string>;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onSwitchToLogin: () => void;
}> = ({
  formData,
  updateFormData,
  showPassword,
  setShowPassword,
  errors,
  isLoading,
  onSubmit,
  onSwitchToLogin
}) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
  >
    <DialogHeader>
      <DialogTitle className="text-center text-2xl font-bold text-slate-900">
        Join Stoneclough Hub
      </DialogTitle>
      <p className="text-center text-slate-600">
        Get access to detailed civic insights and analytics
      </p>
    </DialogHeader>

    <form onSubmit={onSubmit} className="space-y-4">
      {errors.general && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{errors.general}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            placeholder="John"
            value={formData.firstName}
            onChange={(e) => updateFormData('firstName', e.target.value)}
            className={errors.firstName ? 'border-red-500' : ''}
          />
          {errors.firstName && (
            <p className="text-sm text-red-600">{errors.firstName}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            placeholder="Doe"
            value={formData.lastName}
            onChange={(e) => updateFormData('lastName', e.target.value)}
            className={errors.lastName ? 'border-red-500' : ''}
          />
          {errors.lastName && (
            <p className="text-sm text-red-600">{errors.lastName}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            value={formData.email}
            onChange={(e) => updateFormData('email', e.target.value)}
            className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
          />
        </div>
        {errors.email && (
          <p className="text-sm text-red-600">{errors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Create a strong password"
            value={formData.password}
            onChange={(e) => updateFormData('password', e.target.value)}
            className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-red-600">{errors.password}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={(e) => updateFormData('confirmPassword', e.target.value)}
            className={`pl-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
          />
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-red-600">{errors.confirmPassword}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
        ) : (
          <>
            <UserPlus className="h-4 w-4 mr-2" />
            Create Account
          </>
        )}
      </Button>

      <div className="text-center">
        <span className="text-sm text-slate-600">Already have an account? </span>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-sm text-blue-600 hover:underline"
        >
          Sign in
        </button>
      </div>
    </form>
  </motion.div>
);

// ============================================
// FORGOT PASSWORD FORM
// ============================================

const ForgotPasswordForm: React.FC<{
  formData: AuthFormData;
  updateFormData: (field: keyof AuthFormData, value: string) => void;
  errors: Record<string, string>;
  isLoading: boolean;
  onBack: () => void;
}> = ({ formData, updateFormData, errors, isLoading, onBack }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
  >
    <DialogHeader>
      <DialogTitle className="text-center text-2xl font-bold text-slate-900">
        Reset Password
      </DialogTitle>
      <p className="text-center text-slate-600">
        Enter your email to receive reset instructions
      </p>
    </DialogHeader>

    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={(e) => updateFormData('email', e.target.value)}
            className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
          />
        </div>
        {errors.email && (
          <p className="text-sm text-red-600">{errors.email}</p>
        )}
      </div>

      <Button className="w-full" disabled={isLoading}>
        {isLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
        ) : (
          'Send Reset Link'
        )}
      </Button>

      <Button
        type="button"
        variant="ghost"
        className="w-full"
        onClick={onBack}
      >
        Back to Sign In
      </Button>
    </div>
  </motion.div>
);

// ============================================
// USER PROFILE COMPONENT
// ============================================

export const UserProfile: React.FC<{
  user: User;
  onLogout: () => void;
}> = ({ user, onLogout }) => (
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
      <User className="h-4 w-4 text-blue-600" />
    </div>
    <div className="hidden sm:block">
      <p className="text-sm font-medium text-slate-900">
        {user.firstName} {user.lastName}
      </p>
      <div className="flex items-center gap-2">
        <Badge 
          variant={user.subscription === 'free' ? 'secondary' : 'default'}
          className={user.subscription === 'premium' ? 'bg-blue-100 text-blue-800' : 
                     user.subscription === 'pro' ? 'bg-purple-100 text-purple-800' : ''}
        >
          {user.subscription === 'premium' && <Star className="h-3 w-3 mr-1" />}
          {user.subscription === 'pro' && <Crown className="h-3 w-3 mr-1" />}
          {user.subscription}
        </Badge>
      </div>
    </div>
    <Button
      onClick={onLogout}
      variant="ghost"
      size="sm"
      className="text-slate-600 hover:text-slate-900"
    >
      Logout
    </Button>
  </div>
);

export default AuthSystem;
