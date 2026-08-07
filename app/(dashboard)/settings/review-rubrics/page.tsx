"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Award,
  Plus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  Loader2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  FolderTree,
  HelpCircle,
  Filter,
  Layers,
  FileText,
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
  listReviewQuestionCategories,
  createReviewQuestionCategory,
  updateReviewQuestionCategory,
  deleteReviewQuestionCategory,
  listReviewQuestions,
  createReviewQuestion,
  updateReviewQuestion,
  deleteReviewQuestion,
  type ReviewQuestionCategoryItem,
  type ReviewQuestionItem,
} from "@/api/services/review-questions.service";
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

function parseRubricText(raw?: string) {
  const cleaned = decodeHtmlEntities(raw);
  if (!cleaned) return { title: "Untitled Rubric Question", body: "" };

  // E.g., "Pillar 1 - Strategic Alignment (Weight: 30%)-Relevance to the Annual Research Agenda..."
  const dashSplit = cleaned.split(/-(?=[A-Za-z0-9])/);
  if (dashSplit.length >= 2 && dashSplit[0].toLowerCase().includes("pillar")) {
    const title = dashSplit[0].trim();
    const body = dashSplit.slice(1).join("-").trim();
    return { title, body };
  }

  const lines = cleaned.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 1) {
    return { title: lines[0], body: "" };
  }

  return { title: lines[0], body: lines.slice(1).join(" ") };
}

