import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { 
  Home, 
  Building2, 
  MessageSquare, 
  FileText, 
  BarChart3, 
  Users, 
  Search,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Calendar,
  MapPin,
  ChevronDown,
  Zap,
  Shield,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ElementType;
  description?: string;
  badge?: string;
  children?: {
    name: string;
    href: string;
    description: string;
    icon?: React.ElementType;
  }[];
}

export function ModernHeader() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationCount, setNotificationCount] = useState(3);

  const navigation: NavigationItem[] = [
    { 
      name: 'Home', 
      href: '/', 
      icon: Home,
      description: 'Welcome to Stoneclough Hub'
    },
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: BarChart3,
      description: 'Your civic dashboard',
      children: [
        {
          name: 'Overview',
          href: '/dashboard',
          description: 'Key metrics and insights',
          icon: BarChart3
        },
        {
          name: 'Civic Data',
          href: '/civic',
          description: 'Comprehensive civic analytics',
          icon: Shield
        },
        {
          name: 'Performance',
          href: '/dashboard/performance',
          description: 'Service performance metrics',
          icon: Zap
        }
      ]
    },
    { 
      name: 'Directory', 
      href: '/directory', 
      icon: Building2,
      description: 'Local business directory',
      children: [
        {
          name: 'All Businesses',
          href: '/directory',
          description: 'Browse all local businesses',
          icon: Building2
        },
        {
          name: 'Featured',
          href: '/directory?featured=true',
          description: 'Featured local businesses',
          icon: Heart
        },
        {
          name: 'Add Business',
          href: '/my-business',
          description: 'List your business',
          icon: Building2
        }
      ]
    },
    { 
      name: 'Forum', 
      href: '/forum', 
      icon: MessageSquare,
      description: 'Community discussions',
      children: [
        {
          name: 'Recent Discussions',
          href: '/forum',
          description: 'Latest community discussions',
          icon: MessageSquare
        },
        {
          name: 'Council Meetings',
          href: '/forum/council-meetings',
          description: 'Meeting discussions',
          icon: Calendar
        },
        {
          name: 'Local Issues',
          href: '/forum/local-issues',
          description: 'Community issues and solutions',
          icon: MapPin
        }
      ]
    },
    { 
      name: 'Blog', 
      href: '/blog', 
      icon: FileText,
      description: 'Local news and updates',
      badge: 'New'
    },
    { 
      name: 'Services', 
      href: '/services', 
      icon: Users,
      description: 'Local government services'
    },
  ];

  const isActivePage = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const getUserInitials = (user: any) => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  const getUserRole = (user: any) => {
    return user?.user_metadata?.role || 'resident';
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'moderator':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'councillor':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'business':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results page
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsMobileMenuOpen(false);
    };

    if (isMobileMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isMobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-3">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 p-2 shadow-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-white" />
              </motion.div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-slate-900">Stoneclough Hub</h1>
                <p className="text-xs text-slate-500">Civic Transparency Platform</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            <NavigationMenu>
              <NavigationMenuList>
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = isActivePage(item.href);
                  
                  if (item.children) {
                    return (
                      <NavigationMenuItem key={item.name}>
                        <NavigationMenuTrigger
                          className={`flex items-center space-x-2 ${
                            isActive 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.name}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="ml-1 text-xs">
                              {item.badge}
                            </Badge>
                          )}
                        </NavigationMenuTrigger>
                        <NavigationMenuContent>
                          <div className="grid gap-3 p-4 w-80">
                            <div className="mb-2">
                              <h4 className="text-sm font-medium leading-none mb-1">
                                {item.name}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {item.description}
                              </p>
                            </div>
                            {item.children.map((child) => {
                              const ChildIcon = child.icon;
                              return (
                                <NavigationMenuLink key={child.name} asChild>
                                  <Link
                                    to={child.href}
                                    className="flex items-center space-x-3 rounded-md p-3 hover:bg-slate-100 transition-colors"
                                  >
                                    {ChildIcon && <ChildIcon className="h-4 w-4 text-slate-500" />}
                                    <div>
                                      <div className="text-sm font-medium">{child.name}</div>
                                      <div className="text-xs text-slate-500">{child.description}</div>
                                    </div>
                                  </Link>
                                </NavigationMenuLink>
                              );
                            })}
                          </div>
                        </NavigationMenuContent>
                      </NavigationMenuItem>
                    );
                  }

                  return (
                    <NavigationMenuItem key={item.name}>
                      <NavigationMenuLink asChild>
                        <Link
                          to={item.href}
                          className={`flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-blue-100 text-blue-700'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.name}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="ml-1 text-xs">
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  );
                })}
              </NavigationMenuList>
            </NavigationMenu>
          </nav>

          {/* Search and Actions */}
          <div className="flex items-center space-x-3">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="search"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10 pr-4 h-9 bg-slate-50 border-0 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </form>

            {/* Notifications */}
            {user && (
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
              </Button>
            )}

            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.avatar_url} alt={user.email} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 text-blue-700 text-sm font-medium">
                        {getUserInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar_url} alt={user.email} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 text-blue-700">
                        {getUserInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.user_metadata?.full_name || user.email}
                      </p>
                      <p className="text-xs leading-none text-slate-500">
                        {user.email}
                      </p>
                      <Badge 
                        variant="outline" 
                        className={`text-xs w-fit ${getRoleBadgeColor(getUserRole(user))}`}
                      >
                        {getUserRole(user)}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Profile Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/my-business" className="flex items-center">
                      <Building2 className="mr-2 h-4 w-4" />
                      <span>My Business</span>
                    </Link>
                  </DropdownMenuItem>
                  {['admin', 'moderator'].includes(getUserRole(user)) && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center">
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Admin Panel</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => logout()}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/auth">
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth?mode=register">
                  <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="lg:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMobileMenuOpen(!isMobileMenuOpen);
                }}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden border-t border-slate-200 bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-2 pt-4 pb-4 space-y-2">
                {/* Mobile Search */}
                <form onSubmit={handleSearch} className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="search"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10"
                    />
                  </div>
                </form>

                {/* Mobile Navigation Items */}
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = isActivePage(item.href);
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 rounded-md px-3 py-3 text-base font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.name}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

export default ModernHeader;
