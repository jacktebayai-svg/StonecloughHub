import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DataChart } from "@/components/charts/data-chart";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, BarChart3, Sparkles, TrendingUp, ArrowRight, Users, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

// Define schemas for new survey and survey response
const newSurveySchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  status: z.enum(['draft', 'active', 'closed']),
  questions: z.array(z.object({
    questionText: z.string().min(1, "Question text is required"),
    questionType: z.enum(['text', 'radio', 'checkbox']),
    options: z.union([z.string(), z.array(z.string())]).optional(), // Accept both string and array
  })).min(1, "At least one question is required"),
  endsAt: z.string().optional(), // Date string
});

const surveyResponseSchema = z.record(z.string(), z.union([z.string(), z.array(z.string())]));

export default function Surveys() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isCreateSurveyOpen, setIsCreateSurveyOpen] = useState(false);
  const [isTakeSurveyOpen, setIsTakeSurveyOpen] = useState(false);
  const [selectedSurveyToTake, setSelectedSurveyToTake] = useState<any>(null);

  const { data: surveys, isLoading } = useQuery({
    queryKey: ["/api/surveys"],
    queryFn: () => api.surveys.getAll(),
  });

  const activeSurveys = surveys?.filter(s => s.status === 'active') || [];
  const completedSurveys = surveys?.filter(s => s.status === 'closed') || [];

  // Create Survey Form
  const createSurveyForm = useForm<z.infer<typeof newSurveySchema>>({
    resolver: zodResolver(newSurveySchema),
    defaultValues: {
      status: "draft",
      questions: [{ questionText: "", questionType: "text", options: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: createSurveyForm.control,
    name: "questions",
  });

  const createSurveyMutation = useMutation({
    mutationFn: (data: z.infer<typeof newSurveySchema>) =>
      api.surveys.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/surveys"] });
      toast({ title: "Survey created successfully" });
      createSurveyForm.reset();
      setIsCreateSurveyOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Failed to create survey", description: error.message, variant: "destructive" });
    },
  });

  const onSubmitCreateSurvey = (data: z.infer<typeof newSurveySchema>) => {
    if (!isAuthenticated) {
      toast({ title: "Not logged in", description: "Please log in to create a survey.", variant: "destructive" });
      return;
    }
    // Parse options string into array for radio/checkbox types
    const questionsWithParsedOptions = data.questions.map(q => ({
      ...q,
      options: q.options && typeof q.options === 'string' ? q.options.split(',').map(opt => opt.trim()) : q.options
    }));
    createSurveyMutation.mutate({ ...data, questions: questionsWithParsedOptions });
  };

  // Take Survey Form
  const takeSurveyForm = useForm<z.infer<typeof surveyResponseSchema>>({
    resolver: zodResolver(surveyResponseSchema),
  });

  const createSurveyResponseMutation = useMutation({
    mutationFn: (data: z.infer<typeof surveyResponseSchema>) =>
      api.surveys.submitResponse(selectedSurveyToTake?.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/surveys"] });
      toast({ title: "Survey response submitted successfully" });
      takeSurveyForm.reset();
      setIsTakeSurveyOpen(false);
      setSelectedSurveyToTake(null);
    },
    onError: (error: any) => {
      toast({ title: "Failed to submit response", description: error.message, variant: "destructive" });
    },
  });

  const onSubmitTakeSurvey = (data: z.infer<typeof surveyResponseSchema>) => {
    createSurveyResponseMutation.mutate(data);
  };

  // Sample data for survey results chart
  const sampleResults = [
    { label: 'Strongly Support', value: 45 },
    { label: 'Somewhat Support', value: 28 },
    { label: 'Neutral', value: 15 },
    { label: 'Oppose', value: 12 },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-20 relative overflow-hidden">
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
                Voice Your Opinion
                <BarChart3 className="h-4 w-4 text-blue-500" />
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-5xl md:text-7xl font-bold text-slate-900 mb-6"
              >
                Community
                <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Surveys
                </span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-xl text-slate-600 mb-10 max-w-4xl mx-auto leading-relaxed"
              >
                Have your voice heard on local issues. Participate in community surveys and see how your neighbors feel about topics that matter.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="flex flex-wrap items-center justify-center gap-4"
              >
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 px-4 py-2 text-base font-medium">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Active Participation
                </Badge>
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 px-4 py-2 text-base font-medium">
                  <Users className="h-4 w-4 mr-2" />
                  {activeSurveys?.length || 0} Active Surveys
                </Badge>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl shadow-lg"
              onClick={() => setIsCreateSurveyOpen(true)}
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New Survey
            </Button>
          </motion.div>
        </motion.div>

        {/* Active surveys */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-16"
        >
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent mb-4">
              Active Surveys
            </h2>
            <p className="text-slate-600 text-lg max-w-3xl mx-auto">
              Join your neighbors in shaping community decisions through active participation
            </p>
          </div>
          
          {isLoading ? (
            <div className="grid lg:grid-cols-2 gap-8">
              {[...Array(2)].map((_, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="animate-pulse"
                >
                  <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500">
                    <CardContent className="p-8">
                      <div className="h-4 bg-gradient-to-r from-slate-200 to-blue-300 rounded mb-4"></div>
                      <div className="h-5 bg-gradient-to-r from-slate-200 to-blue-300 rounded mb-3"></div>
                      <div className="h-4 bg-gradient-to-r from-slate-200 to-blue-300 rounded mb-4"></div>
                      <div className="h-8 bg-gradient-to-r from-slate-200 to-blue-300 rounded"></div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : activeSurveys.length > 0 ? (
            <div className="grid lg:grid-cols-2 gap-8">
              {activeSurveys.map((survey, index) => (
                <motion.div
                  key={survey.id}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    duration: 0.6, 
                    delay: 0.1 * index,
                    type: "spring",
                    stiffness: 200
                  }}
                  whileHover={{ y: -8, scale: 1.02 }}
                >
                  <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 h-full relative overflow-hidden group">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-blue-600"></div>
                    <CardContent className="p-8">
                      <div className="flex items-center justify-between mb-6">
                        <motion.div whileHover={{ scale: 1.1 }}>
                          <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 font-medium">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Active Survey
                          </Badge>
                        </motion.div>
                        <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                          {survey.endsAt ? 
                            `Ends ${new Date(survey.endsAt).toLocaleDateString()}` : 
                            'No end date'
                          }
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-blue-600 transition-colors duration-300">
                        {survey.title}
                      </h3>
                      <p className="text-slate-600 mb-6 leading-relaxed">
                        {survey.description}
                      </p>
                      <div className="mb-6">
                        <div className="flex justify-between text-sm text-slate-600 mb-3">
                          <span className="font-medium">Progress</span>
                          <span className="font-semibold">{survey.responseCount} responses</span>
                        </div>
                        <Progress value={(survey.responseCount || 0) / 200 * 100} className="h-3 bg-slate-100" />
                      </div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button 
                          size="lg"
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300"
                          onClick={() => {
                            setSelectedSurveyToTake(survey);
                            setIsTakeSurveyOpen(true);
                          }}
                        >
                          Take Survey
                          <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                        </Button>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="text-center py-16"
            >
              <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 max-w-2xl mx-auto">
                <CardContent className="p-12">
                  <motion.div 
                    className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-slate-100 to-blue-100 mb-6"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <BarChart3 className="h-8 w-8 text-blue-600" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">
                    No Active Surveys
                  </h3>
                  <p className="text-slate-600 text-lg mb-4">
                    No active surveys at the moment.
                  </p>
                  <p className="text-slate-500">
                    Check back soon for new community surveys and have your voice heard.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>

        {/* Survey results preview */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-16"
        >
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent mb-4">
              Recent Survey Results
            </h2>
            <p className="text-slate-600 text-lg max-w-3xl mx-auto">
              See how your community is responding to important local topics
            </p>
          </div>
          
          <Card className="border-0 shadow-2xl hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-blue-600"></div>
            <CardHeader className="pb-8">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent">
                Sample Survey Results
              </CardTitle>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <div className="grid md:grid-cols-2 gap-12">
                <div>
                  <h4 className="text-xl font-bold text-slate-900 mb-6">Traffic Management Survey Results</h4>
                  <div className="space-y-4">
                    {sampleResults.map((item, index) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + index * 0.1 }}
                      >
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-medium text-slate-700">{item.label}</span>
                          <span className="font-bold text-slate-900">{item.value}%</span>
                        </div>
                        <Progress value={item.value} className="h-3 bg-slate-100" />
                      </motion.div>
                    ))}
                  </div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl"
                  >
                    <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      238 total responses
                    </p>
                  </motion.div>
                </div>
                <div className="flex items-center justify-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.0, type: "spring", stiffness: 200 }}
                  >
                    <DataChart 
                      data={sampleResults} 
                      type="doughnut"
                      height={280}
                      colors={['#3B82F6', '#8B5CF6', '#06B6D4', '#10B981']}
                    />
                  </motion.div>
                </div>
              </div>
              <div className="mt-8 pt-8 border-t border-slate-200">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-semibold text-lg px-6 py-3">
                    View Full Survey Results
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Completed surveys */}
        {completedSurveys.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mb-16"
          >
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent mb-4">
                Completed Surveys
              </h2>
              <p className="text-slate-600 text-lg max-w-3xl mx-auto">
                Review past community decisions and their outcomes
              </p>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-8">
              {completedSurveys.map((survey, index) => (
                <motion.div
                  key={survey.id}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    duration: 0.6, 
                    delay: 0.1 * index,
                    type: "spring",
                    stiffness: 200
                  }}
                  whileHover={{ y: -5, scale: 1.02 }}
                >
                  <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-400 to-slate-600"></div>
                    <CardContent className="p-8">
                      <div className="flex items-center justify-between mb-6">
                        <motion.div whileHover={{ scale: 1.1 }}>
                          <Badge className="bg-gradient-to-r from-slate-500 to-slate-600 text-white px-4 py-2 font-medium">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Completed
                          </Badge>
                        </motion.div>
                        <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                          Ended {survey.endsAt ? new Date(survey.endsAt).toLocaleDateString() : 'Recently'}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-blue-600 transition-colors duration-300">
                        {survey.title}
                      </h3>
                      <p className="text-slate-600 mb-6 leading-relaxed">
                        {survey.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Users className="h-4 w-4" />
                          <span className="font-semibold">
                            {survey.responseCount} total responses
                          </span>
                        </div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-semibold px-4">
                            View Results
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
      
      <Footer />

      {/* Create New Survey Dialog */}
      <Dialog open={isCreateSurveyOpen} onOpenChange={setIsCreateSurveyOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Survey</DialogTitle>
            <DialogDescription>Define the questions and settings for your new community survey.</DialogDescription>
          </DialogHeader>
          <form onSubmit={createSurveyForm.handleSubmit(onSubmitCreateSurvey)} className="space-y-4">
            <div>
              <Label htmlFor="surveyTitle">Survey Title</Label>
              <Input id="surveyTitle" {...createSurveyForm.register("title")} />
              {createSurveyForm.formState.errors.title && (
                <p className="text-destructive text-sm mt-1">{createSurveyForm.formState.errors.title.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="surveyDescription">Description</Label>
              <Textarea id="surveyDescription" {...createSurveyForm.register("description")} />
              {createSurveyForm.formState.errors.description && (
                <p className="text-destructive text-sm mt-1">{createSurveyForm.formState.errors.description.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="surveyStatus">Status</Label>
              <Select onValueChange={(value) => createSurveyForm.setValue("status", value as "draft")} defaultValue={createSurveyForm.watch("status")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              {createSurveyForm.formState.errors.status && (
                <p className="text-destructive text-sm mt-1">{createSurveyForm.formState.errors.status.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="endsAt">Ends At (Optional)</Label>
              <Input type="date" id="endsAt" {...createSurveyForm.register("endsAt")} />
              {createSurveyForm.formState.errors.endsAt && (
                <p className="text-destructive text-sm mt-1">{createSurveyForm.formState.errors.endsAt.message}</p>
              )}
            </div>

            <h3 className="text-lg font-semibold mt-6">Questions</h3>
            {fields.map((field, index) => (
              <Card key={field.id} className="p-4 border border-stoneclough-blue/20">
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor={`questions.${index}.questionText`}>Question Text</Label>
                    <Input id={`questions.${index}.questionText`} {...createSurveyForm.register(`questions.${index}.questionText`)} />
                    {createSurveyForm.formState.errors.questions?.[index]?.questionText && (
                      <p className="text-destructive text-sm mt-1">{createSurveyForm.formState.errors.questions[index]?.questionText?.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor={`questions.${index}.questionType`}>Question Type</Label>
                    <Select onValueChange={(value) => createSurveyForm.setValue(`questions.${index}.questionType`, value as "text")} defaultValue={createSurveyForm.watch(`questions.${index}.questionType`)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text Input</SelectItem>
                        <SelectItem value="radio">Single Choice (Radio)</SelectItem>
                        <SelectItem value="checkbox">Multiple Choice (Checkbox)</SelectItem>
                      </SelectContent>
                    </Select>
                    {createSurveyForm.formState.errors.questions?.[index]?.questionType && (
                      <p className="text-destructive text-sm mt-1">{createSurveyForm.formState.errors.questions[index]?.questionType?.message}</p>
                    )}
                  </div>
                  {(createSurveyForm.watch(`questions.${index}.questionType`) === 'radio' || createSurveyForm.watch(`questions.${index}.questionType`) === 'checkbox') && (
                    <div>
                      <Label htmlFor={`questions.${index}.options`}>Options (comma-separated)</Label>
                      <Input id={`questions.${index}.options`} {...createSurveyForm.register(`questions.${index}.options`)} placeholder="Option 1, Option 2" />
                      {createSurveyForm.formState.errors.questions?.[index]?.options && (
                        <p className="text-destructive text-sm mt-1">{createSurveyForm.formState.errors.questions[index]?.options?.message}</p>
                      )}
                    </div>
                  )}
                  <Button type="button" variant="destructive" size="sm" onClick={() => remove(index)}>
                    <Trash2 className="w-4 h-4 mr-2" /> Remove Question
                  </Button>
                </CardContent>
              </Card>
            ))}
            <Button type="button" variant="outline" onClick={() => append({ questionText: "", questionType: "text", options: "" })}>
              <Plus className="w-4 h-4 mr-2" /> Add Question
            </Button>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={createSurveyMutation.isPending}>
                {createSurveyMutation.isPending ? "Creating..." : "Create Survey"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Take Survey Dialog */}
      <Dialog open={isTakeSurveyOpen} onOpenChange={setIsTakeSurveyOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedSurveyToTake?.title}</DialogTitle>
            <DialogDescription>{selectedSurveyToTake?.description}</DialogDescription>
          </DialogHeader>
          <form onSubmit={takeSurveyForm.handleSubmit(onSubmitTakeSurvey)} className="space-y-4">
            {selectedSurveyToTake?.questions?.map((q: any, index: number) => (
              <div key={index}>
                <Label>{q.questionText}</Label>
                {q.questionType === 'text' && (
                  <Input {...takeSurveyForm.register(q.questionText)} />
                )}
                {q.questionType === 'radio' && (
                  <div className="flex flex-col space-y-2">
                    {q.options?.map((option: string) => (
                      <Label key={option} className="flex items-center space-x-2">
                        <Input type="radio" value={option} {...takeSurveyForm.register(q.questionText)} />
                        <span>{option}</span>
                      </Label>
                    ))}
                  </div>
                )}
                {q.questionType === 'checkbox' && (
                  <div className="flex flex-col space-y-2">
                    {q.options?.map((option: string) => (
                      <Label key={option} className="flex items-center space-x-2">
                        <Input type="checkbox" value={option} {...takeSurveyForm.register(q.questionText)} />
                        <span>{option}</span>
                      </Label>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={createSurveyResponseMutation.isPending}>
                {createSurveyResponseMutation.isPending ? "Submitting..." : "Submit Response"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