export default function ReviewRubricsPage() {
  const [activeTab, setActiveTab] = useState("questions");

  // Questions state & filters
  const [questions, setQuestions] = useState<ReviewQuestionItem[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [questionSearch, setQuestionSearch] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");
  const [selectedProposalTypeFilter, setSelectedProposalTypeFilter] = useState("all");

  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<ReviewQuestionItem | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState<ReviewQuestionItem | null>(null);
  const [questionForm, setQuestionForm] = useState({
    text: "",
    category: "",
    proposal_type: "",
    max_points: 10,
    order: 1,
    is_active: true,
  });

  // Categories state
  const [categories, setCategories] = useState<ReviewQuestionCategoryItem[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [categorySearch, setCategorySearch] = useState("");
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ReviewQuestionCategoryItem | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<ReviewQuestionCategoryItem | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    proposal_type: "",
  });

  // Taxonomy Reference Data: Proposal Types
  const [proposalTypes, setProposalTypes] = useState<TaxonomyItem[]>([]);

  const fetchProposalTypes = useCallback(async () => {
    try {
      const res = await listTaxonomyItems(TaxonomyKind.PROPOSAL_TYPES, { limit: 100 });
      setProposalTypes(res.data || []);
    } catch {
      setProposalTypes([]);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    try {
      const data = await listReviewQuestionCategories({ search: categorySearch || undefined });
      setCategories(data);
    } catch {
      setCategories([]);
    } finally {
      setIsLoadingCategories(false);
    }
  }, [categorySearch]);

  const fetchQuestions = useCallback(async () => {
    setIsLoadingQuestions(true);
    try {
      const data = await listReviewQuestions({ limit: 500 });
      setQuestions(data);
    } catch {
      setQuestions([]);
    } finally {
      setIsLoadingQuestions(false);
    }
  }, []);

  useEffect(() => {
    fetchProposalTypes();
    fetchCategories();
  }, [fetchProposalTypes, fetchCategories]);

  useEffect(() => {
    if (activeTab === "questions") fetchQuestions();
    if (activeTab === "categories") fetchCategories();
  }, [activeTab, fetchQuestions, fetchCategories]);

  // Filtered Questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const formattedText = decodeHtmlEntities(q.text).toLowerCase();
      const matchesSearch = !questionSearch || formattedText.includes(questionSearch.toLowerCase());

      const catId = q.category_id ? String(q.category_id) : "";
      const matchesCategory =
        selectedCategoryFilter === "all" || catId === selectedCategoryFilter;

      const propTypeId = q.proposal_type_id ? String(q.proposal_type_id) : "";
      const matchesPropType =
        selectedProposalTypeFilter === "all" || propTypeId === selectedProposalTypeFilter;

      return matchesSearch && matchesCategory && matchesPropType;
    });
  }, [questions, questionSearch, selectedCategoryFilter, selectedProposalTypeFilter]);

  // Group Questions by Category
  const categoryGroups = useMemo(() => {
    const map = new Map<string, { categoryName: string; questions: ReviewQuestionItem[] }>();

    filteredQuestions.forEach((q) => {
      const catKey = q.category_id ? String(q.category_id) : "unassigned";
      const catObj = categories.find((c) => String(c.id) === String(q.category_id));
      const catName = q.category_name || catObj?.name || "General Review Checklist";

      if (!map.has(catKey)) {
        map.set(catKey, { categoryName: catName, questions: [] });
      }
      map.get(catKey)!.questions.push(q);
    });

    return Array.from(map.entries()).map(([key, group]) => ({
      key,
      categoryName: group.categoryName,
      questions: group.questions.sort((a, b) => (a.order || 0) - (b.order || 0)),
      totalPoints: group.questions.reduce((sum, item) => sum + (item.max_points || 0), 0),
    }));
  }, [filteredQuestions, categories]);

  const defaultOpenKeys = useMemo(() => {
    return categoryGroups.map((g) => g.key);
  }, [categoryGroups]);

  // Question Handlers
  const handleSaveQuestion = async () => {
    if (!questionForm.text.trim()) {
      toast.error("Evaluation question text is required.");
      return;
    }
    try {
      const payload = {
        text: questionForm.text.trim(),
        category: questionForm.category ? Number(questionForm.category) : null,
        proposal_type: questionForm.proposal_type ? Number(questionForm.proposal_type) : null,
        max_points: Number(questionForm.max_points) || 1,
        order: Number(questionForm.order) || 1,
        is_active: questionForm.is_active,
      };

      if (editingQuestion) {
        await updateReviewQuestion(editingQuestion.id, payload);
        toast.success("Review rubric question updated.");
      } else {
        await createReviewQuestion(payload);
        toast.success("Review rubric question created.");
      }
      setQuestionDialogOpen(false);
      fetchQuestions();
    } catch {
      toast.error("Failed to save review rubric question.");
    }
  };

  const handleConfirmDeleteQuestion = async () => {
    if (!deletingQuestion) return;
    try {
      await deleteReviewQuestion(deletingQuestion.id);
      toast.success("Review rubric question deleted.");
      setDeletingQuestion(null);
      fetchQuestions();
    } catch {
      toast.error("Failed to delete question.");
    }
  };

  // Category Handlers
  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast.error("Category name is required.");
      return;
    }
    try {
      const payload = {
        name: categoryForm.name.trim(),
        proposal_type: categoryForm.proposal_type ? Number(categoryForm.proposal_type) : null,
      };
      if (editingCategory) {
        await updateReviewQuestionCategory(editingCategory.id, payload);
        toast.success("Rubric category updated.");
      } else {
        await createReviewQuestionCategory(payload);
        toast.success("Rubric category created.");
      }
      setCategoryDialogOpen(false);
      fetchCategories();
    } catch {
      toast.error("Failed to save rubric category.");
    }
  };

  const handleConfirmDeleteCategory = async () => {
    if (!deletingCategory) return;
    try {
      await deleteReviewQuestionCategory(deletingCategory.id);
      toast.success("Rubric category deleted.");
      setDeletingCategory(null);
      fetchCategories();
    } catch {
      toast.error("Failed to delete category.");
    }
  };

  return (
    <PageContainer
      title="Proposal Technical Review Rubric Manager"
      description="Configure scoring evaluation questions, rubric categories, and maximum point weights for proposal reviews."
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        {/* Mobile Dropdown Category Switcher */}
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
                  <Award className="h-4 w-4 text-primary shrink-0" />
                  <span>Evaluation Questions ({questions.length})</span>
                </div>
              </SelectItem>
              <SelectItem value="categories" className="text-xs font-bold">
                <div className="flex items-center gap-2">
                  <FolderTree className="h-4 w-4 text-primary shrink-0" />
                  <span>Rubric Categories ({categories.length})</span>
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
              <Award className="h-4 w-4 shrink-0" />
              <span>Evaluation Questions ({questions.length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="categories"
              className="gap-2 px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap shrink-0 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs cursor-pointer"
            >
              <FolderTree className="h-4 w-4 shrink-0" />
              <span>Rubric Categories ({categories.length})</span>
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
                    <Award className="h-5 w-5 text-primary" />
                    Proposal Scoring Questions & Point Weights
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Questions presented to technical reviewers, grouped into collapsible rubric categories.
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
                        text: "",
                        category: "",
                        proposal_type: "",
                        max_points: 10,
                        order: questions.length + 1,
                        is_active: true,
                      });
                      setQuestionDialogOpen(true);
                    }}
                    className="gap-2 bg-primary text-white font-bold text-xs cursor-pointer"
                  >
                    <Plus className="h-4 w-4" /> Add Rubric Question
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filter Bar */}
              <div className="p-3 bg-muted/30 rounded-2xl border space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                  <Filter className="h-3.5 w-3.5 text-primary" />
                  <span>Filter Evaluation Rubrics</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search rubric questions..."
                      value={questionSearch}
                      onChange={(e) => setQuestionSearch(e.target.value)}
                      className="pl-9 h-9 text-xs"
                    />
                  </div>

                  {/* Filter by Category */}
                  <div>
                    <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filter by Proposal Type */}
                  <div>
                    <Select value={selectedProposalTypeFilter} onValueChange={setSelectedProposalTypeFilter}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="All Proposal Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Proposal Types</SelectItem>
                        {proposalTypes.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Grouped Accordions */}
              {isLoadingQuestions ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-primary" />
                  Loading review rubric questions...
                </div>
              ) : categoryGroups.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground font-semibold border rounded-2xl">
                  No matching rubric questions found.
                </div>
              ) : (
                <Accordion type="multiple" defaultValue={defaultOpenKeys} className="space-y-4">
                  {categoryGroups.map((group) => (
                    <AccordionItem
                      key={group.key}
                      value={group.key}
                      className="border border-border/80 rounded-2xl bg-card overflow-hidden shadow-xs"
                    >
                      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 transition-colors">
                        <div className="flex flex-wrap items-center gap-3 text-left">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <FolderTree className="h-4 w-4" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-foreground">
                              {group.categoryName}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] text-muted-foreground font-medium">
                                {group.questions.length} Rubric Criteria Items
                              </span>
                              <Badge variant="outline" className="font-mono text-[9px] font-bold text-primary border-primary/20 bg-primary/5">
                                Total: {group.totalPoints} Points
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="p-4 pt-2 space-y-3 bg-muted/10 border-t">
                        {group.questions.map((q) => {
                          const parsed = parseRubricText(q.text);
                          const propTypeName =
                            q.proposal_type_name ||
                            proposalTypes.find((p) => String(p.id) === String(q.proposal_type_id))?.name;
                          const isActiveState = q.is_active ?? true;

                          return (
                            <div
                              key={q.id}
                              className="p-4 rounded-xl border border-border/70 bg-card hover:border-primary/40 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                            >
                              {/* Content */}
                              <div className="space-y-1.5 flex-1 min-w-0">
                                <div className="flex items-start gap-2.5">
                                  <Badge variant="outline" className="font-mono text-xs font-bold bg-muted shrink-0 mt-0.5">
                                    #{q.order || 1}
                                  </Badge>
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

                                {/* Metadata Badges */}
                                <div className="flex flex-wrap items-center gap-2 pl-9 pt-1">
                                  <Badge variant="outline" className="font-mono font-extrabold text-[10px] bg-primary/10 text-primary border-primary/20">
                                    Max: {q.max_points ?? 10} Points
                                  </Badge>

                                  {propTypeName && (
                                    <Badge variant="secondary" className="text-[10px] font-medium">
                                      {propTypeName}
                                    </Badge>
                                  )}

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

                              {/* Actions */}
                              <div className="flex items-center gap-1 shrink-0 self-end sm:self-start">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingQuestion(q);
                                    setQuestionForm({
                                      text: decodeHtmlEntities(q.text),
                                      category: q.category_id ? String(q.category_id) : "",
                                      proposal_type: q.proposal_type_id ? String(q.proposal_type_id) : "",
                                      max_points: q.max_points ?? 10,
                                      order: q.order ?? 1,
                                      is_active: q.is_active ?? true,
                                    });
                                    setQuestionDialogOpen(true);
                                  }}
                                  className="h-8 text-xs cursor-pointer gap-1"
                                >
                                  <Edit className="h-3.5 w-3.5" /> Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeletingQuestion(q)}
                                  className="h-8 text-xs cursor-pointer text-destructive hover:bg-destructive/10 gap-1"
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Delete
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB 2: RUBRIC CATEGORIES ───────────────────────────────────── */}
        <TabsContent value="categories">
          <Card className="border-border/80">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <FolderTree className="h-5 w-5 text-primary" />
                    Rubric Evaluation Categories
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Categories used to group technical evaluation criteria.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={fetchCategories} disabled={isLoadingCategories} className="gap-2 text-xs font-bold">
                    <RefreshCw className={cn("h-4 w-4", isLoadingCategories && "animate-spin")} />
                    Refresh
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingCategory(null);
                      setCategoryForm({ name: "" });
                      setCategoryDialogOpen(true);
                    }}
                    className="gap-2 bg-primary text-white font-bold text-xs cursor-pointer"
                  >
                    <Plus className="h-4 w-4" /> Add Category
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search categories..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>

              <div className="overflow-x-auto rounded-xl border border-border/80">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="font-bold text-xs">Category Name</TableHead>
                      <TableHead className="font-bold text-xs">Target Proposal Type</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingCategories ? (
                      <TableRow>
                        <TableCell colSpan={3} className="py-10 text-center text-xs text-muted-foreground">
                          <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-primary" /> Loading categories...
                        </TableCell>
                      </TableRow>
                    ) : categories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="py-10 text-center text-xs text-muted-foreground font-semibold">
                          No categories configured.
                        </TableCell>
                      </TableRow>
                    ) : (
                      categories.map((cat) => {
                        const targetPropTypeName =
                          cat.proposal_type_name ||
                          proposalTypes.find((p) => String(p.id) === String(cat.proposal_type_id))?.name;

                        return (
                          <TableRow key={cat.id} className="hover:bg-muted/30">
                            <TableCell className="font-bold text-xs text-foreground">{cat.name}</TableCell>
                            <TableCell>
                              {targetPropTypeName ? (
                                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-bold text-[10px]">
                                  {targetPropTypeName}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
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
                                      setEditingCategory(cat);
                                      setCategoryForm({
                                        name: cat.name,
                                        proposal_type: cat.proposal_type_id ? String(cat.proposal_type_id) : "",
                                      });
                                      setCategoryDialogOpen(true);
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <Edit className="mr-2 h-4 w-4" /> Edit Category
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setDeletingCategory(cat)} className="text-destructive cursor-pointer">
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Category
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

      {/* Question Modal */}
      <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              {editingQuestion ? "Edit Rubric Question" : "Add Rubric Question"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure question prompt text, point weight, category, and target proposal type.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold">Evaluation Question Text *</Label>
              <Textarea
                value={questionForm.text}
                onChange={(e) => setQuestionForm((p) => ({ ...p, text: e.target.value }))}
                placeholder="e.g. Pillar 1 - Strategic Alignment (Weight: 30%) - Relevance to Annual Research Agenda..."
                rows={3}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-bold">Rubric Category</Label>
                <SearchableSelect<ReviewQuestionCategoryItem>
                  value={questionForm.category}
                  onValueChange={(val) => setQuestionForm((p) => ({ ...p, category: val }))}
                  options={categories}
                  getOptionValue={(item) => String(item.id)}
                  getOptionLabel={(item) => item.name}
                  placeholder="Select category..."
                  searchPlaceholder="Search categories..."
                  emptyMessage="No categories"
                  noResultsMessage="No categories"
                  limit={100}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold">Proposal Type</Label>
                <SearchableSelect<TaxonomyItem>
                  value={questionForm.proposal_type}
                  onValueChange={(val) => setQuestionForm((p) => ({ ...p, proposal_type: val }))}
                  options={proposalTypes}
                  getOptionValue={(item) => String(item.id)}
                  getOptionLabel={(item) => item.name}
                  placeholder="Select proposal type..."
                  searchPlaceholder="Search proposal types..."
                  emptyMessage="No proposal types"
                  noResultsMessage="No proposal types"
                  limit={100}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold">Max Points Weight</Label>
                <Input
                  type="number"
                  value={questionForm.max_points}
                  onChange={(e) => setQuestionForm((p) => ({ ...p, max_points: Number(e.target.value) }))}
                  placeholder="30"
                  className="text-xs font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold">Display Order</Label>
                <Input
                  type="number"
                  value={questionForm.order}
                  onChange={(e) => setQuestionForm((p) => ({ ...p, order: Number(e.target.value) }))}
                  placeholder="1"
                  className="text-xs font-mono"
                />
              </div>
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

      {/* Category Modal */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <FolderTree className="h-5 w-5 text-primary" />
              {editingCategory ? "Edit Rubric Category" : "Add Rubric Category"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold">Category Name *</Label>
              <Input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. ROC Review Checklist"
                className="text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold">Target Proposal Type</Label>
              <SearchableSelect<TaxonomyItem>
                value={categoryForm.proposal_type}
                onValueChange={(val) => setCategoryForm((p) => ({ ...p, proposal_type: val }))}
                options={proposalTypes}
                getOptionValue={(item) => String(item.id)}
                getOptionLabel={(item) => item.name}
                placeholder="Select proposal type..."
                searchPlaceholder="Search proposal types..."
                emptyMessage="No proposal types"
                noResultsMessage="No proposal types"
                limit={100}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveCategory} className="bg-primary text-white font-bold cursor-pointer">
              Save Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Alerts */}
      <AlertDialog open={!!deletingQuestion} onOpenChange={() => setDeletingQuestion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold">Delete rubric question?</AlertDialogTitle>
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

      <AlertDialog open={!!deletingCategory} onOpenChange={() => setDeletingCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold">Delete rubric category?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to delete &quot;{deletingCategory?.name}&quot;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteCategory} className="bg-destructive text-white font-bold cursor-pointer">
              Delete Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
