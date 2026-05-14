"use client";

import { useState } from "react";
import { 
  Users, 
  Search, 
  UserPlus, 
  Filter, 
  Shield, 
  Mail, 
  Building2, 
  CheckCircle2, 
  XCircle, 
  Trash2,
  Settings2,
  FileBadge,
  Download,
  MoreVertical,
  ChevronRight,
  ShieldAlert,
  Save,
  X
} from "lucide-react";

import { PageContainer } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const mockUsersData = [
  {
    id: "1",
    fullName: "Dr. Abera Molla",
    email: "abera.molla@ephi.gov.et",
    phone: "+251 911 223344",
    organization: "Ethiopian Public Health Institute",
    unit: "Epidemiology Directorate",
    roles: ["Admin", "PSR Officer"],
    enabled: true,
    lastLogin: "2 hours ago",
  },
  {
    id: "2",
    fullName: "Selamawit Kebede",
    email: "s.kebede@aau.edu.et",
    phone: "+251 912 334455",
    organization: "Addis Ababa University",
    unit: "College of Health Sciences",
    roles: ["Researcher"],
    enabled: true,
    lastLogin: "5 hours ago",
  },
  {
    id: "3",
    fullName: "John Doe",
    email: "john.doe@who.int",
    phone: "+41 22 791 2111",
    organization: "World Health Organization",
    unit: "Ethics Committee",
    roles: ["Reviewer"],
    enabled: false,
    lastLogin: "2 days ago",
  },
];

const availableRoles = ["Admin", "PSR Officer", "Researcher", "Reviewer", "ROC Member"];

