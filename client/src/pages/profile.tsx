import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { BusinessCard } from '@/components/business/business-card'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Profile, Business } from "@shared/schema";

// Define schemas for validation
const personalDetailsSchema = z.object({
  bio: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  profilePictureUrl: z.string().url().optional().or(z.literal("")),
});

const businessDetailsSchema = z.object({
  name: z.string().min(1, "Business name is required"),
  description: z.string().optional(),
  category: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

const skillSchema = z.object({
  name: z.string().min(1, "Skill name is required"),
  level: z.string().optional(),
});

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("personal");

  const { data: profile, isLoading: isProfileLoading, error: profileError } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      try {
        return await api.profile.get(user!.id);
      } catch (error) {
        console.warn('Profile API call failed, using default profile:', error);
        return { id: user!.id, bio: '', phone: '', address: '', profilePictureUrl: '' };
      }
    },
    enabled: isAuthenticated && !!user?.id,
    retry: false,
  });

  const { data: userBusinesses, isLoading: isBusinessesLoading } = useQuery({
    queryKey: ["userBusinesses", user?.id],
    queryFn: async () => {
      try {
        return await api.users.getBusinesses(user!.id);
      } catch (error) {
        console.warn('Businesses API call failed:', error);
        return [];
      }
    },
    enabled: isAuthenticated && !!user?.id,
    retry: false,
  });

  const { data: userSkills, isLoading: isSkillsLoading } = useQuery({
    queryKey: ["userSkills", user?.id],
    queryFn: async () => {
      try {
        return await api.users.getSkills(user!.id);
      } catch (error) {
        console.warn('Skills API call failed:', error);
        return [];
      }
    },
    enabled: isAuthenticated && !!user?.id,
    retry: false,
  });

  // Personal Details Form
  const personalForm = useForm<z.infer<typeof personalDetailsSchema>>({
    resolver: zodResolver(personalDetailsSchema),
    values: {
      bio: profile?.bio || "",
      phone: profile?.phone || "",
      address: profile?.address || "",
      profilePictureUrl: profile?.profilePictureUrl || "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: z.infer<typeof personalDetailsSchema>) =>
      api.profile.update(user!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast({ title: "Profile updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update profile", description: error.message, variant: "destructive" });
    },
  });

  const onSubmitPersonal = (data: z.infer<typeof personalDetailsSchema>) => {
    updateProfileMutation.mutate(data);
  };

  // Business Details Form
  const businessForm = useForm<z.infer<typeof businessDetailsSchema>>({
    resolver: zodResolver(businessDetailsSchema),
  });

  const createBusinessMutation = useMutation({
    mutationFn: (data: z.infer<typeof businessDetailsSchema>) =>
      api.users.createBusiness(user!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userBusinesses", user?.id] });
      toast({ title: "Business added successfully" });
      businessForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Failed to add business", description: error.message, variant: "destructive" });
    },
  });

  const onSubmitBusiness = (data: z.infer<typeof businessDetailsSchema>) => {
    createBusinessMutation.mutate(data);
  };

  // Skills Form
  const skillForm = useForm<z.infer<typeof skillSchema>>({
    resolver: zodResolver(skillSchema),
  });

  const addSkillMutation = useMutation({
    mutationFn: (data: z.infer<typeof skillSchema>) =>
      api.users.addSkill(user!.id, data.name, data.level || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userSkills", user?.id] });
      toast({ title: "Skill added successfully" });
      skillForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Failed to add skill", description: error.message, variant: "destructive" });
    },
  });

  const removeSkillMutation = useMutation({
    mutationFn: (skillId: string) =>
      api.users.removeSkill(user!.id, skillId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userSkills", user?.id] });
      toast({ title: "Skill removed successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to remove skill", description: error.message, variant: "destructive" });
    },
  });

  const onSubmitSkill = (data: z.infer<typeof skillSchema>) => {
    addSkillMutation.mutate(data);
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-3"></div>
          <p className="text-gray-600 font-medium text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-700 font-medium">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">My Profile</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal">Personal Details</TabsTrigger>
            <TabsTrigger value="business">My Businesses</TabsTrigger>
            <TabsTrigger value="skills">My Skills</TabsTrigger>
            <TabsTrigger value="account">Account Settings</TabsTrigger>
          </TabsList>

          {/* Personal Details Tab */}
          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Manage your personal details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={personalForm.handleSubmit(onSubmitPersonal)} className="space-y-4">
                  <div>
                    <Label htmlFor="profilePictureUrl">Profile Picture URL</Label>
                    <Input id="profilePictureUrl" {...personalForm.register("profilePictureUrl")} />
                  </div>
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea id="bio" {...personalForm.register("bio")} />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" {...personalForm.register("phone")} />
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" {...personalForm.register("address")} />
                  </div>
                  <Button type="submit" disabled={updateProfileMutation.isPending}>
                    {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Businesses Tab */}
          <TabsContent value="business">
            <Card>
              <CardHeader>
                <CardTitle>My Businesses</CardTitle>
                <CardDescription>Add or manage your business listings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <h4 className="text-lg font-semibold">Add New Business</h4>
                <form onSubmit={businessForm.handleSubmit(onSubmitBusiness)} className="space-y-4">
                  <div>
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input id="businessName" {...businessForm.register("name")} />
                  </div>
                  <div>
                    <Label htmlFor="businessDescription">Description</Label>
                    <Textarea id="businessDescription" {...businessForm.register("description")} />
                  </div>
                  <div>
                    <Label htmlFor="businessCategory">Category</Label>
                    <Input id="businessCategory" {...businessForm.register("category")} />
                  </div>
                  <div>
                    <Label htmlFor="businessAddress">Address</Label>
                    <Input id="businessAddress" {...businessForm.register("address")} />
                  </div>
                  <div>
                    <Label htmlFor="businessPhone">Phone</Label>
                    <Input id="businessPhone" {...businessForm.register("phone")} />
                  </div>
                  <div>
                    <Label htmlFor="businessEmail">Email</Label>
                    <Input id="businessEmail" {...businessForm.register("email")} />
                  </div>
                  <div>
                    <Label htmlFor="businessWebsite">Website</Label>
                    <Input id="businessWebsite" {...businessForm.register("website")} />
                  </div>
                  <div>
                    <Label htmlFor="businessImageUrl">Image URL</Label>
                    <Input id="businessImageUrl" {...businessForm.register("imageUrl")} />
                  </div>
                  <Button type="submit" disabled={createBusinessMutation.isPending}>
                    {createBusinessMutation.isPending ? "Adding..." : "Add Business"}
                  </Button>
                </form>

                <h4 className="text-lg font-semibold mt-8">Your Current Businesses</h4>
                {isBusinessesLoading ? (
                  <p>Loading businesses...</p>
                ) : userBusinesses && userBusinesses.length > 0 ? (
                  <div className="space-y-4">
                    {userBusinesses.map((business: any) => (
                      <BusinessCard key={business.id} business={business} />
                    ))}
                  </div>
                ) : (
                  <p>No businesses added yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Skills Tab */}
          <TabsContent value="skills">
            <Card>
              <CardHeader>
                <CardTitle>My Skills</CardTitle>
                <CardDescription>Add or manage your professional skills.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <h4 className="text-lg font-semibold">Add New Skill</h4>
                <form onSubmit={skillForm.handleSubmit(onSubmitSkill)} className="space-y-4">
                  <div>
                    <Label htmlFor="skillName">Skill Name</Label>
                    <Input id="skillName" {...skillForm.register("name")} />
                  </div>
                  <div>
                    <Label htmlFor="skillLevel">Level (Optional)</Label>
                    <Input id="skillLevel" {...skillForm.register("level")} placeholder="e.g., Expert, Intermediate" />
                  </div>
                  <Button type="submit" disabled={addSkillMutation.isPending}>
                    {addSkillMutation.isPending ? "Adding..." : "Add Skill"}
                  </Button>
                </form>

                <h4 className="text-lg font-semibold mt-8">Your Current Skills</h4>
                {isSkillsLoading ? (
                  <p>Loading skills...</p>
                ) : userSkills && userSkills.length > 0 ? (
                  <div className="space-y-4">
                    {userSkills.map((skill: any) => (
                      <Card key={skill.id} className="p-4 flex justify-between items-center">
                        <span>{skill.name} {skill.level && `(${skill.level})`}</span>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => removeSkillMutation.mutate(skill.id)}
                          disabled={removeSkillMutation.isPending}
                        >
                          {removeSkillMutation.isPending ? "Removing..." : "Remove"}
                        </Button>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p>No skills added yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Settings Tab */}
          <TabsContent value="account">
            <div className="space-y-6">
              {/* Account Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>View your account details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Email</Label>
                    <Input value={user?.email || ''} disabled className="bg-gray-50" />
                  </div>
                  <div>
                    <Label>Full Name</Label>
                    <Input value={user?.user_metadata?.full_name || ''} disabled className="bg-gray-50" />
                  </div>
                  <div>
                    <Label>Member Since</Label>
                    <Input value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'} disabled className="bg-gray-50" />
                  </div>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="text-red-600">Danger Zone</CardTitle>
                  <CardDescription>
                    Irreversible actions that will permanently affect your account.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-semibold text-red-800 mb-2">Delete Account</h4>
                    <p className="text-sm text-red-700 mb-4">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    <Button 
                      variant="destructive"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                          toast({ 
                            title: "Account deletion requested", 
                            description: "Please contact support to complete account deletion.",
                            variant: "destructive" 
                          });
                        }
                      }}
                    >
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
}
