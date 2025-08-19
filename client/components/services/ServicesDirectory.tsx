import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  Clock, 
  MapPin, 
  ExternalLink,
  Star,
  CheckCircle,
  AlertCircle,
  Calendar,
  FileText,
  Users,
  Home,
  Car,
  Leaf,
  Heart,
  Shield,
  Briefcase,
  GraduationCap,
  Building,
  Zap,
  Globe,
  ChevronRight,
  Info,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { 
  ServiceCard, 
  ServiceDetailModal, 
  PopularServices, 
  NoServicesFound, 
  ServicesLoading,
  generateMockServices
} from './ServiceComponents';

// ============================================
// INTERFACES AND TYPES
// ============================================

interface Service {
  id: string;
  name: string;
  description: string;
  category: ServiceCategory;
  department: string;
  status: 'operational' | 'limited' | 'unavailable';
  digitalAvailable: boolean;
  cost: 'free' | 'paid' | 'variable';
  processingTime: string;
  contactInfo: {
    phone?: string;
    email?: string;
    address?: string;
    website?: string;
  };
  openingHours?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
  eligibility: string[];
  requirements: string[];
  onlineAccess?: {
    available: boolean;
    url?: string;
    loginRequired?: boolean;
  };
  popularity: number; // 1-5 rating
  lastUpdated: Date;
}

type ServiceCategory = 
  | 'housing-planning'
  | 'environment'
  | 'transport'
  | 'education'
  | 'health-social'
  | 'business'
  | 'finance'
  | 'community'
  | 'emergency';

interface ServiceFilters {
  category: ServiceCategory | 'all';
  status: string;
  cost: string;
  digitalAvailable: boolean | null;
  search: string;
}

// ============================================
// MAIN SERVICES DIRECTORY COMPONENT
// ============================================

