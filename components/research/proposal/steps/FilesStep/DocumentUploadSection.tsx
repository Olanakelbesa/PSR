"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FileText, Upload, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProposalFormInput } from "@/lib/validators/proposal.schema";

export function DocumentUploadSection() {
  const form = useFormContext<ProposalFormInput>();
  const fileValue = form.watch("technicalProposal");
  const [isFileDragging, setIsFileDragging] = useState(false);

  const isFile = fileValue instanceof File;
  const uploadedFile = isFile ? fileValue : null;
  const existingFile =
    !isFile && fileValue && typeof fileValue === "object" && "file" in fileValue
      ? (fileValue as { name?: string; file: string; id?: number })
      : null;

  return (
    <div className="flex-1">
      <div className="w-full space-y-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">Document Upload</h2>
          <p className="text-sm text-muted-foreground">
            Upload your complete proposal document (PDF, max
            10MB)
          </p>
        </div>
        <FormField
          control={form.control}
          name="technicalProposal"
          render={({ field: { value, onChange, ...field } }) => (
            <FormItem>
              <FormControl>
                <div className="space-y-4">
                  {!uploadedFile && !existingFile ? (
                    <div
                      className={cn(
                        "relative border-2 border-dashed rounded-lg p-12 transition-all duration-200",
                        isFileDragging
                          ? "border-primary bg-primary/5 scale-[1.02]"
                          : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30",
                        "cursor-pointer group",
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
                            "application/msword",
                            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                          ];
                          const validExtensions = [".pdf", ".doc", ".docx"];
                          const fileName = droppedFile.name.toLowerCase();
                          const isValidType =
                            validTypes.includes(droppedFile.type) ||
                            validExtensions.some((ext) =>
                              fileName.endsWith(ext),
                            );

                          if (isValidType) {
                            if (droppedFile.size <= 10 * 1024 * 1024) {
                              onChange(droppedFile);
                            } else {
                              form.setError("technicalProposal", {
                                type: "manual",
                                message: "File size must be less than 10MB",
                              });
                            }
                          } else {
                            form.setError("technicalProposal", {
                              type: "manual",
                              message:
                                "Only PDF documents are allowed",
                            });
                          }
                        }
                      }}
                      onClick={() => {
                        document.getElementById("file-upload-input")?.click();
                      }}
                    >
                      <input
                        id="file-upload-input"
                        type="file"
                        accept=".pdf"
                        onChange={(e) => {
                          const selectedFile = e.target.files?.[0];
                          if (selectedFile) {
                            onChange(selectedFile);
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
                              : "bg-muted group-hover:bg-primary/5",
                          )}
                        >
                          <Upload
                            className={cn(
                              "h-8 w-8 transition-colors",
                              isFileDragging
                                ? "text-primary"
                                : "text-muted-foreground group-hover:text-primary",
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
                            PDF document (max 10MB)
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
                        <div className="flex justify-between items-center min-w-0 w-full">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-sm truncate">
                                {uploadedFile?.name || existingFile?.name || existingFile?.file.split("/").pop() || "File"}
                              </p>
                              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                            </div>
                            {uploadedFile ? (
                              <p className="text-xs text-muted-foreground mb-3">
                                {((uploadedFile.size || 0) / 1024 / 1024).toFixed(2)} MB
                              </p>
                            ) : existingFile ? (
                              <p className="text-xs text-muted-foreground mb-3">
                                Existing file
                              </p>
                            ) : null}
                          </div>
                          <div className="flex gap-2">
                            {existingFile && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  window.open(existingFile.file, "_blank");
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
                                form.setValue("technicalProposal", undefined);
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
    </div>
  );
}
