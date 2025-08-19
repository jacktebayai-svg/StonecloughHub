import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { DiscussionCard } from "@/components/forum/discussion-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

const categoryLabels = {
  general: "General Discussion",
  local_events: "Local Events", 
  business_recommendations: "Business Recommendations",
  council_planning: "Council & Planning",
  buy_sell: "Buy & Sell",
  green_space: "Green Space",
};

const newDiscussionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  imageUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  category: z.enum(['general', 'local_events', 'business_recommendations', 'council_planning', 'buy_sell', 'green_space']),
});

export default function Forum() {
  const [selectedCategory, setSelectedCategory] = useState<string>("general");
  const [isNewDiscussionOpen, setIsNewDiscussionOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  const { data: discussions, isLoading } = useQuery({
    queryKey: ["/api/forum/discussions", { category: selectedCategory }],
  });

  const newDiscussionForm = useForm<z.infer<typeof newDiscussionSchema>>({
    resolver: zodResolver(newDiscussionSchema),
    defaultValues: {
      category: "general",
    },
  });

  const createDiscussionMutation = useMutation({
    mutationFn: (data: z.infer<typeof newDiscussionSchema>) =>
      apiRequest("/api/forum/discussions", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forum/discussions"] });
      toast({ title: "Discussion created successfully" });
      newDiscussionForm.reset();
      setIsNewDiscussionOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Failed to create discussion", description: error.message, variant: "destructive" });
    },
  });

  const onSubmitNewDiscussion = (data: z.infer<typeof newDiscussionSchema>) => {
    if (!isAuthenticated) {
      toast({ title: "Not logged in", description: "Please log in to create a discussion.", variant: "destructive" });
      return;
    }
    createDiscussionMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-stoneclough-light">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-stoneclough-blue mb-4">Community Forum</h1>
          <p className="text-lg text-stoneclough-gray-blue max-w-3xl mx-auto">
            Connect with your neighbors, ask questions, share recommendations, and organize local initiatives.
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Forum categories sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-stoneclough-light border border-stoneclough-blue/20">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg text-stoneclough-blue mb-4">Categories</h3>
                <nav className="space-y-2">
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedCategory(key)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left ${
                        selectedCategory === key
                          ? 'bg-stoneclough-blue text-stoneclough-light'
                          : 'hover:bg-stoneclough-light/50 text-stoneclough-gray-blue'
                      }`}
                    >
                      <span>{label}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        selectedCategory === key
                          ? 'bg-stoneclough-light bg-opacity-20'
                          : 'bg-stoneclough-light/80'
                      }`}>
                        0
                      </span>
                    </button>
                  ))}
                </nav>
                <Button 
                  className="w-full mt-6 bg-stoneclough-gray-blue hover:bg-stoneclough-gray-blue/90 text-stoneclough-light"
                  onClick={() => setIsNewDiscussionOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Discussion
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Forum discussions */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <Card className="bg-stoneclough-light border border-stoneclough-blue/20">
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-3 mb-4">
                          <div className="w-10 h-10 bg-stoneclough-light/80 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-stoneclough-light/80 rounded mb-2"></div>
                            <div className="h-3 bg-stoneclough-light/80 rounded"></div>
                          </div>
                        </div>
                        <div className="h-5 bg-stoneclough-light/80 rounded mb-3"></div>
                        <div className="h-4 bg-stoneclough-light/80 rounded mb-2"></div>
                        <div className="h-4 bg-stoneclough-light/80 rounded"></div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            ) : discussions && discussions.length > 0 ? (
              <>
                <div className="space-y-6">
                  {discussions.map((discussion) => (
                    <DiscussionCard key={discussion.id} discussion={discussion} />
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex justify-center mt-12">
                  <nav className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button size="sm" className="bg-stoneclough-blue text-stoneclough-light">1</Button>
                    <Button variant="ghost" size="sm">2</Button>
                    <Button variant="ghost" size="sm">3</Button>
                    <Button variant="ghost" size="sm">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </nav>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-stoneclough-gray-blue text-lg">
                  No discussions found in this category.
                </p>
                <p className="text-sm text-stoneclough-gray-blue mt-2">
                  Be the first to start a conversation!
                </p>
                <Button className="mt-4 bg-stoneclough-gray-blue hover:bg-stoneclough-gray-blue/90 text-stoneclough-light">
                  <Plus className="w-4 h-4 mr-2" />
                  Start New Discussion
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Footer />

      {/* New Discussion Dialog */}
      <Dialog open={isNewDiscussionOpen} onOpenChange={setIsNewDiscussionOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Discussion</DialogTitle>
            <DialogDescription>Fill in the details for your new forum discussion.</DialogDescription>
          </DialogHeader>
          <form onSubmit={newDiscussionForm.handleSubmit(onSubmitNewDiscussion)} className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...newDiscussionForm.register("title")} />
              {newDiscussionForm.formState.errors.title && (
                <p className="text-red-500 text-sm mt-1">{newDiscussionForm.formState.errors.title.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea id="content" {...newDiscussionForm.register("content")} />
              {newDiscussionForm.formState.errors.content && (
                <p className="text-red-500 text-sm mt-1">{newDiscussionForm.formState.errors.content.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="imageUrl">Image URL (Optional)</Label>
              <Input id="imageUrl" {...newDiscussionForm.register("imageUrl")} />
              {newDiscussionForm.formState.errors.imageUrl && (
                <p className="text-red-500 text-sm mt-1">{newDiscussionForm.formState.errors.imageUrl.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select onValueChange={(value) => newDiscussionForm.setValue("category", value as "general")} defaultValue={newDiscussionForm.watch("category")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {newDiscussionForm.formState.errors.category && (
                <p className="text-red-500 text-sm mt-1">{newDiscussionForm.formState.errors.category.message}</p>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={createDiscussionMutation.isPending}>
                {createDiscussionMutation.isPending ? "Creating..." : "Create Discussion"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
