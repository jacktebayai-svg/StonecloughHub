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
  { href: "/", label: "Home", icon: Home, gradient: "from-blue-500 to-cyan-500" },
  { href: "/directory", label: "Directory", icon: Building2, gradient: "from-emerald-500 to-teal-500" },
  { href: "/forum", label: "Forum", icon: MessageSquare, gradient: "from-orange-500 to-red-500" },
  { href: "/blog", label: "Blog", icon: FileText, gradient: "from-indigo-500 to-purple-500" },
  { href: "/civic", label: "Civic", icon: Building, gradient: "from-blue-600 to-indigo-600" },
  { href: "/surveys", label: "Surveys", icon: BarChart3, gradient: "from-pink-500 to-rose-500" },
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

  const getActiveGradient = () => {
    const activeItem = navigationItems.find(item => isActive(item.href));
    return activeItem?.gradient || "from-blue-500 to-cyan-500";
  };

  return (
    <>
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="relative bg-white/90 backdrop-blur-lg border-b border-gray-200/50 shadow-sm z-40"
      >
        {/* Contained background gradient that only affects header */}
        <motion.div 
          className={`absolute inset-0 bg-gradient-to-r ${getActiveGradient()} opacity-5`}
          layout
          transition={{ duration: 0.6, ease: "easeInOut" }}
        />
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
                    <motion.div
                      className="relative"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {active && (
                        <motion.div
                          layoutId="activeTab"
                          className={`absolute inset-0 bg-gradient-to-r ${item.gradient} rounded-lg opacity-10`}
                          transition={{ duration: 0.3 }}
                        />
                      )}
                      <motion.div
                        className={`relative px-3 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                          active 
                            ? `text-transparent bg-gradient-to-r ${item.gradient} bg-clip-text font-semibold` 
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                      >
                        <IconComponent className={`h-4 w-4 ${active ? 'text-gray-700' : ''}`} />
                        <span className="text-sm font-medium">{item.label}</span>
                      </motion.div>
                      {active && (
                        <motion.div
                          layoutId="activeIndicator"
                          className={`absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r ${item.gradient} rounded-full`}
                          transition={{ duration: 0.3 }}
                        />
                      )}
                    </motion.div>
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