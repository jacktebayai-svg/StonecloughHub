import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Edit3, 
  Save, 
  X, 
  Upload, 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Clock, 
  Camera,
  Trash2,
  Eye,
  EyeOff,
  Heart,
  MessageSquare,
  Share2,
  Filter,
  Search,
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { Business, BusinessCategory, BusinessReview, BusinessService, BusinessPromotion } from '@/shared/business-discussions-schema';
import { format } from 'date-fns';

interface BusinessManagementProps {
  userBusinesses?: Business[];
  categories?: BusinessCategory[];
  onCreateBusiness?: (business: Partial<Business>) => void;
  onUpdateBusiness?: (id: string, updates: Partial<Business>) => void;
  onDeleteBusiness?: (id: string) => void;
}

interface BusinessFormData {
  name: string;
  description: string;
  shortDescription: string;
  address: string;
  postcode: string;
  phone: string;
  email: string;
  website: string;
  categoryIds: string[];
  tags: string[];
  openingHours: Record<string, string>;
  services: string[];
  amenities: string[];
}

const DEFAULT_OPENING_HOURS = {
  monday: '9:00 AM - 5:00 PM',
  tuesday: '9:00 AM - 5:00 PM',
  wednesday: '9:00 AM - 5:00 PM',
  thursday: '9:00 AM - 5:00 PM',
  friday: '9:00 AM - 5:00 PM',
  saturday: '10:00 AM - 4:00 PM',
  sunday: 'Closed'
};

const SAMPLE_CATEGORIES: BusinessCategory[] = [
  { id: '1', name: 'Restaurants & Food', description: 'Dining and food services', icon: 'UtensilsCrossed', displayOrder: 1, lastUpdated: new Date() },
  { id: '2', name: 'Retail & Shopping', description: 'Shops and retail stores', icon: 'ShoppingBag', displayOrder: 2, lastUpdated: new Date() },
  { id: '3', name: 'Health & Beauty', description: 'Healthcare and beauty services', icon: 'Heart', displayOrder: 3, lastUpdated: new Date() },
  { id: '4', name: 'Professional Services', description: 'Professional business services', icon: 'Briefcase', displayOrder: 4, lastUpdated: new Date() }
];

