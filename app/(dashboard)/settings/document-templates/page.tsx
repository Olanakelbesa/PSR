"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Plus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  Loader2,
  RefreshCw,
  Download,
  Upload,
  Calendar,
  Paperclip,
} from "lucide-react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  listSystemAttachments,
  uploadSystemAttachment,
  updateSystemAttachment,
  deleteSystemAttachment,
  type SystemAttachmentItem,
} from "@/api/services/document-templates.service";
import { cn } from "@/lib/utils";

export default function DocumentTemplatesPage() {
  const [attachments, setAttachments] = useState<SystemAttachmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SystemAttachmentItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<SystemAttachmentItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchAttachments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await listSystemAttachments({ search: search || undefined });
      setAttachments(data);
    } catch {
      setAttachments([]);
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Attachment title is required.");
      return;
    }
    if (!editingItem && !selectedFile) {
      toast.error("Please select an attachment file to upload.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", title.trim());
      if (selectedFile) {
        formData.append("attachment", selectedFile);
      }

      if (editingItem) {
        await updateSystemAttachment(editingItem.id, formData);
        toast.success("Attachment updated successfully.");
      } else {
        await uploadSystemAttachment(formData);
        toast.success("Attachment uploaded successfully.");
      }

      setDialogOpen(false);
      setTitle("");
      setSelectedFile(null);
      setEditingItem(null);
      fetchAttachments();
    } catch {
      toast.error("Failed to save attachment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    try {
      await deleteSystemAttachment(deletingItem.id);
      toast.success("Attachment deleted.");
      setDeletingItem(null);
      fetchAttachments();
    } catch {
      toast.error("Failed to delete attachment.");
    }
  };

  return (
    <PageContainer
      title="System Attachments & Documents"
      description="Upload and manage official downloadable system attachments, user guides, budget templates, and policy guidelines."
    >
      <Card className="border-border/80">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Paperclip className="h-5 w-5 text-primary" />
                System Attachments Repository
              </CardTitle>
              <CardDescription className="text-xs">
                Official documents hosted here are accessible to researchers when submitting proposals and IRB applications.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchAttachments} disabled={isLoading} className="gap-2 text-xs font-bold">
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                Refresh
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setEditingItem(null);
                  setTitle("");
                  setSelectedFile(null);
                  setDialogOpen(true);
                }}
                className="gap-2 bg-primary text-white font-bold text-xs cursor-pointer"
              >
                <Upload className="h-4 w-4" /> Add Attachment
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search attachments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-border/80">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="font-bold text-xs">Attachment Title</TableHead>
                  <TableHead className="font-bold text-xs">Document Format</TableHead>
                  <TableHead className="font-bold text-xs">File Download</TableHead>
                  <TableHead className="font-bold text-xs">Date Uploaded</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-xs text-muted-foreground">
                      <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-primary" /> Loading attachments...
                    </TableCell>
                  </TableRow>
                ) : attachments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-xs text-muted-foreground font-semibold">
                      No system attachments uploaded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  attachments.map((item) => {
                    const fileName = item.attachment ? item.attachment.split("/").pop() : "file";
                    const docType = item.document_type || "pdf";

                    return (
                      <TableRow key={item.id} className="hover:bg-muted/30">
                        <TableCell className="font-bold text-xs text-foreground max-w-md">
                          {item.title || item.description || "Official Attachment"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="uppercase font-mono text-[10px] font-bold">
                            {docType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.attachment ? (
                            <a
                              href={item.attachment}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                            >
                              <Download className="h-3.5 w-3.5" />
                              {fileName}
                            </a>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {item.date_of_upload ? new Date(item.date_of_upload).toLocaleDateString() : "—"}
                        </TableCell>
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
                                  setEditingItem(item);
                                  setTitle(item.title || item.description || "");
                                  setSelectedFile(null);
                                  setDialogOpen(true);
                                }}
                                className="cursor-pointer"
                              >
                                <Edit className="mr-2 h-4 w-4" /> Edit Attachment
                              </DropdownMenuItem>

                              {item.attachment && (
                                <DropdownMenuItem asChild className="cursor-pointer">
                                  <a href={item.attachment} target="_blank" rel="noreferrer">
                                    <Download className="mr-2 h-4 w-4" /> Download File
                                  </a>
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuItem onClick={() => setDeletingItem(item)} className="text-destructive cursor-pointer">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Attachment
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add / Edit Dialog Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              {editingItem ? "Edit System Attachment" : "Upload System Attachment"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure attachment title and upload PDF, DOCX, or XLSX document files.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold">Attachment Title / Purpose *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. RPDMS User Guide 2026"
                className="text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold">
                {editingItem ? "Replace File (Optional)" : "Select Attachment File *"}
              </Label>
              <Input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="text-xs cursor-pointer"
              />
              {editingItem && editingItem.attachment && (
                <p className="text-[11px] text-muted-foreground">
                  Current file: <span className="font-mono text-foreground">{editingItem.attachment.split("/").pop()}</span>
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSubmitting} className="bg-primary text-white font-bold cursor-pointer">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingItem ? "Save Changes" : "Upload Attachment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Alert */}
      <AlertDialog open={!!deletingItem} onOpenChange={() => setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold">Delete attachment?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to delete &quot;{deletingItem?.title || deletingItem?.description}&quot;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-white font-bold cursor-pointer">
              Delete Attachment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
