import { Link } from "wouter";
import { Home, LayoutDashboard, Building2, MessageSquare, FileText, BarChart3, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function BottomNavigation() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return null; // Don't render if not authenticated
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-stoneclough-blue border-t border-gray-200 dark:border-gray-700 md:hidden z-50">
      <div className="flex justify-around h-16 items-center">
        <Link href="/">
          <a className="flex flex-col items-center text-xs text-stoneclough-blue dark:text-stoneclough-light hover:text-blue-600 dark:hover:text-blue-400">
            <Home className="h-6 w-6 mb-1" />
            Home
          </a>
        </Link>
        <Link href="/dashboard">
          <a className="flex flex-col items-center text-xs text-stoneclough-blue dark:text-stoneclough-light hover:text-blue-600 dark:hover:text-blue-400">
            <LayoutDashboard className="h-6 w-6 mb-1" />
            Dashboard
          </a>
        </Link>
        <Link href="/directory">
          <a className="flex flex-col items-center text-xs text-stoneclough-blue dark:text-stoneclough-light hover:text-blue-600 dark:hover:text-blue-400">
            <Building2 className="h-6 w-6 mb-1" />
            Directory
          </a>
        </Link>
        <Link href="/forum">
          <a className="flex flex-col items-center text-xs text-stoneclough-blue dark:text-stoneclough-light hover:text-blue-600 dark:hover:text-blue-400">
            <MessageSquare className="h-6 w-6 mb-1" />
            Forum
          </a>
        </Link>
        <Link href="/blog">
          <a className="flex flex-col items-center text-xs text-stoneclough-blue dark:text-stoneclough-light hover:text-blue-600 dark:hover:text-blue-400">
            <FileText className="h-6 w-6 mb-1" />
            Blog
          </a>
        </Link>
        <Link href="/surveys">
          <a className="flex flex-col items-center text-xs text-stoneclough-blue dark:text-stoneclough-light hover:text-blue-600 dark:hover:text-blue-400">
            <BarChart3 className="h-6 w-6 mb-1" />
            Surveys
          </a>
        </Link>
        <Link href="/profile">
          <a className="flex flex-col items-center text-xs text-stoneclough-blue dark:text-stoneclough-light hover:text-blue-600 dark:hover:text-blue-400">
            <User className="h-6 w-6 mb-1" />
            Profile
          </a>
        </Link>
      </div>
    </nav>
  );
}