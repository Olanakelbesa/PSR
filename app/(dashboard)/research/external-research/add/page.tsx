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
  Plus,
  Send,
  Library,
  GraduationCap,
  Scale
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

    try {
      toast.success("External research added to repository!");
      setTimeout(() => router.push("/research/external-research"), 2000);
    } catch (error) {
      toast.error("Failed to add research.");
    }
  }

  return (
    <PageContainer
      title="Add External Research"
      description="Manually ingest external findings into the PSR Repository"
      actions={
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      }
    >
      <div className="max-w-5xl mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid gap-8 md:grid-cols-[1fr_350px]">
              
              {/* Primary Information */}
              <div className="space-y-6">
                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2">
                      <Library className="h-5 w-5 text-primary" />
                      Research Metadata
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Research Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Impact of climate change on health..." className="h-12 rounded-xl" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="authors"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Authors</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Separated by commas..." className="pl-10 h-11 rounded-xl" {...field} />
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
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Institution</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="e.g., Addis Ababa University" className="pl-10 h-11 rounded-xl" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="year"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Year</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="2024" className="pl-10 h-11 rounded-xl" {...field} />
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
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Research Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-11 rounded-xl">
                                  <SelectValue placeholder="Select Type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="report">Report</SelectItem>
                                <SelectItem value="manuscript">Manuscript</SelectItem>
                                <SelectItem value="thesis">Thesis</SelectItem>
                                <SelectItem value="policy_brief">Policy Brief</SelectItem>
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
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Graded Evidence</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-11 rounded-xl">
                                  <SelectValue placeholder="Select Grade" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="good" className="text-emerald-600 font-bold">Good Quality</SelectItem>
                                <SelectItem value="bad" className="text-rose-600 font-bold">Poor Quality</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="keywords"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Keywords</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="e.g., Health, Climate, Ethiopia" className="pl-10 h-11 rounded-xl" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar: File Upload & Actions */}
              <div className="space-y-6">
                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Research File</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className={cn(
                      "border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer group",
                      file ? "border-emerald-500 bg-emerald-50/30" : "border-muted-foreground/20 hover:bg-primary/5"
                    )}>
                      <input 
                        type="file" 
                        id="external-research-upload" 
                        className="hidden" 
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                      />
                      <label htmlFor="external-research-upload" className="cursor-pointer space-y-2">
                        <FileUp className={cn("h-8 w-8 mx-auto transition-transform group-hover:scale-110", file ? "text-emerald-500" : "text-muted-foreground/40")} />
                        <p className="text-[11px] font-black uppercase tracking-tighter">
                          {file ? file.name : "Upload Research File"}
                        </p>
                      </label>
                    </div>

                    {file && (
                       <Button 
                         variant="ghost" 
                         size="sm" 
                         className="w-full text-rose-600 hover:bg-rose-50 font-bold text-[10px]"
                         onClick={() => setFile(null)}
                       >
                         <X className="h-3 w-3 mr-2" /> REMOVE FILE
                       </Button>
                    )}

                    <div className="pt-4">
                      <Button 
                        type="submit" 
                        className="w-full h-12 text-sm font-black bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-xl group"
                      >
                        <Send className="mr-2 h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        Ingest Research
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-muted/30">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <GraduationCap className="h-5 w-5 text-primary" />
                      <p className="text-xs font-bold">Evidence Standards</p>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      External research is graded based on the **PSR Quality Matrix**. Ensure authors and year are accurately recorded for citation purposes.
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
