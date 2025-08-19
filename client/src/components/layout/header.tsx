import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export function Header() {
  const { user, isAuthenticated } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
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
            {user?.role === 'admin' && (
              <Link href="/admin">
                <span className="hover:text-stoneclough-gray-blue cursor-pointer">
                  Admin
                </span>
              </Link>
            )}
          </nav>

          {isAuthenticated && user ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm">
                {user.firstName || user.email}
              </span>
              <Button onClick={handleLogout} variant="outline">
                Log out
              </Button>
            </div>
          ) : (
            <Button onClick={() => window.location.href = "/api/login"} className="bg-stoneclough-blue text-stoneclough-light">
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}