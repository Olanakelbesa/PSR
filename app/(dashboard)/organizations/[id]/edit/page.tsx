"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { 
  Building2, 
  ArrowLeft, 
  Save, 
  Info, 
  Globe, 
  MapPin, 
  Mail, 
  Loader2,
  AlertCircle
} from "lucide-react";

import { PageContainer } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useUpdateOrganization, useOrganization, useOrganizationTypesList } from "@/hooks/useOrganizations";

const formSchema = z.object({
  name: z.string().min(3, "Organization name must be at least 3 characters"),
  orgType: z.string().min(1, "Please select an organization type"),
  description: z.string().optional(),
  organizationEmail: z.string().email("Please provide a valid email").optional().or(z.literal("")),
  organizationWebsite: z.string().url("Please provide a valid URL").optional().or(z.literal("")),
  address: z.string().optional(),
});

export default function EditOrganizationPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  
  const { data: org, isLoading: orgLoading, error: orgError } = useOrganization(id);
  const { data: typesResponse } = useOrganizationTypesList();
  const updateMutation = useUpdateOrganization(id);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      orgType: "",
      description: "",
      organizationEmail: "",
      organizationWebsite: "",
      address: "",
    },
  });

  // Populate form when org data loads
  useEffect(() => {
    if (org) {
      form.reset({
        name: org.name,
        orgType: String(org.orgType),
        description: org.description || "",
        organizationEmail: org.organizationEmail || "",
        organizationWebsite: org.organizationWebsite || "",
        address: org.address || "",
      });
    }
  }, [org, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await updateMutation.mutateAsync({
        name: values.name,
        orgType: Number(values.orgType),
        description: values.description,
        organizationEmail: values.organizationEmail || undefined,
        organizationWebsite: values.organizationWebsite || undefined,
        address: values.address,
      });
      
      toast.success("Organization updated successfully!");
      setTimeout(() => router.push(`/organizations/${id}`), 1500);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to update organization";
      toast.error(errorMsg);
      console.error("[EditOrg]", error);
    }
  }

  if (orgLoading) {
    return (
      <PageContainer title="Loading..." description="Fetching organization details">
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
      title="Edit Organization"
      description={`Update details for ${org.name}`}
      actions={
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
        </Button>
      }
    >
      <div className="max-w-4xl mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card className="border-none shadow-sm overflow-hidden bg-white">
              <CardHeader className="bg-primary/5 p-8 border-b border-primary/10 flex flex-row items-center gap-6">
                <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center border shadow-sm">
                   <Building2 className="h-7 w-7 text-primary" />
                </div>
                <div>
                   <CardTitle className="text-xl font-black tracking-tight">Institutional Metadata</CardTitle>
                   <CardDescription>Update organization identification and classification</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                 <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Organization Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Ministry of Health" className="h-12 rounded-xl" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="orgType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Organization Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 rounded-xl">
                                <SelectValue placeholder="Select Type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-xl border-primary/10">
                              {(typesResponse?.data ?? []).map((type) => (
                                <SelectItem key={type.id} value={String(type.id)}>
                                  {type.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Physical Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="City, Region, Country" className="pl-10 h-12 rounded-xl" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                 </div>

                 <FormField
                   control={form.control}
                   name="description"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description & Mandate</FormLabel>
                       <FormControl>
                         <Textarea 
                           placeholder="Describe the organization's role and mission..." 
                           className="min-h-[120px] rounded-2xl resize-none" 
                           {...field} 
                         />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm overflow-hidden bg-white">
              <CardHeader className="p-8 pb-4">
                 <CardTitle className="text-lg font-black tracking-tight">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-6">
                 <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="organizationEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Official Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                               <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                               <Input placeholder="admin@org.gov.et" className="pl-10 h-12 rounded-xl" type="email" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="organizationWebsite"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Website</FormLabel>
                          <FormControl>
                             <div className="relative">
                               <Globe className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                               <Input placeholder="https://example.gov.et" className="pl-10 h-12 rounded-xl" type="url" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                 </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-6">
               <div className="p-6 bg-blue-50 rounded-2xl border border-blue-200 flex gap-4">
                  <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] font-medium text-blue-900 leading-relaxed">
                     **Update Note:** Changes to organization details will be reflected system-wide. Users affiliated with this organization will automatically see the updated information.
                  </p>
               </div>

               <Button 
                 type="submit" 
                 disabled={updateMutation.isPending}
                 className="w-full h-14 text-base font-black bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl group disabled:opacity-50"
               >
                 {updateMutation.isPending ? (
                   <>
                     <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                     Updating...
                   </>
                 ) : (
                   <>
                     <Save className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                     Update Organization
                   </>
                 )}
               </Button>
            </div>
          </form>
        </Form>
      </div>
    </PageContainer>
  );
}
