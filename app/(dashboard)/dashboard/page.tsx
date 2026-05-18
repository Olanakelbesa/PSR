"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  FilePlus,
  Clock,
  CheckCircle2,
  FlaskConical,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertCircle,
  BookOpen,
  ClipboardCheck,
  Building2,
  Users,
  Activity,
} from "lucide-react";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
  CartesianGrid,
  Tooltip,
} from "recharts";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

// ─── Stats Data ────────────────────────────────────────────────────────────────
const statsData = [
  {
    title: "Registered Policies",
    value: 42,
    change: 5,
    changeLabel: "newly registered",
    icon: BookOpen,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    title: "Active Concept Notes",
    value: 12,
    change: 3,
    changeLabel: "since last week",
    icon: FilePlus,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  {
    title: "Drafts in Review",
    value: 8,
    change: -2,
    changeLabel: "from last month",
    icon: Clock,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    title: "Approved Research",
    value: 156,
    change: 12,
    changeLabel: "total proposals",
    icon: FlaskConical,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  {
    title: "PSR Decisions",
    value: 28,
    change: 100,
    changeLabel: "ratification rate",
    icon: CheckCircle2,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
];

// ─── Approval Pipeline (7-Stage Workflow) ──────────────────────────────────────
const approvalPipelineData = [
  { stage: "Concept Submission", value: 34, color: "#3b82f6" }, // Stage 1
  { stage: "Expert Review", value: 12, color: "#8b5cf6" }, // Stage 2
  { stage: "PSR CN Decision", value: 8, color: "#06b6d4" }, // Stage 3
  { stage: "Draft Submission", value: 15, color: "#10b981" }, // Stage 4
  { stage: "Checklist Review", value: 6, color: "#f59e0b" }, // Stage 5
  { stage: "PSR Ratification", value: 4, color: "#f43f5e" }, // Stage 6
  { stage: "Registration", value: 42, color: "#1e293b" }, // Stage 7
];

// ─── Workflow Overview (Status Distribution) ───────────────────────────────────
const workflowOverviewData = [
  { name: "In Review", value: 18, percentage: 38, color: "#3b82f6" },
  { name: "Pending Action", value: 12, percentage: 25, color: "#f59e0b" },
  { name: "Ratified", value: 10, percentage: 21, color: "#10b981" },
  { name: "Archived", value: 7, percentage: 16, color: "#64748b" },
];

// ─── Recent Activities (Education Focused) ────────────────────────────────────
const recentActivities = [
  {
    icon: "green",
    user: "Dr. Abebe K.",
    action: 'submitted a concept note: "Digital Literacy in Rural Schools"',
    time: "5 minutes ago",
  },
  {
    icon: "blue",
    user: "PSR Office",
    action: 'initiated checklist review for "TVET Reform Strategy v2"',
    time: "1 hour ago",
  },
  {
    icon: "amber",
    user: "Expert Reviewer",
    action: 'completed evaluation for "Inclusive Education Framework"',
    time: "3 hours ago",
  },
  {
    icon: "purple",
    user: "ROC Board",
    action: "approved 5 new research proposals for AAU",
    time: "Yesterday",
  },
  {
    icon: "green",
    user: "System",
    action: "New Policy Serial ET_MoE_EDU_042 generated for ESDP VI",
    time: "2 days ago",
  },
];

// ─── Thematic Area Data (Education Focused) ───────────────────────────────────
const thematicAreaData = [
  { name: "Basic Education", value: 15, percentage: 36, color: "#3b82f6" },
  { name: "Higher Education", value: 10, percentage: 24, color: "#10b981" },
  { name: "TVET (Vocational)", value: 8, percentage: 19, color: "#f59e0b" },
  { name: "Digital Learning", value: 5, percentage: 12, color: "#8b5cf6" },
  { name: "Teacher Dev.", value: 4, percentage: 9, color: "#ef4444" },
];

const researchTrendData = [
  { month: "Jan", value: 12 },
  { month: "Feb", value: 18 },
  { month: "Mar", value: 15 },
  { month: "Apr", value: 24 },
  { month: "May", value: 31 },
  { month: "Jun", value: 28 },
  { month: "Jul", value: 35 },
  { month: "Aug", value: 42 },
];

const upcomingDeadlines = [
  {
    title: "TVET Checklist Review",
    days: 2,
    status: "Urgent",
    color: "text-red-500",
  },
  {
    title: "PSR Ratification Board",
    days: 5,
    status: "Scheduled",
    color: "text-blue-500",
  },
  {
    title: "ROC Proposal Deadline",
    days: 12,
    status: "Incoming",
    color: "text-emerald-500",
  },
];

// ─── Helper Components ────────────────────────────────────────────────────────

function StatCard({ stat }: { stat: (typeof statsData)[0] }) {
  const Icon = stat.icon;
  const isPositive = stat.change > 0;

  return (
    <Card className="bg-card hover:shadow-md transition-shadow border-primary/10 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className={cn("p-2.5 rounded-xl", stat.iconBg)}>
            <Icon className={cn("h-5 w-5", stat.iconColor)} />
          </div>
        </div>
        <div className="mt-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {stat.title}
          </p>
          <p className="text-3xl font-black mt-1 tracking-tight">
            {stat.value}
          </p>
          <div className="flex items-center gap-1 mt-2">
            {isPositive ? (
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-red-500" />
            )}
            <span
              className={cn(
                "text-xs font-bold",
                isPositive ? "text-emerald-500" : "text-red-500",
              )}
            >
              {isPositive ? "+" : ""}
              {stat.change}%
            </span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase">
              {stat.changeLabel}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ApprovalPipeline() {
  const maxValue = Math.max(...approvalPipelineData.map((d) => d.value));

  return (
    <Card className="shadow-sm border-primary/10">
      <CardHeader className="pb-2 border-b bg-muted/30">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-primary" />
          7-Stage Policy Lifecycle
        </CardTitle>
        <CardDescription>
          Document throughput across all approval stages
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-3.5">
          {approvalPipelineData.map((item, index) => (
            <div key={item.stage} className="flex items-center gap-3">
              <div className="flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0">
                {index + 1}
              </div>
              <span className="text-xs font-medium text-muted-foreground w-32 truncate">
                {item.stage}
              </span>
              <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
              <span className="text-xs font-black w-8 text-right">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function WorkflowOverview() {
  const total = workflowOverviewData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="shadow-sm border-primary/10">
      <CardHeader className="pb-2 border-b bg-muted/30">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Operational Status
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 pb-2">
        <div className="flex flex-col items-center">
          <div className="relative w-40 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={workflowOverviewData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {workflowOverviewData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="none"
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black">{total}</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase">
                Total Active
              </span>
            </div>
          </div>
          <div className="w-full mt-6 space-y-2">
            {workflowOverviewData.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <div
                  className="w-3 h-3 rounded-sm shrink-0 shadow-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-muted-foreground font-medium flex-1">
                  {item.name}
                </span>
                <span className="font-bold">{item.value}</span>
                <span className="text-muted-foreground/70 text-[10px]">
                  ({item.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function UpcomingDeadlines() {
  return (
    <Card className="shadow-sm border-primary/10">
      <CardHeader className="pb-2 border-b bg-muted/30">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-primary" />
          Critical Deadlines
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-5">
          {upcomingDeadlines.map((deadline) => (
            <div
              key={deadline.title}
              className="flex items-start justify-between group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-muted rounded-lg group-hover:bg-primary/5 transition-colors">
                  <Calendar className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-bold leading-none">
                    {deadline.title}
                  </p>
                  <p
                    className={cn(
                      "text-[10px] font-bold uppercase mt-1.5",
                      deadline.color,
                    )}
                  >
                    {deadline.status}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black">{deadline.days}</span>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">
                  Days Left
                </p>
              </div>
            </div>
          ))}
        </div>
        <Button
          variant="ghost"
          className="w-full mt-6 h-9 text-xs font-bold uppercase tracking-wider hover:bg-primary/5 text-primary"
        >
          View Master Calendar
        </Button>
      </CardContent>
    </Card>
  );
}

function RecentActivities() {
  const iconColors: Record<string, string> = {
    green: "bg-emerald-500",
    blue: "bg-blue-500",
    amber: "bg-amber-500",
    purple: "bg-purple-500",
  };

  return (
    <Card className="shadow-sm border-primary/10">
      <CardHeader className="pb-2 border-b bg-muted/30 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Live Activity Feed
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4 relative">
          <div className="absolute left-1 top-2 bottom-2 w-0.5 bg-muted" />
          {recentActivities.map((activity, index) => (
            <div key={index} className="flex items-start gap-4 relative z-10">
              <div
                className={cn(
                  "w-2 h-2 rounded-full mt-1.5 shrink-0 shadow-sm",
                  iconColors[activity.icon],
                )}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs leading-relaxed">
                  {activity.user && (
                    <span className="font-black text-foreground">
                      {activity.user}{" "}
                    </span>
                  )}
                  <span className="text-muted-foreground font-medium">
                    {activity.action}
                  </span>
                </p>
                <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  {activity.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ThematicAreaChart() {
  const total = thematicAreaData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="shadow-sm border-primary/10">
      <CardHeader className="pb-2 border-b bg-muted/30">
        <CardTitle className="text-sm font-bold uppercase tracking-wider">
          Policies by Thematic Area
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 pb-2">
        <div className="flex flex-col items-center">
          <div className="relative w-36 h-36">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={thematicAreaData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {thematicAreaData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="none"
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs font-bold text-muted-foreground uppercase">
                Registry
              </span>
              <span className="text-2xl font-black">{total}</span>
            </div>
          </div>
          <div className="w-full mt-6 grid grid-cols-1 gap-2">
            {thematicAreaData.map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-2 text-[10px]"
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-muted-foreground font-bold truncate flex-1 uppercase tracking-tight">
                  {item.name}
                </span>
                <span className="font-black">{item.value}</span>
                <span className="text-muted-foreground/60">
                  ({item.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ResearchTrendChart() {
  return (
    <Card className="shadow-sm border-primary/10 h-full">
      <CardHeader className="pb-2 border-b bg-muted/30 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-primary" />
          Research Proposal Trends
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={researchTrendData}
              margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                className="stroke-muted"
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={4}
                dot={{ fill: "white", stroke: "#3b82f6", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 0, fill: "#3b82f6" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState("Good morning");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  if (!user) return null;

  return (
    <div className="flex-1 p-6 space-y-6 bg-background">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 ">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">
            {greeting}, {user.firstName}{" "}
            <span className="inline-block origin-bottom">👋</span>
          </h1>
          <p className="text-muted-foreground font-medium mt-1">
            Policy & Research Dashboard — Monitoring Policy and Research
            Outcomes.
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statsData.map((stat) => (
          <StatCard key={stat.title} stat={stat} />
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <ApprovalPipeline />
        </div>
        <div className="lg:col-span-3">
          <WorkflowOverview />
        </div>
        <div className="lg:col-span-4">
          <UpcomingDeadlines />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-8">
        <div className="lg:col-span-4">
          <RecentActivities />
        </div>
        <div className="lg:col-span-3">
          <ThematicAreaChart />
        </div>
        <div className="lg:col-span-5">
          <ResearchTrendChart />
        </div>
      </div>
    </div>
  );
}
