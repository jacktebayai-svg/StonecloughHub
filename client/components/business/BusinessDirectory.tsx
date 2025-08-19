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
  ChevronDown,
  Users
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Business, BusinessCategory } from '@/shared/business-discussions-schema';

interface BusinessDirectoryProps {
  businesses?: Business[];
  categories?: BusinessCategory[];
}

// Sample data for public directory
const SAMPLE_BUSINESSES: Business[] = [
  {
    id: '1',
    name: 'The Stoneclough Café',
    ownerId: 'owner1',
    description: 'A cozy local café serving freshly roasted coffee, homemade pastries, and light meals. Perfect spot for meetings or relaxing with friends.',
    shortDescription: 'Cozy local café with fresh coffee and pastries',
    address: '123 High Street, Stoneclough',
    ward: 'Central',
    postcode: 'M26 1AB',
    phone: '01204 123456',
    email: 'hello@stonecloughcafe.co.uk',
    website: 'https://stonecloughcafe.co.uk',
    categoryIds: ['1'],
    tags: ['coffee', 'pastries', 'wifi', 'meetings'],
    logoUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400',
    coverImageUrl: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800',
    avgRating: 4.7,
    reviewCount: 23,
    verified: true,
    featured: true,
    status: 'active',
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
    amenities: ['WiFi', 'Wheelchair accessible', 'Outdoor seating', 'Pet friendly'],
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2024-01-10')
  },
  {
    id: '2',
    name: 'Stoneclough Hardware',
    ownerId: 'owner2',
    description: 'Your local hardware store with everything you need for DIY projects, gardening, and home maintenance.',
    shortDescription: 'Local hardware store for all your DIY needs',
    address: '45 Main Road, Stoneclough',
    ward: 'North',
    postcode: 'M26 2CD',
    phone: '01204 234567',
    email: 'info@stonecloughhardware.co.uk',
    categoryIds: ['5'],
    tags: ['hardware', 'DIY', 'gardening', 'tools'],
    avgRating: 4.5,
    reviewCount: 18,
    verified: true,
    status: 'active',
    openingHours: {
      monday: '8:00 AM - 6:00 PM',
      tuesday: '8:00 AM - 6:00 PM',
      wednesday: '8:00 AM - 6:00 PM',
      thursday: '8:00 AM - 6:00 PM',
      friday: '8:00 AM - 6:00 PM',
      saturday: '8:00 AM - 5:00 PM',
      sunday: 'Closed'
    },
    services: ['Tool rental', 'Key cutting', 'Advice', 'Delivery'],
    amenities: ['Parking', 'Expert advice', 'Local delivery'],
    createdAt: new Date('2023-03-20'),
    updatedAt: new Date('2024-01-05')
  },
  {
    id: '3',
    name: 'Bella\'s Beauty Salon',
    ownerId: 'owner3',
    description: 'Professional beauty treatments including hair styling, nail care, and spa services in a relaxing environment.',
    shortDescription: 'Professional beauty treatments and spa services',
    address: '78 Church Lane, Stoneclough',
    ward: 'South',
    postcode: 'M26 3EF',
    phone: '01204 345678',
    email: 'bookings@bellasbeauty.co.uk',
    categoryIds: ['3'],
    tags: ['beauty', 'hair', 'nails', 'spa'],
    avgRating: 4.8,
    reviewCount: 31,
    verified: true,
    status: 'active',
    openingHours: {
      monday: 'Closed',
      tuesday: '9:00 AM - 7:00 PM',
      wednesday: '9:00 AM - 7:00 PM',
      thursday: '9:00 AM - 8:00 PM',
      friday: '9:00 AM - 8:00 PM',
      saturday: '8:00 AM - 6:00 PM',
      sunday: '10:00 AM - 4:00 PM'
    },
    services: ['Hair styling', 'Nail care', 'Facial treatments', 'Massage'],
    amenities: ['Air conditioning', 'Refreshments', 'Wi-Fi'],
    createdAt: new Date('2023-06-10'),
    updatedAt: new Date('2024-01-08')
  }
];

