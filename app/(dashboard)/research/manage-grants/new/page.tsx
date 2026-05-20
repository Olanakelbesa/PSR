"use client";

import { useState, useRef, useMemo, useEffect } from "react";
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
  FileText,
  ChevronsUpDown,
  ChevronsDown,
  ChevronDown,
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
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createGrantCall,
  updateGrantCall,
  publishGrantCall,
} from "@/api/services/grant-calls.service";
import { useProposalTypes } from "@/lib/queries/proposal-type";

export default function NewGrantPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("<p></p>");
  const [eligibilityCriteria, setEligibilityCriteria] = useState("<p></p>");
  const [budget, setBudget] = useState<string>("");
  const [status, setStatus] = useState("draft");
  const [openDate, setOpenDate] = useState("2025-01-01");
  const [closeDate, setCloseDate] = useState("2025-06-01");

  const [installments, setInstallments] = useState([
    { id: 1, percentage: 40 },
    { id: 2, percentage: 30 },
    { id: 3, percentage: 30 },
  ]);
  const [errors, setErrors] = useState<any>(null);
  const [grantCallId, setGrantCallId] = useState<string | number | null>(null);

  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const {
    data: proposalTypes = [],
    isLoading: proposalTypesLoading,
    error: proposalTypesError,
  } = useProposalTypes();

  // Image Upload State
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [banner, setBanner] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  // Refs for hidden inputs
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const autosaveTimerRef = useRef<number | null>(null);
  const saveInFlightRef = useRef(false);
  const activeSavePromiseRef = useRef<Promise<any> | null>(null);
  const queuedPayloadRef = useRef<{
    payload: ReturnType<typeof buildGrantCallPayload>;
    mode: "autosave" | "manual" | "publish";
  } | null>(null);
  const lastSavedSignatureRef = useRef("");

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

  const router = useRouter();
  const [currentYear, setCurrentYear] = useState("2026");

  function buildGrantCallPayload() {
    return {
      title,
      description,
      eligibility_criteria: eligibilityCriteria,
      proposal_types: selectedTypes,
      status: status || "",
      current_year: currentYear,
      open_date: openDate || null,
      close_date: closeDate || null,
      thumbnail_image: thumbnail ?? null,
      banner_image: banner ?? null,
      installment_plans: installments.map((it, idx) => ({
        installment_number: idx + 1,
        percentage: it.percentage,
      })),
      budget: budget ? Number(budget) : null,
    };
  }

  function serializeGrantCallPayload(
    payload: ReturnType<typeof buildGrantCallPayload>,
  ) {
    return JSON.stringify({
      ...payload,
      thumbnail_image:
        payload.thumbnail_image instanceof File
          ? `${payload.thumbnail_image.name}:${payload.thumbnail_image.size}:${payload.thumbnail_image.lastModified}`
          : payload.thumbnail_image,
      banner_image:
        payload.banner_image instanceof File
          ? `${payload.banner_image.name}:${payload.banner_image.size}:${payload.banner_image.lastModified}`
          : payload.banner_image,
    });
  }

  async function persistGrantCall(
    mode: "autosave" | "manual" | "publish",
    payloadOverride?: ReturnType<typeof buildGrantCallPayload>,
  ): Promise<string | number | null> {
    const payload = payloadOverride ?? buildGrantCallPayload();
    const signature = serializeGrantCallPayload(payload);

    if (mode === "autosave" && signature === lastSavedSignatureRef.current) {
      return grantCallId;
    }

    if (saveInFlightRef.current) {
      if (mode !== "autosave") {
        try {
          await activeSavePromiseRef.current;
        } catch {
          // ignore error from previous request to retry
        }
      } else {
        queuedPayloadRef.current = { payload, mode };
        return grantCallId;
      }
    }

    saveInFlightRef.current = true;

    const savePromise = (async () => {
      setErrors(null);
      const saved = grantCallId
        ? await updateGrantCall(grantCallId, payload)
        : await createGrantCall(payload);

      if (!grantCallId) {
        setGrantCallId(saved.id);
      }

      lastSavedSignatureRef.current = signature;

      if (mode !== "autosave" && mode !== "publish") {
        toast.success("Grant call saved");
      }

      return saved.id;
    })();

    activeSavePromiseRef.current = savePromise;

    try {
      const savedId = await savePromise;
      return savedId;
    } catch (err) {
      console.error(err);
      const envelope =
        (err as any)?.response?.data ?? (err as any)?.data ?? err;
      setErrors(envelope);
      const msg =
        envelope?.error?.message ??
        envelope?.message ??
        "Failed to save grant call";
      if (mode !== "autosave") {
        toast.error(msg);
      }
      if (err && typeof err === "object") {
        (err as any)._persistFailed = true;
      }
      throw err;
    } finally {
      if (activeSavePromiseRef.current === savePromise) {
        saveInFlightRef.current = false;
        activeSavePromiseRef.current = null;
      }

      const queued = queuedPayloadRef.current;
      queuedPayloadRef.current = null;

      if (queued) {
        const queuedSignature = serializeGrantCallPayload(queued.payload);
        if (queuedSignature !== lastSavedSignatureRef.current) {
          void persistGrantCall(queued.mode, queued.payload).catch((err) => {
            if (queued.mode !== "autosave") {
              console.error(err);
            }
          });
        }
      }
    }
  }

  async function handleSubmit() {
    return persistGrantCall("manual");
  }

  async function handlePublish() {
    try {
      const savedId = await persistGrantCall("publish");
      if (!savedId) return;
      await publishGrantCall(savedId);
      toast.success("Grant call published");
      router.push(`/research/manage-grants/${savedId}`);
    } catch (err) {
      console.error(err);
      // If persistGrantCall failed, it already showed a toast error (since mode !== "autosave").
      // But if publishGrantCall failed (which happened after savedId was successfully returned),
      // we need to toast the publish error:
      if (err && (err as any)._persistFailed === undefined) {
        const envelope =
          (err as any)?.response?.data ?? (err as any)?.data ?? err;
        const msg =
          envelope?.error?.message ??
          envelope?.message ??
          "Failed to publish grant call";
        toast.error(msg);
      }
    }
  }

  const canAutosave =
    title.trim().length > 0 &&
    hasMeaningfulContent(description) &&
    openDate.trim().length > 0 &&
    closeDate.trim().length > 0 &&
    budget.trim().length > 0 &&
    totalPercentage === 100;

  useEffect(() => {
    if (!canAutosave) return;

    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }

    const payload = buildGrantCallPayload();
    autosaveTimerRef.current = window.setTimeout(() => {
      void persistGrantCall("autosave", payload).catch(() => {
        // autosave errors are surfaced through inline validation state
      });
    }, 900);

    return () => {
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [
    canAutosave,
    title,
    description,
    eligibilityCriteria,
    budget,
    status,
    openDate,
    closeDate,
    installments,
    selectedTypes,
    thumbnail,
    banner,
    currentYear,
    totalPercentage,
  ]);

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
                  <Select
                    value={currentYear}
                    onValueChange={(v) => setCurrentYear(v)}
                  >
                    <SelectTrigger id="year" className="h-11">
                      <SelectValue placeholder="Select Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2026">2026</SelectItem>
                      <SelectItem value="2027">2027</SelectItem>
                      <SelectItem value="2028">2028</SelectItem>
                      <SelectItem value="2029">2029</SelectItem>
                      <SelectItem value="2030">2030</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-semibold">
                    Status
                  </Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger id="status" className="h-11">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="open">Open for Submission</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
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
                            : proposalTypesLoading
                              ? "Loading proposal types..."
                              : "Select proposal types..."}
                        </span>
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
                          <CommandEmpty>
                            {proposalTypesLoading
                              ? "Loading proposal types..."
                              : proposalTypesError
                                ? "Unable to load proposal types. Please sign in again or refresh."
                                : "No proposal type found."}
                          </CommandEmpty>
                          <CommandGroup>
                            {proposalTypes.map((type) => (
                              <CommandItem
                                key={type.id}
                                value={type.name}
                                onSelect={() => toggleType(type.id)}
                                className="cursor-pointer"
                              >
                                <div
                                  className={cn(
                                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary transition-colors",
                                    selectedTypes.includes(type.id)
                                      ? "bg-primary text-primary-foreground"
                                      : "opacity-50 [&_svg]:invisible",
                                  )}
                                >
                                  <Check className={cn("h-3 w-3")} />
                                </div>
                                <span>{type.name}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  {proposalTypesError && !proposalTypesLoading && (
                    <p className="text-xs text-destructive">
                      Proposal types could not be loaded. Your session may have
                      expired.
                    </p>
                  )}

                  {selectedTypes.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 bg-muted/20 rounded-xl border border-border/40 min-h-12.5">
                      {selectedTypes.map((val) => {
                        const type = proposalTypes.find((t) => t.id === val);
                        return (
                          <Badge
                            key={val}
                            variant="secondary"
                            className="bg-background hover:bg-background border-border/40 text-xs py-1 px-2 flex items-center gap-1 group"
                          >
                            {type?.name ?? val}
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

              <div className="space-y-2">
                <Label htmlFor="budget" className="text-sm font-semibold">
                  Budget (ETB) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="budget"
                  placeholder="e.g. 10000000"
                  className="h-11"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  type="number"
                />
                {errors?.error?.details?.budget && (
                  <p className="text-xs text-destructive mt-1">
                    {(errors.error.details.budget as string[]).join(" ")}
                  </p>
                )}
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
            <CardHeader>
              <CardTitle className="text-lg font-bold tracking-tight">
                Installment Plan
              </CardTitle>
              <CardDescription>
                Define payment breakdown for the grant call
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col gap-3">
                  {installments.map((it, idx) => {
                    const installmentErrors =
                      errors?.error?.details?.installmentPlans?.[idx] ?? null;
                    const percentageErrors =
                      installmentErrors?.percentage ?? null;
                    return (
                      <div key={it.id} className="flex items-center gap-3">
                        <div className="w-24">
                          <Label className="text-xs font-semibold">
                            Installment
                          </Label>
                          <Input value={idx + 1} readOnly className="h-10" />
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs font-semibold">
                            Percentage
                          </Label>
                          <Input
                            type="number"
                            value={String(it.percentage)}
                            onChange={(e) =>
                              updatePercentage(it.id, e.target.value)
                            }
                            className="h-10"
                          />
                          {percentageErrors && (
                            <p className="text-xs text-destructive mt-1">
                              {percentageErrors.join(" ")}
                            </p>
                          )}
                        </div>
                        <div className="w-28 shrink-0 flex items-center mt-3 ">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeInstallment(it.id)}
                          >
                            <Trash2 className="h-4 w-4 " />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Total: {totalPercentage}%
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addInstallment}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add Installment
                    </Button>
                  </div>
                </div>

                {errors?.error?.details?.installmentPlans && (
                  <div className="text-xs text-destructive">
                    Please fix the highlighted installment errors above.
                  </div>
                )}
              </div>
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
                      className="border-2 border-dashed border-border/60 rounded-xl p-8 flex flex-col items-center justify-center gap-3 hover:bg-muted/30 hover:border-primary/40 transition-all cursor-pointer group min-h-40 bg-muted/10"
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
                      className="border-2 border-dashed border-border/60 rounded-xl p-8 flex flex-col items-center justify-center gap-3 hover:bg-muted/30 hover:border-primary/40 transition-all cursor-pointer group min-h-40 bg-muted/10"
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
        </div>

        {/* Right Column - Status Panel */}
        <div>
          <Card className="xl:sticky xl:top-2 shadow-md border-primary/10 overflow-hidden bg-linear-to-b from-background to-muted/20 -py-6">
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
                  onClick={() => handleSubmit()}
                >
                  <Save className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  Save Draft
                </Button>
                <Button
                  className="w-full justify-start h-12 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all group font-black text-sm"
                  onClick={() => handlePublish()}
                >
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
