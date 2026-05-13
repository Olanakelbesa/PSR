"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  ArrowLeft,
  Calendar,
  Plus,
  Trash2,
  FileText,
  DollarSign,
  AlertCircle,
  Save,
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
import { mockCalls } from "@/lib/api/mock-data";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function EditCallPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [isLoading, setIsLoading] = useState(false);
  const [priorityAreaInput, setPriorityAreaInput] = useState("");

  const call = useMemo(() => mockCalls.find((item) => item.id === id), [id]);

  const form = useForm<CallForProposalFormData>({
    resolver: zodResolver(callForProposalSchema),
    defaultValues: {
      title: call?.title ?? "",
      description: call?.description ?? "",
      eligibilityCriteria: call?.eligibilityCriteria ?? "",
      priorityAreas: call?.priorityAreas ?? [],
      budgetMin: call?.budgetRange.min ?? 50000,
      budgetMax: call?.budgetRange.max ?? 500000,
      submissionDeadline: call?.submissionDeadline?.split("T")[0] ?? "",
      reviewDeadline: call?.reviewDeadline?.split("T")[0] ?? "",
    },
  });

  const priorityAreas = form.watch("priorityAreas");

  const addPriorityArea = () => {
    const value = priorityAreaInput.trim();
    if (value && !priorityAreas.includes(value)) {
      form.setValue("priorityAreas", [...priorityAreas, value]);
      setPriorityAreaInput("");
    }
  };

  const removePriorityArea = (area: string) => {
    form.setValue(
      "priorityAreas",
      priorityAreas.filter((item) => item !== area),
    );
  };

  async function onSubmit(data: CallForProposalFormData) {
    if (!call) return;

    setIsLoading(true);
    try {
      const response = await callsApi.updateCall(id, {
        title: data.title,
        description: data.description,
        eligibilityCriteria: data.eligibilityCriteria,
        priorityAreas: data.priorityAreas,
        budgetRange: {
          min: data.budgetMin,
          max: data.budgetMax,
        },
        submissionDeadline: data.submissionDeadline,
        reviewDeadline: data.reviewDeadline || undefined,
      });

      if (response.success) {
        toast.success("Research call updated successfully");
        router.push(`/research/calls/${id}`);
      } else {
        toast.error(response.message || "Failed to update research call");
      }
    } catch (error) {
      console.error("Error updating call:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  if (!call) {
    return (
      <div className="space-y-6">
        <Link href="/research/calls">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Calls
          </Button>
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Call for proposal not found
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <PageContainer
      title="Edit Research Call"
      description="Update an existing call for proposals"
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
              <Card className="shadow-sm border-primary/10">
                <CardHeader className="bg-muted/30 border-b pb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base">
                      Call Information
                    </CardTitle>
                  </div>
                  <CardDescription>
                    Update the title and description of the research call
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
                            className="min-h-40 resize-none shadow-sm"
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
                            className="min-h-25 resize-none shadow-sm"
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
            </form>
          </Form>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-20 xl:h-fit">
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Current Call
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Status</span>
                <Badge
                  variant={call.status === "open" ? "default" : "secondary"}
                >
                  {call.status.charAt(0).toUpperCase() + call.status.slice(1)}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Created By</span>
                <span className="font-medium text-right">
                  {call.createdBy.firstName} {call.createdBy.lastName}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Priority Areas</span>
                <span className="font-medium">{call.priorityAreas.length}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Attachments</span>
                <span className="font-medium">{call.attachments.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-primary/10 overflow-hidden">
            <CardContent className="pt-6 space-y-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={isLoading}
                  className="flex-1"
                  onClick={() => router.push(`/research/calls/${id}`)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={isLoading}
                  className="flex-1"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>

              <div className="pt-2 border-t">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Changes are applied to the local mock dataset in this
                    frontend-only flow.
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
