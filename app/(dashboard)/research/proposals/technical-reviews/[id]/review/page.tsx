"use client";

import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { z } from "zod";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  useIndividualReview,
  useReviewQuestions,
  useUpdateIndividualReview,
} from "@/lib/queries/individual-review";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormLabel,
} from "@/components/ui/form";

import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { PageContainer } from "@/components/layout";

const formSchema = z.object({
  comments: z.string().optional(),
  responses: z.record(z.number()).default({}),
});

type FormValues = z.infer<typeof formSchema>;

export default function TechnicalReviewPage() {
  const { id } = useParams();
  const router = useRouter();

  const { data: questionsRes, isLoading: qLoading } = useReviewQuestions();

  const { data: existingReview } = useIndividualReview(id as string);

  const review = useUpdateIndividualReview();

  const questions = questionsRes?.data ?? [];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      comments: "",
      responses: {},
    },
  });

  useEffect(() => {
    if (!existingReview) return;

    const mapped = Object.fromEntries(
      (existingReview.responses ?? [])
        .filter((r) => r.question_id != null)
        .map((r) => [String(r.question_id), Number(r.points_earned)]),
    );

    form.reset({
      comments: existingReview.comments ?? "",
      responses: mapped,
    });
  }, [existingReview, form]);

  // live updates
  const responses = useWatch({
    control: form.control,
    name: "responses",
  });

  const totalScore = useMemo(() => {
    return Object.values(responses || {}).reduce(
      (sum, value) => sum + Number(value || 0),
      0,
    );
  }, [responses]);

  const completedCount = useMemo(() => {
    return questions.filter(
      (q) => responses?.[q.id] !== undefined && responses?.[q.id] !== null,
    ).length;
  }, [responses, questions]);

  function onSubmit(data: FormValues) {
    if (!id) return;

    const payload = {
      comments: data.comments ?? "",
      responses: Object.entries(data.responses || {}).map(
        ([questionId, score]) => ({
          question_id: Number(questionId),
          points_earned: Number(score),
        }),
      ),
      attachment: null,
    };

    review.mutate(
      { id: Number(id), payload },
      {
        onSuccess: () => {
          router.back();
        },
      },
    );
  }

  if (qLoading) {
    return (
      <PageContainer title="Loading">
        <div className="p-6">Loading review form...</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Technical Review"
      actions={
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Proposal */}
          <Card>
            <CardHeader>
              <CardTitle>Proposal Summary</CardTitle>
            </CardHeader>

            <CardContent>
              <p className="font-semibold">
                {existingReview?.screening?.proposal?.title}
              </p>

              <p className="text-sm text-muted-foreground">
                {existingReview?.screening?.proposal?.referenceNumber}
              </p>
            </CardContent>
          </Card>

          {/* Questions */}
          <Card>
            <CardHeader>
              <CardTitle>Evaluation Questions</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {questions.map((q) => (
                <div
                  key={q.id}
                  className="flex items-center justify-between border-b pb-3"
                >
                  <div>
                    <p className="font-medium">{q.text}</p>

                    <p className="text-xs text-muted-foreground">
                      Max: {q.maxPoints}
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name={`responses.${q.id}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min={0}
                              max={q.maxPoints}
                              className="w-20"
                              value={field.value ?? ""}
                              onChange={(e) => {
                                const value = e.target.value;

                                field.onChange(
                                  value === ""
                                    ? undefined
                                    : Math.max(
                                        0,
                                        Math.min(q.maxPoints, Number(value)),
                                      ),
                                );
                              }}
                            />

                            <span>/ {q.maxPoints}</span>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              ))}

              <div className="pt-3 flex gap-3">
                <Badge className="text-base">Total Score: {totalScore}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          <FormField
            control={form.control}
            name="comments"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Comments</FormLabel>

                <FormControl>
                  <Textarea
                    {...field}
                    className="min-h-[150px]"
                    placeholder="Write your technical review..."
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <Button type="submit" disabled={review.isPending} className="w-full">
            <Send className="mr-2 h-4 w-4" />

            {review.isPending ? "Submitting..." : "Submit Review"}
          </Button>
        </form>
      </Form>
    </PageContainer>
  );
}
