import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThumbsUp, MessageCircle, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { ForumDiscussion } from "@shared/schema";

interface DiscussionCardProps {
  discussion: ForumDiscussion;
  onJoinDiscussion?: (id: string) => void;
}

const categoryLabels = {
  general: "General Discussion",
  local_events: "Local Events",
  business_recommendations: "Business Recommendations",
  council_planning: "Council & Planning",
  buy_sell: "Buy & Sell"
};

const categoryColors = {
  general: "bg-blue-100 text-hub-blue",
  local_events: "bg-purple-100 text-purple-600",
  business_recommendations: "bg-green-100 text-hub-green",
  council_planning: "bg-orange-100 text-orange-600",
  buy_sell: "bg-gray-100 text-gray-600"
};

export function DiscussionCard({ discussion, onJoinDiscussion }: DiscussionCardProps) {
  const timeAgo = formatDistanceToNow(new Date(discussion.createdAt), { addSuffix: true });
  
  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-hub-blue text-white rounded-full flex items-center justify-center font-semibold text-sm">
              {discussion.authorInitials}
            </div>
            <div>
              <h4 className="font-semibold text-hub-dark">{discussion.authorName}</h4>
              <p className="text-sm text-hub-gray">{timeAgo}</p>
            </div>
          </div>
          <Badge className={categoryColors[discussion.category] || categoryColors.general}>
            {categoryLabels[discussion.category]}
          </Badge>
        </div>
        
        <h3 className="text-lg font-semibold text-hub-dark mb-3">
          {discussion.title}
        </h3>
        
        <p className="text-hub-gray mb-4 line-clamp-2">
          {discussion.content}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-hub-gray">
            <span className="flex items-center">
              <ThumbsUp className="w-4 h-4 mr-1" />
              {discussion.likes} likes
            </span>
            <span className="flex items-center">
              <MessageCircle className="w-4 h-4 mr-1" />
              {discussion.replyCount} replies
            </span>
            <span className="flex items-center">
              <Eye className="w-4 h-4 mr-1" />
              {discussion.views} views
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-hub-blue hover:text-hub-dark-blue"
            onClick={() => onJoinDiscussion?.(discussion.id)}
          >
            Join Discussion →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
