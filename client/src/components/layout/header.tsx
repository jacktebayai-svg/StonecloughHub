import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

export function Header() {
  const { user, isAuthenticated } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer">
              <MapPin className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                The Stoneclough Hub
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex space-x-8">
            <Link href="/dashboard">
              <span className="text-gray-700 dark:text-gray-300 hover:text-blue-600 cursor-pointer">
                Dashboard
              </span>
            </Link>
            <Link href="/directory">
              <span className="text-gray-700 dark:text-gray-300 hover:text-blue-600 cursor-pointer">
                Directory
              </span>
            </Link>
            <Link href="/forum">
              <span className="text-gray-700 dark:text-gray-300 hover:text-blue-600 cursor-pointer">
                Forum
              </span>
            </Link>
            <Link href="/blog">
              <span className="text-gray-700 dark:text-gray-300 hover:text-blue-600 cursor-pointer">
                Blog
              </span>
            </Link>
            <Link href="/surveys">
              <span className="text-gray-700 dark:text-gray-300 hover:text-blue-600 cursor-pointer">
                Surveys
              </span>
            </Link>
            {user?.role === 'admin' && (
              <Link href="/admin">
                <span className="text-gray-700 dark:text-gray-300 hover:text-blue-600 cursor-pointer">
                  Admin
                </span>
              </Link>
            )}
          </nav>

          {isAuthenticated && user ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {user.firstName || user.email}
              </span>
              <Button onClick={handleLogout} variant="outline">
                Log out
              </Button>
            </div>
          ) : (
            <Button onClick={() => window.location.href = "/api/login"}>
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}