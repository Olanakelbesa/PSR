'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, Mail, Phone, Building2, Briefcase, Calendar, Clock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { PageContainer } from '@/components/layout'
import { StatusBadge } from '@/components/shared'
import { userApi } from '@/api/client'
import { ROLES } from '@/lib/constants'
import type { User } from '@/lib/types'

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await userApi.getUser(params.id as string)
        if (response.success && response.data) {
          setUser(response.data)
        } else {
          router.push('/users')
        }
      } catch (error) {
        console.error('Failed to load user:', error)
        router.push('/users')
      } finally {
        setIsLoading(false)
      }
    }
    loadUser()
  }, [params.id, router])

  if (isLoading) {
    return (
      <PageContainer title="Loading...">
        <div className="space-y-6">
          <div className="h-32 bg-muted animate-pulse rounded-lg" />
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
        </div>
      </PageContainer>
    )
  }

  if (!user) {
    return null
  }

  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
  const roleConfig = ROLES[user.role]

  return (
    <PageContainer
      title="User Details"
      description="View and manage user information"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/users">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/users/${user.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit User
            </Link>
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-muted-foreground">{user.position || 'No position'}</p>
              <div className="flex items-center gap-2 mt-3">
                <StatusBadge type="role" status={user.role} />
                <StatusBadge type="user" status={user.status} />
              </div>
            </div>

            <Separator className="my-6" />

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm">{user.email}</p>
                </div>
              </div>
              {user.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm">{user.phone}</p>
                  </div>
                </div>
              )}
              {user.institution && (
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Institution</p>
                    <p className="text-sm">{user.institution}</p>
                  </div>
                </div>
              )}
              {user.department && (
                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Department</p>
                    <p className="text-sm">{user.department}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Details Cards */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Role Information</CardTitle>
              <CardDescription>User role and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Role</p>
                  <p className="text-lg">{roleConfig?.label}</p>
                  <p className="text-sm text-muted-foreground">{roleConfig?.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Activity</CardTitle>
              <CardDescription>Login history and account dates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Account Created</p>
                    <p className="text-sm font-medium">
                      {new Date(user.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Last Login</p>
                    <p className="text-sm font-medium">
                      {user.lastLogin
                        ? new Date(user.lastLogin).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'Never'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm">
                Reset Password
              </Button>
              <Button variant="outline" size="sm">
                Send Welcome Email
              </Button>
              {user.status === 'active' ? (
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                  Deactivate Account
                </Button>
              ) : (
                <Button variant="outline" size="sm" className="text-green-600 hover:text-green-600">
                  Activate Account
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
