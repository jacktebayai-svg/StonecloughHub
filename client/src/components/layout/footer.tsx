import { MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-stoneclough-blue-800 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <img src="/Logo.svg" alt="The Stoneclough Hub" className="h-10 w-10 drop-shadow-sm filter brightness-0 invert" />
              <div>
                <h3 className="text-xl font-bold text-white">The Stoneclough Hub</h3>
                <p className="text-stoneclough-blue-200 text-sm">Civic Transparency Platform</p>
              </div>
            </div>
            <p className="text-stoneclough-blue-200 text-sm leading-relaxed max-w-md">
              The definitive community platform for Stoneclough, providing transparent access to local government data, 
              business directory services, and community engagement tools.
            </p>
            <div className="flex items-center gap-2 text-sm mt-4">
              <MapPin className="h-4 w-4 text-stoneclough-blue-300" />
              <span className="text-stoneclough-blue-200">Stoneclough, Bolton, Greater Manchester</span>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Community
            </h4>
            <ul className="space-y-2">
              <li>
                <span className="text-sm text-stoneclough-blue-200 hover:text-white cursor-pointer transition-colors">
                  Forum
                </span>
              </li>
              <li>
                <span className="text-sm text-stoneclough-blue-200 hover:text-white cursor-pointer transition-colors">
                  Blog
                </span>
              </li>
              <li>
                <span className="text-sm text-stoneclough-blue-200 hover:text-white cursor-pointer transition-colors">
                  Surveys
                </span>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Resources
            </h4>
            <ul className="space-y-2">
              <li>
                <span className="text-sm text-stoneclough-blue-200 hover:text-white cursor-pointer transition-colors">
                  Data Dashboard
                </span>
              </li>
              <li>
                <span className="text-sm text-stoneclough-blue-200 hover:text-white cursor-pointer transition-colors">
                  Business Directory
                </span>
              </li>
              <li>
                <span className="text-sm text-stoneclough-blue-200 hover:text-white cursor-pointer transition-colors">
                  Council Data
                </span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-stoneclough-blue-700 mt-8 pt-8">
          <p className="text-center text-sm text-stoneclough-blue-200">
            &copy; 2025 The Stoneclough Hub. Data sourced from Bolton Council under Open Government License.
          </p>
        </div>
      </div>
    </footer>
  );
}