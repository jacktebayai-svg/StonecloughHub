import React from 'react';
import { motion } from 'framer-motion';
import { 
  Phone, 
  Mail, 
  Clock, 
  MapPin, 
  ExternalLink,
  Star,
  CheckCircle,
  AlertCircle,
  Calendar,
  Globe,
  Info,
  Users,
  Home,
  Car,
  Leaf,
  Heart,
  Shield,
  Briefcase,
  GraduationCap,
  Building
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';

// ============================================
// INTERFACES (from main component)
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
  popularity: number;
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

// ============================================
// SERVICE CARD COMPONENT
// ============================================

export const ServiceCard: React.FC<{
  service: Service;
  index: number;
  viewMode: 'grid' | 'list';
  onClick: () => void;
}> = ({ service, index, viewMode, onClick }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'text-green-600 bg-green-100';
      case 'limited': return 'text-yellow-600 bg-yellow-100';
      case 'unavailable': return 'text-red-600 bg-red-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  const getCostColor = (cost: string) => {
    switch (cost) {
      case 'free': return 'text-green-600 bg-green-100';
      case 'paid': return 'text-blue-600 bg-blue-100';
      case 'variable': return 'text-orange-600 bg-orange-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  const getCategoryIcon = (category: ServiceCategory) => {
    const iconMap = {
      'housing-planning': Home,
      'environment': Leaf,
      'transport': Car,
      'education': GraduationCap,
      'health-social': Heart,
      'business': Briefcase,
      'finance': Building,
      'community': Users,
      'emergency': Shield,
    };
    return iconMap[category] || Users;
  };

  const Icon = getCategoryIcon(service.category);

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ scale: 1.01 }}
        className="cursor-pointer"
        onClick={onClick}
      >
        <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-slate-900">{service.name}</h3>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(service.status)}>
                        {service.status}
                      </Badge>
                      <Badge className={getCostColor(service.cost)}>
                        {service.cost}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-slate-600 mb-3 line-clamp-2">{service.description}</p>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span>📍 {service.department}</span>
                    <span>⏱️ {service.processingTime}</span>
                    {service.digitalAvailable && (
                      <Badge variant="outline" className="text-xs">
                        <Globe className="h-3 w-3 mr-1" />
                        Online
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-4 w-4 ${
                        i < service.popularity ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      className="cursor-pointer group"
      onClick={onClick}
    >
      <Card className="shadow-lg hover:shadow-xl transition-all duration-300 h-full">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
              <Icon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(service.status)}>
                {service.status}
              </Badge>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-slate-900 mb-2 line-clamp-2">
            {service.name}
          </h3>
          
          <p className="text-slate-600 mb-4 line-clamp-3">
            {service.description}
          </p>

          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Building className="h-4 w-4" />
              <span>{service.department}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Clock className="h-4 w-4" />
              <span>{service.processingTime}</span>
            </div>
            {service.contactInfo.phone && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Phone className="h-4 w-4" />
                <span>{service.contactInfo.phone}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className={getCostColor(service.cost)}>
                {service.cost}
              </Badge>
              {service.digitalAvailable && (
                <Badge variant="outline" className="text-xs">
                  <Globe className="h-3 w-3 mr-1" />
                  Online
                </Badge>
              )}
            </div>
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star 
                  key={i} 
                  className={`h-3 w-3 ${
                    i < service.popularity ? 'text-yellow-400 fill-current' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// ============================================
// SERVICE DETAIL MODAL
// ============================================

export const ServiceDetailModal: React.FC<{
  service: Service;
  isOpen: boolean;
  onClose: () => void;
}> = ({ service, isOpen, onClose }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'text-green-600 bg-green-100';
      case 'limited': return 'text-yellow-600 bg-yellow-100';
      case 'unavailable': return 'text-red-600 bg-red-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{service.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Basic Info */}
          <div className="flex items-center gap-4">
            <Badge className={getStatusColor(service.status)} size="lg">
              {service.status}
            </Badge>
            <Badge variant="outline" size="lg">
              {service.cost}
            </Badge>
            {service.digitalAvailable && (
              <Badge className="bg-blue-100 text-blue-800" size="lg">
                <Globe className="h-4 w-4 mr-1" />
                Online Available
              </Badge>
            )}
            <div className="flex items-center ml-auto">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star 
                  key={i} 
                  className={`h-4 w-4 ${
                    i < service.popularity ? 'text-yellow-400 fill-current' : 'text-gray-300'
                  }`}
                />
              ))}
              <span className="text-sm text-slate-500 ml-2">
                ({service.popularity}/5)
              </span>
            </div>
          </div>

          <Separator />

          {/* Service Details Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="requirements">Requirements</TabsTrigger>
              <TabsTrigger value="access">Access</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-slate-600">{service.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Department</h4>
                  <p className="text-slate-600">{service.department}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Processing Time</h4>
                  <p className="text-slate-600">{service.processingTime}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Last Updated</h4>
                <p className="text-slate-600">
                  {format(service.lastUpdated, 'dd/MM/yyyy HH:mm')}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {service.contactInfo.phone && (
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                    <Phone className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-semibold">Phone</p>
                      <p className="text-slate-600">{service.contactInfo.phone}</p>
                    </div>
                  </div>
                )}

                {service.contactInfo.email && (
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-semibold">Email</p>
                      <p className="text-slate-600">{service.contactInfo.email}</p>
                    </div>
                  </div>
                )}

                {service.contactInfo.address && (
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-semibold">Address</p>
                      <p className="text-slate-600">{service.contactInfo.address}</p>
                    </div>
                  </div>
                )}

                {service.contactInfo.website && (
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                    <ExternalLink className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-semibold">Website</p>
                      <a 
                        href={service.contactInfo.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Visit Website
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Opening Hours */}
              {service.openingHours && (
                <div>
                  <h4 className="font-semibold mb-3">Opening Hours</h4>
                  <div className="space-y-2">
                    {Object.entries(service.openingHours).map(([day, hours]) => (
                      <div key={day} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                        <span className="font-medium capitalize">{day}</span>
                        <span className="text-slate-600">{hours || 'Closed'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="requirements" className="space-y-4">
              {service.eligibility.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Eligibility Criteria</h4>
                  <ul className="space-y-2">
                    {service.eligibility.map((criteria, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-600">{criteria}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {service.requirements.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Required Documents</h4>
                  <ul className="space-y-2">
                    {service.requirements.map((requirement, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-600">{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>

            <TabsContent value="access" className="space-y-4">
              {service.onlineAccess?.available ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h4 className="font-semibold text-green-800">Online Access Available</h4>
                  </div>
                  <p className="text-green-700 mb-3">
                    This service can be accessed online for faster processing.
                  </p>
                  {service.onlineAccess.loginRequired && (
                    <p className="text-sm text-green-600 mb-3">
                      * Account registration may be required
                    </p>
                  )}
                  {service.onlineAccess.url && (
                    <Button 
                      onClick={() => window.open(service.onlineAccess!.url, '_blank')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Access Online Service
                    </Button>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    <h4 className="font-semibold text-orange-800">In-Person Service Only</h4>
                  </div>
                  <p className="text-orange-700">
                    This service requires an in-person visit. Please use the contact information 
                    to schedule an appointment or visit during opening hours.
                  </p>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-3">How to Access This Service</h4>
                <ol className="list-decimal list-inside space-y-2 text-slate-600">
                  <li>Check eligibility criteria and gather required documents</li>
                  <li>Contact the service using the provided contact information</li>
                  {service.onlineAccess?.available && <li>Complete the application online or in-person</li>}
                  <li>Wait for processing (typical time: {service.processingTime})</li>
                  <li>Follow up if needed using the reference provided</li>
                </ol>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ============================================
// POPULAR SERVICES COMPONENT
// ============================================

export const PopularServices: React.FC<{
  services: Service[];
  onServiceSelect: (service: Service) => void;
}> = ({ services, onServiceSelect }) => {
  const popularServices = services
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 6);

  if (popularServices.length === 0) return null;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          Popular Services
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {popularServices.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
              onClick={() => onServiceSelect(service)}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm line-clamp-1">{service.name}</h4>
                <div className="flex items-center">
                  <Star className="h-3 w-3 text-yellow-400 fill-current" />
                  <span className="text-xs text-slate-500 ml-1">{service.popularity}</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 line-clamp-2 mb-2">
                {service.description}
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {service.department}
                </Badge>
                {service.digitalAvailable && (
                  <Badge variant="outline" className="text-xs">
                    <Globe className="h-2 w-2 mr-1" />
                    Online
                  </Badge>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================
// NO SERVICES FOUND COMPONENT
// ============================================

export const NoServicesFound: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center py-12"
  >
    <div className="max-w-md mx-auto">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Users className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">
        No services found
      </h3>
      <p className="text-slate-600 mb-6">
        Try adjusting your search criteria or browse by category to find the services you need.
      </p>
      <Button variant="outline">
        Browse All Categories
      </Button>
    </div>
  </motion.div>
);

// ============================================
// SERVICES LOADING COMPONENT
// ============================================

export const ServicesLoading: React.FC = () => (
  <div className="space-y-6">
    {/* Categories Skeleton */}
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {Array.from({ length: 9 }).map((_, index) => (
        <Card key={index} className="animate-pulse">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-slate-200 rounded-full mx-auto mb-3" />
            <div className="h-4 bg-slate-200 rounded w-20 mx-auto mb-1" />
            <div className="h-3 bg-slate-200 rounded w-16 mx-auto" />
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Services Grid Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="animate-pulse">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-slate-200 rounded-lg" />
              <div className="w-16 h-6 bg-slate-200 rounded" />
            </div>
            <div className="space-y-2 mb-4">
              <div className="h-5 bg-slate-200 rounded w-3/4" />
              <div className="h-4 bg-slate-200 rounded w-full" />
              <div className="h-4 bg-slate-200 rounded w-2/3" />
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-slate-200 rounded w-1/2" />
              <div className="h-4 bg-slate-200 rounded w-2/3" />
              <div className="h-4 bg-slate-200 rounded w-1/3" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

// ============================================
// UTILITY FUNCTION
// ============================================

export const generateMockServices = (): Service[] => {
  const categories: ServiceCategory[] = [
    'housing-planning', 'environment', 'transport', 'education', 
    'health-social', 'business', 'finance', 'community', 'emergency'
  ];

  const departments = [
    'Housing & Planning Department',
    'Environmental Services',
    'Transportation Department',
    'Education Services',
    'Health & Social Care',
    'Business Development',
    'Finance Department',
    'Community Services',
    'Emergency Services'
  ];

  const serviceNames = [
    'Planning Permission Application',
    'Waste Collection Service',
    'Parking Permits',
    'School Admissions',
    'Social Care Assessment',
    'Business License Application',
    'Council Tax Payment',
    'Community Center Booking',
    'Emergency Housing',
    'Building Control Inspection',
    'Garden Waste Collection',
    'Blue Badge Application',
    'Library Services',
    'Adult Day Care',
    'Trading License',
    'Housing Benefit Claim',
    'Event Planning Permission',
    'Environmental Health Inspection'
  ];

  return Array.from({ length: 45 }, (_, i) => ({
    id: `service-${i + 1}`,
    name: serviceNames[i % serviceNames.length],
    description: `Comprehensive ${serviceNames[i % serviceNames.length].toLowerCase()} service providing residents with essential local government support and assistance.`,
    category: categories[i % categories.length],
    department: departments[i % departments.length],
    status: ['operational', 'limited', 'unavailable'][Math.floor(Math.random() * 3)] as any,
    digitalAvailable: Math.random() > 0.4,
    cost: ['free', 'paid', 'variable'][Math.floor(Math.random() * 3)] as any,
    processingTime: ['1-2 days', '3-5 days', '1-2 weeks', '2-4 weeks', 'Same day'][Math.floor(Math.random() * 5)],
    contactInfo: {
      phone: `0161-555-${(Math.floor(Math.random() * 9000) + 1000)}`,
      email: `${serviceNames[i % serviceNames.length].toLowerCase().replace(/\s+/g, '.')}@council.gov.uk`,
      address: `${Math.floor(Math.random() * 999) + 1} Council Lane, Bolton, BL1 1AA`,
      website: Math.random() > 0.3 ? 'https://www.bolton.gov.uk/services' : undefined
    },
    openingHours: Math.random() > 0.2 ? {
      monday: '9:00 AM - 5:00 PM',
      tuesday: '9:00 AM - 5:00 PM',
      wednesday: '9:00 AM - 5:00 PM',
      thursday: '9:00 AM - 5:00 PM',
      friday: '9:00 AM - 4:30 PM',
      saturday: Math.random() > 0.5 ? '9:00 AM - 1:00 PM' : undefined,
      sunday: undefined
    } : undefined,
    eligibility: [
      'Must be a resident of the local area',
      'Valid identification required',
      'Age restrictions may apply'
    ].slice(0, Math.floor(Math.random() * 3) + 1),
    requirements: [
      'Proof of identity (passport or driving license)',
      'Proof of address (utility bill or bank statement)',
      'Completed application form',
      'Supporting documentation'
    ].slice(0, Math.floor(Math.random() * 4) + 1),
    onlineAccess: Math.random() > 0.4 ? {
      available: true,
      url: 'https://www.bolton.gov.uk/online-services',
      loginRequired: Math.random() > 0.5
    } : { available: false },
    popularity: Math.floor(Math.random() * 5) + 1,
    lastUpdated: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
  }));
};
