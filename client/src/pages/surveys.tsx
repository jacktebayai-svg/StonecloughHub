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
import { Plus, Trash2 } from "lucide-react";
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
    <div className="min-h-screen bg-stoneclough-light">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-stoneclough-blue mb-4">Community Surveys</h1>
          <p className="text-lg text-stoneclough-gray-blue max-w-3xl mx-auto">
            Have your voice heard on local issues. Participate in community surveys and see how your neighbors feel about topics that matter.
          </p>
        </div>

        <Button 
          className="mb-6 bg-stoneclough-blue hover:bg-stoneclough-blue/90 text-stoneclough-light"
          onClick={() => setIsCreateSurveyOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Survey
        </Button>

        {/* Active surveys */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-stoneclough-blue mb-6">Active Surveys</h2>
          
          {isLoading ? (
            <div className="grid lg:grid-cols-2 gap-8">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <Card>
                    <CardContent className="p-6">
                      <div className="h-4 bg-stoneclough-blue/10 rounded mb-4"></div>
                      <div className="h-5 bg-stoneclough-blue/10 rounded mb-3"></div>
                      <div className="h-4 bg-stoneclough-blue/10 rounded mb-4"></div>
                      <div className="h-8 bg-stoneclough-blue/10 rounded"></div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          ) : activeSurveys.length > 0 ? (
            <div className="grid lg:grid-cols-2 gap-8">
              {activeSurveys.map((survey) => (
                <Card key={survey.id} className="bg-stoneclough-light border border-stoneclough-blue/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Badge className="bg-stoneclough-gray-blue text-stoneclough-light">Active Survey</Badge>
                      <span className="text-sm text-stoneclough-gray-blue">
                        {survey.endsAt ? 
                          `Ends ${new Date(survey.endsAt).toLocaleDateString()}` : 
                          'No end date'
                        }
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-stoneclough-blue mb-3">
                      {survey.title}
                    </h3>
                    <p className="text-stoneclough-gray-blue mb-4">
                      {survey.description}
                    </p>
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-stoneclough-gray-blue mb-2">
                        <span>Progress</span>
                        <span>{survey.responseCount} responses</span>
                      </div>
                      <Progress value={(survey.responseCount || 0) / 200 * 100} className="h-2" />
                    </div>
                    <Button 
                      className="w-full bg-stoneclough-blue hover:bg-stoneclough-blue/90 text-stoneclough-light"
                      onClick={() => {
                        setSelectedSurveyToTake(survey);
                        setIsTakeSurveyOpen(true);
                      }}
                    >
                      Take Survey
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-stoneclough-gray-blue text-lg">
                  No active surveys at the moment.
                </p>
                <p className="text-sm text-stoneclough-gray-blue mt-2">
                  Check back soon for new community surveys.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Survey results preview */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-stoneclough-blue mb-6">Recent Survey Results</h2>
          
          <Card className="border border-stoneclough-blue/20 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-stoneclough-blue">
                Sample Survey Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-stoneclough-blue mb-4">Traffic Management Survey Results</h4>
                  <div className="space-y-3">
                    {sampleResults.map((item, index) => (
                      <div key={index}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{item.label}</span>
                          <span className="font-medium">{item.value}%</span>
                        </div>
                        <Progress value={item.value} className="h-2" />
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-stoneclough-gray-blue mt-4">238 total responses</p>
                </div>
                <div className="flex items-center justify-center">
                  <DataChart 
                    data={sampleResults} 
                    type="doughnut"
                    height={250}
                    colors={['#587492', '#254974', '#58749280', '#587492C0']}
                  />
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-stoneclough-blue/20">
                <Button variant="ghost" className="text-stoneclough-blue hover:text-stoneclough-blue/90">
                  View Full Survey Results →
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Completed surveys */}
        {completedSurveys.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-stoneclough-blue mb-6">Completed Surveys</h2>
            
            <div className="grid lg:grid-cols-2 gap-8">
              {completedSurveys.map((survey) => (
                <Card key={survey.id} className="border border-stoneclough-blue/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="secondary">Completed</Badge>
                      <span className="text-sm text-stoneclough-gray-blue">
                        Ended {survey.endsAt ? new Date(survey.endsAt).toLocaleDateString() : 'Recently'}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-stoneclough-blue mb-3">
                      {survey.title}
                    </h3>
                    <p className="text-stoneclough-gray-blue mb-4">
                      {survey.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-stoneclough-gray-blue">
                        {survey.responseCount} total responses
                      </span>
                      <Button variant="ghost" size="sm" className="text-stoneclough-blue hover:text-stoneclough-blue/90">
                        View Results →
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
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