export const BusinessManagement: React.FC<BusinessManagementProps> = ({
  userBusinesses = [],
  categories = SAMPLE_CATEGORIES,
  onCreateBusiness,
  onUpdateBusiness,
  onDeleteBusiness
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'edit' | 'analytics'>('list');
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'pending' | 'suspended'>('all');

  // Form state for create/edit
  const [formData, setFormData] = useState<BusinessFormData>({
    name: '',
    description: '',
    shortDescription: '',
    address: '',
    postcode: '',
    phone: '',
    email: '',
    website: '',
    categoryIds: [],
    tags: [],
    openingHours: DEFAULT_OPENING_HOURS,
    services: [],
    amenities: []
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      shortDescription: '',
      address: '',
      postcode: '',
      phone: '',
      email: '',
      website: '',
      categoryIds: [],
      tags: [],
      openingHours: DEFAULT_OPENING_HOURS,
      services: [],
      amenities: []
    });
  };

  const handleCreateBusiness = () => {
    if (!user) return;
    
    const businessData: Partial<Business> = {
      ...formData,
      ownerId: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'pending'
    };

    onCreateBusiness?.(businessData);
    resetForm();
    setActiveTab('list');
  };

  const handleUpdateBusiness = () => {
    if (!selectedBusiness) return;
    
    onUpdateBusiness?.(selectedBusiness.id!, {
      ...formData,
      updatedAt: new Date()
    });
    
    setIsEditing(false);
    setSelectedBusiness(null);
    setActiveTab('list');
  };

  const populateFormWithBusiness = (business: Business) => {
    setFormData({
      name: business.name,
      description: business.description,
      shortDescription: business.shortDescription || '',
      address: business.address,
      postcode: business.postcode,
      phone: business.phone || '',
      email: business.email || '',
      website: business.website || '',
      categoryIds: business.categoryIds,
      tags: business.tags || [],
      openingHours: business.openingHours || DEFAULT_OPENING_HOURS,
      services: business.services || [],
      amenities: business.amenities || []
    });
  };

  const filteredBusinesses = userBusinesses.filter(business => {
    const matchesSearch = business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         business.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || business.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Mock data for demo purposes
  const mockBusinesses: Business[] = [
    {
      id: '1',
      name: 'The Stoneclough Café',
      ownerId: user?.id || '1',
      description: 'A cozy local café serving freshly roasted coffee, homemade pastries, and light meals. Perfect spot for meetings or relaxing with friends.',
      shortDescription: 'Cozy local café with fresh coffee and pastries',
      address: '123 High Street, Stoneclough',
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
      ownerId: user?.id || '1',
      description: 'Your local hardware store with everything you need for DIY projects, gardening, and home maintenance. Expert advice from our friendly team.',
      shortDescription: 'Local hardware store for all your DIY needs',
      address: '45 Main Road, Stoneclough',
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
    }
  ];

  const businesses = userBusinesses.length > 0 ? userBusinesses : mockBusinesses;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Business Management</h1>
          <p className="text-slate-600 mt-2">Manage your business listings and connect with the local community</p>
        </div>
        <Button 
          onClick={() => {
            resetForm();
            setActiveTab('create');
          }}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Business
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
        {[
          { id: 'list', label: 'My Businesses', icon: Eye },
          { id: 'create', label: 'Add Business', icon: Plus },
          { id: 'analytics', label: 'Analytics', icon: TrendingUp }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
              activeTab === id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Business List Tab */}
        {activeTab === 'list' && (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Search your businesses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as any)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Business Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredBusinesses.map((business) => (
                <motion.div
                  key={business.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -4 }}
                  className="group"
                >
                  <Card className="h-full shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                    {/* Cover Image */}
                    {business.coverImageUrl && (
                      <div className="relative h-32 bg-gradient-to-r from-blue-500 to-purple-600">
                        <img 
                          src={business.coverImageUrl} 
                          alt={business.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-4 right-4 flex gap-2">
                          {business.featured && (
                            <Badge className="bg-yellow-500/90 text-white">Featured</Badge>
                          )}
                          {business.verified && (
                            <Badge className="bg-green-500/90 text-white">Verified</Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={business.logoUrl} alt={business.name} />
                            <AvatarFallback>{business.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900">{business.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              {business.avgRating && (
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  <span>{business.avgRating}</span>
                                  <span>({business.reviewCount} reviews)</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <Badge variant={
                          business.status === 'active' ? 'default' : 
                          business.status === 'pending' ? 'secondary' : 'destructive'
                        }>
                          {business.status}
                        </Badge>
                      </div>

                      <p className="text-slate-600 mb-4 line-clamp-2">{business.shortDescription}</p>

                      <div className="space-y-2 mb-4 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate">{business.address}</span>
                        </div>
                        {business.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{business.phone}</span>
                          </div>
                        )}
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mb-4">
                        {business.tags?.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {business.tags && business.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{business.tags.length - 3} more
                          </Badge>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedBusiness(business);
                            populateFormWithBusiness(business);
                            setIsEditing(true);
                            setActiveTab('create');
                          }}
                          className="flex items-center gap-1"
                        >
                          <Edit3 className="h-3 w-3" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1 text-red-600 hover:text-red-700"
                          onClick={() => business.id && onDeleteBusiness?.(business.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {filteredBusinesses.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No businesses found</h3>
                <p className="text-slate-600 mb-4">
                  {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first business.'}
                </p>
                <Button onClick={() => setActiveTab('create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Business
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {/* Create/Edit Business Tab */}
        {activeTab === 'create' && (
          <motion.div
            key="create"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {isEditing ? <Edit3 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                  {isEditing ? 'Edit Business' : 'Add New Business'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Business Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Your business name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="shortDescription">Short Description</Label>
                      <Input
                        id="shortDescription"
                        value={formData.shortDescription}
                        onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                        placeholder="Brief description (280 chars max)"
                        maxLength={280}
                      />
                    </div>
                    <div>
                      <Label htmlFor="address">Address *</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Full business address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="postcode">Postcode *</Label>
                      <Input
                        id="postcode"
                        value={formData.postcode}
                        onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                        placeholder="M26 1AB"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="01204 123456"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="hello@yourbusiness.co.uk"
                      />
                    </div>
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="https://yourbusiness.co.uk"
                      />
                    </div>
                    <div>
                      <Label htmlFor="categories">Business Categories *</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select categories" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id!}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description">Full Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your business, services, and what makes you special..."
                    rows={4}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <Button 
                    onClick={isEditing ? handleUpdateBusiness : handleCreateBusiness}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {isEditing ? 'Update Business' : 'Create Business'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setActiveTab('list');
                      setIsEditing(false);
                      setSelectedBusiness(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { title: 'Total Views', value: '1,234', change: '+12%', icon: Eye, color: 'blue' },
                { title: 'New Reviews', value: '8', change: '+3', icon: Star, color: 'yellow' },
                { title: 'Contact Clicks', value: '45', change: '+15%', icon: Phone, color: 'green' },
                { title: 'Website Visits', value: '89', change: '+8%', icon: ExternalLink, color: 'purple' }
              ].map((stat, index) => (
                <Card key={index} className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                      <p className={`text-sm text-${stat.color}-600`}>{stat.change} this month</p>
                    </div>
                    <stat.icon className={`h-8 w-8 text-${stat.color}-500`} />
                  </div>
                </Card>
              ))}
            </div>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Business Performance Overview</h3>
              <div className="h-64 bg-slate-50 rounded-lg flex items-center justify-center text-slate-500">
                Analytics charts would be implemented here with a charting library
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BusinessManagement;
