"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { 
  Settings2, 
  User, 
  BellRing, 
  Database, 
  Monitor, 
  Key, 
  Save, 
  Mail, 
  Activity, 
  Globe,
  Camera,
  Smartphone,
  ChevronRight,
  Info,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  Search,
  Plus,
  Trash2,
  FileBadge,
  GraduationCap,
  Building2,
  Shield
} from "lucide-react";

import { PageContainer } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
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
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Form Schemas
const profileSchema = z.object({
  title: z.string().min(1),
  fullName: z.string().min(3),
  phone: z.string().min(10),
});

const securitySchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function SettingsHubPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [selectedTaxonomy, setSelectedTaxonomy] = useState<string | null>(null);

  // Forms
  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { title: "dr", fullName: "Dr. Abera Molla", phone: "+251 911 223344" }
  });

  const securityForm = useForm<z.infer<typeof securitySchema>>({
    resolver: zodResolver(securitySchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" }
  });

  const onProfileSubmit = (values: z.infer<typeof profileSchema>) => {
    toast.success("Profile updated successfully!");
  };

  const onSecuritySubmit = (values: z.infer<typeof securitySchema>) => {
    toast.success("Security credentials updated!");
    securityForm.reset();
  };

  const taxonomyItems = [
    { id: "ra", label: "Research Areas", count: 12, icon: Globe, items: ["Epidemiology", "Public Health", "WASH", "Mental Health"] },
    { id: "ot", label: "Organization Types", count: 5, icon: Building2, items: ["Government", "University", "NGO", "International"] },
    { id: "ar", label: "Academic Ranks", count: 8, icon: GraduationCap, items: ["Professor", "Associate Professor", "Lecturer", "TA"] },
    { id: "od", label: "Output Deliverables", count: 6, icon: FileBadge, items: ["Policy Brief", "Full Report", "Manuscript", "Codebook"] },
  ];

  return (
    <PageContainer
      title="System & Account Settings"
      description="Configure your personal preferences and manage global system taxonomy."
    >
      <div className="max-w-6xl mx-auto">
        <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
             
             {/* Sidebar Navigation */}
             <div className="w-full md:w-64 shrink-0 bg-white p-2 rounded-2xl shadow-sm border border-slate-100 sticky top-24">
                <TabsList className="flex flex-col h-auto w-full bg-transparent gap-1 p-0">
                   {[
                     { id: "profile", label: "My Profile", icon: User },
                     { id: "security", label: "Login & Security", icon: Shield },
                     { id: "notifications", label: "Notification Settings", icon: BellRing },
                     { id: "system", label: "Global Taxonomy", icon: Database },
                   ].map((item) => (
                     <TabsTrigger 
                       key={item.id}
                       value={item.id} 
                       onClick={() => setSelectedTaxonomy(null)}
                       className="w-full justify-start gap-3 h-11 px-4 rounded-xl data-[state=active]:bg-primary/5 data-[state=active]:text-primary transition-all font-bold text-xs uppercase tracking-widest text-muted-foreground hover:bg-slate-50 border-none shadow-none"
                     >
                       <item.icon className="h-4 w-4" />
                       {item.label}
                     </TabsTrigger>
                   ))}
                </TabsList>
             </div>

             {/* Content Area */}
             <div className="flex-1 w-full space-y-8">
                
                {/* 1. Profile Settings */}
                <TabsContent value="profile" className="m-0">
                   <Form {...profileForm}>
                      <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                         <Card className="border-none shadow-sm overflow-hidden bg-white">
                            <CardHeader className="bg-slate-900 p-10 text-white">
                               <div className="flex flex-col md:flex-row items-center gap-8">
                                  <div className="relative group">
                                     <div className="h-24 w-24 rounded-3xl bg-white/10 flex items-center justify-center text-3xl font-black border-2 border-white/20 shadow-xl">AM</div>
                                     <Button variant="secondary" size="icon" className="absolute -bottom-2 -right-2 h-8 w-8 rounded-xl shadow-lg border-2 border-slate-900 bg-white hover:bg-primary">
                                        <Camera className="h-4 w-4" />
                                     </Button>
                                  </div>
                                  <div className="text-center md:text-left">
                                     <h3 className="text-2xl font-black tracking-tight">Dr. Abera Molla</h3>
                                     <p className="text-slate-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2 pt-1"><Globe className="h-3 w-3" /> System Administrator</p>
                                  </div>
                               </div>
                            </CardHeader>
                            <CardContent className="p-10 space-y-8">
                               <div className="grid md:grid-cols-2 gap-8">
                                  <FormField
                                    control={profileForm.control}
                                    name="title"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Professional Title</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                          <FormControl>
                                            <SelectTrigger className="h-12 rounded-xl border-muted"><SelectValue /></SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            <SelectItem value="dr">Dr.</SelectItem>
                                            <SelectItem value="prof">Prof.</SelectItem>
                                            <SelectItem value="mr">Mr.</SelectItem>
                                            <SelectItem value="ms">Ms.</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={profileForm.control}
                                    name="fullName"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Full Name</FormLabel>
                                        <FormControl><Input className="h-12 rounded-xl font-bold" {...field} /></FormControl>
                                      </FormItem>
                                    )}
                                  />
                                  <FormItem>
                                     <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Official Email</FormLabel>
                                     <Input readOnly defaultValue="abera.molla@ephi.gov.et" className="h-12 rounded-xl bg-slate-50 border-muted text-muted-foreground" />
                                  </FormItem>
                                  <FormField
                                    control={profileForm.control}
                                    name="phone"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Phone Number</FormLabel>
                                        <FormControl><Input className="h-12 rounded-xl font-bold" {...field} /></FormControl>
                                      </FormItem>
                                    )}
                                  />
                               </div>
                               <div className="pt-6 border-t flex justify-end">
                                  <Button type="submit" className="bg-primary hover:bg-primary/90 h-12 px-8 font-black text-xs uppercase tracking-widest rounded-xl shadow-lg">
                                     <Save className="h-4 w-4 mr-2" /> Save Profile Updates
                                  </Button>
                               </div>
                            </CardContent>
                         </Card>
                      </form>
                   </Form>
                </TabsContent>

                {/* 2. Security Settings */}
                <TabsContent value="security" className="m-0 space-y-6">
                   <Form {...securityForm}>
                      <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-6">
                         <Card className="border-none shadow-sm bg-white">
                            <CardHeader>
                               <CardTitle className="text-lg font-black tracking-tight">Update Credentials</CardTitle>
                               <CardDescription>Secure your account with a strong password.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                               <FormField
                                 control={securityForm.control}
                                 name="currentPassword"
                                 render={({ field }) => (
                                   <FormItem>
                                     <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Current Password</FormLabel>
                                     <FormControl><Input type="password" placeholder="••••••••" className="h-12 rounded-xl" {...field} /></FormControl>
                                     <FormMessage />
                                   </FormItem>
                                 )}
                               />
                               <div className="grid md:grid-cols-2 gap-6">
                                  <FormField
                                    control={securityForm.control}
                                    name="newPassword"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">New Password</FormLabel>
                                        <FormControl><Input type="password" placeholder="••••••••" className="h-12 rounded-xl" {...field} /></FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={securityForm.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Confirm New Password</FormLabel>
                                        <FormControl><Input type="password" placeholder="••••••••" className="h-12 rounded-xl" {...field} /></FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                               </div>
                               <div className="pt-6 border-t flex justify-end">
                                  <Button type="submit" className="bg-slate-900 h-12 px-8 font-black text-xs uppercase tracking-widest rounded-xl shadow-xl">
                                     Update Security Settings
                                  </Button>
                               </div>
                            </CardContent>
                         </Card>
                      </form>
                   </Form>
                   
                   <Card className="border-none shadow-sm bg-white overflow-hidden">
                      <CardContent className="p-8 flex items-center justify-between bg-emerald-50/30">
                         <div className="flex gap-4">
                            <ShieldCheck className="h-10 w-10 text-emerald-600" />
                            <div>
                               <h4 className="text-sm font-black text-emerald-900 uppercase tracking-tight">Two-Factor Authentication</h4>
                               <p className="text-[11px] text-emerald-800 font-medium">Add an extra layer of security to your account.</p>
                            </div>
                         </div>
                         <Switch defaultChecked />
                      </CardContent>
                   </Card>
                </TabsContent>

                {/* 4. Global Taxonomy (Functional Drill-down) */}
                <TabsContent value="system" className="m-0 space-y-6">
                   {!selectedTaxonomy ? (
                     <Card className="border-none shadow-sm bg-white overflow-hidden">
                        <div className="bg-amber-50 p-6 border-b border-amber-200 flex gap-4">
                           <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
                           <div className="space-y-1">
                              <h4 className="text-sm font-black text-amber-900 tracking-tight uppercase">Administrative Configuration</h4>
                              <p className="text-[11px] text-amber-800 font-medium leading-relaxed">Changes to global taxonomy will affect all historical research records.</p>
                           </div>
                        </div>
                        <CardContent className="p-8 space-y-4">
                           {taxonomyItems.map((tax) => (
                             <div 
                               key={tax.id} 
                               className="flex items-center justify-between p-4 rounded-xl border border-transparent hover:border-primary/10 hover:bg-primary/5 transition-all cursor-pointer group"
                               onClick={() => setSelectedTaxonomy(tax.id)}
                             >
                                <div className="flex items-center gap-4">
                                   <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-primary transition-colors">
                                      <tax.icon className="h-5 w-5" />
                                   </div>
                                   <div>
                                      <p className="text-sm font-black text-slate-800">{tax.label}</p>
                                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{tax.count} ACTIVE ENTRIES</p>
                                   </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                             </div>
                           ))}
                        </CardContent>
                     </Card>
                   ) : (
                     <Card className="border-none shadow-sm bg-white overflow-hidden">
                        <CardHeader className="p-8 border-b">
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                 <Button variant="ghost" size="icon" onClick={() => setSelectedTaxonomy(null)} className="rounded-xl"><ArrowLeft className="h-4 w-4" /></Button>
                                 <div>
                                    <CardTitle className="text-lg font-black tracking-tight">{taxonomyItems.find(t => t.id === selectedTaxonomy)?.label}</CardTitle>
                                    <CardDescription>Global Management</CardDescription>
                                 </div>
                              </div>
                              <Button size="sm" className="bg-primary hover:bg-primary/90 h-9 rounded-xl font-bold text-[10px] uppercase"><Plus className="h-4 w-4 mr-2" /> Add Entry</Button>
                           </div>
                        </CardHeader>
                        <CardContent className="p-0">
                           <Table>
                              <TableHeader className="bg-slate-50/50">
                                 <TableRow className="border-muted">
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest px-8">Item Name</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-right px-8">Actions</TableHead>
                                 </TableRow>
                              </TableHeader>
                              <TableBody>
                                 {taxonomyItems.find(t => t.id === selectedTaxonomy)?.items.map((item, i) => (
                                    <TableRow key={i} className="border-muted hover:bg-slate-50/50 transition-colors">
                                       <TableCell className="px-8 font-bold text-xs">{item}</TableCell>
                                       <TableCell className="px-8 text-right">
                                          <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5" /></Button>
                                       </TableCell>
                                    </TableRow>
                                 ))}
                              </TableBody>
                           </Table>
                        </CardContent>
                     </Card>
                   )}
                </TabsContent>

             </div>
          </div>
        </Tabs>
      </div>
    </PageContainer>
  );
}
