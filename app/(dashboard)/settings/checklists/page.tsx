"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  FileCheck,
  Plus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  Loader2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Filter,
  Layers,
  AlertTriangle,
  FolderTree,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  listChecklistTemplates,
  createChecklistTemplate,
  updateChecklistTemplate,
  deleteChecklistTemplate,
  listChecklistQuestions,
  createChecklistQuestion,
  updateChecklistQuestion,
  deleteChecklistQuestion,
  type ChecklistTemplateItem,
  type ChecklistQuestionItem,
} from "@/api/services/checklist.service";
import { listTaxonomyItems, TaxonomyKind, type TaxonomyItem } from "@/api/services/taxonomy.service";
import { cn } from "@/lib/utils";

function decodeHtmlEntities(rawText?: string): string {
  if (!rawText) return "";
  return rawText
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function parseQuestionText(raw?: string) {
  const cleaned = decodeHtmlEntities(raw);
  if (!cleaned) return { title: "Untitled Question", body: "" };

  const lines = cleaned.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 1) {
    return { title: lines[0], body: "" };
  }

  const title = lines[0].replace(/\s*\?\s*$/, "");
  const body = lines.slice(1).join(" ");
  return { title, body };
}

export default function ChecklistsSettingsPage() {
  const [activeTab, setActiveTab] = useState("questions");

  // Templates state
  const [templates, setTemplates] = useState<ChecklistTemplateItem[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ChecklistTemplateItem | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<ChecklistTemplateItem | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    doc_type: "",
    pass_rule_type: "threshold",
    threshold: "100.00",
    is_active: true,
  });

  // Questions state & filters
  const [questions, setQuestions] = useState<ChecklistQuestionItem[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [questionSearch, setQuestionSearch] = useState("");
  const [selectedTemplateFilter, setSelectedTemplateFilter] = useState("all");
  const [selectedDocTypeFilter, setSelectedDocTypeFilter] = useState("all");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");

  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<ChecklistQuestionItem | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState<ChecklistQuestionItem | null>(null);
  const [questionForm, setQuestionForm] = useState({
    question_text: "",
    template: "",
    doc_type: "",
    category: "1",
    is_critical: false,
    weight: "1.00",
    is_active: true,
  });

  // Reference Data: Policy Document Types
  const [policyDocTypes, setPolicyDocTypes] = useState<TaxonomyItem[]>([]);

  const fetchDocTypes = useCallback(async () => {
    try {
      const res = await listTaxonomyItems(TaxonomyKind.POLICY_DOCUMENT_TYPES, { limit: 100 });
      setPolicyDocTypes(res.data || []);
    } catch {
      setPolicyDocTypes([]);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    setIsLoadingTemplates(true);
    try {
      const data = await listChecklistTemplates({ search: templateSearch || undefined });
      setTemplates(data);
    } catch {
      setTemplates([]);
    } finally {
      setIsLoadingTemplates(false);
    }
  }, [templateSearch]);

  const fetchQuestions = useCallback(async () => {
    setIsLoadingQuestions(true);
    try {
      const data = await listChecklistQuestions({ limit: 500 });
      setQuestions(data);
    } catch {
      setQuestions([]);
    } finally {
      setIsLoadingQuestions(false);
    }
  }, []);

  useEffect(() => {
    fetchDocTypes();
    fetchTemplates();
  }, [fetchDocTypes, fetchTemplates]);

  useEffect(() => {
    if (activeTab === "questions") fetchQuestions();
    if (activeTab === "templates") fetchTemplates();
  }, [activeTab, fetchQuestions, fetchTemplates]);

  // Unique categories for dropdown filter
  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    questions.forEach((q) => {
      if (q.category != null) set.add(String(q.category));
    });
    return Array.from(set).sort((a, b) => Number(a) - Number(b));
  }, [questions]);

  // Filtered Questions List
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const formattedText = decodeHtmlEntities(q.question_text).toLowerCase();
      const matchesSearch = !questionSearch || formattedText.includes(questionSearch.toLowerCase());

      const parentTpl = templates.find((t) => String(t.id) === String(q.template));
      const resolvedDocTypeId = q.doc_type || parentTpl?.doc_type;

      const matchesTemplate =
        selectedTemplateFilter === "all" || String(q.template) === selectedTemplateFilter;

      const matchesDocType =
        selectedDocTypeFilter === "all" || String(resolvedDocTypeId) === selectedDocTypeFilter;

      const matchesCategory =
        selectedCategoryFilter === "all" || String(q.category) === selectedCategoryFilter;

      return matchesSearch && matchesTemplate && matchesDocType && matchesCategory;
    });
  }, [questions, questionSearch, selectedTemplateFilter, selectedDocTypeFilter, selectedCategoryFilter, templates]);

  // Group Filtered Questions by Template
  const templateGroups = useMemo(() => {
    const map = new Map<string, { template: ChecklistTemplateItem | null; questions: ChecklistQuestionItem[] }>();

    filteredQuestions.forEach((q) => {
      const tplId = q.template ? String(q.template) : "unassigned";
      const tpl = templates.find((t) => String(t.id) === String(q.template)) || null;

      if (!map.has(tplId)) {
        map.set(tplId, { template: tpl, questions: [] });
      }
      map.get(tplId)!.questions.push(q);
    });

    return Array.from(map.entries()).map(([key, group]) => ({
      key,
      template: group.template,
      questions: group.questions,
    }));
  }, [filteredQuestions, templates]);

  // Accordions default open keys
  const defaultOpenKeys = useMemo(() => {
    return templateGroups.map((g) => g.key);
  }, [templateGroups]);

  // Template Handlers
  const handleSaveTemplate = async () => {
    if (!templateForm.name.trim()) {
      toast.error("Template name is required.");
      return;
    }
    try {
      const payload = {
        name: templateForm.name.trim(),
        doc_type: templateForm.doc_type ? Number(templateForm.doc_type) : null,
        pass_rule_type: templateForm.pass_rule_type,
        threshold: templateForm.threshold,
        is_active: templateForm.is_active,
      };

      if (editingTemplate) {
        await updateChecklistTemplate(editingTemplate.id, payload);
        toast.success("Checklist template updated successfully.");
      } else {
        await createChecklistTemplate(payload);
        toast.success("Checklist template created successfully.");
      }
      setTemplateDialogOpen(false);
      fetchTemplates();
    } catch {
      toast.error("Failed to save template.");
    }
  };

  const handleConfirmDeleteTemplate = async () => {
    if (!deletingTemplate) return;
    try {
      await deleteChecklistTemplate(deletingTemplate.id);
      toast.success("Checklist template deleted.");
      setDeletingTemplate(null);
      fetchTemplates();
    } catch {
      toast.error("Failed to delete template.");
    }
  };

  // Question Handlers
  const handleSaveQuestion = async () => {
    if (!questionForm.question_text.trim()) {
      toast.error("Question criteria text is required.");
      return;
    }
    try {
      const payload = {
        question_text: questionForm.question_text.trim(),
        template: questionForm.template ? Number(questionForm.template) : null,
        doc_type: questionForm.doc_type ? Number(questionForm.doc_type) : null,
        category: questionForm.category ? Number(questionForm.category) : 1,
        is_critical: questionForm.is_critical,
        weight: questionForm.weight,
        is_active: questionForm.is_active,
      };

      if (editingQuestion) {
        await updateChecklistQuestion(editingQuestion.id, payload);
        toast.success("Checklist question updated.");
      } else {
        await createChecklistQuestion(payload);
        toast.success("Checklist question created.");
      }
      setQuestionDialogOpen(false);
      fetchQuestions();
    } catch {
      toast.error("Failed to save checklist question.");
    }
  };

  const handleConfirmDeleteQuestion = async () => {
    if (!deletingQuestion) return;
    try {
      await deleteChecklistQuestion(deletingQuestion.id);
      toast.success("Checklist question deleted.");
      setDeletingQuestion(null);
      fetchQuestions();
    } catch {
      toast.error("Failed to delete checklist question.");
    }
  };

  return (
    <PageContainer
      title="Policy & Concept Note Checklist Manager"
      description="Configure dynamic evaluation templates, passing thresholds, and collapsible criteria questions for policy reviews."
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        {/* Mobile Dropdown View Switcher */}
        <div className="sm:hidden mb-2">
          <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
            Select View Mode
          </Label>
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="h-10 text-xs font-bold bg-card border-border/80 shadow-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="questions" className="text-xs font-bold">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                  <span>Evaluation Questions ({questions.length})</span>
                </div>
              </SelectItem>
              <SelectItem value="templates" className="text-xs font-bold">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-primary shrink-0" />
                  <span>Checklist Templates ({templates.length})</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tablet / Desktop Horizontal Pill Tabs */}
        <div className="hidden sm:block overflow-x-auto max-w-full p-1 rounded-2xl bg-muted/60 border border-border/80">
          <TabsList className="flex h-auto w-max justify-start gap-1 bg-transparent p-0">
            <TabsTrigger
              value="questions"
              className="gap-2 px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap shrink-0 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs cursor-pointer"
            >
              <HelpCircle className="h-4 w-4 shrink-0" />
              <span>Evaluation Questions ({questions.length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="templates"
              className="gap-2 px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap shrink-0 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs cursor-pointer"
            >
              <FileCheck className="h-4 w-4 shrink-0" />
              <span>Checklist Templates ({templates.length})</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ── TAB 1: EVALUATION QUESTIONS (GROUPED ACCORDION) ───────────── */}
        <TabsContent value="questions">
          <Card className="border-border/80">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-primary" />
                    Evaluation Criteria Questions
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Questions are grouped into collapsible sections by Checklist Template and Category for clean, readable management.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={fetchQuestions} disabled={isLoadingQuestions} className="gap-2 text-xs font-bold">
                    <RefreshCw className={cn("h-4 w-4", isLoadingQuestions && "animate-spin")} />
                    Refresh
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingQuestion(null);
                      setQuestionForm({
                        question_text: "",
                        template: "",
                        doc_type: "",
                        category: "1",
                        is_critical: false,
                        weight: "1.00",
                        is_active: true,
                      });
                      setQuestionDialogOpen(true);
                    }}
                    className="gap-2 bg-primary text-white font-bold text-xs cursor-pointer"
                  >
                    <Plus className="h-4 w-4" /> Add Criteria Question
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filter Controls Bar */}
              <div className="p-3 bg-muted/30 rounded-2xl border space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                  <Filter className="h-3.5 w-3.5 text-primary" />
                  <span>Filter Questions By Context</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search question text..."
                      value={questionSearch}
                      onChange={(e) => setQuestionSearch(e.target.value)}
                      className="pl-9 h-9 text-xs"
                    />
                  </div>

                  {/* Filter by Template */}
                  <div>
                    <Select value={selectedTemplateFilter} onValueChange={setSelectedTemplateFilter}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="All Templates" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Templates</SelectItem>
                        {templates.map((tpl) => (
                          <SelectItem key={tpl.id} value={String(tpl.id)}>
                            {tpl.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filter by Doc Type */}
                  <div>
                    <Select value={selectedDocTypeFilter} onValueChange={setSelectedDocTypeFilter}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="All Policy Document Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Policy Document Types</SelectItem>
                        {policyDocTypes.map((doc) => (
                          <SelectItem key={doc.id} value={String(doc.id)}>
                            {doc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filter by Category */}
                  <div>
                    <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {uniqueCategories.map((catId) => (
                          <SelectItem key={catId} value={catId}>
                            Category #{catId}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Collapsible Accordion Groups */}
              {isLoadingQuestions ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-primary" />
                  Loading criteria questions...
                </div>
              ) : templateGroups.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground font-semibold border rounded-2xl">
                  No matching criteria questions found.
                </div>
              ) : (
                <Accordion type="multiple" defaultValue={defaultOpenKeys} className="space-y-4">
                  {templateGroups.map((group) => {
                    const tpl = group.template;
                    const docTypeName = policyDocTypes.find(
                      (d) => String(d.id) === String(tpl?.doc_type)
                    )?.name;

                    // Group questions within this template by Category
                    const categoryMap = new Map<string, ChecklistQuestionItem[]>();
                    group.questions.forEach((q) => {
                      const catId = q.category != null ? String(q.category) : "unassigned";
                      if (!categoryMap.has(catId)) categoryMap.set(catId, []);
                      categoryMap.get(catId)!.push(q);
                    });
                    const categoryEntries = Array.from(categoryMap.entries()).sort(
                      (a, b) => Number(a[0]) - Number(b[0])
                    );

                    return (
                      <AccordionItem
                        key={group.key}
                        value={group.key}
                        className="border border-border/80 rounded-2xl bg-card overflow-hidden shadow-xs"
                      >
                        <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 transition-colors">
                          <div className="flex flex-wrap items-center gap-3 text-left">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <FileCheck className="h-4 w-4" />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-foreground">
                                {tpl ? tpl.name : "Direct & General Questions"}
                              </h3>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] text-muted-foreground font-medium">
                                  {group.questions.length} Questions
                                </span>
                                {docTypeName && (
                                  <Badge variant="secondary" className="text-[9px] font-bold">
                                    {docTypeName}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-4 pt-2 space-y-4 bg-muted/10 border-t">
                          {categoryEntries.map(([catId, catQuestions]) => (
                            <div key={catId} className="space-y-2">
                              {/* Category Header */}
                              <div className="flex items-center gap-2 text-xs font-bold text-primary pb-1 border-b border-border/60">
                                <FolderTree className="h-3.5 w-3.5" />
                                <span>
                                  {catId === "unassigned" ? "General Criteria" : `Category #${catId}`}
                                </span>
                                <Badge variant="outline" className="text-[9px] font-mono ml-auto">
                                  {catQuestions.length} Items
                                </Badge>
                              </div>

                              {/* Question Cards Stack */}
                              <div className="space-y-2 pt-1">
                                {catQuestions.map((q) => {
                                  const parsed = parseQuestionText(q.question_text);
                                  const isActiveState = q.is_active ?? true;

                                  return (
                                    <div
                                      key={q.id}
                                      className="p-3.5 rounded-xl border border-border/70 bg-card hover:border-primary/40 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                                    >
                                      {/* Left: Question Content */}
                                      <div className="space-y-1.5 flex-1 min-w-0">
                                        <div className="flex items-start gap-2">
                                          {q.is_critical ? (
                                            <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                                          ) : (
                                            <HelpCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                          )}
                                          <div className="space-y-1 min-w-0">
                                            <h4 className="text-xs sm:text-sm font-bold text-foreground leading-snug">
                                              {parsed.title}
                                            </h4>
                                            {parsed.body && (
                                              <p className="text-xs text-muted-foreground leading-relaxed">
                                                {parsed.body}
                                              </p>
                                            )}
                                          </div>
                                        </div>

                                        {/* Bottom Metadata Badges */}
                                        <div className="flex flex-wrap items-center gap-2 pl-6 pt-1">
                                           {q.is_critical ? (
                                            <Badge
                                              variant="outline"
                                              className="bg-amber-500/10 text-amber-600 border-amber-300 dark:text-amber-400 font-extrabold text-[9px]"
                                            >
                                              MANDATORY REQUIREMENT
                                            </Badge>
                                          ) : (
                                            <Badge variant="outline" className="text-[9px] text-muted-foreground">
                                              Standard Item
                                            </Badge>
                                          )}

                                          <Badge variant="outline" className="font-mono text-[9px] font-bold">
                                            Weight: {q.weight || "1.00"}
                                          </Badge>

                                          <Badge
                                            variant="outline"
                                            className={cn(
                                              "text-[9px] font-extrabold uppercase px-1.5 py-0.5 gap-1",
                                              isActiveState
                                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-300 dark:text-emerald-400"
                                                : "bg-slate-500/10 text-slate-500 border-slate-300"
                                            )}
                                          >
                                            {isActiveState ? (
                                              <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
                                            ) : (
                                              <XCircle className="h-2.5 w-2.5 text-slate-400" />
                                            )}
                                            {isActiveState ? "Active" : "Inactive"}
                                          </Badge>
                                        </div>
                                      </div>

                                      {/* Right: Quick Actions */}
                                      <div className="flex items-center gap-1 shrink-0 self-end sm:self-start">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                           onClick={() => {
                                            const resolvedTemplateId = q.template != null && String(q.template) !== "null" ? String(q.template) : "";
                                            const resolvedDocTypeId = (q.doc_type || q.docType) != null && String(q.doc_type || q.docType) !== "null" ? String(q.doc_type || q.docType) : "";

                                            setEditingQuestion(q);
                                            setQuestionForm({
                                              question_text: decodeHtmlEntities(q.question_text),
                                              template: resolvedTemplateId,
                                              doc_type: resolvedDocTypeId,
                                              category: q.category != null ? String(q.category) : "1",
                                              is_critical: q.is_critical ?? q.isCritical ?? false,
                                              weight: String(q.weight || "1.00"),
                                              is_active: q.is_active ?? q.isActive ?? true,
                                            });
                                            setQuestionDialogOpen(true);
                                          }}
                                          className="h-8 text-xs cursor-pointer gap-1"
                                        >
                                          <Edit className="h-3.5 w-3.5" />
                                          Edit
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => setDeletingQuestion(q)}
                                          className="h-8 text-xs cursor-pointer text-destructive hover:bg-destructive/10 gap-1"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                          Delete
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB 2: CHECKLIST TEMPLATES ────────────────────────────────── */}
        <TabsContent value="templates">
          <Card className="border-border/80">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <FileCheck className="h-5 w-5 text-primary" />
                    Checklist Evaluation Templates
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Define templates per policy document type with pass thresholds and evaluation rules.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={fetchTemplates} disabled={isLoadingTemplates} className="gap-2 text-xs font-bold">
                    <RefreshCw className={cn("h-4 w-4", isLoadingTemplates && "animate-spin")} />
                    Refresh
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingTemplate(null);
                      setTemplateForm({
                        name: "",
                        doc_type: "",
                        pass_rule_type: "threshold",
                        threshold: "100.00",
                        is_active: true,
                      });
                      setTemplateDialogOpen(true);
                    }}
                    className="gap-2 bg-primary text-white font-bold text-xs cursor-pointer"
                  >
                    <Plus className="h-4 w-4" /> Add Template
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>

              <div className="overflow-x-auto rounded-xl border border-border/80">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="font-bold text-xs">Template Name</TableHead>
                      <TableHead className="font-bold text-xs">Target Policy Document Type</TableHead>
                      <TableHead className="font-bold text-xs">Pass Rule Type</TableHead>
                      <TableHead className="font-bold text-xs">Required Score %</TableHead>
                      <TableHead className="font-bold text-xs">Status</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingTemplates ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-10 text-center text-xs text-muted-foreground">
                          <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-primary" /> Loading templates...
                        </TableCell>
                      </TableRow>
                    ) : templates.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-10 text-center text-xs text-muted-foreground font-semibold">
                          No checklist templates configured.
                        </TableCell>
                      </TableRow>
                    ) : (
                      templates.map((tpl) => {
                        const targetDocType = policyDocTypes.find((d) => String(d.id) === String(tpl.doc_type));

                        return (
                          <TableRow key={tpl.id} className="hover:bg-muted/30">
                            <TableCell className="font-bold text-xs text-foreground">{tpl.name}</TableCell>
                            <TableCell>
                              {targetDocType ? (
                                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-bold text-[10px]">
                                  {targetDocType.name}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize text-[10px] font-bold">
                                {tpl.pass_rule_type || "threshold"}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs font-bold text-foreground">
                              {tpl.threshold ? `${tpl.threshold}%` : "100%"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[9px] font-extrabold uppercase px-2 py-0.5 gap-1",
                                  tpl.is_active ?? true
                                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-300 dark:text-emerald-400"
                                    : "bg-slate-500/10 text-slate-500 border-slate-300"
                                )}
                              >
                                {tpl.is_active ?? true ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <XCircle className="h-3 w-3 text-slate-400" />}
                                {tpl.is_active ?? true ? "Active" : "Inactive"}
                              </Badge>
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
                                      setEditingTemplate(tpl);
                                      setTemplateForm({
                                        name: tpl.name,
                                        doc_type: tpl.doc_type ? String(tpl.doc_type) : "",
                                        pass_rule_type: tpl.pass_rule_type || "threshold",
                                        threshold: String(tpl.threshold || "100.00"),
                                        is_active: tpl.is_active ?? true,
                                      });
                                      setTemplateDialogOpen(true);
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <Edit className="mr-2 h-4 w-4" /> Edit Template
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setDeletingTemplate(tpl)} className="text-destructive cursor-pointer">
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Template
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
        </TabsContent>
      </Tabs>

      {/* Template Dialog Modal */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-primary" />
              {editingTemplate ? "Edit Checklist Template" : "Add Checklist Template"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure target policy document type, pass rules, and threshold percentage.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold">Template Name *</Label>
              <Input
                value={templateForm.name}
                onChange={(e) => setTemplateForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Standard Policy Brief Evaluation Template"
                className="text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold">Target Policy Document Type</Label>
              <SearchableSelect<TaxonomyItem>
                value={templateForm.doc_type}
                onValueChange={(val) => setTemplateForm((p) => ({ ...p, doc_type: val }))}
                options={policyDocTypes}
                getOptionValue={(item) => String(item.id)}
                getOptionLabel={(item) => item.name}
                placeholder="Select document type..."
                searchPlaceholder="Search document types..."
                emptyMessage="No document types available"
                noResultsMessage="No document types found"
                limit={100}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold">Pass Rule Type</Label>
              <Select
                value={templateForm.pass_rule_type}
                onValueChange={(val) => setTemplateForm((p) => ({ ...p, pass_rule_type: val }))}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="threshold">Threshold Pass (Score % Required)</SelectItem>
                  <SelectItem value="strict">Strict Pass (All items must pass)</SelectItem>
                  <SelectItem value="weighted">Weighted Scoring</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold">Required Threshold Percentage (%)</Label>
              <Input
                type="number"
                value={templateForm.threshold}
                onChange={(e) => setTemplateForm((p) => ({ ...p, threshold: e.target.value }))}
                placeholder="100.00"
                className="text-xs font-mono"
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/20">
              <span className="text-xs font-bold">Active Status</span>
              <Switch
                checked={templateForm.is_active}
                onCheckedChange={(val) => setTemplateForm((p) => ({ ...p, is_active: val }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setTemplateDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveTemplate} className="bg-primary text-white font-bold cursor-pointer">
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Question Dialog Modal */}
      <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              {editingQuestion ? "Edit Criteria Question" : "Add Criteria Question"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Formulate evaluation question criteria, associate with a template, and set critical flags.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold">Question / Criteria Text *</Label>
              <Textarea
                value={questionForm.question_text}
                onChange={(e) => setQuestionForm((p) => ({ ...p, question_text: e.target.value }))}
                placeholder="e.g. Is the evidence base sound and supported by valid citations?"
                rows={3}
                className="text-xs"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-bold">Checklist Template</Label>
                <SearchableSelect<ChecklistTemplateItem>
                  value={questionForm.template}
                  onValueChange={(val) => setQuestionForm((p) => ({ ...p, template: val }))}
                  options={templates}
                  getOptionValue={(item) => String(item.id)}
                  getOptionLabel={(item) => item.name}
                  placeholder="Select template..."
                  searchPlaceholder="Search templates..."
                  emptyMessage="No templates"
                  noResultsMessage="No templates"
                  limit={100}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold">Policy Document Type</Label>
                <SearchableSelect<TaxonomyItem>
                  value={questionForm.doc_type}
                  onValueChange={(val) => setQuestionForm((p) => ({ ...p, doc_type: val }))}
                  options={policyDocTypes}
                  getOptionValue={(item) => String(item.id)}
                  getOptionLabel={(item) => item.name}
                  placeholder="Select doc type..."
                  searchPlaceholder="Search doc types..."
                  emptyMessage="No document types"
                  noResultsMessage="No document types"
                  limit={100}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-bold">Category ID / Section</Label>
                <Input
                  type="number"
                  value={questionForm.category}
                  onChange={(e) => setQuestionForm((p) => ({ ...p, category: e.target.value }))}
                  placeholder="1"
                  className="text-xs font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold">Score Weight</Label>
                <Input
                  type="number"
                  value={questionForm.weight}
                  onChange={(e) => setQuestionForm((p) => ({ ...p, weight: e.target.value }))}
                  placeholder="1.00"
                  className="text-xs font-mono"
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl border border-amber-500/30 bg-amber-500/5">
              <div className="space-y-0.5 text-xs">
                <span className="font-bold text-amber-700 dark:text-amber-300 block">Mandatory Requirement</span>
                <span className="text-muted-foreground text-[11px]">
                  Must be satisfied for policy document approval.
                </span>
              </div>
              <Switch
                checked={questionForm.is_critical}
                onCheckedChange={(val) => setQuestionForm((p) => ({ ...p, is_critical: val }))}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/20">
              <span className="text-xs font-bold">Active Status</span>
              <Switch
                checked={questionForm.is_active}
                onCheckedChange={(val) => setQuestionForm((p) => ({ ...p, is_active: val }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setQuestionDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveQuestion} className="bg-primary text-white font-bold cursor-pointer">
              Save Question
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Alerts */}
      <AlertDialog open={!!deletingTemplate} onOpenChange={() => setDeletingTemplate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold">Delete checklist template?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to delete &quot;{deletingTemplate?.name}&quot;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteTemplate} className="bg-destructive text-white font-bold cursor-pointer">
              Delete Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletingQuestion} onOpenChange={() => setDeletingQuestion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold">Delete criteria question?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to delete this question?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteQuestion} className="bg-destructive text-white font-bold cursor-pointer">
              Delete Question
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
