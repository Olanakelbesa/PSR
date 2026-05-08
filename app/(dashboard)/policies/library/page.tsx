'use client'

import { useState } from 'react'
import { 
  Library, 
  Search, 
  Filter, 
  Download, 
  ExternalLink, 
  Bookmark,
  FileText,
  Calendar,
  Building2,
  Tag,
  ChevronRight,
  LayoutGrid,
  List as ListIcon,
  ArrowUpDown
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
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
import { PageContainer } from '@/components/layout'

interface PolicyDocument {
  id: string
  title: string
  type: string
  category: string
  organization: string
  publishedDate: string
  version: string
  fileSize: string
  tags: string[]
}

const mockLibrary: PolicyDocument[] = [
  {
    id: 'POL-001',
    title: 'Education Sector Development Programme VI (ESDP VI)',
    type: 'Policy',
    category: 'Sector Strategy',
    organization: 'Ministry of Education',
    publishedDate: '2023-11-15',
    version: '1.0',
    fileSize: '4.2 MB',
    tags: ['Strategic', 'National', 'Infrastructure'],
  },
  {
    id: 'POL-002',
    title: 'Digital Literacy Framework for Primary Schools',
    type: 'Framework',
    category: 'ICT in Education',
    organization: 'ICT Directorate',
    publishedDate: '2024-01-20',
    version: '2.1',
    fileSize: '2.8 MB',
    tags: ['Digital', 'Primary', 'Syllabus'],
  },
  {
    id: 'POL-003',
    title: 'Higher Education Quality Assurance Guidelines',
    type: 'Guideline',
    category: 'Quality Control',
    organization: 'HERQA',
    publishedDate: '2023-08-05',
    version: '3.0',
    fileSize: '1.5 MB',
    tags: ['Academic', 'Standards', 'Compliance'],
  },
  {
    id: 'POL-004',
    title: 'Inclusive Education Implementation Guide',
    type: 'Guide',
    category: 'Social Inclusion',
    organization: 'Special Needs Department',
    publishedDate: '2024-02-12',
    version: '1.2',
    fileSize: '3.1 MB',
    tags: ['Inclusive', 'Resource', 'Implementation'],
  },
  {
    id: 'POL-005',
    title: 'TVET Transformation Strategy 2025',
    type: 'Strategy',
    category: 'Vocational Training',
    organization: 'TVET Agency',
    publishedDate: '2023-12-01',
    version: '1.0',
    fileSize: '5.4 MB',
    tags: ['TVET', 'Skills', 'Economic'],
  },
  {
    id: 'POL-006',
    title: 'Research Ethics and Integrity Protocol',
    type: 'Protocol',
    category: 'Research Governance',
    organization: 'Research Directorate',
    publishedDate: '2024-03-01',
    version: '1.1',
    fileSize: '1.2 MB',
    tags: ['Ethics', 'Research', 'Academic'],
  },
]

export default function PolicyLibraryPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const filteredLibrary = mockLibrary.filter(doc => {
    if (categoryFilter !== 'all' && doc.category !== categoryFilter) return false
    if (searchQuery && !doc.title.toLowerCase().includes(searchQuery.toLowerCase()) && !doc.id.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  return (
    <PageContainer
      title="Policy Repository"
      description="Access and download finalized education policies, strategies, and guidelines"
    >
      <div className="space-y-8">
        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full lg:max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search repository..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-11 bg-muted/30 border-muted focus:bg-background transition-all"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[200px] h-11 bg-muted/30 border-muted">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Sector Strategy">Sector Strategy</SelectItem>
                <SelectItem value="ICT in Education">ICT in Education</SelectItem>
                <SelectItem value="Quality Control">Quality Control</SelectItem>
                <SelectItem value="Research Governance">Research Governance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 border rounded-lg p-1 bg-muted/20">
            <Button 
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="h-8 w-8 p-0 rounded-md"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="h-8 w-8 p-0 rounded-md"
              onClick={() => setViewMode('list')}
            >
              <ListIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content Section */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredLibrary.map((doc) => (
              <Card key={doc.id} className="group flex flex-col hover:shadow-xl transition-all duration-300 border-muted/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                      <FileText className="h-5 w-5" />
                    </div>
                    <Badge variant="secondary" className="bg-muted/50 text-[10px] uppercase font-bold tracking-wider">
                      v{doc.version}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors cursor-pointer line-clamp-2 min-h-[3.5rem]">
                    {doc.title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-tight mt-2">
                    <Building2 className="h-3 w-3" />
                    {doc.organization}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div className="flex flex-wrap gap-1.5">
                    {doc.tags.map(tag => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/5 text-primary-foreground/70 border border-primary/10 font-medium italic">
                        #{tag.toLowerCase()}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4 py-3 border-y border-muted/30">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">Published</span>
                      <span className="text-sm font-medium">{doc.publishedDate}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">Size</span>
                      <span className="text-sm font-medium">{doc.fileSize}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="grid grid-cols-2 gap-3 pt-2">
                  <Button variant="outline" className="h-10 w-full text-xs font-bold uppercase gap-2 hover:bg-primary hover:text-white border-primary/20">
                    <ExternalLink className="h-4 w-4" />
                    Preview
                  </Button>
                  <Button className="h-10 w-full text-xs font-bold uppercase gap-2 shadow-lg shadow-primary/20">
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-muted/50 overflow-hidden bg-card/50 backdrop-blur-sm">
            <div className="grid grid-cols-12 gap-4 p-4 bg-muted/30 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <div className="col-span-6">Document Title</div>
              <div className="col-span-2">Organization</div>
              <div className="col-span-2">Published</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            <div className="divide-y divide-muted/30">
              {filteredLibrary.map((doc) => (
                <div key={doc.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/20 transition-colors group">
                  <div className="col-span-6 flex items-center gap-4">
                    <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary/70">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm group-hover:text-primary transition-colors">{doc.title}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-tighter">{doc.type}</span>
                        <span className="text-[10px] text-muted-foreground">•</span>
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-tighter">v{doc.version}</span>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 text-sm text-muted-foreground font-medium">{doc.organization}</div>
                  <div className="col-span-2 text-sm text-muted-foreground">{doc.publishedDate}</div>
                  <div className="col-span-2 flex justify-end gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary">
                      <Bookmark className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {filteredLibrary.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-muted rounded-3xl">
            <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
              <Library className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold">No documents found</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mt-2">
              We couldn't find any documents matching your search. Try different keywords or clear the filters.
            </p>
            <Button variant="outline" className="mt-8 px-8" onClick={() => { setSearchQuery(''); setCategoryFilter('all'); }}>
              Clear All Filters
            </Button>
          </div>
        )}
      </div>
    </PageContainer>
  )
}
