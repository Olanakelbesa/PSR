'use client'

import { useState } from 'react'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  Tags,
  MapPin,
  FileType,
  Building2,
  ChevronRight,
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { PageContainer } from '@/components/layout'
import { THEMATIC_AREAS, STUDY_TYPES, REGIONS } from '@/lib/constants'

interface TaxonomyItem {
  value: string
  label: string
  description?: string
  isActive?: boolean
  itemCount?: number
}

function TaxonomyTable({ 
  items, 
  onEdit, 
  onDelete 
}: { 
  items: TaxonomyItem[]
  onEdit: (item: TaxonomyItem) => void
  onDelete: (item: TaxonomyItem) => void
}) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredItems = items.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add New
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Item</DialogTitle>
              <DialogDescription>
                Create a new taxonomy item
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="label">Label *</Label>
                <Input id="label" placeholder="Enter label" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">Value/Code *</Label>
                <Input id="value" placeholder="Enter unique value" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Optional description" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="active">Active</Label>
                <Switch id="active" defaultChecked />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline">Cancel</Button>
              <Button>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Label</TableHead>
              <TableHead>Value/Code</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item.value}>
                <TableCell className="font-medium">{item.label}</TableCell>
                <TableCell className="text-muted-foreground">{item.value}</TableCell>
                <TableCell>
                  <Badge variant={item.isActive !== false ? 'default' : 'secondary'}>
                    {item.isActive !== false ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.itemCount || Math.floor(Math.random() * 50)} items
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(item)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => onDelete(item)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default function TaxonomyPage() {
  const handleEdit = (item: TaxonomyItem) => {
    console.log('Edit:', item)
  }

  const handleDelete = (item: TaxonomyItem) => {
    console.log('Delete:', item)
  }

  const thematicItems = THEMATIC_AREAS.map(area => ({
    ...area,
    isActive: true,
    itemCount: Math.floor(Math.random() * 50) + 5,
  }))

  const studyTypeItems = STUDY_TYPES.map(type => ({
    ...type,
    isActive: true,
    itemCount: Math.floor(Math.random() * 30) + 5,
  }))

  const regionItems = REGIONS.map(region => ({
    ...region,
    isActive: true,
    itemCount: Math.floor(Math.random() * 40) + 10,
  }))

  return (
    <PageContainer
      title="Taxonomy Management"
      description="Manage classification data used throughout the system"
    >
      <Tabs defaultValue="thematic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="thematic" className="gap-2">
            <Tags className="h-4 w-4" />
            Thematic Areas
          </TabsTrigger>
          <TabsTrigger value="study-types" className="gap-2">
            <FileType className="h-4 w-4" />
            Study Types
          </TabsTrigger>
          <TabsTrigger value="regions" className="gap-2">
            <MapPin className="h-4 w-4" />
            Regions
          </TabsTrigger>
          <TabsTrigger value="organizations" className="gap-2">
            <Building2 className="h-4 w-4" />
            Organizations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="thematic">
          <Card>
            <CardHeader>
              <CardTitle>Thematic Areas</CardTitle>
              <CardDescription>
                Manage research and policy thematic areas/categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TaxonomyTable 
                items={thematicItems} 
                onEdit={handleEdit} 
                onDelete={handleDelete} 
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="study-types">
          <Card>
            <CardHeader>
              <CardTitle>Study Types</CardTitle>
              <CardDescription>
                Manage research study types and methodologies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TaxonomyTable 
                items={studyTypeItems} 
                onEdit={handleEdit} 
                onDelete={handleDelete} 
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regions">
          <Card>
            <CardHeader>
              <CardTitle>Regions</CardTitle>
              <CardDescription>
                Manage geographic regions and administrative areas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TaxonomyTable 
                items={regionItems} 
                onEdit={handleEdit} 
                onDelete={handleDelete} 
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organizations">
          <Card>
            <CardHeader>
              <CardTitle>Organizations</CardTitle>
              <CardDescription>
                Manage partner organizations and institutions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TaxonomyTable 
                items={[
                  { value: 'moe', label: 'Ministry of Education', isActive: true, itemCount: 45 },
                  { value: 'unesco', label: 'UNESCO', isActive: true, itemCount: 23 },
                  { value: 'unicef', label: 'UNICEF', isActive: true, itemCount: 18 },
                  { value: 'usaid', label: 'USAID', isActive: true, itemCount: 31 },
                  { value: 'aau', label: 'Addis Ababa University', isActive: true, itemCount: 56 },
                  { value: 'neaea', label: 'National Educational Assessment agency', isActive: true, itemCount: 42 },
                ]} 
                onEdit={handleEdit} 
                onDelete={handleDelete} 
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  )
}
