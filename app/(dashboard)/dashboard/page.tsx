'use client'

import { useEffect, useState } from 'react'
import {
  FileText,
  FilePlus,
  Clock,
  CheckCircle2,
  FlaskConical,
  TrendingUp,
  TrendingDown,
  Settings2,
  Calendar,
  AlertCircle,
} from 'lucide-react'
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
  Legend,
} from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth-store'

// Mock data for dashboard
const statsData = [
  {
    title: 'Total Policies',
    value: 128,
    change: 12,
    changeLabel: 'from last month',
    icon: FileText,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    title: 'Concept Notes',
    value: 24,
    change: 8,
    changeLabel: 'from last month',
    icon: FilePlus,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    title: 'Under Review',
    value: 18,
    change: -5,
    changeLabel: 'from last month',
    icon: Clock,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
  {
    title: 'Approved',
    value: 96,
    change: 15,
    changeLabel: 'from last month',
    icon: CheckCircle2,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
  },
  {
    title: 'Research Proposals',
    value: 156,
    change: 18,
    changeLabel: 'from last month',
    icon: FlaskConical,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
]

const approvalPipelineData = [
  { stage: 'Submitted', value: 56, color: '#3b82f6' },
  { stage: 'Under Review', value: 18, color: '#8b5cf6' },
  { stage: 'Technical Review', value: 12, color: '#06b6d4' },
  { stage: 'PSR Approval', value: 8, color: '#10b981' },
  { stage: 'Final Approval', value: 6, color: '#f59e0b' },
]

const workflowOverviewData = [
  { name: 'Submitted', value: 43, percentage: 33.6, color: '#3b82f6' },
  { name: 'Under Review', value: 28, percentage: 21.9, color: '#8b5cf6' },
  { name: 'Technical Review', value: 26, percentage: 20.3, color: '#06b6d4' },
  { name: 'PSR Approval', value: 15, percentage: 11.7, color: '#10b981' },
  { name: 'Final Approval', value: 16, percentage: 12.5, color: '#f59e0b' },
]

const recentActivities = [
  { 
    icon: 'green',
    user: 'Dr. Hirst', 
    action: 'submitted a concept note',
    time: '2 minutes ago' 
  },
  { 
    icon: 'blue',
    user: '', 
    action: 'ROC evaluation completed for Proposal R-2024-156',
    time: '' 
  },
  { 
    icon: 'amber',
    user: '', 
    action: 'Policy draft "NCD Strategic Plan" updated',
    time: '1 hour ago' 
  },
  { 
    icon: 'green',
    user: '', 
    action: 'User Berhekt T. was added to PSR Office',
    time: '2 hours ago' 
  },
  { 
    icon: 'purple',
    user: '', 
    action: 'Final report submitted for Proposal R-2023-089',
    time: '3 hours ago' 
  },
]

const thematicAreaData = [
  { name: 'Health Systems', value: 32, percentage: 25, color: '#3b82f6' },
  { name: 'Nutrition', value: 28, percentage: 22, color: '#10b981' },
  { name: 'Communicable Diseases', value: 20, percentage: 16, color: '#f59e0b' },
  { name: 'NCDs', value: 18, percentage: 14, color: '#ef4444' },
  { name: 'RMNCAH', value: 15, percentage: 12, color: '#8b5cf6' },
  { name: 'Others', value: 15, percentage: 12, color: '#6b7280' },
]

const researchTrendData = [
  { month: 'Jan', value: 20 },
  { month: 'Feb', value: 35 },
  { month: 'Mar', value: 28 },
  { month: 'Apr', value: 45 },
  { month: 'May', value: 55 },
  { month: 'Jun', value: 48 },
  { month: 'Jul', value: 62 },
  { month: 'Aug', value: 75 },
]

const upcomingDeadlines = [
  { title: 'Concept Note Review', days: 3, status: 'Overdue', color: 'text-red-500' },
  { title: 'ROC Evaluation', days: 5, status: 'Due in 3 days', color: 'text-amber-500' },
  { title: 'Progress Reports', days: 12, status: 'Due in 7 days', color: 'text-blue-500' },
  { title: 'Final Reports', days: 7, status: 'Due in 14 days', color: 'text-blue-500' },
]

function StatCard({ stat }: { stat: typeof statsData[0] }) {
  const Icon = stat.icon
  const isPositive = stat.change > 0

  return (
    <Card className="bg-card hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className={`p-2.5 rounded-full ${stat.iconBg}`}>
            <Icon className={`h-5 w-5 ${stat.iconColor}`} />
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
          <p className="text-3xl font-bold mt-1">{stat.value}</p>
          <div className="flex items-center gap-1 mt-2">
            {isPositive ? (
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span className={`text-sm font-medium ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
              {isPositive ? '+' : ''}{stat.change}%
            </span>
            <span className="text-sm text-muted-foreground">{stat.changeLabel}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ApprovalPipeline() {
  const maxValue = Math.max(...approvalPipelineData.map(d => d.value))
  const conversionRate = ((approvalPipelineData[4].value / approvalPipelineData[0].value) * 100).toFixed(1)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Approval Pipeline</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-3">
          {approvalPipelineData.map((item) => (
            <div key={item.stage} className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground w-28 truncate">{item.stage}</span>
              <div className="flex-1 h-6 bg-muted rounded-sm overflow-hidden">
                <div
                  className="h-full rounded-sm transition-all duration-500"
                  style={{ 
                    width: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: item.color 
                  }}
                />
              </div>
              <span className="text-sm font-semibold w-8 text-right">{item.value}</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          Conversion Rate: <span className="font-semibold text-foreground">{conversionRate}%</span>
        </p>
      </CardContent>
    </Card>
  )
}

function WorkflowOverview() {
  const total = workflowOverviewData.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Workflow Overview</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-4">
          <div className="relative w-36 h-36">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={workflowOverviewData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {workflowOverviewData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold">{total}</span>
              <span className="text-xs text-muted-foreground text-center">Total</span>
            </div>
          </div>
          <div className="flex-1 space-y-1.5">
            {workflowOverviewData.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <div 
                  className="w-2.5 h-2.5 rounded-full shrink-0" 
                  style={{ backgroundColor: item.color }} 
                />
                <span className="text-muted-foreground truncate flex-1">{item.name}</span>
                <span className="font-medium">{item.value}</span>
                <span className="text-muted-foreground">({item.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function UpcomingDeadlines() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Upcoming Deadlines</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-3">
          {upcomingDeadlines.map((deadline) => (
            <div key={deadline.title} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{deadline.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold">{deadline.days}</span>
                <span className={`text-xs ${deadline.color}`}>{deadline.status}</span>
              </div>
            </div>
          ))}
        </div>
        <Button variant="link" className="p-0 h-auto mt-4 text-primary text-sm">
          View all deadlines
        </Button>
      </CardContent>
    </Card>
  )
}

function RecentActivities() {
  const iconColors: Record<string, string> = {
    green: 'bg-emerald-500',
    blue: 'bg-blue-500',
    amber: 'bg-amber-500',
    purple: 'bg-purple-500',
  }

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">Recent Activities</CardTitle>
        <Button variant="link" className="p-0 h-auto text-primary text-sm">
          View all
        </Button>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-3">
          {recentActivities.map((activity, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-2 ${iconColors[activity.icon]}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  {activity.user && <span className="font-medium">{activity.user} </span>}
                  {activity.action}
                </p>
                {activity.time && (
                  <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ThematicAreaChart() {
  const total = thematicAreaData.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Policies by Thematic Area</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-4">
          <div className="relative w-32 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={thematicAreaData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={50}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {thematicAreaData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold">Total</span>
              <span className="text-xl font-bold">{total}</span>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1.5">
            {thematicAreaData.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <div 
                  className="w-2 h-2 rounded-full shrink-0" 
                  style={{ backgroundColor: item.color }} 
                />
                <span className="text-muted-foreground truncate">{item.name}</span>
                <span className="font-medium ml-auto">{item.value} ({item.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ResearchTrendChart() {
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">Research Proposals Trend</CardTitle>
        <span className="text-xs text-muted-foreground">This Year</span>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={researchTrendData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 10 }} 
                axisLine={false}
                tickLine={false}
                className="text-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 10 }} 
                axisLine={false}
                tickLine={false}
                className="text-muted-foreground"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [greeting, setGreeting] = useState('Good morning')

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 18) setGreeting('Good afternoon')
    else setGreeting('Good evening')
  }, [])

  if (!user) return null

  return (
    <div className="flex-1 p-6 space-y-6 bg-background overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {greeting}, {user.firstName} <span className="inline-block animate-pulse">&#128075;</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            {"Here's what's happening with policy and research management today."}
          </p>
        </div>
        {/* <Button variant="outline" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Customize
        </Button> */}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {statsData.map((stat) => (
          <StatCard key={stat.title} stat={stat} />
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ApprovalPipeline />
        <WorkflowOverview />
        <UpcomingDeadlines />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <RecentActivities />
        <ThematicAreaChart />
        <ResearchTrendChart />
      </div>
    </div>
  )
}
