import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  ArrowRight, 
  BarChart3, 
  MessageSquare, 
  Building2, 
  Search,
  Users,
  TrendingUp,
  Shield,
  Heart,
  Star,
  Quote
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const LandingPage: React.FC = () => {
  const features = [
    {
      icon: BarChart3,
      title: 'Civic Transparency',
      description: 'Access real-time council budgets, spending data, and decision-making processes with interactive visualizations.',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: MessageSquare,
      title: 'Community Discussions',
      description: 'Engage in meaningful conversations about local issues, council meetings, and community initiatives.',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: Building2,
      title: 'Local Business Directory',
      description: 'Discover and support local businesses, read reviews, and connect with your community entrepreneurs.',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: Search,
      title: 'Intelligent Search',
      description: 'Find civic information quickly with AI-powered search that understands context and provides relevant results.',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Mitchell',
      role: 'Local Resident',
      content: 'StonecloughHub has completely changed how I stay informed about local government. I can easily track where my council tax goes and participate in community discussions.',
      avatar: '👩‍💼',
      rating: 5
    },
    {
      name: 'David Thompson',
      role: 'Business Owner',
      content: 'The business directory has helped my café connect with so many new customers. The community engagement features are fantastic for local entrepreneurs.',
      avatar: '👨‍🍳',
      rating: 5
    },
    {
      name: 'Emma Johnson',
      role: 'Community Volunteer',
      content: 'Finally, a platform where residents can have productive conversations about local issues. The discussion features promote real civic engagement.',
      avatar: '👩‍🎓',
      rating: 5
    }
  ];

  const stats = [
    { label: 'Active Users', value: '2,500+', icon: Users },
    { label: 'Civic Documents', value: '10,000+', icon: BarChart3 },
    { label: 'Local Businesses', value: '150+', icon: Building2 },
    { label: 'Community Posts', value: '5,000+', icon: MessageSquare }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Home className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">StonecloughHub</h1>
                <p className="text-xs text-slate-500">Civic Transparency</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link to="/business-directory" className="text-slate-600 hover:text-slate-900 font-medium">
                Business Directory
              </Link>
              <Link to="/auth">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link to="/auth">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left"
            >
              <div className="mb-6">
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                  🚀 Now Live for Stoneclough Community
                </Badge>
              </div>
              
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl">
                <span className="block">Connect with your</span>
                <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  local community
                </span>
              </h1>
              
              <p className="mt-6 text-lg text-slate-600 leading-relaxed">
                StonecloughHub brings transparency to local government, connects residents with businesses, 
                and fosters meaningful community discussions. Join thousands of engaged citizens building 
                a stronger Stoneclough together.
              </p>
              
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link to="/auth">
                  <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    Start Exploring
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/business-directory">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Browse Businesses
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mt-16 sm:mt-20 lg:mt-0 lg:col-span-6"
            >
              <div className="relative">
                {/* Dashboard Preview */}
                <div className="relative mx-auto w-full max-w-lg">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-2xl opacity-20 transform rotate-6"></div>
                  <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 border-b border-slate-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      </div>
                      <div className="text-sm font-medium text-slate-600">Civic Dashboard</div>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        {stats.map((stat, index) => (
                          <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + index * 0.1 }}
                            className="bg-slate-50 rounded-lg p-3"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <stat.icon className="h-4 w-4 text-blue-600" />
                              <div className="text-xs text-slate-600">{stat.label}</div>
                            </div>
                            <div className="text-lg font-bold text-slate-900">{stat.value}</div>
                          </motion.div>
                        ))}
                      </div>
                      <div className="h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                        <div className="text-sm text-slate-600">Live Civic Data Visualization</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl mb-4">
              Everything you need for civic engagement
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Powerful tools to stay informed, engaged, and connected with your local community
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 ${feature.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                      <feature.icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-3">{feature.title}</h3>
                    <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl mb-4">
              Loved by the Stoneclough community
            </h2>
            <p className="text-lg text-slate-600">
              See what residents and businesses are saying about StonecloughHub
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1 mb-4">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <Quote className="h-8 w-8 text-slate-300 mb-4" />
                    <p className="text-slate-600 mb-6 leading-relaxed">"{testimonial.content}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center text-2xl">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{testimonial.name}</div>
                        <div className="text-sm text-slate-600">{testimonial.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">
              Ready to engage with your community?
            </h2>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Join StonecloughHub today and become part of a more transparent, connected, and thriving local community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 font-semibold">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/business-directory">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                  Explore Directory
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Home className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">StonecloughHub</h3>
                  <p className="text-sm text-slate-400">Civic Transparency Platform</p>
                </div>
              </div>
              <p className="text-slate-400 mb-4 max-w-md">
                Empowering the Stoneclough community through transparency, engagement, and connection.
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <span className="text-sm">All systems operational</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Platform</h4>
              <ul className="space-y-2">
                <li><Link to="/auth" className="hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link to="/business-directory" className="hover:text-white transition-colors">Business Directory</Link></li>
                <li><Link to="/auth" className="hover:text-white transition-colors">Discussions</Link></li>
                <li><Link to="/auth" className="hover:text-white transition-colors">Search</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between">
            <p className="text-slate-400 text-sm">
              © 2024 StonecloughHub. All rights reserved.
            </p>
            <p className="text-slate-400 text-sm mt-2 md:mt-0">
              Made with <Heart className="inline h-4 w-4 text-red-400" /> for the Stoneclough community
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
