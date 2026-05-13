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
  Rocket,
  Image,
  Upload,
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageContainer } from "@/components/layout";
import {
  callForProposalSchema,
  type CallForProposalFormData,
} from "@/lib/validations";
import { callsApi } from "@/lib/api/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function CreateCallPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [priorityAreaInput, setPriorityAreaInput] = useState("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>("");
  const [posterPreview, setPosterPreview] = useState<string>("");

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
    if (
      priorityAreaInput.trim() &&
      !priorityAreas.includes(priorityAreaInput.trim())
    ) {
      form.setValue("priorityAreas", [
        ...priorityAreas,
        priorityAreaInput.trim(),
      ]);
      setPriorityAreaInput("");
    }
  };

  const removePriorityArea = (area: string) => {
    form.setValue(
      "priorityAreas",
      priorityAreas.filter((a) => a !== area),
    );
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      form.setValue("banner", file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setBannerPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPosterFile(file);
      form.setValue("poster", file);
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setPosterPreview(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPosterPreview(file.name);
      }
    }
  };

  const removeBanner = () => {
    setBannerFile(null);
    setBannerPreview("");
    form.setValue("banner", undefined);
  };

  const removePoster = () => {
    setPosterFile(null);
    setPosterPreview("");
    form.setValue("poster", undefined);
  };

  async function onSubmit(data: CallForProposalFormData) {
    setIsLoading(true);
    try {
      const response = await callsApi.createCall(data);
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
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_350px] xl:items-start">
        <div className="space-y-6">
          <Form {...form}>
            <form className="space-y-6">
              {/* Core Information */}
              <Card className="shadow-sm border-primary/10">
                <CardHeader className="bg-muted/30 border-b pb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base">
                      Call Information
                    </CardTitle>
                  </div>
                  <CardDescription>
                    Primary identification and focus of the research call
                  </CardDescription>
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
                        <FormLabel className="font-bold">
                          Detailed Description
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Provide a comprehensive overview of the research needs and objectives..."
                            className="min-h-[160px] resize-none shadow-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Explain why this research is being commissioned and
                          what it aims to solve.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Eligibility & Priorities */}
              <Card className="shadow-sm border-primary/10">
                <CardHeader className="bg-muted/30 border-b pb-4">
                  <CardTitle className="text-base">
                    Eligibility & Priorities
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-5">
                  <FormField
                    control={form.control}
                    name="eligibilityCriteria"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold">
                          Eligibility Criteria
                        </FormLabel>
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
                    <FormLabel className="font-bold">
                      Specific Priority Areas
                    </FormLabel>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a priority area..."
                        value={priorityAreaInput}
                        onChange={(e) => setPriorityAreaInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addPriorityArea();
                          }
                        }}
                        className="h-10 shadow-sm"
                      />
                      <Button
                        type="button"
                        onClick={addPriorityArea}
                        variant="outline"
                        className="h-10"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {priorityAreas.map((area) => (
                        <Badge
                          key={area}
                          variant="secondary"
                          className="pl-3 pr-2 py-1 gap-1 border-primary/10"
                        >
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
                        <p className="text-xs text-muted-foreground italic">
                          No priority areas added yet.
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Budget & Timeline */}
              <Card className="shadow-sm border-primary/10">
                <CardHeader className="bg-muted/30 border-b pb-4">
                  <CardTitle className="text-base">
                    Budget & Deadlines
                  </CardTitle>
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
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
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
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
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

              {/* Marketing Materials */}
              <Card className="shadow-sm border-primary/10">
                <CardHeader className="bg-muted/30 border-b pb-4">
                  <div className="flex items-center gap-2">
                    <Image className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base">
                      Marketing Materials
                    </CardTitle>
                  </div>
                  <CardDescription>
                    Upload promotional banner and poster for the research call
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {/* Banner Upload */}
                  <div className="space-y-3">
                    <FormLabel className="font-bold flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Call Banner (Optional)
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Recommended size: 1200x300px, Max: 5MB (JPG, PNG)
                    </FormDescription>
                    
                    {!bannerPreview ? (
                      <div className="border-2 border-dashed border-border/50 rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBannerChange}
                          className="hidden"
                          id="banner-input"
                        />
                        <label
                          htmlFor="banner-input"
                          className="cursor-pointer block"
                        >
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm font-medium text-foreground">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            PNG, JPG up to 5MB
                          </p>
                        </label>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <img
                          src={bannerPreview}
                          alt="Banner preview"
                          className="w-full h-32 object-cover rounded-lg border border-border/50"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={removeBanner}
                          className="w-full"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove Banner
                        </Button>
                      </div>
                    )}
                    {form.formState.errors.banner && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.banner.message}
                      </p>
                    )}
                  </div>

                  {/* Poster Upload */}
                  <div className="space-y-3 pt-4 border-t">
                    <FormLabel className="font-bold flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Research Poster (Optional)
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Recommended size: 36x48 inches (A1), Max: 10MB (JPG, PNG, PDF)
                    </FormDescription>
                    
                    {!posterPreview ? (
                      <div className="border-2 border-dashed border-border/50 rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handlePosterChange}
                          className="hidden"
                          id="poster-input"
                        />
                        <label
                          htmlFor="poster-input"
                          className="cursor-pointer block"
                        >
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm font-medium text-foreground">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            PNG, JPG, PDF up to 10MB
                          </p>
                        </label>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {posterFile?.type.startsWith("image/") ? (
                          <img
                            src={posterPreview}
                            alt="Poster preview"
                            className="w-full h-48 object-cover rounded-lg border border-border/50"
                          />
                        ) : (
                          <div className="bg-muted rounded-lg p-6 text-center border border-border/50">
                            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm font-medium text-foreground">
                              {posterPreview}
                            </p>
                          </div>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={removePoster}
                          className="w-full"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove Poster
                        </Button>
                      </div>
                    )}
                    {form.formState.errors.poster && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.poster.message}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 xl:sticky xl:top-20 xl:h-fit">
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Call Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {[
                {
                  label: "Clear descriptive title",
                  checked: !!form.watch("title"),
                },
                {
                  label: "Detailed research scope",
                  checked: form.watch("description").length > 50,
                },
                {
                  label: "Eligibility criteria",
                  checked: !!form.watch("eligibilityCriteria"),
                },
                {
                  label: "Valid budget range",
                  checked: form.watch("budgetMax") >= form.watch("budgetMin"),
                },
                {
                  label: "Submission deadline",
                  checked: !!form.watch("submissionDeadline"),
                },
              ].map((req, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div
                    className={cn(
                      "h-3.5 w-3.5 rounded-full border flex items-center justify-center transition-colors",
                      req.checked
                        ? "bg-green-500 border-green-600"
                        : "bg-muted border-muted-foreground/30",
                    )}
                  >
                    {req.checked && <Plus className="h-2 w-2 text-white" />}
                  </div>
                  <span
                    className={
                      req.checked
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
                    }
                  >
                    {req.label}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="shadow-sm border-primary/10 overflow-hidden">
            <CardContent className=" pt-6 space-y-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={isLoading}
                  className="flex-1"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save as Draft
                </Button>
                <Button
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={isLoading}
                  className="flex-1"
                >
                  <Rocket className="mr-2 h-4 w-4" />
                  Publish
                </Button>
              </div>

              <div className="pt-2 border-t">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Publishing this call will make it immediately visible to all
                    registered researchers and institutions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </PageContainer>
  );
}
