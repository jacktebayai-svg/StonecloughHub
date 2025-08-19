import { MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-stoneclough-blue text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <MapPin className="h-6 w-6" />
              <span className="text-lg font-bold">The Stoneclough Hub</span>
            </div>
            <p className="text-stoneclough-light text-sm leading-relaxed">
              The definitive community platform for Stoneclough, providing transparent access to local government data, 
              business directory services, and community engagement tools.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-stoneclough-gray-blue uppercase tracking-wider mb-4">
              Community
            </h3>
            <ul className="space-y-2">
              <li><span className="text-sm text-stoneclough-light hover:text-stoneclough-light cursor-pointer">Forum</span></li>
              <li><span className="text-sm text-stoneclough-light hover:text-stoneclough-light cursor-pointer">Blog</span></li>
              <li><span className="text-sm text-stoneclough-light hover:text-stoneclough-light cursor-pointer">Surveys</span></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-stoneclough-gray-blue uppercase tracking-wider mb-4">
              Resources
            </h3>
            <ul className="space-y-2">
              <li><span className="text-sm text-stoneclough-light hover:text-stoneclough-light cursor-pointer">Data Dashboard</span></li>
              <li><span className="text-sm text-stoneclough-light hover:text-stoneclough-light cursor-pointer">Business Directory</span></li>
              <li><span className="text-sm text-stoneclough-light hover:text-stoneclough-light cursor-pointer">Council Data</span></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8">
          <p className="text-center text-sm text-stoneclough-gray-blue">
            &copy; 2025 The Stoneclough Hub. Data sourced from Bolton Council under Open Government License.
          </p>
        </div>
      </div>
    </footer>
  );
}