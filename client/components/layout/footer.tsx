import { Link } from 'react-router-dom';
import { Heart, MapPin, Mail, Phone } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <img
                src="/Logo.svg"
                alt="The Stoneclough Hub"
                className="h-10 w-10 drop-shadow-sm"
              />
              <div>
                <h3 className="text-xl font-bold text-white">Stoneclough Hub</h3>
                <p className="text-sm text-slate-400">Civic Transparency Platform</p>
              </div>
            </div>
            <p className="text-slate-400 mb-4 max-w-md">
              Empowering the Stoneclough community through transparency, engagement, and connection.
              Bringing local government data and community resources together.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-slate-400" />
              <span>Stoneclough, Bolton, Greater Manchester</span>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Platform</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/directory" className="hover:text-white transition-colors">
                  Business Directory
                </Link>
              </li>
              <li>
                <Link to="/forum" className="hover:text-white transition-colors">
                  Community Forum
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-white transition-colors">
                  Local News
                </Link>
              </li>
              <li>
                <Link to="/civic" className="hover:text-white transition-colors">
                  Civic Data
                </Link>
              </li>
              <li>
                <Link to="/surveys" className="hover:text-white transition-colors">
                  Surveys & Polls
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Data Sources
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-slate-800 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between">
          <p className="text-slate-400 text-sm">
            © {currentYear} The Stoneclough Hub. All rights reserved.
          </p>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <p className="text-slate-400 text-sm">
              Data sourced from Bolton Council under Open Government License
            </p>
            <div className="flex items-center space-x-1 text-sm">
              <span className="text-slate-400">Made with</span>
              <Heart className="inline h-4 w-4 text-red-400" />
              <span className="text-slate-400">for Stoneclough</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