const SAMPLE_CATEGORIES = [
  { id: '1', name: 'Restaurants & Food', description: 'Dining and food services', icon: 'UtensilsCrossed', displayOrder: 1, lastUpdated: new Date() },
  { id: '2', name: 'Retail & Shopping', description: 'Shops and retail stores', icon: 'ShoppingBag', displayOrder: 2, lastUpdated: new Date() },
  { id: '3', name: 'Health & Beauty', description: 'Healthcare and beauty services', icon: 'Heart', displayOrder: 3, lastUpdated: new Date() },
  { id: '4', name: 'Professional Services', description: 'Professional business services', icon: 'Briefcase', displayOrder: 4, lastUpdated: new Date() },
  { id: '5', name: 'Home & Garden', description: 'Hardware and home improvement', icon: 'Home', displayOrder: 5, lastUpdated: new Date() }
];

const BusinessDirectory: React.FC<BusinessDirectoryProps> = ({
  businesses = SAMPLE_BUSINESSES,
  categories = SAMPLE_CATEGORIES
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedWard, setSelectedWard] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('featured');

  const wards = ['all', ...Array.from(new Set(businesses.map(b => b.ward).filter(Boolean)))];

  const filteredBusinesses = businesses.filter(business => {
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
      case 'featured':
      default:
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return (b.avgRating || 0) - (a.avgRating || 0);
    }
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Stoneclough Business Directory
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Discover and support amazing local businesses in your community. From cozy cafés to essential services.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 max-w-4xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search businesses, services, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48 h-12">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id!}>
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

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40 h-12">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-slate-600">
            Showing {sortedBusinesses.length} of {businesses.length} businesses
          </p>
        </div>

        {/* Business Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedBusinesses.map((business, index) => (
            <motion.div
              key={business.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-xl transition-all duration-300 overflow-hidden group">
                {/* Cover Image */}
                {business.coverImageUrl && (
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={business.coverImageUrl} 
                      alt={business.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4 flex gap-2">
                      {business.featured && (
                        <Badge className="bg-yellow-500/90 text-white">Featured</Badge>
                      )}
                      {business.verified && (
                        <Badge className="bg-green-500/90 text-white">Verified</Badge>
                      )}
                    </div>
                    <div className="absolute top-4 right-4">
                      <Button size="sm" variant="ghost" className="bg-white/90 hover:bg-white">
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <Avatar className="w-12 h-12 border-2 border-white shadow-md">
                      <AvatarImage src={business.logoUrl} alt={business.name} />
                      <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                        {business.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-slate-900 leading-tight">
                        {business.name}
                      </h3>
                      {business.avgRating && (
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star 
                                key={i}
                                className={`h-4 w-4 ${
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

                  <p className="text-slate-600 mb-4 line-clamp-2">
                    {business.shortDescription}
                  </p>

                  {/* Contact Info */}
                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span className="truncate">{business.address}</span>
                    </div>
                    {business.phone && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="h-4 w-4 text-slate-400" />
                        <span>{business.phone}</span>
                      </div>
                    )}
                    {business.openingHours && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <span className="truncate">
                          {Object.entries(business.openingHours).find(([day, hours]) => 
                            new Date().getDay() === ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(day)
                          )?.[1] || 'See hours'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {business.tags?.slice(0, 3).map((tag, tagIndex) => (
                      <Badge key={tagIndex} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {business.tags && business.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{business.tags.length - 3}
                      </Badge>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1">
                      View Details
                    </Button>
                    {business.website && (
                      <Button size="sm" variant="outline">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      <Navigation className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* No Results */}
        {sortedBusinesses.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No businesses found</h3>
            <p className="text-slate-600">
              Try adjusting your search criteria or browse all categories.
            </p>
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-16 text-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8">
          <Building2 className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Own a business in Stoneclough?
          </h2>
          <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
            Join our community directory and connect with local customers. 
            It's free to list your business and start building relationships.
          </p>
          <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            List Your Business
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BusinessDirectory;
