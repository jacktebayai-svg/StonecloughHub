import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/auth/AuthModal";
import { motion } from "framer-motion";
import { 
  User, 
  LogOut, 
  Menu, 
  X, 
  Home, 
  Building2, 
  MessageSquare, 
  FileText, 
  BarChart3, 
  Building,
  Shield
} from "lucide-react";

const navigationItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/directory", label: "Directory", icon: Building2 },
  { href: "/forum", label: "Forum", icon: MessageSquare },
  { href: "/blog", label: "Blog", icon: FileText },
  { href: "/civic", label: "Civic", icon: Building },
  { href: "/surveys", label: "Surveys", icon: BarChart3 },
];

export function Header() {
  const { user, userProfile, isAuthenticated, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();

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

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-white/90 backdrop-blur-lg border-b border-gray-200/50 shadow-sm z-40"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/">
              <div className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity">
                <img src="/Logo.svg" alt="The Stoneclough Hub Logo" className="h-10 w-10" />
                <div>
                  <h1 className="text-xl font-bold text-gray-800">
                    The Stoneclough Hub
                  </h1>
                  <p className="text-xs text-gray-500">Civic Transparency Platform</p>
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navigationItems.map((item) => {
                const IconComponent = item.icon;
                const active = isActive(item.href);
                
                return (
                  <Link key={item.href} href={item.href}>
                    <div className={`px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                      active 
                        ? 'bg-blue-100 text-blue-700 font-semibold' 
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}>
                      <IconComponent className="h-4 w-4" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
              
              {/* Profile & Admin Links */}
              {isAuthenticated && (
                <Link href="/profile">
                  <div className={`px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 ml-2 ${
                    isActive('/profile') 
                      ? 'bg-gray-100 text-gray-800 font-semibold' 
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}>
                    <User className="h-4 w-4" />
                    <span className="text-sm font-medium">Profile</span>
                  </div>
                </Link>
              )}
              
              {userProfile?.role === 'admin' && (
                <Link href="/admin">
                  <div className={`px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                    isActive('/admin') 
                      ? 'bg-orange-100 text-orange-700 font-semibold' 
                      : 'text-orange-600 hover:text-orange-700 hover:bg-orange-50'
                  }`}>
                    <Shield className="h-4 w-4" />
                    <span className="text-sm font-medium">Admin</span>
                  </div>
                </Link>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>

            {/* Auth Section */}
            <div className="hidden lg:flex items-center space-x-3">
              {isAuthenticated && user ? (
                <>
                  <span className="text-sm font-medium text-gray-700">
                    {user.user_metadata?.full_name || user.email?.split('@')[0]}
                  </span>
                  <Button 
                    onClick={handleLogout} 
                    variant="outline" 
                    size="sm"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button 
                    onClick={handleSignIn} 
                    variant="outline" 
                    size="sm"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Sign In
                  </Button>
                  <Button 
                    onClick={handleSignUp} 
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200/50 bg-white/95 backdrop-blur-lg">
            <div className="px-4 py-4 space-y-2">
              {navigationItems.map((item) => {
                const IconComponent = item.icon;
                const active = isActive(item.href);
                
                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        active 
                          ? 'bg-blue-100 text-blue-700 font-semibold' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <IconComponent className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
              
              {/* Mobile Auth Section */}
              {isAuthenticated && user ? (
                <div className="pt-4 border-t border-gray-200 space-y-2">
                  <div className="px-4 py-2 text-sm text-gray-600">
                    {user.user_metadata?.full_name || user.email}
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="pt-4 border-t border-gray-200 space-y-2">
                  <button
                    onClick={() => {
                      handleSignIn();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center py-3 rounded-lg text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      handleSignUp();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center py-3 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.header>
      
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </>
  );
}