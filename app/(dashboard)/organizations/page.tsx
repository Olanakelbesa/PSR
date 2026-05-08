'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Plus,
  Search,
  Filter,
  Building2,
  Users,
  MapPin,
  Mail,
  Phone,
  Globe,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { PageContainer } from '@/components/layout'

interface Organization {
  id: string
  name: string
  type: 'government' | 'academic' | 'ngo' | 'international' | 'private'
  email: string
  phone?: string
  website?: string
  location: string
  membersCount: number
  projectsCount: number
  isActive: boolean
}

const mockOrganizations: Organization[] = [
  {
    id: '1',
    name: 'Ethiopian Ministry of Education',
    type: 'government',
    email: 'info@moe.gov.et',
    phone: '+251-11-155-3133',
    website: 'https://moe.gov.et',
    location: 'Addis Ababa, Ethiopia',
    membersCount: 156,
    projectsCount: 45,
    isActive: true,
  },
  {
    id: '2',
    name: 'Addis Ababa University',
    type: 'academic',
    email: 'info@aau.edu.et',
    website: 'https://aau.edu.et',
    location: 'Addis Ababa, Ethiopia',
    membersCount: 89,
    projectsCount: 67,
    isActive: true,
  },
  {
    id: '3',
    name: 'UNESCO - Ethiopia Office',
    type: 'international',
    email: 'addis@unesco.org',
    website: 'https://unesco.org/fieldoffice/addisababa',
    location: 'Addis Ababa, Ethiopia',
    membersCount: 34,
    projectsCount: 28,
    isActive: true,
  },
  {
    id: '4',
    name: 'National Educational Assessment and Examinations Agency',
    type: 'government',
    email: 'info@neaea.gov.et',
    website: 'https://neaea.gov.et',
    location: 'Addis Ababa, Ethiopia',
    membersCount: 78,
    projectsCount: 52,
    isActive: true,
  },
  {
    id: '5',
    name: 'USAID Ethiopia',
    type: 'international',
    email: 'ethiopia@usaid.gov',
    website: 'https://usaid.gov/ethiopia',
    location: 'Addis Ababa, Ethiopia',
    membersCount: 45,
    projectsCount: 31,
    isActive: true,
  },
  {
    id: '6',
    name: 'Jimma University',
    type: 'academic',
    email: 'info@ju.edu.et',
    website: 'https://ju.edu.et',
    location: 'Jimma, Ethiopia',
    membersCount: 56,
    projectsCount: 38,
    isActive: true,
  },
]

const typeConfig: Record<string, { label: string; color: string }> = {
  government: { label: 'Government', color: 'bg-blue-500' },
  academic: { label: 'Academic', color: 'bg-purple-500' },
  ngo: { label: 'NGO', color: 'bg-green-500' },
  international: { label: 'International', color: 'bg-amber-500' },
  private: { label: 'Private', color: 'bg-slate-500' },
}

function OrganizationCard({ org }: { org: Organization }) {
  const typeInfo = typeConfig[org.type] || typeConfig.private

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {org.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base leading-tight line-clamp-1">
                {org.name}
              </CardTitle>
              <Badge variant="outline" className="mt-1 text-xs">
                <div className={`w-2 h-2 rounded-full ${typeInfo.color} mr-1.5`} />
                {typeInfo.label}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* Contact Info */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{org.location}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4 shrink-0" />
            <span className="truncate">{org.email}</span>
          </div>
          {org.website && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="h-4 w-4 shrink-0" />
              <a 
                href={org.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="truncate hover:text-primary hover:underline"
              >
                {org.website.replace('https://', '')}
              </a>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-lg font-bold">{org.membersCount}</p>
            <p className="text-xs text-muted-foreground">Members</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <Building2 className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-lg font-bold">{org.projectsCount}</p>
            <p className="text-xs text-muted-foreground">Projects</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function OrganizationsPage() {
  const [organizations] = useState<Organization[]>(mockOrganizations)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredOrgs = organizations.filter(org => {
    if (typeFilter !== 'all' && org.type !== typeFilter) return false
    if (searchQuery && !org.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  return (
    <PageContainer
      title="Organizations"
      description="Manage partner organizations and institutions"
      actions={
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Organization
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{organizations.length}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          {Object.entries(typeConfig).map(([key, config]) => {
            const count = organizations.filter(o => o.type === key).length
            return (
              <Card key={key}>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm text-muted-foreground">{config.label}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search organizations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(typeConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Organizations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrgs.map((org) => (
            <OrganizationCard key={org.id} org={org} />
          ))}
        </div>

        {filteredOrgs.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No organizations found</h3>
              <p className="text-muted-foreground">
                {searchQuery || typeFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'Add your first organization to get started'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  )
}
