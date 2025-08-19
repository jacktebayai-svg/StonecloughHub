import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a mock Supabase client if environment variables are missing
let supabase: any;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not found. Using mock authentication system.');
  
  // Mock session storage
  let mockSession: any = null;
  const listeners: Array<(event: string, session: any) => void> = [];
  
  // Create a mock client that simulates Supabase behavior
  supabase = {
    auth: {
      signInWithPassword: async (credentials: { email: string; password: string }) => {
        try {
          const response = await fetch('/api/auth/signin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
          });
          
          const data = await response.json();
          
          if (response.ok) {
            mockSession = data.session;
            localStorage.setItem('mock-session', JSON.stringify(mockSession));
            
            // Notify listeners
            listeners.forEach(callback => callback('SIGNED_IN', mockSession));
            
            // Trigger custom event for the main app
            window.dispatchEvent(new CustomEvent('auth-change'));
            
            return { data: { user: data.user, session: data.session }, error: null };
          } else {
            return { data: { user: null, session: null }, error: data.error };
          }
        } catch (error) {
          return { data: { user: null, session: null }, error: { message: 'Network error' } };
        }
      },
      
      signUp: async (credentials: { email: string; password: string }) => {
        try {
          const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
          });
          
          const data = await response.json();
          
          if (response.ok) {
            return { data: { user: data.user, session: data.session }, error: null };
          } else {
            return { data: { user: null, session: null }, error: data.error };
          }
        } catch (error) {
          return { data: { user: null, session: null }, error: { message: 'Network error' } };
        }
      },
      
      signOut: async () => {
        mockSession = null;
        localStorage.removeItem('mock-session');
        listeners.forEach(callback => callback('SIGNED_OUT', null));
        return { error: null };
      },
      
      getSession: () => {
        // Try to restore session from localStorage
        if (!mockSession) {
          const stored = localStorage.getItem('mock-session');
          if (stored) {
            mockSession = JSON.parse(stored);
          }
        }
        return Promise.resolve({ data: { session: mockSession }, error: null });
      },
      
      onAuthStateChange: (callback: (event: string, session: any) => void) => {
        listeners.push(callback);
        // Immediately call with current session
        setTimeout(() => callback('INITIAL_SESSION', mockSession), 0);
        return { 
          data: { 
            subscription: { 
              unsubscribe: () => {
                const index = listeners.indexOf(callback);
                if (index > -1) listeners.splice(index, 1);
              } 
            } 
          } 
        };
      }
    },
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ data: null, error: null })
    })
  };
} else {
  // Client-side Supabase client for authentication and public operations
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
}

export { supabase };
export default supabase;
