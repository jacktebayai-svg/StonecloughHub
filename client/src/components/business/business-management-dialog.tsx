import { useState } from "react";
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
import type { Business } from "@shared/schema";

const businessSchema = z.object({
  name: z.string().min(1, "Business name is required"),
  description: z.string().optional(),
  category: z.enum(['restaurant_cafe', 'retail_shopping', 'health_beauty', 'professional_services', 'home_garden', 'other']),
  address: z.string().min(1, "Address is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  imageUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  isVerified: z.boolean().optional(),
  isPremium: z.boolean().optional(),
  isPromoted: z.boolean().optional(),
});

const categoryLabels = {
  restaurant_cafe: "Restaurant & Cafe",
  retail_shopping: "Retail & Shopping", 
  health_beauty: "Health & Beauty",
  professional_services: "Professional Services",
  home_garden: "Home & Garden",
  other: "Other"
};

interface BusinessManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  business?: Business;
  mode: "create" | "edit";
  userId?: string;
}

export function BusinessManagementDialog({
  open,
  onOpenChange,
  business,
  mode,
  userId
}: BusinessManagementDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof businessSchema>>({
    resolver: zodResolver(businessSchema),
    defaultValues: business ? {
      name: business.name,
      description: business.description || "",
      category: business.category,
      address: business.address,
      phone: business.phone || "",
      email: business.email || "",
      website: business.website || "",
      imageUrl: business.imageUrl || "",
      isVerified: business.isVerified ?? false,
      isPremium: business.isPremium ?? false,
      isPromoted: business.isPromoted ?? false,
    } : {
      name: "",
      description: "",
      category: "other",
      address: "",
      phone: "",
      email: "",
      website: "",
      imageUrl: "",
      isVerified: false,
      isPremium: false,
      isPromoted: false,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: z.infer<typeof businessSchema>) =>
      apiRequest("/api/businesses", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/businesses"] });
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ["userBusinesses", userId] });
      }
      toast({ title: "Business created successfully" });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create business", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: z.infer<typeof businessSchema>) =>
      apiRequest(`/api/businesses/${business?.id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/businesses"] });
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ["userBusinesses", userId] });
      }
      toast({ title: "Business updated successfully" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update business", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest(`/api/businesses/${business?.id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/businesses"] });
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ["userBusinesses", userId] });
      }
      toast({ title: "Business deleted successfully" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to delete business", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const onSubmit = (data: z.infer<typeof businessSchema>) => {
    if (mode === "create") {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate(data);
    }
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this business? This action cannot be undone.")) {
      deleteMutation.mutate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add New Business" : "Edit Business"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create" 
              ? "Fill in the details for your business listing." 
              : "Update your business information."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-stoneclough-blue">Basic Information</h4>
            
            <div>
              <Label htmlFor="name">Business Name *</Label>
              <Input id="name" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Describe your business and services..."
                {...form.register("description")} 
              />
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select 
                onValueChange={(value) => form.setValue("category", value as any)} 
                defaultValue={form.watch("category")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
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
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-stoneclough-blue">Contact Information</h4>
            
            <div>
              <Label htmlFor="address">Address *</Label>
              <Input id="address" {...form.register("address")} />
              {form.formState.errors.address && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.address.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" {...form.register("phone")} />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...form.register("email")} />
              {form.formState.errors.email && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="website">Website</Label>
              <Input 
                id="website" 
                type="url" 
                placeholder="https://example.com"
                {...form.register("website")} 
              />
              {form.formState.errors.website && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.website.message}
                </p>
              )}
            </div>
          </div>

          {/* Media */}
          <div className="space-y-4">
            <h4 className="font-semibold text-stoneclough-blue">Media</h4>
            
            <div>
              <Label htmlFor="imageUrl">Business Image URL</Label>
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
              <p className="text-sm text-muted-foreground mt-1">
                Add a high-quality image to showcase your business
              </p>
            </div>
          </div>

          {/* Premium Settings - Only show for edit mode or admin users */}
          {(mode === "edit" || userId) && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-semibold text-stoneclough-blue">Premium Settings</h4>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="isPremium"
                  checked={form.watch("isPremium")}
                  onCheckedChange={(checked) => form.setValue("isPremium", checked)}
                />
                <Label htmlFor="isPremium">Premium Listing</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isPromoted"
                  checked={form.watch("isPromoted")}
                  onCheckedChange={(checked) => form.setValue("isPromoted", checked)}
                />
                <Label htmlFor="isPromoted">Promoted on Homepage</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isVerified"
                  checked={form.watch("isVerified")}
                  onCheckedChange={(checked) => form.setValue("isVerified", checked)}
                />
                <Label htmlFor="isVerified">Verified Business</Label>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <div>
              {mode === "edit" && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete Business"}
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
                  : (mode === "create" ? "Create Business" : "Update Business")
                }
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
