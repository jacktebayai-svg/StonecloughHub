# Supabase Authentication Setup Guide

This guide covers setting up Supabase Authentication for StonecloughHub, replacing the previous Passport.js system.

## Overview

The application now uses Supabase Auth instead of Passport.js for authentication. This provides:

- Built-in user management
- Email verification
- Password reset functionality  
- Session management
- OAuth providers (Google, GitHub, etc.)
- Row Level Security (RLS)

## 1. Supabase Project Setup

### Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a region close to your users
3. Set a strong database password
4. Wait for the project to be provisioned

### Get API Keys

1. Go to Settings > API in your Supabase dashboard
2. Copy the following values:
   - **Project URL** (e.g., `https://your-project-ref.supabase.co`)
   - **Anon key** (public key for client-side)
   - **Service role key** (private key for server-side)

## 2. Environment Variables Setup

Update your environment variables with the following:

### Server-side variables:
```bash
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
```

### Client-side variables (for Vite):
```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 3. Database Schema Setup

The application expects your existing user tables to remain unchanged. Supabase Auth will create its own `auth.users` table, and the application syncs data between Supabase Auth and your local users table.

### Required Tables

Ensure these tables exist (they should already be in your schema):

```sql
-- Your existing users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Your existing profiles table  
CREATE TABLE profiles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id),
  display_name TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
  profile_image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 4. Supabase Auth Configuration

### Enable Email Authentication

1. Go to Authentication > Settings in your Supabase dashboard
2. Ensure "Enable email confirmations" is enabled for production
3. Configure your site URL: `https://yourdomain.com`
4. Add redirect URLs for auth callbacks

### Configure OAuth Providers (Optional)

For Google OAuth:

1. Go to Authentication > Providers
2. Enable Google provider
3. Add your Google OAuth credentials:
   - Client ID
   - Client Secret
4. Set authorized redirect URIs in Google Console:
   - `https://your-project-ref.supabase.co/auth/v1/callback`

### Email Templates

1. Go to Authentication > Email Templates
2. Customize the email templates for:
   - Email confirmation
   - Password reset
   - Magic link (if enabled)

## 5. Row Level Security (RLS)

Enable RLS for better data protection:

```sql
-- Enable RLS on user-related tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can create own businesses" ON businesses
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own businesses" ON businesses
  FOR UPDATE USING (auth.uid() = created_by);
```

## 6. Application Features

### Authentication Flow

1. **Sign Up**: Users create account with email/password
2. **Email Verification**: Optional email confirmation step
3. **Sign In**: Users authenticate with email/password
4. **Session Management**: Automatic token refresh
5. **Password Reset**: Email-based password recovery

### Available Auth Methods

- Email/Password authentication
- OAuth providers (Google, GitHub, etc.)
- Magic links (passwordless)
- Phone/SMS authentication (if enabled)

### API Routes

The following auth routes are available:

- `POST /api/auth/signup` - Create new account
- `POST /api/auth/signin` - Sign in user  
- `POST /api/auth/signout` - Sign out user
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/me` - Update user profile
- `POST /api/auth/reset-password` - Request password reset
- `POST /api/auth/update-password` - Update password

## 7. Client-Side Usage

### Using the Auth Hook

```tsx
import { useAuthContext } from '../contexts/AuthContext';

function MyComponent() {
  const { 
    user, 
    profile, 
    loading, 
    signIn, 
    signOut, 
    updateProfile 
  } = useAuthContext();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please sign in</div>;

  return <div>Hello, {user.name}!</div>;
}
```

### Auth Forms Component

```tsx
import { AuthForms } from '../components/auth/AuthForms';

function LoginPage() {
  return (
    <AuthForms 
      onSuccess={() => navigate('/')}
      redirectTo="/"
    />
  );
}
```

## 8. Server-Side Authentication

### Middleware Usage

```typescript
// Protect routes that require authentication
app.get('/api/protected', isAuthenticated, (req, res) => {
  const user = req.user; // Supabase user object
  res.json({ message: `Hello, ${user.email}!` });
});

// Admin-only routes
app.get('/api/admin', isAdmin, (req, res) => {
  res.json({ message: 'Admin access granted' });
});
```

## 9. Migration from Passport.js

The application has been updated to:

- ✅ Remove Passport.js dependencies
- ✅ Replace Google OAuth with Supabase OAuth
- ✅ Update authentication middleware
- ✅ Create new auth API routes
- ✅ Implement React auth context
- ✅ Update storage layer for user sync

### Breaking Changes

1. **Session Storage**: Now uses Supabase sessions instead of express-session
2. **User IDs**: User IDs now come from Supabase Auth (UUID format)
3. **OAuth Flow**: Google OAuth now flows through Supabase
4. **Client State**: Auth state managed by React context instead of server sessions

## 10. Testing Authentication

### Local Development

1. Set up environment variables
2. Start the development server: `npm run dev`
3. Navigate to `/login` to test authentication
4. Check browser dev tools for auth tokens
5. Verify API calls include `Authorization: Bearer <token>` header

### Production Testing

1. Deploy with environment variables configured
2. Test email verification flow
3. Test password reset functionality
4. Verify OAuth providers work correctly
5. Check that protected routes require authentication

## 11. Security Considerations

### Best Practices

1. **Environment Variables**: Keep service keys secure and never expose them client-side
2. **Token Management**: Tokens are automatically managed by Supabase client
3. **Password Policies**: Configure strong password requirements in Supabase
4. **Rate Limiting**: Enable rate limiting for auth endpoints
5. **Email Security**: Use proper email validation and confirmation

### Production Checklist

- [ ] Enable email confirmation for new users
- [ ] Configure proper redirect URLs
- [ ] Set up custom email templates
- [ ] Enable Row Level Security
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging
- [ ] Test all auth flows thoroughly

## 12. Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure your domain is added to Supabase allowed origins
2. **Token Errors**: Check that environment variables are set correctly
3. **Email Issues**: Verify SMTP settings in Supabase (for custom domains)
4. **Redirect Issues**: Ensure redirect URLs match exactly in Supabase settings

### Debug Tips

1. Check browser network tab for auth requests
2. Verify tokens in browser localStorage
3. Check Supabase logs for authentication events
4. Use Supabase dashboard to manage users manually
5. Enable debug logging in development

## Support

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/auth-signup)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
