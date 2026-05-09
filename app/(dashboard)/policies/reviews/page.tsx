"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  ClipboardList,
  Clock,
  CheckCircle2,
  MessageSquare,
  BarChart3,
  TrendingUp,
  FileText,
  Calendar,
  ArrowRight,
  BookOpen,
  FileEdit,
  Activity,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { PageContainer } from "@/components/layout";
import { cn } from "@/lib/utils";

const stats = [
  {
    label: "Assigned Reviews",
    value: 4,
    icon: ClipboardList,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    description: "Pending your evaluation",
  },
  {
    label: "Completed Reviews",
    value: 11,
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
    description: "Successfully submitted",
  },
  {
    label: "Pending Comments",
    value: 2,
    icon: MessageSquare,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    description: "Awaiting proposer action",
  },
  {
    label: "Average Score",
    value: "78%",
    icon: BarChart3,
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
    description: "Across all completed reviews",
  },
];

const assignedReviews = [
  {
    id: "cn-001",
    title: "Basic Education Quality Improvement Framework",
    type: "concept",
    organization: "MoE – Policy Analysis Directorate",
    assignedDate: "2026-05-06",
    dueDate: "2026-05-14",
    status: "pending",
  },
  {
    id: "cn-003",
    title: "Digital Learning Infrastructure Strategy",
    type: "concept",
    organization: "AAU – Educational Technology",
    assignedDate: "2026-05-07",
    dueDate: "2026-05-15",
    status: "in_progress",
  },
  {
    id: "d-002",
    title: "Teacher Professional Development Policy Draft",
    type: "draft",
    organization: "MoE – Teacher Education",
    assignedDate: "2026-05-04",
    dueDate: "2026-05-12",
    status: "in_progress",
  },
  {
    id: "d-005",
    title: "Inclusive Education Guideline v2",
    type: "draft",
    organization: "MoE – Special Needs Education",
    assignedDate: "2026-05-08",
    dueDate: "2026-05-17",
    status: "pending",
  },
];

const activityFeed = [
  {
    id: 1,
    action: "You submitted a review for",
    subject: "Early Childhood Policy Framework",
    time: "2 hours ago",
    icon: CheckCircle2,
    color: "text-green-500",
  },
  {
    id: 2,
    action: "Comment addressed by proposer on",
    subject: "Vocational Training Guideline",
    time: "Yesterday",
    icon: MessageSquare,
    color: "text-blue-500",
  },
  {
    id: 3,
    action: "PSR approved your review of",
    subject: "TVET Strategy Draft 2025",
    time: "2 days ago",
    icon: ClipboardCheck,
    color: "text-primary",
  },
  {
    id: 4,
    action: "New concept note assigned:",
    subject: "Digital Learning Infrastructure Strategy",
    time: "3 days ago",
    icon: FileEdit,
    color: "text-amber-500",
  },
  {
    id: 5,
    action: "You scored",
    subject: "Basic Education Quality Improvement — 84%",
    time: "5 days ago",
    icon: BarChart3,
    color: "text-purple-500",
  },
];

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-700 border-amber-200" },
  in_progress: { label: "In Progress", className: "bg-blue-100 text-blue-700 border-blue-200" },
};

export default function ReviewsDashboardPage() {
  return (
    <PageContainer
      title="Reviewer Workspace"
      description="Manage and track all policy concept note and draft reviews assigned to you"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/policies/reviews/completed">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              View Completed
            </Link>
          </Button>
          <Button asChild className="bg-primary hover:bg-primary/90">
            <Link href="/policies/reviews/assigned">
              <ClipboardList className="mr-2 h-4 w-4" />
              My Queue
            </Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className={cn("shadow-sm border", stat.border)}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-black tracking-tight">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  </div>
                  <div className={cn("p-2.5 rounded-lg", stat.bg)}>
                    <stat.icon className={cn("h-5 w-5", stat.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          {/* Assigned Reviews Table */}
          <div className="xl:col-span-2">
            <Card className="shadow-sm border-primary/10 h-full">
              <CardHeader className="border-b bg-muted/30 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Recent Assigned Reviews</CardTitle>
                    <CardDescription>Reviews currently in your queue</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/policies/reviews/assigned">
                      View all <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 divide-y">
                {assignedReviews.map((review) => {
                  const statusCfg = STATUS_CONFIG[review.status];
                  const href =
                    review.type === "concept"
                      ? `/policies/concept-notes/${review.id}/review`
                      : `/policies/drafts/${review.id}/review`;

                  return (
                    <div
                      key={review.id}
                      className="flex items-start justify-between p-4 hover:bg-muted/20 transition-colors gap-4"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={cn(
                          "p-2 rounded-md shrink-0 mt-0.5",
                          review.type === "concept" ? "bg-blue-50" : "bg-purple-50"
                        )}>
                          {review.type === "concept"
                            ? <FileEdit className="h-4 w-4 text-blue-600" />
                            : <BookOpen className="h-4 w-4 text-purple-600" />
                          }
                        </div>
                        <div className="min-w-0 space-y-1">
                          <p className="text-sm font-semibold truncate">{review.title}</p>
                          <p className="text-xs text-muted-foreground">{review.organization}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Due {review.dueDate}
                            </span>
                            <Badge variant="outline" className={cn("text-[10px] py-0", statusCfg.className)}>
                              {statusCfg.label}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] py-0">
                              {review.type === "concept" ? "Concept Note" : "Draft"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button size="sm" asChild className="shrink-0">
                        <Link href={href}>
                          {review.status === "in_progress" ? "Continue" : "Start Review"}
                        </Link>
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Activity Timeline */}
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="border-b bg-muted/30 pb-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Recent Activity</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="relative space-y-1">
                {activityFeed.map((item, index) => (
                  <div key={item.id} className="flex gap-3 pb-4">
                    <div className="flex flex-col items-center">
                      <div className={cn("p-1.5 rounded-full bg-muted shrink-0")}>
                        <item.icon className={cn("h-3 w-3", item.color)} />
                      </div>
                      {index < activityFeed.length - 1 && (
                        <div className="w-px flex-1 bg-border mt-1" />
                      )}
                    </div>
                    <div className="pb-1 min-w-0">
                      <p className="text-xs leading-relaxed">
                        <span className="text-muted-foreground">{item.action} </span>
                        <span className="font-medium text-foreground">{item.subject}</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {item.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Overview */}
        <Card className="shadow-sm border-primary/10">
          <CardHeader className="border-b bg-muted/30 pb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Review Progress Overview</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Total Assigned (All Time)", value: 15, done: 11, color: "bg-primary" },
                { label: "Concept Note Reviews", value: 8, done: 6, color: "bg-blue-500" },
                { label: "Policy Draft Reviews", value: 7, done: 5, color: "bg-purple-500" },
                { label: "This Month", value: 6, done: 3, color: "bg-green-500" },
              ].map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-xs text-muted-foreground">{item.label}</span>
                    <span className="font-bold text-xs">{item.done}/{item.value}</span>
                  </div>
                  <Progress
                    value={(item.done / item.value) * 100}
                    className="h-2"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    {Math.round((item.done / item.value) * 100)}% complete
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
