"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  ArrowLeft,
  Upload,
  BookOpen,
  User,
  Building2,
  Calendar,
  Tag,
  FileUp,
  X,
  Send,
  Library,
  GraduationCap,
  Scale,
  Check,
  FileText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageContainer } from "@/components/layout";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const formSchema = z.object({
  title: z.string().min(5, "Title is required"),
  authors: z.string().min(3, "Authors are required"),
  institution: z.string().min(3, "Institution is required"),
  year: z.string().regex(/^\d{4}$/, "Please provide a valid 4-digit year"),
  department: z.string().optional(),
  gradedEvidence: z.enum(["good", "bad"]),
  type: z.string().min(1, "Type is required"),
  keywords: z.string().optional(),
});

export default function AddExternalResearchPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      authors: "",
      institution: "",
      year: new Date().getFullYear().toString(),
      department: "",
      gradedEvidence: "good",
      type: "report",
      keywords: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!file) {
      toast.error("Please upload the research file");
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success("External research successfully ingested into repository!");
      router.push("/research/external-research");
    } catch (error) {
      toast.error("Failed to add research.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageContainer
      title="Add External Research"
      description="Manually ingest external findings into the PSR Repository"
      actions={
        <Button
          variant="outline"
          onClick={() => router.push("/research/external-research")}
          className="shadow-sm bg-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      }
    >
      <div className="max-w-7xl mx-auto space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-[1fr_350px]">
              {/* Left Column: Form Fields */}
              <div className="space-y-6">
                <Card className="border border-muted-foreground/10 shadow-sm bg-white overflow-hidden ">
                  <CardHeader className="border-b pb-4">
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                      <Library className="h-5 w-5 text-primary" />
                      Research Metadata
                    </CardTitle>
                    <CardDescription>
                      Record primary indexing details and academic parameters.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    {/* Research Title */}
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold text-slate-700">
                            Research Title
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Global Trends in Antimicrobial Resistance..."
                              className="h-11 rounded-xl bg-slate-50 border-muted-foreground/15 focus-visible:ring-primary/20 text-sm"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Authors & Publisher */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="authors"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold text-slate-700">
                              Authors
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground/60" />
                                <Input
                                  placeholder="Separated by commas..."
                                  className="pl-10 h-11 rounded-xl bg-slate-50 border-muted-foreground/15 focus-visible:ring-primary/20 text-sm"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="institution"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold text-slate-700">
                              Publisher / Source Institution
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Building2 className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground/60" />
                                <Input
                                  placeholder="e.g., World Health Organization"
                                  className="pl-10 h-11 rounded-xl bg-slate-50 border-muted-foreground/15 focus-visible:ring-primary/20 text-sm"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Year, Type & Evidence Grade */}
                    <div className="grid md:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="year"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold text-slate-700">
                              Publication Year
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground/60" />
                                <Input
                                  placeholder="2024"
                                  className="pl-10 h-11 rounded-xl bg-slate-50 border-muted-foreground/15 focus-visible:ring-primary/20 text-sm"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold text-slate-700">
                              Research Type
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-muted-foreground/15 focus-visible:ring-primary/20 text-sm">
                                  <SelectValue placeholder="Select Type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="rounded-xl border-primary/10 shadow-lg">
                                <SelectItem value="report">Report</SelectItem>
                                <SelectItem value="manuscript">
                                  Manuscript
                                </SelectItem>
                                <SelectItem value="thesis">Thesis</SelectItem>
                                <SelectItem value="policy_brief">
                                  Policy Brief
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="gradedEvidence"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold text-slate-700">
                              Evidence Grade
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-muted-foreground/15 focus-visible:ring-primary/20 text-sm">
                                  <SelectValue placeholder="Select Grade" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="rounded-xl border-primary/10 shadow-lg">
                                <SelectItem value="good">
                                  <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Verified Good
                                  </span>
                                </SelectItem>
                                <SelectItem value="bad">
                                  <span className="text-rose-700 font-semibold flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                    Poor Grade
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Keywords tags */}
                    <FormField
                      control={form.control}
                      name="keywords"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold text-slate-700">
                            Keywords / Tags
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Tag className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground/60" />
                              <Input
                                placeholder="e.g., AMR, Policy, Global Health (separated by commas)..."
                                className="pl-10 h-11 rounded-xl bg-slate-50 border-muted-foreground/15 focus-visible:ring-primary/20 text-sm"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: File Upload & Submission */}
              <div className="space-y-6">
                {/* File Upload card */}
                <Card className="border border-muted-foreground/10 shadow-sm bg-white overflow-hidden">
                  <CardHeader className="border-b pb-4">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                      Research File
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    {/* File Dropzone */}
                    <div
                      className={cn(
                        "border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer group relative overflow-hidden",
                        file
                          ? "border-emerald-500/50 bg-emerald-50/15"
                          : "border-muted-foreground/25 hover:border-primary/50 hover:bg-slate-50/50",
                      )}
                    >
                      <input
                        type="file"
                        id="external-research-upload"
                        className="hidden"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                      />
                      <label
                        htmlFor="external-research-upload"
                        className="cursor-pointer space-y-3 block"
                      >
                        <FileUp
                          className={cn(
                            "h-8 w-8 mx-auto transition-all duration-300",
                            file
                              ? "text-emerald-500 scale-110"
                              : "text-muted-foreground/40 group-hover:scale-115 group-hover:text-primary",
                          )}
                        />
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-800">
                            {file ? "File Uploaded" : "Upload Document"}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {file
                              ? file.name
                              : "Drag & drop or browse PDF / Word"}
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* PDF Visual Card Indicator */}
                    {file && (
                      <div className="flex items-center justify-between p-3.5 border border-emerald-100 bg-emerald-50/20 rounded-xl animate-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="h-5 w-5 text-emerald-600 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">
                              {file.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-medium">
                              {(file.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:bg-rose-50 text-rose-500"
                          onClick={() => setFile(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {/* Submit Actions */}
                    <div className="pt-4 border-t border-slate-100">
                      <Button
                        type="submit"
                        disabled={isSubmitting || !file}
                        className="w-full h-11 text-xs font-bold uppercase tracking-wider text-white bg-primary hover:bg-primary/95 shadow-md shadow-primary/25 hover:shadow-lg rounded-xl transition-all"
                      >
                        {isSubmitting
                          ? "Ingesting..."
                          : "Ingest Research Document"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Guidelines sidebar card */}
                <Card className="border border-muted-foreground/10 shadow-sm bg-slate-50/40 rounded-[1.5rem]">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-3 text-slate-800">
                      <GraduationCap className="h-5 w-5 text-primary shrink-0" />
                      <p className="text-xs font-bold uppercase tracking-wide">
                        Evidence Guidelines
                      </p>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      External research works are indexed in compliance with the
                      **PSR Quality Indexing Framework**. Double check that Year
                      and Authors represent academic guidelines to guarantee
                      correct APA/MLA bibliography generations in referencing
                      dashboards.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </PageContainer>
  );
}
