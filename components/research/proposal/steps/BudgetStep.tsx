"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileText, Upload, CheckCircle2, X, DollarSign } from "lucide-react";
import type { ProposalFormInput } from "@/lib/validators/proposal.schema";
import { cn } from "@/lib/utils";

export function ProposalBudgetStep() {
  const form = useFormContext<ProposalFormInput>();
  const fileValue = form.watch("budgetFile");
  const [isFileDragging, setIsFileDragging] = useState(false);

  // Check if fileValue is a File object or a metadata object from existing proposal
  const isFile = fileValue instanceof File;
  const isExistingFile = fileValue && !isFile && typeof fileValue === 'object' && 'file' in fileValue;
  const file = isFile ? fileValue : null;
  const existingFile = isExistingFile ? fileValue as { name?: string; file: string; id?: number } : null;

  return (
    <div className="space-y-6">
      {/* Budget Requested Amount */}
      <FormField
        control={form.control}
        name="budgetRequested"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2 text-foreground">
              {/* <DollarSign className="h-4 w-4 text-muted-foreground" /> */}
              Budget Requested(ETB) *
            </FormLabel>
            <FormControl>
              <div className="relative">
                {/* <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /> */}
                <Input
                  type="number"
                  placeholder="Enter budget amount"
                  step="0.01"
                  min="0"
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(
                      value === "" || isNaN(parseFloat(value))
                        ? undefined
                        : parseFloat(value)
                    );
                  }}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  className={cn(
                    fieldState.error &&
                    "border-destructive focus:border-destructive focus:ring-destructive"
                  )}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Budget File Upload */}
      <FormField
        control={form.control}
        name="budgetFile"
        render={({ field: { value, onChange, ...field } }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2 text-foreground">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Budget File
            </FormLabel>
            <FormControl>
              <div className="space-y-4">
                {!file && !existingFile ? (
                  <div
                    className={cn(
                      "relative border-2 border-dashed rounded-lg p-12 transition-all duration-200",
                      isFileDragging
                        ? "border-primary bg-primary/5 scale-[1.02]"
                        : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30",
                      "cursor-pointer group"
                    )}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsFileDragging(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsFileDragging(false);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsFileDragging(false);

                      const droppedFile = e.dataTransfer.files?.[0];
                      if (droppedFile) {
                        // Validate file type
                        const validTypes = [
                          "application/pdf",
                          "application/vnd.ms-excel",
                          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        ];
                        const validExtensions = [".pdf", ".xls", ".xlsx"];
                        const fileName = droppedFile.name.toLowerCase();
                        const isValidType =
                          validTypes.includes(droppedFile.type) ||
                          validExtensions.some((ext) => fileName.endsWith(ext));

                        if (isValidType) {
                          if (droppedFile.size <= 5 * 1024 * 1024) {
                            onChange(droppedFile);
                          } else {
                            form.setError("budgetFile", {
                              type: "manual",
                              message: "File size must be less than 5MB",
                            });
                          }
                        } else {
                          form.setError("budgetFile", {
                            type: "manual",
                            message: "Only PDF and Excel files are allowed",
                          });
                        }
                      }
                    }}
                    onClick={() => {
                      document
                        .getElementById("budget-file-upload-input")
                        ?.click();
                    }}
                  >
                    <input
                      id="budget-file-upload-input"
                      type="file"
                      accept=".pdf,.xls,.xlsx"
                      onChange={(e) => {
                        const selectedFile = e.target.files?.[0];
                        if (selectedFile) {
                          // Validate file type
                          const validTypes = [
                            "application/pdf",
                            "application/vnd.ms-excel",
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                          ];
                          const validExtensions = [".pdf", ".xls", ".xlsx"];
                          const fileName = selectedFile.name.toLowerCase();
                          const isValidType =
                            validTypes.includes(selectedFile.type) ||
                            validExtensions.some((ext) =>
                              fileName.endsWith(ext)
                            );

                          if (isValidType) {
                            if (selectedFile.size <= 5 * 1024 * 1024) {
                              onChange(selectedFile);
                            } else {
                              form.setError("budgetFile", {
                                type: "manual",
                                message: "File size must be less than 5MB",
                              });
                            }
                          } else {
                            form.setError("budgetFile", {
                              type: "manual",
                              message: "Only PDF and Excel files are allowed",
                            });
                          }
                        }
                      }}
                      {...field}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div
                        className={cn(
                          "rounded-full p-4 transition-colors",
                          isFileDragging
                            ? "bg-primary/10"
                            : "bg-muted group-hover:bg-primary/5"
                        )}
                      >
                        <Upload
                          className={cn(
                            "h-8 w-8 transition-colors",
                            isFileDragging
                              ? "text-primary"
                              : "text-muted-foreground group-hover:text-primary"
                          )}
                        />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-sm font-medium">
                          {isFileDragging
                            ? "Drop your file here"
                            : "Click to upload or drag and drop"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PDF or Excel document (max 5MB)
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border rounded-lg p-6 bg-card">
                    <div className="flex items-start gap-4">
                      <div className="shrink-0">
                        <div className="rounded-lg bg-primary/10 p-3">
                          <FileText className="h-8 w-8 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm truncate">
                            {file?.name || existingFile?.name || existingFile?.file.split("/").pop() || "Budget File"}
                          </p>
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        </div>
                        {file && (
                          <p className="text-xs text-muted-foreground mb-3">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        )}
                        {existingFile && (
                          <p className="text-xs text-muted-foreground mb-3">
                            Existing file
                          </p>
                        )}
                        <div className="flex gap-2">
                          {existingFile && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                window.open(existingFile.file, '_blank');
                              }}
                              className="text-primary hover:text-primary hover:bg-primary/10"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              View File
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              onChange(null);
                              form.setValue("budgetFile", undefined);
                            }}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <X className="h-4 w-4 mr-2" />
                            {existingFile ? "Remove" : "Remove File"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
