"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { 
  Building2, 
  ArrowLeft, 
  Save, 
  Info, 
  Globe, 
  ShieldCheck, 
  MapPin, 
  Mail, 
  Phone,
  LayoutGrid
} from "lucide-react";

import { PageContainer } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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

const formSchema = z.object({
  name: z.string().min(5, "Full name is required"),
  code: z.string().min(2, "Institutional code is required (e.g., MOH)"),
  orgType: z.string().min(1, "Please select an organization type"),
  description: z.string().optional(),
  email: z.string().email("Please provide a valid official email"),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export default function RegisterOrganizationPage() {
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      code: "",
      orgType: "government",
      description: "",
      email: "",
      phone: "",
      address: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      toast.success("Organization registered successfully!");
      setTimeout(() => router.push("/organizations"), 2000);
    } catch (error) {
      toast.error("Failed to register organization.");
    }
  }

  return (
    <PageContainer
      title="Register Organization"
      description="Onboard a new institutional partner into the PSR system."
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
                   <CardDescription>Primary identification and classification</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                 <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Full Organization Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Ethiopian Public Health Institute" className="h-12 rounded-xl" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Short Code (Unique ID)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., EPHI" className="h-12 rounded-xl font-black uppercase" {...field} />
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 rounded-xl">
                                <SelectValue placeholder="Select Type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-xl border-primary/10">
                              <SelectItem value="government">Government / Ministry</SelectItem>
                              <SelectItem value="academic">University / College</SelectItem>
                              <SelectItem value="agency">Research Agency</SelectItem>
                              <SelectItem value="international">International Partner</SelectItem>
                            </SelectContent>
                          </Select>
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
                           placeholder="Briefly describe the organization's role and mission..." 
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
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Official Email Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                               <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                               <Input placeholder="admin@org.gov.et" className="pl-10 h-12 rounded-xl" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Contact Phone</FormLabel>
                          <FormControl>
                             <div className="relative">
                               <Phone className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                               <Input placeholder="+251 11 ..." className="pl-10 h-12 rounded-xl" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                 </div>
                 <FormField
                   control={form.control}
                   name="address"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Physical Address</FormLabel>
                       <FormControl>
                         <div className="relative">
                           <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                           <Input placeholder="Building, Street, City" className="pl-10 h-12 rounded-xl" {...field} />
                         </div>
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
              </CardContent>
            </Card>

            <div className="flex flex-col gap-6">
               <div className="p-6 bg-amber-50 rounded-2xl border border-amber-200 flex gap-4">
                  <Info className="h-5 w-5 text-amber-600 shrink-0" />
                  <p className="text-[11px] font-medium text-amber-900 leading-relaxed">
                     **Audit Note:** Registering a new organization will enable the "Affiliation" selector for users during registration. Please ensure the official code matches the government-issued identifier.
                  </p>
               </div>

               <Button 
                 type="submit" 
                 className="w-full h-14 text-base font-black bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl group"
               >
                 <Save className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                 Authorize Institutional Registration
               </Button>
            </div>
          </form>
        </Form>
      </div>
    </PageContainer>
  );
}
