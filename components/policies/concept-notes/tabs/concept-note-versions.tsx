"use client";

import { GitBranch, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ConceptNoteVersionsProps {
  note: any;
}

export function ConceptNoteVersions({ note }: ConceptNoteVersionsProps) {
  return (
    <Card className="shadow-sm border-primary/10">
      <CardHeader className="border-b bg-muted/30 pb-4">
        <CardTitle className="text-base">Version History</CardTitle>
      </CardHeader>
      <CardContent className="p-0 divide-y">
        <div className="p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/5 rounded-md">
              <GitBranch className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold font-mono">
                  v1.0.0
                </p>
                <Badge className="text-[10px] bg-primary">
                  Current
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Initial submission of concept note.
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(note.createdAt).toLocaleDateString()} ·{" "}
                {note.createdBy.firstName}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-3 w-3 mr-1" /> Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
