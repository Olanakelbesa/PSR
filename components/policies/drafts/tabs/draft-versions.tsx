"use client";

import { FileText, User, Calendar, Eye, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DraftVersionsProps {
  versionHistory: any[];
}

export function DraftVersions({ versionHistory }: DraftVersionsProps) {
  return (
    <div className="grid gap-6">
      {versionHistory?.map((v: any, index: number) => (
        <Card key={v.version} className={cn(
          "shadow-sm border-primary/10 overflow-hidden relative group",
          v.status === "current" ? "border-primary/30 bg-primary/[0.02]" : "bg-card"
        )}>
          {v.status === "current" && (
            <div className="absolute top-0 right-0">
              <div className="bg-primary text-primary-foreground text-[10px] font-semibold px-3 py-1 rounded-bl-lg shadow-sm">
                Latest Version
              </div>
            </div>
          )}
          
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-5 flex-1">
                <div className={cn(
                  "h-14 w-14 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                  v.status === "current" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  <FileText className="h-7 w-7" />
                </div>
                <div className="space-y-3 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-bold text-foreground">Draft Document {v.version}</h3>
                    <Badge variant="outline" className="font-mono text-[10px] bg-background">
                      {v.size}
                    </Badge>
                    {v.status === "archived" && (
                      <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider">
                        Archived
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                    {v.description}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-6 pt-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                      <User className="h-3.5 w-3.5" />
                      <span>Uploaded by {v.author.firstName} {v.author.lastName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{new Date(v.date).toLocaleDateString("en-US", { 
                        month: "short", 
                        day: "numeric", 
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 md:border-l md:pl-6 border-muted/60">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    asChild={!!v.file} 
                    disabled={!v.file} 
                    className="h-10 px-4 font-semibold text-xs gap-2 border-primary/20 hover:bg-primary/5"
                  >
                    {v.file ? (
                      <a href={v.file} target="_blank" rel="noopener noreferrer">
                        <Eye className="h-4 w-4" />
                        View
                      </a>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        View
                      </span>
                    )}
                  </Button>
                  <Button 
                    size="sm" 
                    asChild={!!v.file} 
                    disabled={!v.file} 
                    className="h-10 px-4 font-semibold text-xs gap-2"
                  >
                    {v.file ? (
                      <a href={v.file} download target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4" />
                        Download
                      </a>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Download
                      </span>
                    )}
                  </Button>
              </div>
            </div>
          </CardContent>
          
          {index < versionHistory.length - 1 && (
            <div className="absolute bottom-0 left-12 w-px h-10 bg-gradient-to-b from-transparent to-muted-foreground/20 translate-y-full" />
          )}
        </Card>
      ))}
    </div>
  );
}
