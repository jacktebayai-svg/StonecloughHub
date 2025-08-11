import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-hub-dark text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <h3 className="text-xl font-bold mb-4">The Stoneclough Hub</h3>
            <p className="text-slate-300 mb-6 leading-relaxed">
              Your community's source for transparent local data, business directory, and community engagement.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-slate-300 hover:text-white transition-colors">
                <i className="fab fa-facebook text-xl"></i>
              </a>
              <a href="#" className="text-slate-300 hover:text-white transition-colors">
                <i className="fab fa-twitter text-xl"></i>
              </a>
              <a href="#" className="text-slate-300 hover:text-white transition-colors">
                <i className="fab fa-linkedin text-xl"></i>
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Community</h4>
            <nav className="space-y-2">
              <Link href="/dashboard" className="block text-slate-300 hover:text-white transition-colors">
                Data Dashboard
              </Link>
              <Link href="/forum" className="block text-slate-300 hover:text-white transition-colors">
                Community Forum
              </Link>
              <Link href="/surveys" className="block text-slate-300 hover:text-white transition-colors">
                Surveys
              </Link>
              <Link href="/blog" className="block text-slate-300 hover:text-white transition-colors">
                Blog
              </Link>
            </nav>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Business</h4>
            <nav className="space-y-2">
              <Link href="/directory" className="block text-slate-300 hover:text-white transition-colors">
                Business Directory
              </Link>
              <a href="#" className="block text-slate-300 hover:text-white transition-colors">
                Add Your Business
              </a>
              <a href="#" className="block text-slate-300 hover:text-white transition-colors">
                Pricing Plans
              </a>
              <a href="#" className="block text-slate-300 hover:text-white transition-colors">
                Success Stories
              </a>
            </nav>
          </div>
          <div>
            <h4 className="font-semibold mb-4">About</h4>
            <nav className="space-y-2">
              <a href="#" className="block text-slate-300 hover:text-white transition-colors">
                Our Mission
              </a>
              <a href="#" className="block text-slate-300 hover:text-white transition-colors">
                Contact Us
              </a>
              <a href="#" className="block text-slate-300 hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="block text-slate-300 hover:text-white transition-colors">
                Terms of Service
              </a>
            </nav>
          </div>
        </div>
        <div className="border-t border-slate-700 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-slate-300 text-sm">
            © 2024 The Stoneclough Hub. All rights reserved.
          </p>
          <p className="text-slate-300 text-sm mt-4 md:mt-0">
            Data sourced from <span className="font-medium">data.bolton.gov.uk</span> under Open Government Licence
          </p>
        </div>
      </div>
    </footer>
  );
}
