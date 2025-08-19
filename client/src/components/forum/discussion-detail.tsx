import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  ThumbsUp, 
  MessageCircle, 
  Eye, 
  ArrowLeft, 
  Send, 
  Edit,
  Trash2,
  Flag
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { ForumDiscussion, ForumReply } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const replySchema = z.object({
  content: z.string().min(1, "Reply content is required"),
});

const categoryLabels = {
  general: "General Discussion",
  local_events: "Local Events",
  business_recommendations: "Business Recommendations",
  council_planning: "Council & Planning",
  buy_sell: "Buy & Sell",
  green_space: "Green Space",
};

const categoryColors = {
  general: "bg-stoneclough-blue/10 text-stoneclough-blue",
  local_events: "bg-stoneclough-orange/10 text-stoneclough-orange",
  business_recommendations: "bg-stoneclough-gray-blue/10 text-stoneclough-gray-blue",
  council_planning: "bg-stoneclough-yellow/10 text-stoneclough-yellow",
  buy_sell: "bg-stoneclough-light text-stoneclough-gray-blue",
  green_space: "bg-green-100 text-green-800",
};

interface DiscussionDetailProps {
  discussionId: string;
  onBack: () => void;
}

export function DiscussionDetail({ discussionId, onBack }: DiscussionDetailProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);

  const { data: discussion, isLoading: discussionLoading } = useQuery({
    queryKey: [`/api/forum/discussions/${discussionId}`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/forum/discussions/${discussionId}`);
      return await response.json() as ForumDiscussion;
    },
  });

  const { data: replies, isLoading: repliesLoading } = useQuery({
    queryKey: [`/api/forum/discussions/${discussionId}/replies`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/forum/discussions/${discussionId}/replies`);
      return await response.json() as ForumReply[];
    },
  });

  const replyForm = useForm<z.infer<typeof replySchema>>({
    resolver: zodResolver(replySchema),
    defaultValues: {
      content: "",
    },
  });

  const createReplyMutation = useMutation({
    mutationFn: (data: z.infer<typeof replySchema>) => {
      // Use user metadata or fallback to email-based name
      const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Anonymous';
      const nameParts = displayName.split(' ');
      const firstName = nameParts[0] || 'A';
      const lastName = nameParts[1] || '';
      
      const replyData = {
        ...data,
        authorName: displayName,
        authorInitials: `${firstName[0]}${lastName[0] || ''}`,
      };
      return apiRequest("POST", `/api/forum/discussions/${discussionId}/replies`, replyData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/forum/discussions/${discussionId}/replies`] 
      });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/forum/discussions/${discussionId}`] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/forum/discussions"] 
      });
      toast({ title: "Reply posted successfully" });
      replyForm.reset();
      setIsReplyDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to post reply",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const likeDiscussionMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/forum/discussions/${discussionId}/like`),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/forum/discussions/${discussionId}`] 
      });
      toast({ title: "Discussion liked!" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to like discussion",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmitReply = (data: z.infer<typeof replySchema>) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to post a reply.",
        variant: "destructive",
      });
      return;
    }
    createReplyMutation.mutate(data);
  };

  if (discussionLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-stoneclough-blue">Loading discussion...</p>
      </div>
    );
  }

  if (!discussion) {
    return (
      <div className="text-center py-12">
        <p className="text-stoneclough-gray-blue">Discussion not found.</p>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Forum
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={onBack}
        className="text-stoneclough-blue hover:text-stoneclough-blue/90"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Forum
      </Button>

      {/* Discussion Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-stoneclough-blue text-stoneclough-light rounded-full flex items-center justify-center font-semibold">
                {discussion.authorInitials}
              </div>
              <div>
                <h4 className="font-semibold text-stoneclough-blue">{discussion.authorName}</h4>
                <p className="text-sm text-stoneclough-gray-blue">
                  {formatDistanceToNow(new Date(discussion.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
            <Badge className={categoryColors[discussion.category] || categoryColors.general}>
              {categoryLabels[discussion.category]}
            </Badge>
          </div>

          <h1 className="text-2xl font-bold text-stoneclough-blue mb-4">
            {discussion.title}
          </h1>

          {discussion.imageUrl && (
            <img
              src={discussion.imageUrl}
              alt="Discussion image"
              className="w-full max-w-2xl h-64 object-cover rounded-lg mb-4"
            />
          )}

          <div className="prose max-w-none mb-6">
            <p className="text-stoneclough-gray-blue leading-relaxed whitespace-pre-wrap">
              {discussion.content}
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-stoneclough-blue/20">
            <div className="flex items-center space-x-6 text-sm text-stoneclough-gray-blue">
              <button
                onClick={() => likeDiscussionMutation.mutate()}
                className="flex items-center space-x-1 hover:text-stoneclough-blue transition-colors"
                disabled={!isAuthenticated || likeDiscussionMutation.isPending}
              >
                <ThumbsUp className="w-4 h-4" />
                <span>{discussion.likes} likes</span>
              </button>
              <span className="flex items-center space-x-1">
                <MessageCircle className="w-4 h-4" />
                <span>{discussion.replyCount} replies</span>
              </span>
              <span className="flex items-center space-x-1">
                <Eye className="w-4 h-4" />
                <span>{discussion.views} views</span>
              </span>
            </div>

            <div className="flex space-x-2">
              {isAuthenticated && (
                <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-stoneclough-blue hover:bg-stoneclough-blue/90">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Reply
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Reply to Discussion</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={replyForm.handleSubmit(onSubmitReply)} className="space-y-4">
                      <div>
                        <Label htmlFor="content">Your Reply</Label>
                        <Textarea
                          id="content"
                          placeholder="Share your thoughts..."
                          rows={4}
                          {...replyForm.register("content")}
                        />
                        {replyForm.formState.errors.content && (
                          <p className="text-destructive text-sm mt-1">
                            {replyForm.formState.errors.content.message}
                          </p>
                        )}
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsReplyDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={createReplyMutation.isPending}
                        >
                          {createReplyMutation.isPending ? "Posting..." : "Post Reply"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}

              <Button variant="ghost" size="sm">
                <Flag className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Replies Section */}
      <div>
        <h2 className="text-xl font-semibold text-stoneclough-blue mb-4">
          Replies ({discussion.replyCount})
        </h2>

        {repliesLoading ? (
          <div className="text-center py-8">
            <p className="text-stoneclough-gray-blue">Loading replies...</p>
          </div>
        ) : replies && replies.length > 0 ? (
          <div className="space-y-4">
            {replies.map((reply: ForumReply) => (
              <Card key={reply.id}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-stoneclough-gray-blue text-stoneclough-light rounded-full flex items-center justify-center font-semibold text-sm">
                      {reply.authorInitials}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-stoneclough-blue">{reply.authorName}</h4>
                          <p className="text-xs text-stoneclough-gray-blue">
                            {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        {isAuthenticated && reply.authorId === user?.id && (
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <p className="text-stoneclough-gray-blue text-sm leading-relaxed whitespace-pre-wrap">
                        {reply.content}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-stoneclough-gray-blue">No replies yet.</p>
              <p className="text-sm text-stoneclough-gray-blue mt-2">
                Be the first to share your thoughts!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
