"use client";

import { FileText, Tag, Eye, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ConceptNoteOverviewProps {
  note: any;
  setViewingFile?: (file: any) => void;
}

export function ConceptNoteOverview({ note, setViewingFile }: ConceptNoteOverviewProps) {
  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-primary/10">
        <CardHeader className="border-b bg-muted/30 pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
            {note.background}
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-primary/10">
        <CardHeader className="border-b bg-muted/30 pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" /> Thematic Areas
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5 flex flex-wrap gap-2">
          {["Health Systems", "Digital Policy", "Education"].map((area) => (
            <Badge key={area} variant="secondary" className="px-3 py-1 text-sm">
              {area}
            </Badge>
          ))}
        </CardContent>
      </Card>

      <Card className="shadow-sm border-primary/10">
        <CardHeader className="border-b bg-muted/30 pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Supporting Files
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          {note.attachments && note.attachments.length > 0 ? (
            <div className="space-y-3">
              {note.attachments.map((file: any) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-sm font-medium truncate">
                        {file.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {setViewingFile && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-primary hover:text-primary hover:bg-primary/10 gap-2"
                        onClick={() => setViewingFile(file)}
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 gap-2"
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = file.url;
                        link.download = file.name;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-6 border border-dashed rounded-lg bg-muted/20">
              <p className="text-sm text-muted-foreground italic">
                No supporting files attached.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
