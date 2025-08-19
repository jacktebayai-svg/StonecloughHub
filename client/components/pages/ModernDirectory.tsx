import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  MapPin, 
  Phone, 
  Globe, 
  Star, 
  Clock, 
  Navigation,
  Building2,
  Heart,
  ExternalLink,
  Users,
  Grid3X3,
  List,
  Verified,
  Award,
  Calendar,
  Mail,
  Wifi,
  Car,
  CreditCard,
  Camera,
  Shield
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { PageLayout } from '../layout/PageLayout';

interface Business {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  address: string;
  ward: string;
  postcode: string;
  phone?: string;
  email?: string;
  website?: string;
  categoryIds: string[];
  tags: string[];
  logoUrl?: string;
  coverImageUrl?: string;
  avgRating?: number;
  reviewCount?: number;
  verified?: boolean;
  featured?: boolean;
  status: string;
  openingHours?: Record<string, string>;
  services?: string[];
  amenities?: string[];
  priceRange?: '$' | '$$' | '$$$' | '$$$$';
  businessType?: 'retail' | 'restaurant' | 'service' | 'healthcare' | 'professional';
}

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  displayOrder: number;
  businessCount?: number;
}

// Sample businesses with more comprehensive data
const SAMPLE_BUSINESSES: Business[] = [
  {
    id: '1',
    name: 'The Stoneclough Café',
    description: 'A cozy local café serving freshly roasted coffee, homemade pastries, and light meals. Perfect spot for meetings or relaxing with friends.',
    shortDescription: 'Cozy local café with fresh coffee and pastries',
    address: '123 High Street, Stoneclough',
    ward: 'Central',
    postcode: 'M26 1AB',
    phone: '01204 123456',
    email: 'hello@stonecloughcafe.co.uk',
    website: 'https://stonecloughcafe.co.uk',
    categoryIds: ['1'],
    tags: ['coffee', 'pastries', 'wifi', 'meetings', 'breakfast', 'lunch'],
    logoUrl: '/api/placeholder/80/80',
    coverImageUrl: '/api/placeholder/400/250',
    avgRating: 4.7,
    reviewCount: 23,
    verified: true,
    featured: true,
    status: 'active',
    businessType: 'restaurant',
    priceRange: '$$',
    openingHours: {
      monday: '7:00 AM - 6:00 PM',
      tuesday: '7:00 AM - 6:00 PM',
      wednesday: '7:00 AM - 6:00 PM',
      thursday: '7:00 AM - 6:00 PM',
      friday: '7:00 AM - 7:00 PM',
      saturday: '8:00 AM - 7:00 PM',
      sunday: '9:00 AM - 5:00 PM'
    },
    services: ['Dine-in', 'Takeaway', 'Catering', 'Private events'],
    amenities: ['WiFi', 'Wheelchair accessible', 'Outdoor seating', 'Pet friendly', 'Parking']
  },
  {
    id: '2',
    name: 'Stoneclough Hardware',
    description: 'Your local hardware store with everything you need for DIY projects, gardening, and home maintenance. Expert advice and quality tools.',
    shortDescription: 'Local hardware store for all your DIY needs',
    address: '45 Main Road, Stoneclough',
    ward: 'North',
    postcode: 'M26 2CD',
    phone: '01204 234567',
    email: 'info@stonecloughhardware.co.uk',
    categoryIds: ['5'],
    tags: ['hardware', 'DIY', 'gardening', 'tools', 'paint', 'electrical'],
    logoUrl: '/api/placeholder/80/80',
    coverImageUrl: '/api/placeholder/400/250',
    avgRating: 4.5,
    reviewCount: 18,
    verified: true,
    status: 'active',
    businessType: 'retail',
    priceRange: '$$',
    openingHours: {
      monday: '8:00 AM - 6:00 PM',
      tuesday: '8:00 AM - 6:00 PM',
      wednesday: '8:00 AM - 6:00 PM',
      thursday: '8:00 AM - 6:00 PM',
      friday: '8:00 AM - 6:00 PM',
      saturday: '8:00 AM - 5:00 PM',
      sunday: 'Closed'
    },
    services: ['Tool rental', 'Key cutting', 'Advice', 'Delivery', 'Installation'],
    amenities: ['Parking', 'Expert advice', 'Local delivery', 'Card payments']
  },
  {
    id: '3',
    name: 'Bella\'s Beauty Salon',
    description: 'Professional beauty treatments including hair styling, nail care, and spa services in a relaxing environment.',
    shortDescription: 'Professional beauty treatments and spa services',
    address: '78 Church Lane, Stoneclough',
    ward: 'South',
    postcode: 'M26 3EF',
    phone: '01204 345678',
    email: 'bookings@bellasbeauty.co.uk',
    website: 'https://bellasbeauty.co.uk',
    categoryIds: ['3'],
    tags: ['beauty', 'hair', 'nails', 'spa', 'massage', 'facial'],
    logoUrl: '/api/placeholder/80/80',
    coverImageUrl: '/api/placeholder/400/250',
    avgRating: 4.8,
    reviewCount: 31,
    verified: true,
    featured: true,
    status: 'active',
    businessType: 'service',
    priceRange: '$$$',
    openingHours: {
      monday: 'Closed',
      tuesday: '9:00 AM - 7:00 PM',
      wednesday: '9:00 AM - 7:00 PM',
      thursday: '9:00 AM - 8:00 PM',
      friday: '9:00 AM - 8:00 PM',
      saturday: '8:00 AM - 6:00 PM',
      sunday: '10:00 AM - 4:00 PM'
    },
    services: ['Hair styling', 'Nail care', 'Facial treatments', 'Massage', 'Bridal packages'],
    amenities: ['Air conditioning', 'Refreshments', 'Wi-Fi', 'Online booking']
  },
  {
    id: '4',
    name: 'The Village Pharmacy',
    description: 'Community pharmacy providing prescriptions, health advice, and wellness products. Supporting local health needs.',
    shortDescription: 'Community pharmacy and health services',
    address: '32 Market Street, Stoneclough',
    ward: 'Central',
    postcode: 'M26 1CD',
    phone: '01204 456789',
    email: 'info@villagepharmacy.co.uk',
    categoryIds: ['4'],
    tags: ['pharmacy', 'health', 'prescriptions', 'vaccinations', 'wellness'],
    logoUrl: '/api/placeholder/80/80',
    avgRating: 4.6,
    reviewCount: 45,
    verified: true,
    status: 'active',
    businessType: 'healthcare',
    openingHours: {
      monday: '8:00 AM - 7:00 PM',
      tuesday: '8:00 AM - 7:00 PM',
      wednesday: '8:00 AM - 7:00 PM',
      thursday: '8:00 AM - 7:00 PM',
      friday: '8:00 AM - 7:00 PM',
      saturday: '8:00 AM - 6:00 PM',
      sunday: '10:00 AM - 4:00 PM'
    },
    services: ['Prescriptions', 'Health consultations', 'Vaccinations', 'Blood pressure checks'],
    amenities: ['Wheelchair accessible', 'Free consultation', 'NHS services']
  },
  {
    id: '5',
    name: 'Stoneclough Solicitors',
    description: 'Professional legal services covering family law, property, wills, and business matters. Experienced local legal team.',
    shortDescription: 'Professional legal services and advice',
    address: '89 High Street, Stoneclough',
    ward: 'Central',
    postcode: 'M26 1EF',
    phone: '01204 567890',
    email: 'enquiries@stonecloughsolicitors.co.uk',
    website: 'https://stonecloughsolicitors.co.uk',
    categoryIds: ['4'],
    tags: ['legal', 'solicitor', 'property', 'wills', 'family law', 'business'],
    logoUrl: '/api/placeholder/80/80',
    avgRating: 4.4,
    reviewCount: 12,
    verified: true,
    status: 'active',
    businessType: 'professional',
    priceRange: '$$$',
    openingHours: {
      monday: '9:00 AM - 5:30 PM',
      tuesday: '9:00 AM - 5:30 PM',
      wednesday: '9:00 AM - 5:30 PM',
      thursday: '9:00 AM - 5:30 PM',
      friday: '9:00 AM - 5:00 PM',
      saturday: 'By appointment',
      sunday: 'Closed'
    },
    services: ['Property law', 'Family law', 'Wills & probate', 'Business law', 'Free consultation'],
    amenities: ['Parking', 'Wheelchair accessible', 'Evening appointments']
  }
];

