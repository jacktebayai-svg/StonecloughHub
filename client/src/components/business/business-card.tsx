import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Star } from "lucide-react";
import type { Business } from "@shared/schema";

interface BusinessCardProps {
  business: Business;
  onViewDetails?: (id: string) => void;
}

const categoryLabels = {
  restaurant_cafe: "Restaurant & Cafe",
  retail_shopping: "Retail & Shopping", 
  health_beauty: "Health & Beauty",
  professional_services: "Professional Services",
  home_garden: "Home & Garden",
  other: "Other"
};

export function BusinessCard({ business, onViewDetails }: BusinessCardProps) {
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
          <h4 className="font-semibold text-lg text-hub-dark">{business.name}</h4>
          <div className="flex gap-2">
            {business.isVerified && (
              <Badge className="bg-hub-green text-white">Verified</Badge>
            )}
            {business.isPremium && (
              <Badge variant="secondary">Premium</Badge>
            )}
          </div>
        </div>
        
        {business.description && (
          <p className="text-hub-gray text-sm mb-3 line-clamp-2">
            {business.description}
          </p>
        )}
        
        <div className="flex items-center text-sm text-hub-gray mb-3">
          <MapPin className="w-4 h-4 mr-2" />
          <span>{business.address}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <span className="ml-2 text-sm text-hub-gray">(Reviews)</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-hub-blue hover:text-hub-dark-blue"
            onClick={() => onViewDetails?.(business.id)}
          >
            View Details
          </Button>
        </div>
        
        <div className="mt-3 pt-3 border-t border-slate-200">
          <Badge variant="outline" className="text-xs">
            {categoryLabels[business.category]}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
