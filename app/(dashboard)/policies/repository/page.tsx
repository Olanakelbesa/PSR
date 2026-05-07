'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FileText, Download, Calendar, Eye, Search, Filter } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageContainer } from '@/components/layout'
import { policyApi } from '@/lib/api/client'
import { POLICY_TYPES } from '@/lib/constants'
import type { PolicyDocument } from '@/lib/types'

export default function PolicyRepositoryPage() {
  const [policies, setPolicies] = useState<PolicyDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    async function loadPolicies() {
      try {
        const response = await policyApi.getPolicies(
          { status: 'published' },
          { page: 1, pageSize: 100 }
        )
        setPolicies(response.data)
      } catch (error) {
        console.error('Failed to load policies:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadPolicies()
  }, [])

  const filteredPolicies = policies.filter((policy) => {
    const matchesSearch =
      policy.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      policy.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === 'all' || policy.type === typeFilter
    return matchesSearch && matchesType
  })

  return (
    <PageContainer
      title="Policy Repository"
      description="Browse and download published policy documents"
    >
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search policies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(POLICY_TYPES).map(([value, { label }]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground">
          Showing {filteredPolicies.length} of {policies.length} documents
        </p>

        {/* Policy Grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="h-16 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPolicies.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No policies found</h3>
              <p className="text-muted-foreground text-center max-w-sm">
                {searchQuery || typeFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'No published policies available yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPolicies.map((policy) => (
              <Card key={policy.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="outline" className="shrink-0">
                      {POLICY_TYPES[policy.type]?.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">v{policy.version}</span>
                  </div>
                  <CardTitle className="text-lg line-clamp-2 mt-2">
                    <Link
                      href={`/policies/repository/${policy.id}`}
                      className="hover:text-primary"
                    >
                      {policy.title}
                    </Link>
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {policy.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {policy.publishedAt
                        ? new Date(policy.publishedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'N/A'}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {policy.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link href={`/policies/repository/${policy.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  )
}
