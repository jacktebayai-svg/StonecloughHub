import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { BlogArticle } from "@shared/schema";

const articleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(50, "Content must be at least 50 characters"),
  excerpt: z.string().min(10, "Excerpt must be at least 10 characters"),
  category: z.string().min(1, "Category is required"),
  imageUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  readTime: z.number().min(1, "Read time must be at least 1 minute"),
  authorName: z.string().min(1, "Author name is required"),
  isFeatured: z.boolean().optional(),
  isPromoted: z.boolean().optional(),
});

const categories = [
  "Featured Analysis",
  "Community News",
  "Business Spotlight",
  "Planning & Development",
  "Local Events",
  "Council Updates",
  "Data Insights",
  "Opinion"
];

interface ArticleManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article?: BlogArticle;
  mode: "create" | "edit";
}

export function ArticleManagementDialog({
  open,
  onOpenChange,
  article,
  mode,
}: ArticleManagementDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Calculate estimated read time based on content length
  const calculateReadTime = (content: string): number => {
    const wordsPerMinute = 200;
    const wordCount = content.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  };

  const form = useForm<z.infer<typeof articleSchema>>({
    resolver: zodResolver(articleSchema),
    defaultValues: article ? {
      title: article.title,
      content: article.content,
      excerpt: article.excerpt,
      category: article.category,
      imageUrl: article.imageUrl || "",
      readTime: article.readTime,
      authorName: article.authorName,
      isFeatured: article.isFeatured,
      isPromoted: article.isPromoted,
    } : {
      title: "",
      content: "",
      excerpt: "",
      category: "",
      imageUrl: "",
      readTime: 1,
      authorName: "",
      isFeatured: false,
      isPromoted: false,
    },
  });

  // Auto-calculate read time when content changes
  const watchedContent = form.watch("content");
  React.useEffect(() => {
    if (watchedContent) {
      const estimatedTime = calculateReadTime(watchedContent);
      form.setValue("readTime", estimatedTime);
    }
  }, [watchedContent, form]);

  const createMutation = useMutation({
    mutationFn: (data: z.infer<typeof articleSchema>) =>
      apiRequest("/api/blog/articles", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/blog/articles/featured"] });
      queryClient.invalidateQueries({ queryKey: ["/api/blog/articles/promoted"] });
      toast({ title: "Article created successfully" });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create article", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: z.infer<typeof articleSchema>) =>
      apiRequest(`/api/blog/articles/${article?.id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/blog/articles/featured"] });
      queryClient.invalidateQueries({ queryKey: ["/api/blog/articles/promoted"] });
      toast({ title: "Article updated successfully" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update article", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest(`/api/blog/articles/${article?.id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/blog/articles/featured"] });
      queryClient.invalidateQueries({ queryKey: ["/api/blog/articles/promoted"] });
      toast({ title: "Article deleted successfully" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to delete article", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const onSubmit = (data: z.infer<typeof articleSchema>) => {
    if (mode === "create") {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate(data);
    }
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this article? This action cannot be undone.")) {
      deleteMutation.mutate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create New Article" : "Edit Article"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create" 
              ? "Write a new blog article for the community." 
              : "Update your article content and settings."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-stoneclough-blue">Article Details</h4>
            
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input 
                id="title" 
                placeholder="Enter a compelling article title..."
                {...form.register("title")} 
              />
              {form.formState.errors.title && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="excerpt">Excerpt *</Label>
              <Textarea 
                id="excerpt" 
                placeholder="Write a brief summary of your article..."
                rows={3}
                {...form.register("excerpt")} 
              />
              {form.formState.errors.excerpt && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.excerpt.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select 
                  onValueChange={(value) => form.setValue("category", value)} 
                  defaultValue={form.watch("category")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.category && (
                  <p className="text-destructive text-sm mt-1">
                    {form.formState.errors.category.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="authorName">Author Name *</Label>
                <Input 
                  id="authorName" 
                  placeholder="Your name"
                  {...form.register("authorName")} 
                />
                {form.formState.errors.authorName && (
                  <p className="text-destructive text-sm mt-1">
                    {form.formState.errors.authorName.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="imageUrl">Featured Image URL</Label>
              <Input 
                id="imageUrl" 
                type="url" 
                placeholder="https://example.com/image.jpg"
                {...form.register("imageUrl")} 
              />
              {form.formState.errors.imageUrl && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.imageUrl.message}
                </p>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4">
            <h4 className="font-semibold text-stoneclough-blue">Content</h4>
            
            <div>
              <Label htmlFor="content">Article Content *</Label>
              <Textarea 
                id="content" 
                placeholder="Write your article content here. Use clear headings, bullet points, and paragraphs to make it easy to read..."
                rows={12}
                className="resize-none"
                {...form.register("content")} 
              />
              {form.formState.errors.content && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.content.message}
                </p>
              )}
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>Estimated read time: {form.watch("readTime")} minutes</span>
                <span>Characters: {form.watch("content")?.length || 0}</span>
              </div>
            </div>
          </div>

          {/* Publishing Settings */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-semibold text-stoneclough-blue">Publishing Settings</h4>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="isFeatured"
                checked={form.watch("isFeatured")}
                onCheckedChange={(checked) => form.setValue("isFeatured", checked)}
              />
              <Label htmlFor="isFeatured" className="text-sm">
                Featured Article (appears at top of blog)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isPromoted"
                checked={form.watch("isPromoted")}
                onCheckedChange={(checked) => form.setValue("isPromoted", checked)}
              />
              <Label htmlFor="isPromoted" className="text-sm">
                Promoted Article (appears on homepage)
              </Label>
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            <div>
              {mode === "edit" && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete Article"}
                </Button>
              )}
            </div>
            <div className="flex space-x-2">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending 
                  ? (mode === "create" ? "Creating..." : "Updating...") 
                  : (mode === "create" ? "Publish Article" : "Update Article")
                }
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