export const ServicesDirectory: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [filters, setFilters] = useState<ServiceFilters>({
    category: 'all',
    status: 'all',
    cost: 'all',
    digitalAvailable: null,
    search: ''
  });
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Load services data
  useEffect(() => {
    loadServices();
  }, []);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [services, filters]);

  const loadServices = async () => {
    setIsLoading(true);
    try {
      // Simulate API call - replace with actual endpoint
      const mockServices = generateMockServices();
      setServices(mockServices);
    } catch (error) {
      console.error('Failed to load services:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = services;

    // Category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(service => service.category === filters.category);
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(service => service.status === filters.status);
    }

    // Cost filter
    if (filters.cost !== 'all') {
      filtered = filtered.filter(service => service.cost === filters.cost);
    }

    // Digital availability filter
    if (filters.digitalAvailable !== null) {
      filtered = filtered.filter(service => service.digitalAvailable === filters.digitalAvailable);
    }

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(searchTerm) ||
        service.description.toLowerCase().includes(searchTerm) ||
        service.department.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredServices(filtered);
  };

  const resetFilters = () => {
    setFilters({
      category: 'all',
      status: 'all',
      cost: 'all',
      digitalAvailable: null,
      search: ''
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <ServicesHeader 
        totalServices={services.length}
        activeFilters={Object.values(filters).filter(v => v !== 'all' && v !== null && v !== '').length}
      />

      {/* Search and Filters */}
      <ServicesFilters 
        filters={filters}
        setFilters={setFilters}
        onReset={resetFilters}
      />

      {/* Categories Overview */}
      <ServicesCategories 
        services={services}
        onCategorySelect={(category) => setFilters(prev => ({ ...prev, category }))}
        selectedCategory={filters.category}
      />

      {/* Services Display */}
      {isLoading ? (
        <ServicesLoading />
      ) : (
        <ServicesDisplay 
          services={filteredServices}
          viewMode={viewMode}
          setViewMode={setViewMode}
          onServiceSelect={setSelectedService}
        />
      )}

      {/* Service Detail Modal */}
      {selectedService && (
        <ServiceDetailModal 
          service={selectedService}
          isOpen={!!selectedService}
          onClose={() => setSelectedService(null)}
        />
      )}

      {/* Popular Services */}
      <PopularServices services={services} onServiceSelect={setSelectedService} />
    </div>
  );
};

// ============================================
// SERVICES HEADER COMPONENT
// ============================================

const ServicesHeader: React.FC<{
  totalServices: number;
  activeFilters: number;
}> = ({ totalServices, activeFilters }) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center space-y-4"
  >
    <h1 className="text-3xl font-bold text-slate-900">
      Council Services Directory
    </h1>
    <p className="text-slate-600 max-w-2xl mx-auto">
      Find all council services in one place. Get contact information, check availability, 
      and access services online when possible.
    </p>
    <div className="flex justify-center items-center gap-4 text-sm text-slate-500">
      <span>{totalServices} services available</span>
      {activeFilters > 0 && (
        <Badge variant="secondary">{activeFilters} filters active</Badge>
      )}
    </div>
  </motion.div>
);

// ============================================
// SERVICES FILTERS COMPONENT
// ============================================

const ServicesFilters: React.FC<{
  filters: ServiceFilters;
  setFilters: (filters: ServiceFilters) => void;
  onReset: () => void;
}> = ({ filters, setFilters, onReset }) => (
  <Card className="shadow-lg">
    <CardContent className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            placeholder="Search services..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="pl-10"
          />
        </div>

        {/* Status */}
        <Select 
          value={filters.status} 
          onValueChange={(value) => setFilters({ ...filters, status: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="operational">Operational</SelectItem>
            <SelectItem value="limited">Limited Service</SelectItem>
            <SelectItem value="unavailable">Unavailable</SelectItem>
          </SelectContent>
        </Select>

        {/* Cost */}
        <Select 
          value={filters.cost} 
          onValueChange={(value) => setFilters({ ...filters, cost: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Cost" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Costs</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="variable">Variable</SelectItem>
          </SelectContent>
        </Select>

        {/* Digital Availability */}
        <Select 
          value={filters.digitalAvailable === null ? 'all' : filters.digitalAvailable.toString()}
          onValueChange={(value) => setFilters({ 
            ...filters, 
            digitalAvailable: value === 'all' ? null : value === 'true'
          })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Digital Access" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            <SelectItem value="true">Online Available</SelectItem>
            <SelectItem value="false">In-Person Only</SelectItem>
          </SelectContent>
        </Select>

        {/* Reset Button */}
        <Button 
          onClick={onReset}
          variant="outline" 
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Reset
        </Button>
      </div>
    </CardContent>
  </Card>
);

// ============================================
// SERVICES CATEGORIES COMPONENT
// ============================================

const ServicesCategories: React.FC<{
  services: Service[];
  onCategorySelect: (category: ServiceCategory) => void;
  selectedCategory: ServiceCategory | 'all';
}> = ({ services, onCategorySelect, selectedCategory }) => {
  const categories = [
    { id: 'housing-planning', name: 'Housing & Planning', icon: Home, color: 'blue' },
    { id: 'environment', name: 'Environment', icon: Leaf, color: 'green' },
    { id: 'transport', name: 'Transport', icon: Car, color: 'purple' },
    { id: 'education', name: 'Education', icon: GraduationCap, color: 'orange' },
    { id: 'health-social', name: 'Health & Social', icon: Heart, color: 'red' },
    { id: 'business', name: 'Business', icon: Briefcase, color: 'indigo' },
    { id: 'finance', name: 'Finance', icon: Building, color: 'yellow' },
    { id: 'community', name: 'Community', icon: Users, color: 'pink' },
    { id: 'emergency', name: 'Emergency', icon: Shield, color: 'gray' },
  ];

  const getCategoryCount = (categoryId: string) => {
    return services.filter(service => service.category === categoryId).length;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {categories.map(category => {
        const Icon = category.icon;
        const count = getCategoryCount(category.id);
        const isSelected = selectedCategory === category.id;

        return (
          <motion.div
            key={category.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card 
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => onCategorySelect(category.id as ServiceCategory)}
            >
              <CardContent className="p-4 text-center">
                <div className={`w-12 h-12 mx-auto mb-3 rounded-full bg-${category.color}-100 flex items-center justify-center`}>
                  <Icon className={`h-6 w-6 text-${category.color}-600`} />
                </div>
                <h3 className="font-semibold text-sm mb-1">{category.name}</h3>
                <p className="text-xs text-slate-500">{count} services</p>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

// ============================================
// SERVICES DISPLAY COMPONENT
// ============================================

const ServicesDisplay: React.FC<{
  services: Service[];
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  onServiceSelect: (service: Service) => void;
}> = ({ services, viewMode, setViewMode, onServiceSelect }) => {
  if (services.length === 0) {
    return <NoServicesFound />;
  }

  return (
    <div className="space-y-4">
      {/* View Controls */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-600">
          {services.length} service{services.length !== 1 ? 's' : ''} found
        </p>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            Grid
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            List
          </Button>
        </div>
      </div>

      {/* Services Grid/List */}
      <div className={viewMode === 'grid' 
        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
        : 'space-y-4'
      }>
        {services.map((service, index) => (
          <ServiceCard
            key={service.id}
            service={service}
            index={index}
            viewMode={viewMode}
            onClick={() => onServiceSelect(service)}
          />
        ))}
      </div>
    </div>
  );
};

// Continue in next part due to length limitations...

export default ServicesDirectory;
