'use client'

import Link from 'next/link'
import {
  Tags,
  History,
  Settings,
  Users,
  Shield,
  Bell,
  Database,
  Globe,
  ChevronRight,
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer } from '@/components/layout'

const settingsSections = [
  {
    title: 'Taxonomy Management',
    description: 'Manage thematic areas, study types, regions, and other classification data',
    icon: Tags,
    href: '/settings/taxonomy',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    title: 'Audit Logs',
    description: 'View system activity logs and track user actions',
    icon: History,
    href: '/settings/audit-logs',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    title: 'User Roles & Permissions',
    description: 'Configure role-based access controls and permissions',
    icon: Shield,
    href: '/settings/roles',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  {
    title: 'Notification Settings',
    description: 'Configure email notifications and system alerts',
    icon: Bell,
    href: '/settings/notifications',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    title: 'System Configuration',
    description: 'General system settings and configuration options',
    icon: Settings,
    href: '/settings/system',
    color: 'text-slate-500',
    bgColor: 'bg-slate-500/10',
  },
  {
    title: 'Data Management',
    description: 'Backup, export, and import system data',
    icon: Database,
    href: '/settings/data',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
  },
]

export default function SettingsPage() {
  return (
    <PageContainer
      title="System Settings"
      description="Configure and manage system-wide settings"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {settingsSections.map((section) => {
          const Icon = section.icon
          return (
            <Link key={section.href} href={section.href}>
              <Card className="h-full hover:shadow-md transition-all hover:border-primary/50 cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg ${section.bgColor}`}>
                      <Icon className={`h-6 w-6 ${section.color}`} />
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-base mb-2">{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </PageContainer>
  )
}
