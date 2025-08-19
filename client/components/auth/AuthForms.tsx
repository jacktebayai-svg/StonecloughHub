import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, User } from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const signUpSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const resetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type SignInFormData = z.infer<typeof signInSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

interface AuthFormsProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export function AuthForms({ onSuccess, redirectTo }: AuthFormsProps) {
  const [activeTab, setActiveTab] = useState('signin');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const { signIn, signUp, resetPassword, loading } = useAuthContext();

  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const resetPasswordForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const handleSignIn = async (data: SignInFormData) => {
    setMessage(null);
    const { error } = await signIn(data.email, data.password);
    
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Successfully signed in!' });
      onSuccess?.();
      if (redirectTo) {
        window.location.href = redirectTo;
      }
    }
  };

  const handleSignUp = async (data: SignUpFormData) => {
    setMessage(null);
    const { error } = await signUp(data.email, data.password, data.name);
    
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Account created successfully! Please check your email to verify your account.' });
      onSuccess?.();
      if (redirectTo) {
        window.location.href = redirectTo;
      }
    }
  };

  const handleResetPassword = async (data: ResetPasswordFormData) => {
    setMessage(null);
    const { error } = await resetPassword(data.email);
    
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Password reset email sent! Check your inbox.' });
      setShowResetPassword(false);
    }
  };

  if (showResetPassword) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={resetPasswordForm.handleSubmit(handleResetPassword)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="pl-10"
                  {...resetPasswordForm.register('email')}
                />
              </div>
              {resetPasswordForm.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {resetPasswordForm.formState.errors.email.message}
                </p>
              )}
            </div>

            {message && (
              <Alert className={message.type === 'error' ? 'border-destructive' : 'border-green-500'}>
                <AlertDescription className={message.type === 'error' ? 'text-destructive' : 'text-green-700'}>
                  {message.text}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowResetPassword(false)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Reset Link
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Welcome to StonecloughHub</CardTitle>
        <CardDescription>
          Sign in to your account or create a new one to get started.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-4">
            <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10"
                    {...signInForm.register('email')}
                  />
                </div>
                {signInForm.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {signInForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="Enter your password"
                    className="pl-10"
                    {...signInForm.register('password')}
                  />
                </div>
                {signInForm.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {signInForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              {message && (
                <Alert className={message.type === 'error' ? 'border-destructive' : 'border-green-500'}>
                  <AlertDescription className={message.type === 'error' ? 'text-destructive' : 'text-green-700'}>
                    {message.text}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>

              <Button
                type="button"
                variant="link"
                onClick={() => setShowResetPassword(true)}
                className="w-full"
              >
                Forgot your password?
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4">
            <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Enter your full name"
                    className="pl-10"
                    {...signUpForm.register('name')}
                  />
                </div>
                {signUpForm.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {signUpForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10"
                    {...signUpForm.register('email')}
                  />
                </div>
                {signUpForm.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {signUpForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password"
                    className="pl-10"
                    {...signUpForm.register('password')}
                  />
                </div>
                {signUpForm.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {signUpForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-confirm-password"
                    type="password"
                    placeholder="Confirm your password"
                    className="pl-10"
                    {...signUpForm.register('confirmPassword')}
                  />
                </div>
                {signUpForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {signUpForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {message && (
                <Alert className={message.type === 'error' ? 'border-destructive' : 'border-green-500'}>
                  <AlertDescription className={message.type === 'error' ? 'text-destructive' : 'text-green-700'}>
                    {message.text}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
