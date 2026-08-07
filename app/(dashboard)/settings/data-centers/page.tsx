"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Building,
  Plus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";
import { cn } from "@/lib/utils";

type DataCenterItem = {
  id: number;
  name: string;
  description?: string | null;
};

export default function DataCentersPage() {
  const [dataCenters, setDataCenters] = useState<DataCenterItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DataCenterItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<DataCenterItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({ name: "", description: "" });

  const fetchDataCenters = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(API_ENDPOINTS.DATA_CENTERS.LIST, {
        params: { search: search || undefined },
      });
      const raw = res.data?.data ?? res.data?.results ?? res.data ?? [];
      setDataCenters(Array.isArray(raw) ? raw : []);
    } catch {
      setDataCenters([]);
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchDataCenters();
  }, [fetchDataCenters]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Data Center name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
      };

      if (editingItem) {
        await apiClient.patch(`${API_ENDPOINTS.DATA_CENTERS.LIST}${editingItem.id}/`, payload);
        toast.success("Data Center updated successfully.");
      } else {
        await apiClient.post(API_ENDPOINTS.DATA_CENTERS.LIST, payload);
        toast.success("Data Center created successfully.");
      }
      setDialogOpen(false);
      fetchDataCenters();
    } catch {
      toast.error("Failed to save Data Center.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    try {
      await apiClient.delete(`${API_ENDPOINTS.DATA_CENTERS.LIST}${deletingItem.id}/`);
      toast.success("Data Center deleted.");
      setDeletingItem(null);
      fetchDataCenters();
    } catch {
      toast.error("Failed to delete Data Center.");
    }
  };

  return (
    <PageContainer
      title="Data Centers & Storage Repositories"
      description="Manage physical and digital data centers where research dataset packages are deposited during final submissions."
    >
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                Data Center Repositories
              </CardTitle>
              <CardDescription className="text-xs">
                Data centers configured here appear in project dataset submission forms.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchDataCenters} disabled={isLoading} className="gap-2 text-xs font-bold">
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                Refresh
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setEditingItem(null);
                  setForm({ name: "", description: "" });
                  setDialogOpen(true);
                }}
                className="gap-2 bg-primary text-white font-bold text-xs cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Add Data Center
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search data centers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-border/80">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="font-bold text-xs">Data Center Name</TableHead>
                  <TableHead className="font-bold text-xs">Description</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-10 text-center text-xs text-muted-foreground">
                      <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-primary" /> Loading data centers...
                    </TableCell>
                  </TableRow>
                ) : dataCenters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-10 text-center text-xs text-muted-foreground font-semibold">
                      No data centers configured.
                    </TableCell>
                  </TableRow>
                ) : (
                  dataCenters.map((dc) => (
                    <TableRow key={dc.id} className="hover:bg-muted/30">
                      <TableCell className="font-bold text-xs text-foreground">{dc.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-md">{dc.description || "—"}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingItem(dc);
                                setForm({ name: dc.name, description: dc.description || "" });
                                setDialogOpen(true);
                              }}
                              className="cursor-pointer"
                            >
                              <Edit className="mr-2 h-4 w-4" /> Edit Data Center
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeletingItem(dc)} className="text-destructive cursor-pointer">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete Data Center
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              {editingItem ? "Edit Data Center" : "Add Data Center"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold">Data Center Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. National Health Data Repository Facility A"
                className="text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold">Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Details regarding physical address or server cluster..."
                rows={3}
                className="text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSubmitting} className="bg-primary text-white font-bold cursor-pointer">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Data Center
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Alert */}
      <AlertDialog open={!!deletingItem} onOpenChange={() => setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold">Delete data center?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to delete &quot;{deletingItem?.name}&quot;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-white font-bold cursor-pointer">
              Delete Data Center
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
