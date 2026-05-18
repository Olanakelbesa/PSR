"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { 
  User, 
  BellRing, 
  Database, 
  Camera, 
  Save, 
  Globe,
  Building2,
  GraduationCap,
  FileBadge,
  Shield,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  Plus,
  Trash2,
  Lock,
  Smartphone,
  CheckCircle2,
  Mail,
  Sliders,
  Laptop,
  Check,
  Info,
  ChevronRight,
  Settings2
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
import { toast } from "sonner";

// Form Schemas
const profileSchema = z.object({
  title: z.string().min(1, "Title is required"),
  fullName: z.string().min(3, "Name must be at least 3 characters"),
  phone: z.string().min(10, "Phone number is too short"),
});

const securitySchema = z.object({
  currentPassword: z.string().min(8, "Password must be at least 8 characters"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
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
    toast.success("Profile saved successfully!");
  };

  const onSecuritySubmit = (values: z.infer<typeof securitySchema>) => {
    toast.success("Password updated successfully!");
    securityForm.reset();
  };

  // State for Taxonomy Management
  const [taxonomyData, setTaxonomyData] = useState<Record<string, { label: string; count: number; icon: any; items: string[] }>>({
    ra: { label: "Research Areas", count: 12, icon: Globe, items: ["Epidemiology", "Public Health", "WASH", "Mental Health"] },
    ot: { label: "Organization Types", count: 5, icon: Building2, items: ["Government", "University", "NGO", "International"] },
    ar: { label: "Academic Ranks", count: 8, icon: GraduationCap, items: ["Professor", "Associate Professor", "Lecturer", "TA"] },
    od: { label: "Output Deliverables", count: 6, icon: FileBadge, items: ["Policy Brief", "Full Report", "Manuscript", "Codebook"] },
  });

  const [newItemName, setNewItemName] = useState("");

  const handleAddTaxonomyItem = (taxId: string) => {
    if (!newItemName.trim()) {
      toast.error("Please enter a valid taxonomy item name.");
      return;
    }
    setTaxonomyData(prev => {
      const current = prev[taxId];
      if (current.items.includes(newItemName.trim())) {
        toast.error("This taxonomy item already exists.");
        return prev;
      }
      const updatedItems = [...current.items, newItemName.trim()];
      toast.success(`"${newItemName.trim()}" added to ${current.label}.`);
      setNewItemName("");
      return {
        ...prev,
        [taxId]: {
          ...current,
          items: updatedItems,
          count: updatedItems.length
        }
      };
    });
  };

  const handleDeleteTaxonomyItem = (taxId: string, itemName: string) => {
    setTaxonomyData(prev => {
      const current = prev[taxId];
      const updatedItems = current.items.filter(item => item !== itemName);
      toast.success(`"${itemName}" removed from ${current.label}.`);
      return {
        ...prev,
        [taxId]: {
          ...current,
          items: updatedItems,
          count: updatedItems.length
        }
      };
    });
  };

  // State for Notification Preferences
  const [notifications, setNotifications] = useState({
    emailDailyDigest: true,
    emailImmediate: true,
    emailNewsletter: false,
    alertProposals: true,
    alertEvaluations: true,
    alertAudit: false,
    pushSubmission: true,
    pushReminders: true,
  });

  const handleToggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSaveNotifications = () => {
    toast.success("Notification preferences updated successfully!");
  };

  // Premium Sidebar Tabs navigation setup
  const tabsList = [
    { id: "profile", label: "My Profile", icon: User },
    { id: "security", label: "Security & Credentials", icon: Shield },
    { id: "notifications", label: "Notifications Preferences", icon: BellRing },
    { id: "system", label: "System Taxonomy", icon: Database },
  ];

  return (
    <PageContainer
      title="System & Account Settings"
      description="Customize your professional profile, manage authentication preferences, and administer global reference schemas."
    >
      <div className="max-w-7xl mx-auto">
        <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
             
             {/* LEFT Sidebar Navigation Panel */}
             <div className="w-full md:w-72 shrink-0 bg-white p-3 rounded-2xl shadow-sm border border-slate-100 sticky top-24">
                <div className="px-3 py-2.5 mb-2 hidden md:block">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Settings Sections</p>
                </div>
                <TabsList className="flex flex-row md:flex-col h-auto w-full bg-transparent gap-1.5 p-1 md:p-0 overflow-x-auto md:overflow-x-visible">
                   {tabsList.map((item) => (
                     <TabsTrigger 
                       key={item.id}
                       value={item.id} 
                       onClick={() => setSelectedTaxonomy(null)}
                       className="justify-center md:justify-start gap-2.5 h-11 px-4 rounded-xl text-slate-600 hover:text-slate-900 transition-all text-xs font-semibold hover:bg-slate-50 border-none shadow-none data-[state=active]:bg-primary/5 data-[state=active]:text-primary shrink-0 w-auto md:w-full whitespace-nowrap"
                     >
                       <item.icon className="h-4.5 w-4.5 shrink-0" />
                       {item.label}
                     </TabsTrigger>
                   ))}
                </TabsList>
             </div>

             {/* RIGHT Content Panel */}
             <div className="flex-1 w-full space-y-6">
                
                {/* ========================================================================= */}
                {/* 1. Profile Settings Tab */}
                {/* ========================================================================= */}
                <TabsContent value="profile" className="m-0">
                   <Form {...profileForm}>
                      <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                         <Card className="border-none shadow-md overflow-hidden bg-white rounded-2xl">
                            {/* Premium Dual-Tone Cover Header */}
                            <CardHeader className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 p-8 text-white relative">
                               <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
                                  <div className="relative group">
                                     <div className="h-24 w-24 rounded-2xl bg-white/10 flex items-center justify-center text-3xl font-bold border-2 border-white/20 shadow-2xl backdrop-blur-xs text-white">
                                        AM
                                     </div>
                                     <Button 
                                       type="button"
                                       variant="secondary" 
                                       size="icon" 
                                       className="absolute -bottom-2 -right-2 h-9 w-9 rounded-xl shadow-lg border-2 border-slate-950 bg-white hover:bg-indigo-50 text-slate-800 hover:scale-105 active:scale-95 transition-all duration-200"
                                     >
                                        <Camera className="h-4.5 w-4.5" />
                                     </Button>
                                  </div>
                                  <div className="text-center sm:text-left space-y-1">
                                     <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                                        <h3 className="text-2xl font-bold tracking-tight">Dr. Abera Molla</h3>
                                        <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold px-2 py-0.5 rounded-md text-[10px] uppercase">Active Session</Badge>
                                     </div>
                                     <p className="text-slate-400 font-semibold text-xs uppercase tracking-wider flex items-center justify-center sm:justify-start gap-2">
                                        <ShieldCheck className="h-4 w-4 text-indigo-400" />
                                        System Administrator
                                     </p>
                                  </div>
                               </div>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                               <div className="grid md:grid-cols-2 gap-6">
                                  <FormField
                                    control={profileForm.control}
                                    name="title"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-xs font-bold text-slate-600 uppercase tracking-wider">Professional Title</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                          <FormControl>
                                            <SelectTrigger className="h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold">
                                               <SelectValue />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent className="rounded-xl">
                                            <SelectItem value="dr">Dr.</SelectItem>
                                            <SelectItem value="prof">Prof.</SelectItem>
                                            <SelectItem value="mr">Mr.</SelectItem>
                                            <SelectItem value="ms">Ms.</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={profileForm.control}
                                    name="fullName"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-xs font-bold text-slate-600 uppercase tracking-wider">Full Name</FormLabel>
                                        <FormControl>
                                           <Input className="h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormItem>
                                     <FormLabel className="text-xs font-bold text-slate-600 uppercase tracking-wider">Official Email Address</FormLabel>
                                     <div className="relative">
                                        <Input 
                                          readOnly 
                                          defaultValue="abera.molla@ephi.gov.et" 
                                          className="h-12 rounded-xl bg-slate-50/50 border-slate-200 text-slate-400 font-semibold pr-10" 
                                        />
                                        <Mail className="absolute right-3.5 top-3.5 h-5 w-5 text-slate-400" />
                                     </div>
                                     <p className="text-[10px] text-slate-400 mt-1 font-medium">To modify your primary institutional email, please contact IT support.</p>
                                  </FormItem>
                                  <FormField
                                    control={profileForm.control}
                                    name="phone"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-xs font-bold text-slate-600 uppercase tracking-wider">Phone Number</FormLabel>
                                        <FormControl>
                                           <Input className="h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                               </div>

                               <div className="pt-6 border-t border-slate-100 flex justify-end">
                                  <Button 
                                    type="submit" 
                                    className="bg-primary hover:bg-primary/95 text-primary-foreground h-12 px-6 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 hover:shadow-lg hover:shadow-primary/20 flex items-center gap-2"
                                  >
                                     <Save className="h-4 w-4" /> Save Profile Preferences
                                  </Button>
                               </div>
                            </CardContent>
                         </Card>
                      </form>
                   </Form>
                </TabsContent>

                {/* ========================================================================= */}
                {/* 2. Login & Security Tab */}
                {/* ========================================================================= */}
                <TabsContent value="security" className="m-0 space-y-6">
                   <Form {...securityForm}>
                      <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-6">
                         <Card className="border-none shadow-md bg-white rounded-2xl">
                            <CardHeader className="border-b border-slate-100 pb-6">
                               <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center">
                                     <Lock className="h-5 w-5" />
                                  </div>
                                  <div>
                                     <CardTitle className="text-lg font-bold tracking-tight">Security Credentials</CardTitle>
                                     <CardDescription className="text-xs text-slate-500">Secure your system privileges with a strong account password.</CardDescription>
                                  </div>
                               </div>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                               <FormField
                                 control={securityForm.control}
                                 name="currentPassword"
                                 render={({ field }) => (
                                   <FormItem>
                                     <FormLabel className="text-xs font-bold text-slate-600 uppercase tracking-wider">Current Account Password</FormLabel>
                                     <FormControl>
                                        <Input type="password" placeholder="••••••••" className="h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold" {...field} />
                                     </FormControl>
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
                                        <FormLabel className="text-xs font-bold text-slate-600 uppercase tracking-wider">New Password</FormLabel>
                                        <FormControl>
                                           <Input type="password" placeholder="••••••••" className="h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={securityForm.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-xs font-bold text-slate-600 uppercase tracking-wider">Confirm New Password</FormLabel>
                                        <FormControl>
                                           <Input type="password" placeholder="••••••••" className="h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                               </div>
                               <div className="pt-6 border-t border-slate-100 flex justify-end">
                                  <Button 
                                    type="submit" 
                                    className="bg-slate-900 hover:bg-slate-800 text-white h-12 px-6 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg"
                                  >
                                     Change Security Password
                                  </Button>
                               </div>
                            </CardContent>
                         </Card>
                      </form>
                   </Form>
                   
                   {/* Two-Factor Authentication Card */}
                   <Card className="border-none shadow-md bg-white rounded-2xl overflow-hidden">
                      <CardContent className="p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-emerald-50/20 border border-emerald-100/50 rounded-2xl gap-6">
                         <div className="flex gap-4">
                            <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                               <ShieldCheck className="h-6 w-6" />
                            </div>
                            <div className="space-y-1">
                               <h4 className="text-sm font-bold text-emerald-950 uppercase tracking-tight flex items-center gap-2">
                                  Two-Factor Authentication (2FA)
                                  <Badge className="bg-emerald-500 text-white border-none font-bold px-2 py-0.5 rounded-md text-[9px] uppercase tracking-wider">Enabled</Badge>
                               </h4>
                               <p className="text-[11px] text-emerald-800 font-medium leading-relaxed max-w-xl">
                                  Require a verification code sent to your registered mobile device upon logging in, protecting access from unauthorized terminals.
                                </p>
                            </div>
                         </div>
                         <Switch defaultChecked className="data-[state=checked]:bg-emerald-600 shrink-0" />
                      </CardContent>
                   </Card>

                   {/* Active Account Sessions (Enterprise UX) */}
                   <Card className="border-none shadow-md bg-white rounded-2xl">
                      <CardHeader className="border-b border-slate-100 pb-6">
                         <CardTitle className="text-base font-bold tracking-tight">Active Sessions</CardTitle>
                         <CardDescription className="text-xs text-slate-500">Currently logged in devices and authorized environments.</CardDescription>
                      </CardHeader>
                      <CardContent className="p-8 space-y-5">
                         {[
                           { device: "Google Chrome on Windows", ip: "197.156.12.82", active: true, time: "Active now", icon: Laptop },
                           { device: "Safari on iPhone 15 Pro", ip: "197.156.14.99", active: false, time: "Last active: 2 hours ago", icon: Smartphone }
                         ].map((session, index) => (
                           <div key={index} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/30">
                              <div className="flex gap-3.5 items-center">
                                 <div className="h-10 w-10 bg-white border border-slate-100 text-slate-500 rounded-xl flex items-center justify-center shrink-0">
                                    <session.icon className="h-5 w-5" />
                                 </div>
                                 <div>
                                    <p className="text-xs font-bold text-slate-800">{session.device}</p>
                                    <p className="text-[10px] text-slate-400 font-medium">{session.ip} • {session.time}</p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-3">
                                 {session.active ? (
                                   <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-bold text-[10px] rounded-md px-2 py-0.5 uppercase tracking-wider">Current Terminal</Badge>
                                 ) : (
                                   <Button 
                                     variant="ghost" 
                                     size="sm" 
                                     onClick={() => toast.success("Authorized session revoked.")} 
                                     className="h-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                                   >
                                      Revoke
                                   </Button>
                                 )}
                              </div>
                           </div>
                         ))}
                      </CardContent>
                   </Card>
                </TabsContent>

                {/* ========================================================================= */}
                {/* 3. Notification Settings Tab (MISSING IMPLEMENTATION RESOLVED) */}
                {/* ========================================================================= */}
                <TabsContent value="notifications" className="m-0 space-y-6">
                   <Card className="border-none shadow-md bg-white rounded-2xl">
                      <CardHeader className="border-b border-slate-100 pb-6">
                         <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center">
                               <Sliders className="h-5 w-5" />
                            </div>
                            <div>
                               <CardTitle className="text-lg font-bold tracking-tight">Notification Channels & Prefs</CardTitle>
                               <CardDescription className="text-xs text-slate-500">Configure how you receive updates and administrative events.</CardDescription>
                            </div>
                         </div>
                      </CardHeader>
                      <CardContent className="p-8 space-y-8">
                         {/* Email Preferences */}
                         <div className="space-y-4">
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-l-2 border-primary pl-2.5">Email Communications</h4>
                            <div className="space-y-4 pt-1">
                               {[
                                 { key: "emailDailyDigest", label: "Daily Summary Digest", desc: "Receive a compiled summary of system updates, proposal reviews, and audit events at the end of each day." },
                                 { key: "emailImmediate", label: "Immediate Actions & Triggers", desc: "Receive immediate notifications for critical tasks like assigned evaluations, budget changes, and security triggers." },
                                 { key: "emailNewsletter", label: "Policy & Reform Circulars", desc: "Periodic updates on new policy circulars, research briefs, and administrative guidelines." }
                               ].map((pref) => (
                                 <div key={pref.key} className="flex items-start justify-between gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50/20 transition-all">
                                    <div className="space-y-1">
                                       <Label className="text-xs font-bold text-slate-700">{pref.label}</Label>
                                       <p className="text-[10px] text-slate-400 leading-normal max-w-xl font-medium">{pref.desc}</p>
                                    </div>
                                    <Switch 
                                      checked={notifications[pref.key as keyof typeof notifications]} 
                                      onCheckedChange={() => handleToggleNotification(pref.key as keyof typeof notifications)} 
                                    />
                                 </div>
                               ))}
                            </div>
                         </div>

                         {/* System Actions Alerts */}
                         <div className="space-y-4">
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-l-2 border-primary pl-2.5">In-App Dashboard Alerts</h4>
                            <div className="space-y-4 pt-1">
                               {[
                                 { key: "alertProposals", label: "New Ingest & Proposal Audits", desc: "Real-time indicators on feature maps when external findings are cataloged or research claims are submitted." },
                                 { key: "alertEvaluations", label: "ROC Evaluations updates", desc: "Notifications detailing reviewer selections, grading assessments, and progress/terminal report decisions." },
                                 { key: "alertAudit", label: "Administrative Audit events", desc: "System triggers when configuration values are changed or database taxonomy is dynamically adjusted." }
                               ].map((pref) => (
                                 <div key={pref.key} className="flex items-start justify-between gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50/20 transition-all">
                                    <div className="space-y-1">
                                       <Label className="text-xs font-bold text-slate-700">{pref.label}</Label>
                                       <p className="text-[10px] text-slate-400 leading-normal max-w-xl font-medium">{pref.desc}</p>
                                    </div>
                                    <Switch 
                                      checked={notifications[pref.key as keyof typeof notifications]} 
                                      onCheckedChange={() => handleToggleNotification(pref.key as keyof typeof notifications)} 
                                    />
                                 </div>
                               ))}
                            </div>
                         </div>

                         {/* Save Button */}
                         <div className="pt-6 border-t border-slate-100 flex justify-end">
                            <Button 
                              onClick={handleSaveNotifications}
                              className="bg-primary hover:bg-primary/95 text-primary-foreground h-12 px-6 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200"
                            >
                               Save Notification Preferences
                            </Button>
                         </div>
                      </CardContent>
                   </Card>
                </TabsContent>

                {/* ========================================================================= */}
                {/* 4. Global Taxonomy Tab (Dynamically managed) */}
                {/* ========================================================================= */}
                <TabsContent value="system" className="m-0 space-y-6">
                   {!selectedTaxonomy ? (
                     <Card className="border-none shadow-md bg-white rounded-2xl overflow-hidden">
                        <div className="bg-amber-500/10 p-6 border-b border-amber-500/20 flex gap-4">
                           <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
                           <div className="space-y-1">
                              <h4 className="text-sm font-bold text-amber-950 tracking-tight uppercase flex items-center gap-1.5">
                                 Administrative Warning
                              </h4>
                              <p className="text-[11px] text-amber-900 leading-relaxed font-semibold">
                                 Modifications to the global reference schemas will alter categorization guidelines and validation schemas on active proposals, historical findings, and policy archives. Execute updates with caution.
                              </p>
                           </div>
                        </div>
                        <CardContent className="p-8 space-y-4">
                           <div className="pb-2">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Reference Data Schemas</p>
                           </div>
                           {Object.entries(taxonomyData).map(([key, tax]) => (
                             <div 
                               key={key} 
                               className="flex items-center justify-between p-4.5 rounded-2xl border border-slate-100 hover:border-primary/15 hover:bg-primary/5 transition-all cursor-pointer group"
                               onClick={() => setSelectedTaxonomy(key)}
                             >
                                 <div className="flex items-center gap-4.5">
                                    <div className="h-11 w-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:border-primary/10 group-hover:text-primary transition-all">
                                       <tax.icon className="h-5.5 w-5.5" />
                                    </div>
                                    <div className="space-y-0.5">
                                       <p className="text-sm font-bold text-slate-800 group-hover:text-primary transition-colors">{tax.label}</p>
                                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{tax.count} ENTRIES CONFIGURED</p>
                                    </div>
                                 </div>
                                 <ChevronRight className="h-5 w-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                             </div>
                           ))}
                        </CardContent>
                     </Card>
                   ) : (
                     <Card className="border-none shadow-md bg-white rounded-2xl overflow-hidden">
                        <CardHeader className="p-6 border-b border-slate-100">
                           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex items-center gap-3.5">
                                 <Button 
                                   variant="ghost" 
                                   size="icon" 
                                   onClick={() => setSelectedTaxonomy(null)} 
                                   className="rounded-xl border border-slate-100 hover:bg-slate-50"
                                 >
                                    <ArrowLeft className="h-4 w-4" />
                                 </Button>
                                 <div className="space-y-0.5">
                                    <CardTitle className="text-base font-bold tracking-tight">{taxonomyData[selectedTaxonomy].label}</CardTitle>
                                    <CardDescription className="text-xs text-slate-400 font-medium">Configure active choices in global dropdown selectors.</CardDescription>
                                 </div>
                              </div>
                           </div>
                        </CardHeader>
                        <CardContent className="p-0">
                           {/* Add New Item Form Section */}
                           <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
                              <div className="flex-1">
                                 <Input 
                                   placeholder={`Enter name for new ${taxonomyData[selectedTaxonomy].label.slice(0, -1)}...`} 
                                   value={newItemName}
                                   onChange={(e) => setNewItemName(e.target.value)}
                                   className="h-11 rounded-xl bg-white border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold text-xs"
                                 />
                              </div>
                              <Button 
                                onClick={() => handleAddTaxonomyItem(selectedTaxonomy)}
                                className="bg-primary hover:bg-primary/95 text-primary-foreground h-11 px-5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shrink-0"
                              >
                                 <Plus className="h-4 w-4" /> Add Item
                              </Button>
                           </div>

                           {/* Taxonomy List Table */}
                           <Table>
                              <TableHeader className="bg-slate-50/30">
                                 <TableRow className="border-slate-100">
                                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-8 h-12">Index</TableHead>
                                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-8 h-12">Option Descriptor</TableHead>
                                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right px-8 h-12">Manage Schema</TableHead>
                                 </TableRow>
                              </TableHeader>
                              <TableBody>
                                 {taxonomyData[selectedTaxonomy].items.map((item, i) => (
                                    <TableRow key={i} className="border-slate-100 hover:bg-slate-50/20 transition-colors">
                                       <TableCell className="px-8 font-semibold text-xs text-slate-400 w-24"># {i + 1}</TableCell>
                                       <TableCell className="px-8 font-bold text-slate-700 text-xs">{item}</TableCell>
                                       <TableCell className="px-8 text-right">
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={() => handleDeleteTaxonomyItem(selectedTaxonomy, item)}
                                            className="h-8.5 w-8.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                          >
                                             <Trash2 className="h-4 w-4" />
                                          </Button>
                                       </TableCell>
                                    </TableRow>
                                 ))}
                              </TableBody>
                           </Table>

                           {/* Empty State when no items exist */}
                           {taxonomyData[selectedTaxonomy].items.length === 0 && (
                             <div className="p-12 text-center text-slate-400">
                                <AlertTriangle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                                <p className="text-xs font-semibold">No options configured in this schema.</p>
                             </div>
                           )}
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
