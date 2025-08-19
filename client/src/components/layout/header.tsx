import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/auth/AuthModal";
import { User, LogOut, Settings } from "lucide-react";

export function Header() {
  const { user, userProfile, isAuthenticated, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const handleLogout = async () => {
    await signOut();
  };

  const handleSignIn = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  const handleSignUp = () => {
    setAuthMode('register');
    setShowAuthModal(true);
  };

  return (
    <>
      <header className="bg-stoneclough-light text-stoneclough-blue shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <div className="flex items-center space-x-2 cursor-pointer">
                <img src="/Logo.svg" alt="The Stoneclough Hub Logo" className="h-16 w-16" />
                <span className="text-xl font-bold">
                  The Stoneclough Hub
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex space-x-8">
              <Link href="/dashboard">
                <span className="hover:text-stoneclough-gray-blue cursor-pointer">
                  Dashboard
                </span>
              </Link>
              <Link href="/directory">
                <span className="hover:text-stoneclough-gray-blue cursor-pointer">
                  Directory
                </span>
              </Link>
              <Link href="/forum">
                <span className="hover:text-stoneclough-gray-blue cursor-pointer">
                  Forum
                </span>
              </Link>
              <Link href="/blog">
                <span className="hover:text-stoneclough-gray-blue cursor-pointer">
                  Blog
                </span>
              </Link>
              <Link href="/surveys">
                <span className="hover:text-stoneclough-gray-blue cursor-pointer">
                  Surveys
                </span>
              </Link>
              {isAuthenticated && (
                <Link href="/profile">
                  <span className="hover:text-stoneclough-gray-blue cursor-pointer">
                    Profile
                  </span>
                </Link>
              )}
              {userProfile?.role === 'admin' && (
                <Link href="/admin">
                  <span className="hover:text-stoneclough-gray-blue cursor-pointer">
                    Admin
                  </span>
                </Link>
              )}
            </nav>

            {isAuthenticated && user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium">
                  {user.user_metadata?.full_name || user.email}
                </span>
                <Button onClick={handleLogout} variant="outline" size="sm">
                  <LogOut className="w-4 h-4 mr-2" />
                  Log out
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button onClick={handleSignIn} variant="outline" size="sm">
                  Sign In
                </Button>
                <Button onClick={handleSignUp} className="bg-stoneclough-blue text-stoneclough-light" size="sm">
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </>
  );
}