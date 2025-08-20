import { useState, useCallback } from "react";
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
  { href: "/", label: "Home", icon: Home, gradient: "from-stoneclough-blue-600 to-stoneclough-blue-800" },
  { href: "/directory", label: "Directory", icon: Building2, gradient: "from-community-success to-stoneclough-accent-green" },
  { href: "/forum", label: "Forum", icon: MessageSquare, gradient: "from-community-warning to-stoneclough-accent-orange" },
  { href: "/blog", label: "Blog", icon: FileText, gradient: "from-stoneclough-blue-700 to-stoneclough-blue-900" },
  { href: "/surveys", label: "Surveys", icon: BarChart3, gradient: "from-stoneclough-gray-600 to-stoneclough-gray-800" },
];

export function Header() {
  const { user, userProfile, isAuthenticated, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

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
    // Show as active if it's the current location OR if it's pending navigation
    if (path === pendingNavigation) return true;
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  const handleNavigation = useCallback((path: string) => {
    setPendingNavigation(path);
    // Clear pending state after a short delay
    setTimeout(() => setPendingNavigation(null), 500);
  }, []);

  const getActiveGradient = () => {
    const activeItem = navigationItems.find(item => isActive(item.href));
    return activeItem?.gradient || "from-stoneclough-blue-600 to-stoneclough-blue-800";
  };

  return (
    <>
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="glass border-b border-border shadow-sm z-40"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/">
              <div className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity">
                <div className="h-10 w-10 rounded-lg gradient-community flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">H</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-brand">
                    Community Hub
                  </h1>
                  <p className="text-xs text-muted-foreground">Your Local Community Platform</p>
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
                          className={`absolute inset-0 bg-gradient-to-r ${item.gradient} rounded-lg`}
                          transition={{ duration: 0.3 }}
                        />
                      )}
                      <motion.div
                        className="relative px-3 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 group-hover:bg-muted"
                      >
                        <IconComponent className={`h-4 w-4 transition-colors duration-200 ${
                          active 
                            ? 'text-white' 
                            : 'text-muted-foreground group-hover:text-foreground'
                        }`} />
                        <span className={`text-sm font-medium transition-colors duration-200 ${
                          active 
                            ? 'font-bold text-white' 
                            : 'text-muted-foreground group-hover:text-foreground'
                        }`}>
                          {item.label}
                        </span>
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
                      ? 'bg-muted text-foreground font-semibold' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
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
                      ? 'bg-community-warning/10 text-community-warning font-semibold' 
                      : 'text-community-warning hover:text-community-warning/80 hover:bg-community-warning/5'
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
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>

            {/* Auth Section */}
            <div className="hidden lg:flex items-center space-x-3">
              {isAuthenticated && user ? (
                <>
                  <span className="text-sm font-medium text-foreground">
                    {user.user_metadata?.full_name || user.email?.split('@')[0]}
                  </span>
                  <Button 
                    onClick={handleLogout} 
                    variant="outline" 
                    size="sm"
                    className="border-border text-foreground hover:bg-muted"
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
                    className="border-border text-foreground hover:bg-muted"
                  >
                    Sign In
                  </Button>
                  <Button 
                    onClick={handleSignUp} 
                    size="sm"
                    className="bg-brand hover:bg-brand/90 text-brand-light"
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
          <div className="lg:hidden border-t border-border glass">
            <div className="px-4 py-4 space-y-2">
              {navigationItems.map((item) => {
                const IconComponent = item.icon;
                const active = isActive(item.href);
                
                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        active 
                          ? 'bg-accent/10 text-accent font-semibold' 
                          : 'text-muted-foreground hover:bg-muted'
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
                <div className="pt-4 border-t border-border space-y-2">
                  <div className="px-4 py-2 text-sm text-muted-foreground">
                    {user.user_metadata?.full_name || user.email}
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="pt-4 border-t border-border space-y-2">
                  <button
                    onClick={() => {
                      handleSignIn();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center py-3 rounded-lg text-foreground border border-border hover:bg-muted transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      handleSignUp();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center py-3 rounded-lg text-brand-light bg-brand hover:bg-brand/90 transition-colors"
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