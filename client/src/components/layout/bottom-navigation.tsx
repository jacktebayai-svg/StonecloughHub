import { Link, useLocation } from "wouter";
import { Home, LayoutDashboard, Building2, MessageSquare, FileText, BarChart3, User, Building } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const navigationItems = [
  { href: "/", label: "Home", icon: Home, gradient: "from-blue-500 to-cyan-500" },
  { href: "/directory", label: "Directory", icon: Building2, gradient: "from-emerald-500 to-teal-500" },
  { href: "/forum", label: "Forum", icon: MessageSquare, gradient: "from-orange-500 to-red-500" },
  { href: "/surveys", label: "Surveys", icon: BarChart3, gradient: "from-pink-500 to-rose-500" },
  { href: "/profile", label: "Profile", icon: User, gradient: "from-purple-500 to-indigo-500" }
];

export function BottomNavigation() {
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();

  if (!isAuthenticated) {
    return null; // Don't render if not authenticated
  }

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200/50 md:hidden z-50 shadow-lg">
      <div className="flex justify-around h-16 items-center px-2">
        {navigationItems.map((item) => {
          const IconComponent = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link key={item.href} href={item.href}>
              <div className={`flex flex-col items-center text-xs transition-all duration-200 px-2 py-1 rounded-lg relative ${
                active 
                  ? 'transform -translate-y-1' 
                  : 'hover:transform hover:-translate-y-0.5'
              }`}>
                {active && (
                  <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-10 rounded-lg`} />
                )}
                <IconComponent className={`h-5 w-5 mb-1 transition-colors duration-200 relative ${
                  active 
                    ? `bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent` 
                    : 'text-gray-600'
                }`} />
                <span className={`font-medium transition-colors duration-200 relative ${
                  active 
                    ? `bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent text-[10px]` 
                    : 'text-gray-600 text-[10px]'
                }`}>
                  {item.label}
                </span>
                {active && (
                  <div className={`absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-gradient-to-r ${item.gradient} rounded-full`} />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
