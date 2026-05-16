"use client";

import {
  RPProvider,
  RPDefaultLayout,
  RPPages
} from "@pdf-viewer/react";

import {
  Dialog,
  DialogContent
} from "@/components/ui/dialog";

interface PdfViewerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
}

export function PdfViewerDialog({
  isOpen,
  onOpenChange,
  url
}: PdfViewerDialogProps) {
  if (!url) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 overflow-hidden flex flex-col">
        <div className="flex-1 h-full w-full relative">
          <RPProvider src={url}>
            <RPDefaultLayout>
              <RPPages />
            </RPDefaultLayout>
          </RPProvider>
        </div>
      </DialogContent>
    </Dialog>
  );
}
