import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Edit, Phone, Mail, Globe } from "lucide-react";
import type { Business } from "@shared/schema";

interface BusinessCardProps {
  business: Business;
  onViewDetails?: (id: string) => void;
  onEdit?: (business: Business) => void;
  showEditButton?: boolean;
}

const categoryLabels = {
  restaurant_cafe: "Restaurant & Cafe",
  retail_shopping: "Retail & Shopping", 
  health_beauty: "Health & Beauty",
  professional_services: "Professional Services",
  home_garden: "Home & Garden",
  other: "Other"
};

export function BusinessCard({ business, onViewDetails, onEdit, showEditButton }: BusinessCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {business.imageUrl && (
        <img 
          src={business.imageUrl} 
          alt={business.name}
          className="w-full h-48 object-cover"
        />
      )}
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h4 className="font-semibold text-lg text-stoneclough-blue">{business.name}</h4>
          <div className="flex gap-2 items-center">
            {showEditButton && onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(business)}
                className="h-8 w-8 p-0 text-stoneclough-gray-blue hover:text-stoneclough-blue"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {business.isVerified && (
              <Badge className="bg-stoneclough-gray-blue text-stoneclough-light">Verified</Badge>
            )}
            {business.isPremium && (
              <Badge variant="secondary">Premium</Badge>
            )}
          </div>
        </div>
        
        {business.description && (
          <p className="text-stoneclough-gray-blue text-sm mb-3 line-clamp-2">
            {business.description}
          </p>
        )}
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-stoneclough-gray-blue">
            <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{business.address}</span>
          </div>
          
          {business.phone && (
            <div className="flex items-center text-sm text-stoneclough-gray-blue">
              <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>{business.phone}</span>
            </div>
          )}
          
          {business.email && (
            <div className="flex items-center text-sm text-stoneclough-gray-blue">
              <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>{business.email}</span>
            </div>
          )}
          
          {business.website && (
            <div className="flex items-center text-sm text-stoneclough-gray-blue">
              <Globe className="w-4 h-4 mr-2 flex-shrink-0" />
              <a 
                href={business.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-stoneclough-blue transition-colors truncate"
              >
                {business.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className="flex text-stoneclough-yellow">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <span className="ml-2 text-sm text-stoneclough-gray-blue">(Reviews)</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-stoneclough-blue hover:text-stoneclough-blue/90"
            onClick={() => onViewDetails?.(business.id)}
          >
            View Details
          </Button>
        </div>
        
        <div className="pt-3 border-t border-stoneclough-blue/20">
          <Badge variant="outline" className="text-xs">
            {categoryLabels[business.category]}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
