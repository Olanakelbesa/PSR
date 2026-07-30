"use client";

import React from "react";
import { PageContainer } from "./page-container";
import { cn } from "@/lib/utils";

export interface DetailLayoutProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  className?: string;
}

export function DetailLayout({
  title,
  description,
  actions,
  children,
  sidebar,
  className,
}: DetailLayoutProps) {
  return (
    <PageContainer title={title} description={description} actions={actions}>
      <div
        className={cn(
          "grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]",
          className,
        )}
      >
        <div className="space-y-6 min-w-0">{children}</div>
        {sidebar ? <aside className="space-y-6">{sidebar}</aside> : null}
      </div>
    </PageContainer>
  );
}