const SAMPLE_CATEGORIES: Category[] = [
  { 
    id: '1', 
    name: 'Restaurants & Food', 
    description: 'Dining and food services', 
    icon: 'UtensilsCrossed', 
    displayOrder: 1,
    businessCount: 8 
  },
  { 
    id: '2', 
    name: 'Retail & Shopping', 
    description: 'Shops and retail stores', 
    icon: 'ShoppingBag', 
    displayOrder: 2,
    businessCount: 12 
  },
  { 
    id: '3', 
    name: 'Health & Beauty', 
    description: 'Healthcare and beauty services', 
    icon: 'Heart', 
    displayOrder: 3,
    businessCount: 7 
  },
  { 
    id: '4', 
    name: 'Professional Services', 
    description: 'Professional business services', 
    icon: 'Briefcase', 
    displayOrder: 4,
    businessCount: 5 
  },
  { 
    id: '5', 
    name: 'Home & Garden', 
    description: 'Hardware and home improvement', 
    icon: 'Home', 
    displayOrder: 5,
    businessCount: 6 
  }
];

export const ModernDirectory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedWard, setSelectedWard] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  const wards = ['all', ...Array.from(new Set(SAMPLE_BUSINESSES.map(b => b.ward).filter(Boolean)))];

  const filteredBusinesses = SAMPLE_BUSINESSES.filter(business => {
    const matchesSearch = business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         business.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         business.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || business.categoryIds.includes(selectedCategory);
    const matchesWard = selectedWard === 'all' || business.ward === selectedWard;
    const isActive = business.status === 'active';
    
    return matchesSearch && matchesCategory && matchesWard && isActive;
  });

  const sortedBusinesses = [...filteredBusinesses].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return (b.avgRating || 0) - (a.avgRating || 0);
      case 'name':
        return a.name.localeCompare(b.name);
      case 'reviews':
        return (b.reviewCount || 0) - (a.reviewCount || 0);
      case 'featured':
      default:
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return (b.avgRating || 0) - (a.avgRating || 0);
    }
  });

  const getCurrentDayHours = (openingHours?: Record<string, string>) => {
    if (!openingHours) return 'See hours';
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[new Date().getDay()];
    return openingHours[today] || 'See hours';
  };

  const BusinessCard = ({ business, isListView }: { business: Business; isListView?: boolean }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={`h-full hover:shadow-xl transition-all duration-300 overflow-hidden group ${
        isListView ? 'flex flex-row' : ''
      }`}>
        {/* Cover Image */}
        {business.coverImageUrl && (
          <div className={`relative overflow-hidden ${
            isListView ? 'w-48 flex-shrink-0' : 'h-48'
          }`}>
            <img 
              src={business.coverImageUrl} 
              alt={business.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-3 left-3 flex gap-2">
              {business.featured && (
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                  <Star className="h-3 w-3 mr-1" />
                  Featured
                </Badge>
              )}
              {business.verified && (
                <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
                  <Shield className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
            <div className="absolute top-3 right-3">
              <Button size="sm" variant="ghost" className="bg-white/90 hover:bg-white h-8 w-8 p-0">
                <Heart className="h-4 w-4" />
              </Button>
            </div>
            {business.priceRange && (
              <div className="absolute bottom-3 left-3">
                <Badge variant="secondary" className="bg-black/70 text-white border-0">
                  {business.priceRange}
                </Badge>
              </div>
            )}
          </div>
        )}

        <CardContent className={`p-4 ${isListView ? 'flex-1' : ''}`}>
          {/* Business Header */}
          <div className="flex items-start gap-3 mb-3">
            <Avatar className="w-12 h-12 border-2 border-white shadow-md">
              <AvatarImage src={business.logoUrl} alt={business.name} />
              <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 text-blue-700 font-semibold">
                {business.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-lg text-slate-900 leading-tight truncate">
                  {business.name}
                </h3>
                {business.verified && (
                  <Verified className="h-4 w-4 text-blue-500 flex-shrink-0" />
                )}
              </div>
              {business.avgRating && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star 
                        key={i}
                        className={`h-3 w-3 ${
                          i < Math.floor(business.avgRating!) 
                            ? 'text-yellow-400 fill-current' 
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-slate-600">
                    {business.avgRating} ({business.reviewCount} reviews)
                  </span>
                </div>
              )}
            </div>
          </div>

          <p className="text-slate-600 mb-3 line-clamp-2 text-sm">
            {business.shortDescription}
          </p>

          {/* Contact Info */}
          <div className="space-y-1.5 mb-3 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin className="h-3 w-3 text-slate-400 flex-shrink-0" />
              <span className="truncate">{business.address}</span>
            </div>
            {business.phone && (
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="h-3 w-3 text-slate-400 flex-shrink-0" />
                <span>{business.phone}</span>
              </div>
            )}
            {business.openingHours && (
              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="h-3 w-3 text-slate-400 flex-shrink-0" />
                <span className="truncate">
                  {getCurrentDayHours(business.openingHours)}
                </span>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-3">
            {business.tags?.slice(0, 4).map((tag, tagIndex) => (
              <Badge key={tagIndex} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {business.tags && business.tags.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{business.tags.length - 4}
              </Badge>
            )}
          </div>

          {/* Amenities */}
          {business.amenities && business.amenities.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {business.amenities.slice(0, 3).map((amenity, index) => (
                <div key={index} className="flex items-center gap-1 text-xs text-slate-500">
                  {amenity === 'WiFi' && <Wifi className="h-3 w-3" />}
                  {amenity === 'Parking' && <Car className="h-3 w-3" />}
                  {amenity === 'Card payments' && <CreditCard className="h-3 w-3" />}
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              View Details
            </Button>
            {business.website && (
              <Button size="sm" variant="outline" className="px-3">
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
            <Button size="sm" variant="outline" className="px-3">
              <Navigation className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <PageLayout className="bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Stoneclough Business Directory
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Discover and support amazing local businesses in your community. 
              From cozy cafés to essential services, find what you need right here.
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search businesses, services, or keywords..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12 text-lg border-0 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48 h-12">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {SAMPLE_CATEGORIES.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedWard} onValueChange={setSelectedWard}>
                    <SelectTrigger className="w-40 h-12">
                      <SelectValue placeholder="All Areas" />
                    </SelectTrigger>
                    <SelectContent>
                      {wards.map((ward) => (
                        <SelectItem key={ward} value={ward}>
                          {ward === 'all' ? 'All Areas' : ward}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="lg"
                    className="lg:hidden"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Browse by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {SAMPLE_CATEGORIES.map((category) => (
            <motion.div
              key={category.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Card 
                className={`cursor-pointer transition-all duration-200 ${
                  selectedCategory === category.id 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedCategory(category.id)}
              >
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-medium text-sm mb-1">{category.name}</h3>
                  <p className="text-xs text-slate-500">{category.businessCount} businesses</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Results Section */}
      <div className="container mx-auto px-4 pb-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 gap-4">
          <div>
            <p className="text-slate-600">
              Showing {sortedBusinesses.length} of {SAMPLE_BUSINESSES.length} businesses
            </p>
            {selectedCategory !== 'all' && (
              <p className="text-sm text-blue-600">
                Filtered by: {SAMPLE_CATEGORIES.find(c => c.id === selectedCategory)?.name}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="reviews">Most Reviewed</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
              </SelectContent>
            </Select>

            <Separator orientation="vertical" className="h-6" />

            <div className="flex rounded-lg border">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Business Grid/List */}
        {sortedBusinesses.length > 0 ? (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'
              : 'space-y-4'
          }>
            {sortedBusinesses.map((business) => (
              <BusinessCard 
                key={business.id} 
                business={business} 
                isListView={viewMode === 'list'} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No businesses found</h3>
            <p className="text-slate-600 mb-6">
              Try adjusting your search criteria or browse all categories.
            </p>
            <Button onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
              setSelectedWard('all');
            }}>
              Clear Filters
            </Button>
          </div>
        )}

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-16 text-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8"
        >
          <Building2 className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Own a business in Stoneclough?
          </h2>
          <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
            Join our community directory and connect with local customers. 
            It's free to list your business and start building relationships.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              List Your Business
            </Button>
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </div>
        </motion.div>
      </div>
    </PageLayout>
  );
};

export default ModernDirectory;
