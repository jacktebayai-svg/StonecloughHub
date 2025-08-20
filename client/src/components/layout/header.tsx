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
      <header className="bg-white border-b border-stoneclough-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <div className="flex items-center space-x-3 cursor-pointer">
                <img src="/Logo.svg" alt="The Stoneclough Hub Logo" className="h-10 w-10 drop-shadow-sm" />
                <div>
                  <h1 className="text-xl font-bold text-stoneclough-blue-800">
                    The Stoneclough Hub
                  </h1>
                  <p className="text-xs text-stoneclough-gray-600">Civic Transparency Platform</p>
                </div>
              </div>
            </Link>

            <nav className="hidden md:flex items-center space-x-1">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-stoneclough-gray-700 hover:text-stoneclough-blue-800 hover:bg-stoneclough-blue-50">
                  Dashboard
                </Button>
              </Link>
              <Link href="/directory">
                <Button variant="ghost" size="sm" className="text-stoneclough-gray-700 hover:text-stoneclough-blue-800 hover:bg-stoneclough-blue-50">
                  Directory
                </Button>
              </Link>
              <Link href="/forum">
                <Button variant="ghost" size="sm" className="text-stoneclough-gray-700 hover:text-stoneclough-blue-800 hover:bg-stoneclough-blue-50">
                  Forum
                </Button>
              </Link>
              <Link href="/blog">
                <Button variant="ghost" size="sm" className="text-stoneclough-gray-700 hover:text-stoneclough-blue-800 hover:bg-stoneclough-blue-50">
                  Blog
                </Button>
              </Link>
              <Link href="/surveys">
                <Button variant="ghost" size="sm" className="text-stoneclough-gray-700 hover:text-stoneclough-blue-800 hover:bg-stoneclough-blue-50">
                  Surveys
                </Button>
              </Link>
              {isAuthenticated && (
                <Link href="/profile">
                  <Button variant="ghost" size="sm" className="text-stoneclough-gray-700 hover:text-stoneclough-blue-800 hover:bg-stoneclough-blue-50">
                    Profile
                  </Button>
                </Link>
              )}
              {userProfile?.role === 'admin' && (
                <Link href="/admin">
                  <Button variant="ghost" size="sm" className="text-stoneclough-accent-orange hover:text-stoneclough-accent-orange hover:bg-orange-50">
                    Admin
                  </Button>
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