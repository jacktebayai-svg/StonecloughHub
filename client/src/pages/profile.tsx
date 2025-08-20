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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { User, Building2, Star, Settings, Sparkles, Shield, Calendar, ArrowRight, Plus, X } from "lucide-react";
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-slate-600 font-medium text-lg">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="border-0 shadow-2xl max-w-md mx-auto">
          <CardContent className="p-12 text-center">
            <motion.div 
              className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-slate-100 to-blue-100 mb-6"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <User className="h-8 w-8 text-blue-600" />
            </motion.div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              Access Required
            </h3>
            <p className="text-slate-600 text-lg">
              Please log in to view your profile.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-16 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-10 -right-10 w-72 h-72 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-100 to-blue-100 text-slate-800 px-6 py-3 rounded-full mb-8 shadow-lg"
              >
                <Sparkles className="h-5 w-5 text-emerald-600" />
                Welcome Back, {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                <User className="h-4 w-4 text-blue-500" />
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-4xl md:text-6xl font-bold text-slate-900 mb-6"
              >
                My
                <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Profile
                </span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto leading-relaxed"
              >
                Manage your personal information, business listings, and community connections.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="flex flex-wrap items-center justify-center gap-4"
              >
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 px-4 py-2 text-base font-medium">
                  <Calendar className="h-4 w-4 mr-2" />
                  Member Since {user?.created_at ? new Date(user.created_at).getFullYear() : 'Recently'}
                </Badge>
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 px-4 py-2 text-base font-medium">
                  <Building2 className="h-4 w-4 mr-2" />
                  {userBusinesses?.length || 0} Business{userBusinesses?.length !== 1 ? 'es' : ''}
                </Badge>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-100 p-2 rounded-xl">
            <TabsTrigger 
              value="personal" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg font-semibold transition-all duration-300 flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              Personal Details
            </TabsTrigger>
            <TabsTrigger 
              value="business" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg font-semibold transition-all duration-300 flex items-center gap-2"
            >
              <Building2 className="h-4 w-4" />
              My Businesses
            </TabsTrigger>
            <TabsTrigger 
              value="skills" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg font-semibold transition-all duration-300 flex items-center gap-2"
            >
              <Star className="h-4 w-4" />
              My Skills
            </TabsTrigger>
            <TabsTrigger 
              value="account" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg font-semibold transition-all duration-300 flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Account Settings
            </TabsTrigger>
          </TabsList>

          {/* Personal Details Tab */}
          <TabsContent value="personal">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>
                <CardHeader className="pb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <motion.div 
                      className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <User className="h-6 w-6 text-blue-600" />
                    </motion.div>
                    <div>
                      <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent">
                        Personal Information
                      </CardTitle>
                      <CardDescription className="text-slate-600">
                        Manage your personal details and profile settings.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 px-8 pb-8">
                  <form onSubmit={personalForm.handleSubmit(onSubmitPersonal)} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="profilePictureUrl" className="text-sm font-semibold text-slate-700">Profile Picture URL</Label>
                        <Input 
                          id="profilePictureUrl" 
                          {...personalForm.register("profilePictureUrl")} 
                          className="mt-2 focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                          placeholder="https://example.com/your-photo.jpg"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone" className="text-sm font-semibold text-slate-700">Phone Number</Label>
                        <Input 
                          id="phone" 
                          {...personalForm.register("phone")} 
                          className="mt-2 focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                          placeholder="Your phone number"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="bio" className="text-sm font-semibold text-slate-700">Bio</Label>
                      <Textarea 
                        id="bio" 
                        {...personalForm.register("bio")} 
                        className="mt-2 min-h-[100px] focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="address" className="text-sm font-semibold text-slate-700">Address</Label>
                      <Input 
                        id="address" 
                        {...personalForm.register("address")} 
                        className="mt-2 focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                        placeholder="Your address"
                      />
                    </div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        type="submit" 
                        disabled={updateProfileMutation.isPending}
                        size="lg"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl shadow-lg font-semibold"
                      >
                        {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                        {!updateProfileMutation.isPending && <ArrowRight className="ml-2 h-5 w-5" />}
                      </Button>
                    </motion.div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* My Businesses Tab */}
          <TabsContent value="business">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-blue-600"></div>
                <CardHeader className="pb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <motion.div 
                      className="p-2 rounded-lg bg-gradient-to-br from-emerald-100 to-blue-100"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <Building2 className="h-6 w-6 text-emerald-600" />
                    </motion.div>
                    <div>
                      <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent">
                        My Businesses
                      </CardTitle>
                      <CardDescription className="text-slate-600">
                        Add or manage your business listings and showcase your services.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-8 px-8 pb-8">
                  <div>
                    <div className="flex items-center gap-2 mb-6">
                      <Plus className="h-5 w-5 text-blue-600" />
                      <h4 className="text-xl font-bold text-slate-900">Add New Business</h4>
                    </div>
                  <form onSubmit={businessForm.handleSubmit(onSubmitBusiness)} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="businessName" className="text-sm font-semibold text-slate-700">Business Name *</Label>
                        <Input 
                          id="businessName" 
                          {...businessForm.register("name")} 
                          className="mt-2 focus:ring-2 focus:ring-emerald-500 transition-all duration-300"
                          placeholder="Your business name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="businessCategory" className="text-sm font-semibold text-slate-700">Category</Label>
                        <Input 
                          id="businessCategory" 
                          {...businessForm.register("category")} 
                          className="mt-2 focus:ring-2 focus:ring-emerald-500 transition-all duration-300"
                          placeholder="e.g., Restaurant, Retail, Services"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="businessDescription" className="text-sm font-semibold text-slate-700">Description</Label>
                      <Textarea 
                        id="businessDescription" 
                        {...businessForm.register("description")} 
                        className="mt-2 min-h-[100px] focus:ring-2 focus:ring-emerald-500 transition-all duration-300"
                        placeholder="Describe your business..."
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="businessAddress" className="text-sm font-semibold text-slate-700">Address</Label>
                        <Input 
                          id="businessAddress" 
                          {...businessForm.register("address")} 
                          className="mt-2 focus:ring-2 focus:ring-emerald-500 transition-all duration-300"
                          placeholder="Business address"
                        />
                      </div>
                      <div>
                        <Label htmlFor="businessPhone" className="text-sm font-semibold text-slate-700">Phone</Label>
                        <Input 
                          id="businessPhone" 
                          {...businessForm.register("phone")} 
                          className="mt-2 focus:ring-2 focus:ring-emerald-500 transition-all duration-300"
                          placeholder="Business phone"
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="businessEmail" className="text-sm font-semibold text-slate-700">Email</Label>
                        <Input 
                          id="businessEmail" 
                          {...businessForm.register("email")} 
                          className="mt-2 focus:ring-2 focus:ring-emerald-500 transition-all duration-300"
                          placeholder="business@example.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="businessWebsite" className="text-sm font-semibold text-slate-700">Website</Label>
                        <Input 
                          id="businessWebsite" 
                          {...businessForm.register("website")} 
                          className="mt-2 focus:ring-2 focus:ring-emerald-500 transition-all duration-300"
                          placeholder="https://yourbusiness.com"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="businessImageUrl" className="text-sm font-semibold text-slate-700">Image URL</Label>
                      <Input 
                        id="businessImageUrl" 
                        {...businessForm.register("imageUrl")} 
                        className="mt-2 focus:ring-2 focus:ring-emerald-500 transition-all duration-300"
                        placeholder="https://example.com/business-photo.jpg"
                      />
                    </div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        type="submit" 
                        disabled={createBusinessMutation.isPending}
                        size="lg"
                        className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl shadow-lg font-semibold"
                      >
                        {createBusinessMutation.isPending ? "Adding..." : "Add Business"}
                        {!createBusinessMutation.isPending && <Plus className="ml-2 h-5 w-5" />}
                      </Button>
                    </motion.div>
                  </form>
                </div>
              </Card>

              {/* Current Businesses */}
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Building2 className="h-5 w-5 text-emerald-600" />
                  <h4 className="text-xl font-bold text-slate-900">Your Current Businesses</h4>
                </div>
                {isBusinessesLoading ? (
                  <div className="text-center py-8">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3"
                    />
                    <p className="text-slate-600">Loading your businesses...</p>
                  </div>
                ) : userBusinesses && userBusinesses.length > 0 ? (
                  <div className="grid gap-6">
                    {userBusinesses.map((business: any, index: number) => (
                      <motion.div
                        key={business.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <BusinessCard business={business} />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <Card className="border-2 border-dashed border-slate-200 hover:border-slate-300 transition-colors">
                    <CardContent className="p-12 text-center">
                      <motion.div 
                        className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-slate-100 to-emerald-100 mb-4"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <Building2 className="h-8 w-8 text-emerald-600" />
                      </motion.div>
                      <p className="text-slate-600 text-lg font-medium">No businesses added yet.</p>
                      <p className="text-slate-500 text-sm mt-2">Add your first business using the form above!</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </motion.div>
          </TabsContent>

          {/* My Skills Tab */}
          <TabsContent value="skills">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-pink-600"></div>
                <CardHeader className="pb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <motion.div 
                      className="p-2 rounded-lg bg-gradient-to-br from-orange-100 to-pink-100"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <Star className="h-6 w-6 text-orange-600" />
                    </motion.div>
                    <div>
                      <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent">
                        My Skills
                      </CardTitle>
                      <CardDescription className="text-slate-600">
                        Add or manage your professional skills and expertise.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-8 px-8 pb-8">
                  <div>
                    <div className="flex items-center gap-2 mb-6">
                      <Plus className="h-5 w-5 text-orange-600" />
                      <h4 className="text-xl font-bold text-slate-900">Add New Skill</h4>
                    </div>
                    <form onSubmit={skillForm.handleSubmit(onSubmitSkill)} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="skillName" className="text-sm font-semibold text-slate-700">Skill Name *</Label>
                          <Input 
                            id="skillName" 
                            {...skillForm.register("name")} 
                            className="mt-2 focus:ring-2 focus:ring-orange-500 transition-all duration-300"
                            placeholder="e.g., Web Development, Marketing"
                          />
                        </div>
                        <div>
                          <Label htmlFor="skillLevel" className="text-sm font-semibold text-slate-700">Level (Optional)</Label>
                          <Input 
                            id="skillLevel" 
                            {...skillForm.register("level")} 
                            className="mt-2 focus:ring-2 focus:ring-orange-500 transition-all duration-300"
                            placeholder="e.g., Expert, Intermediate, Beginner"
                          />
                        </div>
                      </div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button 
                          type="submit" 
                          disabled={addSkillMutation.isPending}
                          size="lg"
                          className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 text-white px-8 py-3 rounded-xl shadow-lg font-semibold"
                        >
                          {addSkillMutation.isPending ? "Adding..." : "Add Skill"}
                          {!addSkillMutation.isPending && <Plus className="ml-2 h-5 w-5" />}
                        </Button>
                      </motion.div>
                    </form>
                  </div>
                </CardContent>
              </Card>
              
              {/* Current Skills */}
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Star className="h-5 w-5 text-orange-600" />
                  <h4 className="text-xl font-bold text-slate-900">Your Current Skills</h4>
                </div>
                {isSkillsLoading ? (
                  <div className="text-center py-8">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-8 w-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-3"
                    />
                    <p className="text-slate-600">Loading your skills...</p>
                  </div>
                ) : userSkills && userSkills.length > 0 ? (
                  <div className="grid gap-4">
                    {userSkills.map((skill: any, index: number) => (
                      <motion.div
                        key={skill.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <motion.div 
                                className="p-2 rounded-lg bg-gradient-to-br from-orange-100 to-pink-100"
                                whileHover={{ scale: 1.1 }}
                              >
                                <Star className="h-4 w-4 text-orange-600" />
                              </motion.div>
                              <div>
                                <h5 className="font-bold text-slate-900">{skill.name}</h5>
                                {skill.level && (
                                  <Badge className="bg-orange-100 text-orange-800 mt-1">
                                    {skill.level}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button 
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSkillMutation.mutate(skill.id)}
                                disabled={removeSkillMutation.isPending}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                {removeSkillMutation.isPending ? "Removing..." : (
                                  <X className="h-4 w-4" />
                                )}
                              </Button>
                            </motion.div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <Card className="border-2 border-dashed border-slate-200 hover:border-slate-300 transition-colors">
                    <CardContent className="p-12 text-center">
                      <motion.div 
                        className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-slate-100 to-orange-100 mb-4"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <Star className="h-8 w-8 text-orange-600" />
                      </motion.div>
                      <p className="text-slate-600 text-lg font-medium">No skills added yet.</p>
                      <p className="text-slate-500 text-sm mt-2">Add your first skill using the form above!</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </motion.div>
          </TabsContent>

          {/* Account Settings Tab */}
          <TabsContent value="account">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              {/* Account Information */}
              <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-green-600"></div>
                <CardHeader className="pb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <motion.div 
                      className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-green-100"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <Settings className="h-6 w-6 text-blue-600" />
                    </motion.div>
                    <div>
                      <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent">
                        Account Information
                      </CardTitle>
                      <CardDescription className="text-slate-600">
                        View your account details and membership information.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 px-8 pb-8">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-semibold text-slate-700">Email Address</Label>
                      <Input 
                        value={user?.email || ''} 
                        disabled 
                        className="mt-2 bg-slate-50 border-slate-200 text-slate-600"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-slate-700">Full Name</Label>
                      <Input 
                        value={user?.user_metadata?.full_name || ''} 
                        disabled 
                        className="mt-2 bg-slate-50 border-slate-200 text-slate-600"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-slate-700">Member Since</Label>
                    <Input 
                      value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'} 
                      disabled 
                      className="mt-2 bg-slate-50 border-slate-200 text-slate-600"
                    />
                  </div>
                  <div className="pt-4">
                    <div className="flex items-center gap-4">
                      <Badge className="bg-green-100 text-green-800 px-4 py-2 font-medium">
                        ✓ Account Active
                      </Badge>
                      <Badge className="bg-blue-100 text-blue-800 px-4 py-2 font-medium">
                        Community Member
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-600"></div>
                <CardHeader className="pb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <motion.div 
                      className="p-2 rounded-lg bg-gradient-to-br from-red-100 to-orange-100"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <Shield className="h-6 w-6 text-red-600" />
                    </motion.div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-red-600">
                        Danger Zone
                      </CardTitle>
                      <CardDescription className="text-slate-600">
                        Irreversible actions that will permanently affect your account.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <motion.div 
                          className="p-2 rounded-lg bg-red-100"
                          whileHover={{ scale: 1.1 }}
                        >
                          <Shield className="h-6 w-6 text-red-600" />
                        </motion.div>
                        <div className="flex-1">
                          <h4 className="font-bold text-red-800 text-lg mb-2">Delete Account</h4>
                          <p className="text-red-700 mb-4 leading-relaxed">
                            Permanently delete your account and all associated data including profile information, business listings, and community activity. This action cannot be undone.
                          </p>
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button 
                              variant="destructive"
                              size="lg"
                              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg font-semibold"
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
                              Delete Account Permanently
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
