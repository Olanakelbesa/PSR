"use client";

import { useState, useRef, useMemo } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Save,
  Send,
  Plus,
  Trash2,
  Bold,
  Italic,
  Underline,
  Link as LinkIcon,
  List,
  Image as ImageIcon,
  Calendar as CalendarIcon,
  Upload,
  Info,
  Check,
  FileUp,
  FileText,
  ChevronsUpDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageContainer } from "@/components/layout";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import RichTextEditor from "@/components/RichTextEditor";

const PROPOSAL_TYPES = [
  { value: "research", label: "Research" },
  { value: "innovation", label: "Innovation" },
  { value: "community", label: "Community Engagement" },
  { value: "consultancy", label: "Consultancy" },
  { value: "capacity-building", label: "Capacity Building" },
  { value: "policy-review", label: "Policy Review" },
];

export default function NewGrantPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("<p></p>");
  const [eligibilityCriteria, setEligibilityCriteria] = useState("<p></p>");
  const [openDate, setOpenDate] = useState("2025-01-01");
  const [closeDate, setCloseDate] = useState("2025-06-01");

  const [installments, setInstallments] = useState([
    { id: 1, percentage: 40 },
    { id: 2, percentage: 30 },
    { id: 3, percentage: 30 },
  ]);

  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    "research",
    "innovation",
  ]);
  const [open, setOpen] = useState(false);

  // Image Upload State
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [banner, setBanner] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  // Supporting Documents State
  const [documents, setDocuments] = useState<{ id: string; file: File }[]>([]);

  // Refs for hidden inputs
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  // Helper to normalize rich-text HTML into visible text.
  const getCleanText = (html: string) => {
    const normalized = html
      .replace(/&nbsp;/g, " ")
      .replace(/\u00a0/g, " ")
      .replace(/<br\s*\/?>(?=\s*<\/p>)/gi, " ")
      .replace(/<[^>]*>/g, " ");

    return normalized.replace(/\s+/g, " ").trim();
  };

  const hasMeaningfulContent = (html: string) => getCleanText(html).length > 0;

  // Installment Logic
  const addInstallment = () => {
    const newId =
      installments.length > 0
        ? Math.max(...installments.map((i) => i.id)) + 1
        : 1;
    setInstallments([...installments, { id: newId, percentage: 0 }]);
  };

  const removeInstallment = (id: number) => {
    setInstallments(installments.filter((i) => i.id !== id));
  };

  const updatePercentage = (id: number, value: string) => {
    const percentage = parseInt(value) || 0;
    setInstallments(
      installments.map((i) => (i.id === id ? { ...i, percentage } : i)),
    );
  };

  const totalPercentage = installments.reduce(
    (sum, i) => sum + i.percentage,
    0,
  );

  // Progress Calculation
  const progress = useMemo(() => {
    let score = 0;
    const totalWeight = 9;

    if (title.trim().length > 3) score += 1;
    if (hasMeaningfulContent(description)) score += 1;
    if (hasMeaningfulContent(eligibilityCriteria)) score += 1;
    if (selectedTypes.length > 0) score += 1;
    if (thumbnail) score += 1;
    if (banner) score += 1;
    if (openDate) score += 1;
    if (closeDate) score += 1;
    if (totalPercentage === 100) score += 1;

    return Math.round((score / totalWeight) * 100);
  }, [
    title,
    description,
    eligibilityCriteria,
    selectedTypes,
    thumbnail,
    banner,
    openDate,
    closeDate,
    totalPercentage,
  ]);

  const progressBlocks = Math.round(progress / 10);

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "thumbnail" | "banner",
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === "thumbnail") {
          setThumbnail(file);
          setThumbnailPreview(reader.result as string);
        } else {
          setBanner(file);
          setBannerPreview(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newDocs = Array.from(files).map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
      }));
      setDocuments((prev) => [...prev, ...newDocs]);
    }
  };

  const removeDocument = (id: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
  };

  const removeImage = (type: "thumbnail" | "banner") => {
    if (type === "thumbnail") {
      setThumbnail(null);
      setThumbnailPreview(null);
    } else {
      setBanner(null);
      setBannerPreview(null);
    }
  };

  const toggleType = (value: string) => {
    setSelectedTypes((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value],
    );
  };

  return (
    <PageContainer
      title="Create Grant Call"
      description="Create and configure a new funding opportunity"
      actions={
        <Button
          variant="outline"
          size="sm"
          asChild
          className="h-8 text-muted-foreground hover:text-foreground"
        >
          <Link href="/research/manage-grants">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Link>
        </Button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Form Fields */}
        <div className="lg:col-span-2 space-y-8">
          {/* Basic Information */}
          <Card className="shadow-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 font-bold tracking-tight">
                <Info className="h-5 w-5 text-primary" />
                BASIC INFORMATION
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-semibold">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g. 2026 Research Call for Health Innovations"
                  className="h-11"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="year" className="text-sm font-semibold">
                    Current Year
                  </Label>
                  <Select defaultValue="2025">
                    <SelectTrigger id="year" className="h-11">
                      <SelectValue placeholder="Select Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                      <SelectItem value="2027">2027</SelectItem>
                      <SelectItem value="2028">2028</SelectItem>
                      <SelectItem value="2029">2029</SelectItem>
                      <SelectItem value="2030">2030</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-semibold">
                  Proposal Types <span className="text-destructive">*</span>
                </Label>
                <div className="flex flex-col gap-3">
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full h-11 justify-between bg-muted/20 hover:bg-muted/30 border-border/40 text-left font-normal"
                      >
                        <span className="truncate">
                          {selectedTypes.length > 0
                            ? `${selectedTypes.length} types selected`
                            : "Select proposal types..."}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[--radix-popover-trigger-width] p-0"
                      align="start"
                    >
                      <Command className="w-full">
                        <CommandInput
                          placeholder="Search proposal types..."
                          className="h-9"
                        />
                        <CommandList>
                          <CommandEmpty>No proposal type found.</CommandEmpty>
                          <CommandGroup>
                            {PROPOSAL_TYPES.map((type) => (
                              <CommandItem
                                key={type.value}
                                value={type.value}
                                onSelect={() => toggleType(type.value)}
                                className="cursor-pointer"
                              >
                                <div
                                  className={cn(
                                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary transition-colors",
                                    selectedTypes.includes(type.value)
                                      ? "bg-primary text-primary-foreground"
                                      : "opacity-50 [&_svg]:invisible",
                                  )}
                                >
                                  <Check className={cn("h-3 w-3")} />
                                </div>
                                <span>{type.label}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  {selectedTypes.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 bg-muted/20 rounded-xl border border-border/40 min-h-[50px]">
                      {selectedTypes.map((val) => {
                        const type = PROPOSAL_TYPES.find(
                          (t) => t.value === val,
                        );
                        return (
                          <Badge
                            key={val}
                            variant="secondary"
                            className="bg-background hover:bg-background border-border/40 text-xs py-1 px-2 flex items-center gap-1 group"
                          >
                            {type?.label}
                            <button
                              onClick={() => toggleType(val)}
                              className="ml-1 rounded-full outline-hidden hover:bg-muted p-0.5"
                            >
                              <Plus className="h-3 w-3 rotate-45 text-muted-foreground group-hover:text-foreground" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card className="shadow-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-bold tracking-tight">
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RichTextEditor
                content={description}
                onChange={(html) => setDescription(html)}
              />
            </CardContent>
          </Card>

          {/* Eligibility Criteria */}
          <Card className="shadow-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-bold tracking-tight">
                Eligibility Criteria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RichTextEditor
                content={eligibilityCriteria}
                onChange={(html) => setEligibilityCriteria(html)}
              />
            </CardContent>
          </Card>

          {/* Upload Images */}
          <Card className="shadow-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-bold tracking-tight">
                Upload Images
              </CardTitle>
              <CardDescription>
                Add a thumbnail and banner for the grant call listing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Thumbnail Upload */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Thumbnail</Label>
                  <input
                    type="file"
                    ref={thumbnailInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "thumbnail")}
                  />
                  {thumbnailPreview ? (
                    <div className="relative group rounded-xl overflow-hidden border border-border aspect-video bg-muted/20">
                      <img
                        src={thumbnailPreview}
                        alt="Thumbnail Preview"
                        className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-8 shadow-lg"
                          onClick={() => thumbnailInputRef.current?.click()}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Change
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-8 shadow-lg"
                          onClick={() => removeImage("thumbnail")}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => thumbnailInputRef.current?.click()}
                      className="border-2 border-dashed border-border/60 rounded-xl p-8 flex flex-col items-center justify-center gap-3 hover:bg-muted/30 hover:border-primary/40 transition-all cursor-pointer group min-h-[160px] bg-muted/10"
                    >
                      <div className="p-3 rounded-full bg-background border shadow-xs group-hover:scale-110 transition-transform">
                        <Upload className="h-6 w-6 text-primary/70" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">Click to upload</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Thumbnail (400x400)
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Banner Upload */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Banner</Label>
                  <input
                    type="file"
                    ref={bannerInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "banner")}
                  />
                  {bannerPreview ? (
                    <div className="relative group rounded-xl overflow-hidden border border-border aspect-video bg-muted/20">
                      <img
                        src={bannerPreview}
                        alt="Banner Preview"
                        className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-8 shadow-lg"
                          onClick={() => bannerInputRef.current?.click()}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Change
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-8 shadow-lg"
                          onClick={() => removeImage("banner")}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => bannerInputRef.current?.click()}
                      className="border-2 border-dashed border-border/60 rounded-xl p-8 flex flex-col items-center justify-center gap-3 hover:bg-muted/30 hover:border-primary/40 transition-all cursor-pointer group min-h-[160px] bg-muted/10"
                    >
                      <div className="p-3 rounded-full bg-background border shadow-xs group-hover:scale-110 transition-transform">
                        <ImageIcon className="h-6 w-6 text-primary/70" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">Click to upload</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Banner (1200x400)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Supporting Documents */}
          <Card className="shadow-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-bold tracking-tight">
                Supporting Documents
              </CardTitle>
              <CardDescription>
                Upload relevant guidelines, templates, or policy documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <input
                type="file"
                ref={documentInputRef}
                className="hidden"
                multiple
                onChange={handleDocumentUpload}
              />

              <div
                onClick={() => documentInputRef.current?.click()}
                className="border-2 border-dashed border-border/60 rounded-xl p-8 flex flex-col items-center justify-center gap-3 hover:bg-muted/30 hover:border-primary/40 transition-all cursor-pointer group bg-muted/10"
              >
                <div className="p-3 rounded-full bg-background border shadow-xs group-hover:scale-110 transition-transform">
                  <FileUp className="h-6 w-6 text-primary/70" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">
                    Click to upload documents
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, DOCX, XLSX (Max 10MB each)
                  </p>
                </div>
              </div>

              {documents.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-semibold px-1">
                    Uploaded Files
                  </Label>
                  <div className="grid grid-cols-1 gap-2">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-background/50 hover:bg-muted/20 transition-colors shadow-xs group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium truncate max-w-[240px] sm:max-w-md">
                              {doc.file.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                              {(doc.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeDocument(doc.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dates */}
          <Card className="shadow-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-bold tracking-tight">
                Application Dates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="open-date" className="text-sm font-semibold">
                    Open Date
                  </Label>
                  <div className="relative">
                    <Input
                      id="open-date"
                      type="date"
                      value={openDate}
                      onChange={(e) => setOpenDate(e.target.value)}
                      className="pl-10 h-11 bg-muted/10"
                    />
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="close-date" className="text-sm font-semibold">
                    Close Date
                  </Label>
                  <div className="relative">
                    <Input
                      id="close-date"
                      type="date"
                      value={closeDate}
                      onChange={(e) => setCloseDate(e.target.value)}
                      className="pl-10 h-11 bg-muted/10"
                    />
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Installment Plan */}
          <Card className="shadow-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-lg font-bold tracking-tight">
                  Installment Plan
                </CardTitle>
                <CardDescription>
                  Configure the grant disbursement schedule
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={addInstallment}
                className="h-9 shadow-xs hover:bg-primary/5"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Installment
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-border/40 overflow-hidden shadow-xs">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="w-32 pl-6">Installment</TableHead>
                      <TableHead>Percentage (%)</TableHead>
                      <TableHead className="w-20 pr-6 text-right"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {installments.map((inst, index) => (
                      <TableRow
                        key={inst.id}
                        className="hover:bg-muted/10 transition-colors"
                      >
                        <TableCell className="font-medium pl-6">
                          [{index + 1}]
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Input
                              type="number"
                              value={inst.percentage}
                              onChange={(e) =>
                                updatePercentage(inst.id, e.target.value)
                              }
                              className="w-24 h-9 bg-background"
                            />
                            <div className="flex-1 max-w-[200px] hidden sm:block">
                              <Progress
                                value={inst.percentage}
                                className="h-1.5"
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="pr-6 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeInstallment(inst.id)}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/20 p-5 rounded-xl border border-border/40">
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "px-5 py-2.5 rounded-lg font-bold border-2 shadow-sm transition-all",
                      totalPercentage === 100
                        ? "bg-primary/10 text-green-600 border-green-200"
                        : "bg-destructive/10 text-destructive border-destructive/20",
                    )}
                  >
                    Total = {totalPercentage}%
                  </div>
                  {totalPercentage !== 100 && (
                    <span className="text-sm text-destructive">
                      Sum must be 100%
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <Info className="h-3.5 w-3.5" />
                  Remaining: {100 - totalPercentage}%
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Status Panel */}
        <div >
          <Card className="xl:sticky xl:top-2 shadow-md border-primary/10 overflow-hidden bg-gradient-to-b from-background to-muted/20 -py-6">
            <div className=" bg-primary w-full" />
            <CardHeader className="bg-primary/5 pb-6 -mt-6">
              <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-primary/80">
                GRANT STATUS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold tracking-wider">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="text-primary">{progress}%</span>
                </div>
                <div className="flex gap-1 h-2 w-full">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex-1 rounded-sm transition-all duration-500",
                        i < progressBlocks
                          ? "bg-primary shadow-[0_0_5px_rgba(var(--primary),0.3)]"
                          : "bg-muted",
                      )}
                    />
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground font-medium italic">
                  {progress === 100
                    ? "Ready to publish!"
                    : progress > 70
                      ? "Almost ready to publish"
                      : "Keep filling the form"}
                </p>
              </div>

              <div className="pt-4 border-t border-border/40">
                <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 mt-0.5">
                      <Info className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold text-primary uppercase tracking-tight">
                        Checklist
                      </p>
                      <ul className="text-xs space-y-1.5 text-muted-foreground font-medium">
                        <li className="flex items-center gap-2">
                          <div
                            className={cn(
                              "h-1.5 w-1.5 rounded-full transition-colors",
                              title.length > 3
                                ? "bg-primary"
                                : "bg-muted-foreground/30",
                            )}
                          />
                          Basic Information
                        </li>
                        <li className="flex items-center gap-2">
                          <div
                            className={cn(
                              "h-1.5 w-1.5 rounded-full transition-colors",
                              hasMeaningfulContent(description)
                                ? "bg-primary"
                                : "bg-muted-foreground/30",
                            )}
                          />
                          Description
                        </li>
                        <li className="flex items-center gap-2">
                          <div
                            className={cn(
                              "h-1.5 w-1.5 rounded-full transition-colors",
                              hasMeaningfulContent(eligibilityCriteria)
                                ? "bg-primary"
                                : "bg-muted-foreground/30",
                            )}
                          />
                          Eligibility Criteria
                        </li>
                        <li className="flex items-center gap-2">
                          <div
                            className={cn(
                              "h-1.5 w-1.5 rounded-full transition-colors",
                              thumbnail && banner
                                ? "bg-primary"
                                : "bg-muted-foreground/30",
                            )}
                          />
                          Media Assets
                        </li>
                        <li className="flex items-center gap-2">
                          <div
                            className={cn(
                              "h-1.5 w-1.5 rounded-full transition-colors",
                              totalPercentage === 100
                                ? "bg-primary"
                                : "bg-muted-foreground/30",
                            )}
                          />
                          Installment Plan
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 pt-2 grid grid-cols-2 gap-4 ">
                <Button
                  variant="outline"
                  className="w-full justify-start h-12 border-border/60 hover:bg-primary/5 hover:border-primary/30 transition-all shadow-xs group font-bold"
                >
                  <Save className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  Save Draft
                </Button>
                <Button className="w-full justify-start h-12 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all group font-black text-sm">
                  <Send className="mr-3 h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  Publish Call
                </Button>
              </div>
            </CardContent>
            <div className="p-4 bg-muted/40 border-t border-border/40">
              <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground font-bold">
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                AUTOSAVED AT{" "}
                {new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
