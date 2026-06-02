"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Building2, 
  ArrowLeft, 
  Plus, 
  Layers, 
  Users, 
  Settings2, 
  Search, 
  MoreVertical,
  Mail,
  Globe,
  Edit2,
  Trash2,
  CheckCircle2,
  Activity,
  History,
  LayoutGrid,
  Download,
  Loader2,
  AlertCircle
} from "lucide-react";

import { PageContainer } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useOrganization, useDeleteOrganization, useOrganizationType } from "@/hooks/useOrganizations";

export default function OrganizationDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  
  const { data: org, isLoading: orgLoading, error: orgError } = useOrganization(id);
  const { data: orgType } = useOrganizationType(org?.orgType);
  const deleteOrgMutation = useDeleteOrganization();

  const handleDelete = async () => {
    try {
      await deleteOrgMutation.mutateAsync(id);
      toast.success("Organization deleted successfully");
      router.push("/organizations");
    } catch (error) {
      toast.error("Failed to delete organization");
      console.error(error);
    }
  };

  if (orgLoading) {
    return (
      <PageContainer
        title="Loading..."
        description="Fetching organization details"
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageContainer>
    );
  }

  if (orgError || !org) {
    return (
      <PageContainer
        title="Error"
        description="Could not load organization"
        actions={
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        }
      >
        <Card className="border-l-4 border-l-red-500 bg-red-50">
          <CardContent className="p-6 flex items-center gap-4">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <div>
              <h3 className="font-bold text-red-900">Failed to load organization</h3>
              <p className="text-sm text-red-800">{orgError instanceof Error ? orgError.message : "Unknown error"}</p>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={org.name}
      description={`Institutional Profile — ${orgType?.name || "Organization"}`}
      actions={
        <div className="flex gap-2">
           <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
           </Button>
           <Button 
             className="bg-primary hover:bg-primary/90 shadow-lg"
             onClick={() => router.push(`/organizations/${id}/edit`)}
           >
              <Edit2 className="mr-2 h-4 w-4" /> Edit
           </Button>
           <AlertDialog>
             <AlertDialogTrigger asChild>
               <Button variant="destructive">
                 <Trash2 className="mr-2 h-4 w-4" /> Delete
               </Button>
             </AlertDialogTrigger>
             <AlertDialogContent>
               <AlertDialogTitle>Delete Organization</AlertDialogTitle>
               <AlertDialogDescription>
                 Are you sure you want to delete &quot;{org.name}&quot;? This action cannot be undone.
               </AlertDialogDescription>
               <div className="flex gap-4 justify-end">
                 <AlertDialogCancel>Cancel</AlertDialogCancel>
                 <AlertDialogAction
                   onClick={handleDelete}
                   disabled={deleteOrgMutation.isPending}
                   className="bg-red-600 hover:bg-red-700"
                 >
                   {deleteOrgMutation.isPending ? "Deleting..." : "Delete"}
                 </AlertDialogAction>
               </div>
             </AlertDialogContent>
           </AlertDialog>
        </div>
      }
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
        {/* Main Content */}
        <div className="space-y-8">
           
           {/* Info Cards Row */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-none shadow-sm">
                 <CardContent className="p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                       <Mail className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email</p>
                       <p className="text-sm font-black truncate">{org.organizationEmail || "—"}</p>
                    </div>
                 </CardContent>
              </Card>
              <Card className="border-none shadow-sm">
                 <CardContent className="p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                       <Globe className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Website</p>
                       <p className="text-sm font-black truncate">{org.organizationWebsite ? "Linked" : "—"}</p>
                    </div>
                 </CardContent>
              </Card>
              <Card className="border-none shadow-sm">
                 <CardContent className="p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center">
                       <Building2 className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Type</p>
                       <p className="text-sm font-black">{orgType?.name || "—"}</p>
                    </div>
                 </CardContent>
              </Card>
           </div>

           <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="bg-white border p-1 rounded-xl h-11">
                 <TabsTrigger value="overview" className="rounded-lg font-bold text-xs uppercase px-6">Overview</TabsTrigger>
                 <TabsTrigger value="details" className="rounded-lg font-bold text-xs uppercase px-6">Details</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="m-0 space-y-4">
                 <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="p-6 pb-4">
                       <CardTitle>Organization Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 pt-0 space-y-6">
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Description</p>
                          <p className="text-sm text-slate-700 leading-relaxed">{org.description || "No description provided"}</p>
                       </div>
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Address</p>
                          <p className="text-sm text-slate-700">{org.address || "Not specified"}</p>
                       </div>
                    </CardContent>
                 </Card>
              </TabsContent>

              {/* Details Tab */}
              <TabsContent value="details" className="m-0 space-y-4">
                 <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="p-6 pb-4">
                       <CardTitle>System Metadata</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 pt-0 space-y-4">
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                             <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Created</p>
                             <p className="text-sm font-medium">{new Date(org.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div>
                             <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Organization ID</p>
                             <p className="text-sm font-mono font-bold">{org.id}</p>
                          </div>
                       </div>
                    </CardContent>
                 </Card>
              </TabsContent>
           </Tabs>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
           <Card className="border-none shadow-sm overflow-hidden bg-white">
              <CardHeader className="bg-slate-900 p-8 text-white">
                 <div className="flex items-center gap-3 mb-2">
                    <Building2 className="h-6 w-6 opacity-80 text-primary" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Organization Profile</p>
                 </div>
                 <CardTitle className="text-xl font-black tracking-tight">{org.name}</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                 <div className="space-y-4">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Contact Information</p>
                       <div className="space-y-2 pt-2">
                          {org.organizationEmail && (
                            <div className="flex items-center gap-3 text-xs font-bold text-slate-700">
                               <Mail className="h-3.5 w-3.5 text-primary" /> {org.organizationEmail}
                            </div>
                          )}
                          {org.organizationWebsite && (
                            <div className="flex items-center gap-3 text-xs font-bold text-slate-700 truncate">
                               <Globe className="h-3.5 w-3.5 text-primary" /> {org.organizationWebsite}
                            </div>
                          )}
                       </div>
                    </div>
                    <div className="space-y-1 pt-4">
                       <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Type Classification</p>
                       <div className="flex items-center gap-2 mt-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-800">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-[10px] font-black uppercase">{orgType?.name}</span>
                       </div>
                    </div>
                 </div>
              </CardContent>
           </Card>

           <Card className="border-none shadow-sm bg-primary/5 border-dashed border-primary/20">
              <CardHeader className="pb-2">
                 <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary">System Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="space-y-2 text-[11px]">
                    <div className="flex justify-between">
                       <span className="text-muted-foreground">Created:</span>
                       <span className="font-bold">{new Date(org.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                       <span className="text-muted-foreground">ID:</span>
                       <span className="font-mono font-bold">{org.id}</span>
                    </div>
                 </div>
              </CardContent>
           </Card>
        </aside>
      </div>
    </PageContainer>
  );
}
