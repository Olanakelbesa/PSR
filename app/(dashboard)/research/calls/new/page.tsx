"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  ArrowLeft, 
  Calendar, 
  Plus, 
  Trash2, 
  FileText, 
  DollarSign,
  AlertCircle,
  Save,
  Rocket
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageContainer } from "@/components/layout";
import { callForProposalSchema, type CallForProposalFormData } from "@/lib/validations";
import { callsApi } from "@/lib/api/client";
import { THEMATIC_AREAS } from "@/lib/constants";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function CreateCallPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [priorityAreaInput, setPriorityAreaInput] = useState("");

  const form = useForm<CallForProposalFormData>({
    resolver: zodResolver(callForProposalSchema),
    defaultValues: {
      title: "",
      description: "",
      eligibilityCriteria: "",
      priorityAreas: [],
      budgetMin: 50000,
      budgetMax: 500000,
      submissionDeadline: "",
      reviewDeadline: "",
    },
  });

  const priorityAreas = form.watch("priorityAreas");

  const addPriorityArea = () => {
    if (priorityAreaInput.trim() && !priorityAreas.includes(priorityAreaInput.trim())) {
      form.setValue("priorityAreas", [...priorityAreas, priorityAreaInput.trim()]);
      setPriorityAreaInput("");
    }
  };

  const removePriorityArea = (area: string) => {
    form.setValue("priorityAreas", priorityAreas.filter((a) => a !== area));
  };

  async function onSubmit(data: CallForProposalFormData) {
    setIsLoading(true);
    try {
      const response = await callsApi.create(data);
      if (response.success) {
        toast.success("Research call created successfully");
        router.push("/research/calls");
      } else {
        toast.error(response.message || "Failed to create research call");
      }
    } catch (error) {
      console.error("Error creating call:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <PageContainer
      title="Create Research Call"
      description="Launch a new call for research proposals to address ministry priority areas"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button 
            onClick={form.handleSubmit(onSubmit)} 
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90 shadow-sm"
          >
            {isLoading ? "Publishing..." : "Publish Call"}
            <Rocket className="ml-2 h-4 w-4" />
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_350px]">
        <div className="space-y-6">
          <Form {...form}>
            <form className="space-y-6">
              {/* Core Information */}
              <Card className="shadow-sm border-primary/10">
                <CardHeader className="bg-muted/30 border-b pb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base">Call Information</CardTitle>
                  </div>
                  <CardDescription>Primary identification and focus of the research call</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-5">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold">Call Title</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g. National Assessment on Technical and Vocational Education Quality" 
                            className="h-11 shadow-sm focus-visible:ring-primary/20" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold">Detailed Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Provide a comprehensive overview of the research needs and objectives..." 
                            className="min-h-[160px] resize-none shadow-sm" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>Explain why this research is being commissioned and what it aims to solve.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Eligibility & Priorities */}
              <Card className="shadow-sm border-primary/10">
                <CardHeader className="bg-muted/30 border-b pb-4">
                  <CardTitle className="text-base">Eligibility & Priorities</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-5">
                  <FormField
                    control={form.control}
                    name="eligibilityCriteria"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold">Eligibility Criteria</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Specify who can apply (e.g. Academic Institutions, NGOs, etc.)" 
                            className="min-h-[100px] resize-none shadow-sm" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-3">
                    <FormLabel className="font-bold">Specific Priority Areas</FormLabel>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Add a priority area..." 
                        value={priorityAreaInput}
                        onChange={(e) => setPriorityAreaInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addPriorityArea();
                          }
                        }}
                        className="h-10 shadow-sm"
                      />
                      <Button type="button" onClick={addPriorityArea} variant="outline" className="h-10">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {priorityAreas.map((area) => (
                        <Badge key={area} variant="secondary" className="pl-3 pr-2 py-1 gap-1 border-primary/10">
                          {area}
                          <button 
                            type="button" 
                            onClick={() => removePriorityArea(area)}
                            className="ml-1 hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      {priorityAreas.length === 0 && (
                        <p className="text-xs text-muted-foreground italic">No priority areas added yet.</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Budget & Timeline */}
              <Card className="shadow-sm border-primary/10">
                <CardHeader className="bg-muted/30 border-b pb-4">
                  <CardTitle className="text-base">Budget & Deadlines</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid gap-6 sm:grid-cols-2 mb-6">
                    <FormField
                      control={form.control}
                      name="budgetMin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-emerald-600" />
                            Min Budget (ETB)
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              className="h-11 shadow-sm"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="budgetMax"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-emerald-600" />
                            Max Budget (ETB)
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              className="h-11 shadow-sm"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="submissionDeadline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-primary" />
                            Submission Deadline
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              className="h-11 shadow-sm"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="reviewDeadline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-primary" />
                            Review Deadline (Optional)
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              className="h-11 shadow-sm"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <Card className="shadow-sm border-primary/10 overflow-hidden">
            <CardHeader className="bg-primary text-primary-foreground py-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider">Publishing Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <Button 
                onClick={form.handleSubmit(onSubmit)} 
                className="w-full h-11" 
                disabled={isLoading}
              >
                <Rocket className="mr-2 h-4 w-4" />
                Publish to Registry
              </Button>
              <Button 
                variant="outline" 
                className="w-full h-11 border-primary/20 text-primary"
                disabled={isLoading}
              >
                <Save className="mr-2 h-4 w-4" />
                Save as Draft
              </Button>
              
              <div className="pt-2 border-t">
                 <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Publishing this call will make it immediately visible to all registered researchers and institutions.
                    </p>
                 </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-primary/10">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Call Requirements</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {[
                { label: "Clear descriptive title", checked: !!form.watch("title") },
                { label: "Detailed research scope", checked: form.watch("description").length > 50 },
                { label: "Eligibility criteria", checked: !!form.watch("eligibilityCriteria") },
                { label: "Valid budget range", checked: form.watch("budgetMax") >= form.watch("budgetMin") },
                { label: "Submission deadline", checked: !!form.watch("submissionDeadline") },
              ].map((req, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div className={cn(
                    "h-3.5 w-3.5 rounded-full border flex items-center justify-center transition-colors",
                    req.checked ? "bg-green-500 border-green-600" : "bg-muted border-muted-foreground/30"
                  )}>
                    {req.checked && <Plus className="h-2 w-2 text-white" />}
                  </div>
                  <span className={req.checked ? "text-foreground font-medium" : "text-muted-foreground"}>
                    {req.label}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </PageContainer>
  );
}
