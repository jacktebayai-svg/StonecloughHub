import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <Link href="/">
                <h1 className="text-xl font-bold text-hub-blue cursor-pointer">The Stoneclough Hub</h1>
              </Link>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="/dashboard" className="text-hub-gray hover:text-hub-blue font-medium transition-colors">
                Data Dashboard
              </Link>
              <Link href="/directory" className="text-hub-gray hover:text-hub-blue font-medium transition-colors">
                Business Directory
              </Link>
              <Link href="/forum" className="text-hub-gray hover:text-hub-blue font-medium transition-colors">
                Community Forum
              </Link>
              <Link href="/blog" className="text-hub-gray hover:text-hub-blue font-medium transition-colors">
                Blog
              </Link>
              <Link href="/surveys" className="text-hub-gray hover:text-hub-blue font-medium transition-colors">
                Surveys
              </Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <Button className="bg-hub-blue hover:bg-hub-dark-blue text-white">
              List Your Business
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden text-hub-gray hover:text-hub-blue">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