export default function UsersManagementPage() {
  const [users, setUsers] = useState(mockUsersData);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const filteredUsers = users.filter(user => 
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.organization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleUserStatus = (userId: string) => {
    setUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, enabled: !u.enabled } : u
    ));
    const user = users.find(u => u.id === userId);
    toast.success(`${user?.fullName}'s account has been ${user?.enabled ? 'disabled' : 'enabled'}.`);
  };

  const handleExport = () => {
    toast.info("Preparing user audit export...");
    // Mock CSV generation
    setTimeout(() => toast.success("User audit report downloaded."), 2000);
  };

  return (
    <PageContainer
      title="User Management"
      description="Govern system access, assign roles, and manage institutional affiliations."
      actions={
        <div className="flex gap-2">
           <Button variant="outline" className="border-muted font-bold text-xs uppercase tracking-widest h-10 px-4" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" /> Export Audit
           </Button>
           <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 h-10 px-4" onClick={() => setIsInviteOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" /> Invite User
           </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Search & Filters */}
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search name, email or institution..." 
                className="pl-10 h-11 rounded-xl border-muted focus-visible:ring-primary/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
               <div className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5 text-emerald-500" />
                  Showing {filteredUsers.length} of {users.length} Users
               </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-muted hover:bg-transparent">
                <TableHead className="w-[300px] text-[10px] font-black uppercase tracking-widest py-4">User Identity</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Affiliation</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Roles</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Status</TableHead>
                <TableHead className="text-right py-4"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className="border-muted group hover:bg-slate-50/50 transition-colors">
                  <TableCell className="py-5">
                    <div className="flex items-center gap-3">
                       <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm border-2 border-white shadow-sm">
                          {user.fullName.split(' ').map(n => n[0]).join('')}
                       </div>
                       <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-800">{user.fullName}</span>
                          <span className="text-[11px] text-muted-foreground font-medium">{user.email}</span>
                       </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                       <span className="text-[11px] font-bold text-slate-700">{user.organization}</span>
                       <span className="text-[10px] text-muted-foreground italic">{user.unit}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                       {user.roles.map((role, i) => (
                         <Badge key={i} variant="secondary" className="bg-primary/5 text-primary border-primary/10 text-[9px] font-black uppercase px-2 py-0">
                            {role}
                         </Badge>
                       ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                       {user.enabled ? (
                         <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 border shadow-none font-black text-[9px] uppercase px-2">Active</Badge>
                       ) : (
                         <Badge className="bg-rose-100 text-rose-700 border-rose-200 border shadow-none font-black text-[9px] uppercase px-2">Revoked</Badge>
                       )}
                       <span className="text-[9px] text-muted-foreground font-bold uppercase">{user.lastLogin}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/5">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 shadow-xl border-primary/10 rounded-xl">
                        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-4 py-2">Governance</DropdownMenuLabel>
                        <DropdownMenuItem className="cursor-pointer font-bold px-4" onClick={() => setEditingUser(user)}>
                           <Settings2 className="h-4 w-4 mr-2" /> Edit Permissions
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer font-bold px-4">
                           <FileBadge className="h-4 w-4 mr-2" /> View Audit Logs
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className={cn(
                          "cursor-pointer font-bold px-4",
                          user.enabled ? "text-rose-600" : "text-emerald-600"
                        )} onClick={() => toggleUserStatus(user.id)}>
                           {user.enabled ? <XCircle className="h-4 w-4 mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                           {user.enabled ? "Disable Account" : "Enable Account"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Governance Sheet (Edit User) */}
      <Sheet open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <SheetContent className="sm:max-w-md border-l-primary/10">
          <SheetHeader className="pb-6 border-b">
            <SheetTitle className="text-xl font-black tracking-tight">Edit Permissions</SheetTitle>
            <SheetDescription className="text-xs font-medium">Manage roles and institutional access for {editingUser?.fullName}.</SheetDescription>
          </SheetHeader>
          <div className="py-8 space-y-8">
             <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Assign System Roles</Label>
                <div className="grid grid-cols-2 gap-4">
                   {availableRoles.map((role) => (
                      <div key={role} className="flex items-center space-x-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                         <Checkbox id={role} defaultChecked={editingUser?.roles.includes(role)} className="rounded-md" />
                         <Label htmlFor={role} className="text-xs font-bold cursor-pointer">{role}</Label>
                      </div>
                   ))}
                </div>
             </div>

             <div className="space-y-4 pt-4 border-t">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Institutional Affiliation</Label>
                <div className="space-y-4">
                   <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase tracking-widest ml-1">Organization</Label>
                      <Select defaultValue="ephi">
                         <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                         <SelectContent className="rounded-xl">
                            <SelectItem value="ephi">EPHI</SelectItem>
                            <SelectItem value="aau">AAU</SelectItem>
                            <SelectItem value="who">WHO</SelectItem>
                         </SelectContent>
                      </Select>
                   </div>
                   <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase tracking-widest ml-1">Unit / Directorate</Label>
                      <Input defaultValue={editingUser?.unit} className="h-12 rounded-xl font-bold" />
                   </div>
                </div>
             </div>

             <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex gap-3">
                <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
                <p className="text-[10px] font-medium text-amber-900 leading-relaxed">
                   **Warning:** Changing administrative roles will immediately affect this user's ability to approve proposals and access system audits.
                </p>
             </div>
          </div>
          <SheetFooter className="absolute bottom-0 left-0 right-0 p-8 border-t bg-white">
             <Button className="w-full h-12 bg-primary hover:bg-primary/90 font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 rounded-xl" onClick={() => {
                toast.success("User permissions updated successfully!");
                setEditingUser(null);
             }}>
                <Save className="h-4 w-4 mr-2" /> Save Governance Updates
             </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Invite User Sheet */}
      <Sheet open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <SheetContent className="sm:max-w-md border-l-primary/10">
          <SheetHeader className="pb-6 border-b">
            <SheetTitle className="text-xl font-black tracking-tight">Invite New User</SheetTitle>
            <SheetDescription className="text-xs font-medium">Send an invitation to a new institutional partner.</SheetDescription>
          </SheetHeader>
          <div className="py-8 space-y-6">
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Full Name</Label>
                <Input placeholder="Abebe Bikila" className="h-12 rounded-xl" />
             </div>
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Official Email</Label>
                <Input placeholder="a.bikila@org.gov.et" className="h-12 rounded-xl" />
             </div>
             <div className="space-y-2 pt-4 border-t">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Initial Role</Label>
                <Select defaultValue="Researcher">
                   <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                   <SelectContent>
                      {availableRoles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                   </SelectContent>
                </Select>
             </div>
          </div>
          <SheetFooter className="absolute bottom-0 left-0 right-0 p-8 border-t bg-white">
             <Button className="w-full h-12 bg-primary hover:bg-primary/90 font-black text-xs uppercase tracking-widest shadow-lg rounded-xl" onClick={() => {
                toast.success("Invitation sent successfully!");
                setIsInviteOpen(false);
             }}>
                <Mail className="h-4 w-4 mr-2" /> Dispatch Invitation
             </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </PageContainer>
  );
}

function Activity(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
