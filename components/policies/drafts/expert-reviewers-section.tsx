"use client";

import { useState, useMemo } from "react";
import { ChevronDown, CheckCircle2, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar as AvatarUI, AvatarFallback as AvatarFallbackUI } from "@/components/ui/avatar";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface Reviewer {
  id: string;
  version: string;
  isLatestVersion?: boolean;
  versionOrder?: number;
  reviewer: {
    id: string;
    firstName: string;
    lastName: string;
    position: string;
    institution?: string;
  };
  status: "completed" | "pending";
  score: number | null;
  comments?: string;
  decision?: string;
  createdAt?: string;
  checklist?: any[];
  isPSRManager?: boolean;
}

interface ExpertReviewersSectionProps {
  reviews: Reviewer[];
  totalCount?: number;
}

export function ExpertReviewersSection({ reviews, totalCount }: ExpertReviewersSectionProps) {
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());

  const expertReviews = useMemo(() => {
    return (reviews || []).filter((rev) => !rev.isPSRManager);
  }, [reviews]);

  const groupedReviewsByVersion = useMemo(() => {
    if (!expertReviews || expertReviews.length === 0) return [];

    // Group reviews by version
    const grouped: Record<string, Reviewer[]> = {};
    expertReviews.forEach((rev) => {
      const version = rev.version || "v1.0.0";
      if (!grouped[version]) {
        grouped[version] = [];
      }
      grouped[version].push(rev);
    });

    // Sort versions in descending order (latest first)
    const sortedVersions = Object.keys(grouped).sort((a, b) => {
      const aNum = parseFloat(a.replace(/[^0-9.]/g, ""));
      const bNum = parseFloat(b.replace(/[^0-9.]/g, ""));
      return bNum - aNum;
    });

    return sortedVersions.map((version) => {
      const versionReviews = grouped[version];
      // Only calculate average from completed/graded reviews
      const completedReviews = versionReviews.filter((rev) => rev.status === "completed" && rev.score !== null);
      const averageScore = completedReviews.length > 0
        ? Math.round(completedReviews.reduce((sum: number, rev) => sum + (rev.score || 0), 0) / completedReviews.length)
        : null;

      return {
        version,
        reviews: versionReviews,
        isLatest: versionReviews.some((rev) => rev.isLatestVersion),
        averageScore,
        completedCount: completedReviews.length,
        pendingCount: versionReviews.filter((rev) => rev.status === "pending").length,
      };
    });
  }, [reviews]);

  // Auto-expand latest version on load
  useMemo(() => {
    if (groupedReviewsByVersion.length > 0 && expandedVersions.size === 0) {
      const latestVersion = groupedReviewsByVersion[0]?.version;
      if (latestVersion) {
        setExpandedVersions(new Set([latestVersion]));
      }
    }
  }, [groupedReviewsByVersion, expandedVersions.size]);

  const handleVersionToggle = (version: string, isOpen: boolean) => {
    const newExpanded = new Set<string>();
    if (isOpen) {
      newExpanded.add(version);
    }
    setExpandedVersions(newExpanded);
  };

  return (
    <Card className="shadow-sm border-primary/10">
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="text-sm sm:text-base flex items-center justify-between gap-2">
          <span className="truncate">Expert Reviewers</span>{" "}
          <Badge variant="secondary" className="font-normal text-xs sm:text-sm flex-shrink-0">
            {/* {totalCount ?? expertReviews.length} */}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-3">
        {expertReviews.length === 0 ? (
          <div className="text-center py-3 sm:py-4 border border-dashed rounded-lg">
            <p className="text-xs sm:text-sm text-muted-foreground italic">
              No experts assigned yet.
            </p>
          </div>
        ) : (
          groupedReviewsByVersion.map((versionGroup) => (
            <Collapsible
              key={versionGroup.version}
              open={expandedVersions.has(versionGroup.version)}
              onOpenChange={(isOpen) => handleVersionToggle(versionGroup.version, isOpen)}
            >
              <CollapsibleTrigger asChild>
                <button className="w-full text-left hover:bg-muted/70 transition-colors p-2.5 sm:p-3 rounded-lg border border-primary/10 bg-muted/50">
                  <div className="flex items-center justify-between gap-2 sm:gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-muted-foreground transition-transform flex-shrink-0",
                          expandedVersions.has(versionGroup.version) && "rotate-180"
                        )}
                      />
                      <span className="font-semibold text-sm truncate">{versionGroup.version}</span>
                      {versionGroup.isLatest && (
                        <Badge variant="default" className="text-[9px] sm:text-[10px] bg-blue-600 flex-shrink-0 whitespace-nowrap">
                          Latest
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 sm:gap-3 flex-shrink-0">
                      <div className="text-right sm:text-left text-xs text-muted-foreground leading-tight">
                        <div className="whitespace-nowrap">{versionGroup.reviews.length} reviewer{versionGroup.reviews.length !== 1 ? "s" : ""}</div>
                        {versionGroup.pendingCount > 0 && (
                          <div className="text-orange-600 font-medium whitespace-nowrap">{versionGroup.pendingCount} pending</div>
                        )}
                      </div>
                      {versionGroup.averageScore !== null && versionGroup.completedCount > 0 && (
                        <div className="text-sm font-semibold whitespace-nowrap">
                          Avg: <span className={versionGroup.averageScore >= 75 ? "text-green-600" : "text-orange-600"}>{versionGroup.averageScore}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-1.5 sm:pt-2 space-y-1.5 sm:space-y-2">
                {versionGroup.reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="flex flex-col xs:flex-row xs:items-center justify-between gap-1.5 xs:gap-2 sm:gap-3 p-1.5 xs:p-2 sm:p-3 bg-muted/30 rounded-lg border border-primary/5"
                  >
                    <div className="flex items-start xs:items-center gap-1.5 xs:gap-2 sm:gap-3 flex-1">
                      <AvatarUI className="h-7 xs:h-8 w-7 xs:w-8 flex-shrink-0">
                        <AvatarFallbackUI className="text-[9px] xs:text-[10px] bg-primary/10 text-primary">
                          {rev.reviewer.firstName[0]}
                          {rev.reviewer.lastName[0]}
                        </AvatarFallbackUI>
                      </AvatarUI>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-xs xs:text-sm font-medium truncate">
                          {rev.reviewer.firstName} {rev.reviewer.lastName}
                        </span>
                        <span className="text-[9px] xs:text-[10px] text-muted-foreground uppercase flex items-center gap-0.5">
                          {rev.status === "completed" ? (
                            <>
                              <CheckCircle2 className="h-2.5 w-2.5 xs:h-3 xs:w-3 text-green-500 flex-shrink-0" />{" "}
                              Graded
                            </>
                          ) : (
                            <>
                              <Clock className="h-2.5 w-2.5 xs:h-3 xs:w-3 text-orange-400 flex-shrink-0" />{" "}
                              Pending
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                    {rev.score !== null && (
                      <Badge
                        className={cn(
                          "font-mono font-bold text-white text-[10px] xs:text-xs self-start xs:self-center flex-shrink-0 px-1.5 xs:px-2",
                          rev.score >= 75 ? "bg-green-600 hover:bg-green-600" : "bg-orange-500 hover:bg-orange-50"
                        )}
                      >
                        {rev.score}%
                      </Badge>
                    )}
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))
        )}
      </CardContent>
    </Card>
  );
}
