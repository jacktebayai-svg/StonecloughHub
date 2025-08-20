import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/auth/AuthModal";
import { motion } from "framer-motion";
import { 
  User, 
  LogOut, 
  Settings, 
  Menu, 
  X, 
  Home, 
  LayoutDashboard, 
  Building2, 
  MessageSquare, 
  FileText, 
  BarChart3, 
  Building,
  Users,
  Shield
} from "lucide-react";

const navigationItems = [
  { href: "/", label: "Home", icon: Home, gradient: "from-blue-500 to-cyan-500" },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, gradient: "from-purple-500 to-pink-500" },
  { href: "/directory", label: "Directory", icon: Building2, gradient: "from-emerald-500 to-teal-500" },
  { href: "/forum", label: "Forum", icon: MessageSquare, gradient: "from-orange-500 to-red-500" },
  { href: "/blog", label: "Blog", icon: FileText, gradient: "from-indigo-500 to-purple-500" },
  { href: "/surveys", label: "Surveys", icon: BarChart3, gradient: "from-pink-500 to-rose-500" },
  { href: "/civic", label: "Civic", icon: Building, gradient: "from-blue-600 to-indigo-600" },
  { href: "/civic-engagement", label: "Engagement", icon: Users, gradient: "from-green-500 to-emerald-500" },
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
        className="relative bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-lg z-40"
      >
        {/* Animated background gradient */}
        <motion.div 
          className={`absolute inset-0 bg-gradient-to-r ${getActiveGradient()} opacity-5`}
          layout
          transition={{ duration: 0.6, ease: "easeInOut" }}
        />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/">
              <motion.div 
                className="flex items-center space-x-3 cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="relative"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <img src="/Logo.svg" alt="The Stoneclough Hub Logo" className="h-10 w-10 drop-shadow-sm" />
                  <motion.div 
                    className={`absolute inset-0 bg-gradient-to-r ${getActiveGradient()} rounded-full opacity-20 blur-sm`}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    The Stoneclough Hub
                  </h1>
                  <p className="text-xs text-gray-500">Civic Transparency Platform</p>
                </div>
              </motion.div>
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
                  <motion.div
                    className="relative ml-2"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className={`px-3 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                      isActive('/profile') 
                        ? 'text-transparent bg-gradient-to-r from-gray-600 to-gray-800 bg-clip-text font-semibold' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}>
                      <User className="h-4 w-4" />
                      <span className="text-sm font-medium">Profile</span>
                    </div>
                  </motion.div>
                </Link>
              )}
              
              {userProfile?.role === 'admin' && (
                <Link href="/admin">
                  <motion.div
                    className="relative"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className={`px-3 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                      isActive('/admin') 
                        ? 'text-transparent bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text font-semibold' 
                        : 'text-orange-600 hover:text-orange-700'
                    }`}>
                      <Shield className="h-4 w-4" />
                      <span className="text-sm font-medium">Admin</span>
                    </div>
                  </motion.div>
                </Link>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <motion.button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                whileTap={{ scale: 0.95 }}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </motion.button>
            </div>

            {/* Auth Section */}
            <div className="hidden lg:flex items-center space-x-3">
              {isAuthenticated && user ? (
                <>
                  <span className="text-sm font-medium text-gray-700">
                    {user.user_metadata?.full_name || user.email?.split('@')[0]}
                  </span>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      onClick={handleLogout} 
                      variant="outline" 
                      size="sm"
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </motion.div>
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      onClick={handleSignIn} 
                      variant="outline" 
                      size="sm"
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Sign In
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      onClick={handleSignUp} 
                      size="sm"
                      className={`bg-gradient-to-r ${getActiveGradient()} text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200`}
                    >
                      Sign Up
                    </Button>
                  </motion.div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <motion.div
          initial={false}
          animate={{ height: mobileMenuOpen ? 'auto' : 0, opacity: mobileMenuOpen ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="lg:hidden overflow-hidden bg-white/95 backdrop-blur-lg border-t border-gray-200/50"
        >
          <div className="px-4 py-4 space-y-2">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      active 
                        ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg` 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <IconComponent className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </motion.div>
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
                  className={`w-full flex items-center justify-center py-3 rounded-lg text-white bg-gradient-to-r ${getActiveGradient()} shadow-lg transition-all duration-200`}
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.header>
      
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </>
  );
}