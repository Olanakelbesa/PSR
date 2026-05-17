"use client";

import { useEffect, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SignaturePadProps {
  onSave: (file: File) => void;
  onClear?: () => void;
  disabled?: boolean;
}

export default function SignaturePad({
  onSave,
  onClear,
  disabled = false,
}: SignaturePadProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const sigCanvasRef = useRef<SignatureCanvas | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(10);

  useEffect(() => {
    const updateWidth = () => {
      if (!wrapperRef.current) return;

      // Preserve the drawing when the canvas resizes.
      const currentDataUrl =
        sigCanvasRef.current && !sigCanvasRef.current.isEmpty()
          ? sigCanvasRef.current.getTrimmedCanvas().toDataURL("image/png")
          : null;

      const nextWidth = Math.max(
        320,
        Math.floor(wrapperRef.current.clientWidth),
      );
      setCanvasWidth(nextWidth);

      if (currentDataUrl) {
        window.requestAnimationFrame(() => {
          const canvas = sigCanvasRef.current?.getCanvas();
          const ctx = canvas?.getContext("2d");
          if (!canvas || !ctx) return;

          const image = new Image();
          image.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const ratio = Math.min(
              canvas.width / image.width,
              canvas.height / image.height,
            );
            const width = image.width * ratio;
            const height = image.height * ratio;
            const x = (canvas.width - width) / 2;
            const y = (canvas.height - height) / 2;
            ctx.drawImage(image, x, y, width, height);
          };
          image.src = currentDataUrl;
        });
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const handleClear = () => {
    sigCanvasRef.current?.clear();
    onClear?.();
  };

  const handleSave = () => {
    if (!sigCanvasRef.current || sigCanvasRef.current.isEmpty()) {
      toast.error("Please provide a signature");
      return;
    }

    const canvas = sigCanvasRef.current.getTrimmedCanvas();

    canvas.toBlob((blob) => {
      if (!blob) {
        toast.error("Unable to save signature");
        return;
      }

      const file = new File([blob], "signature.png", {
        type: "image/png",
      });

      onSave(file);
      toast.success("Signature saved");
    }, "image/png");
  };

  return (
    <div className="space-y-3">
      <div
        ref={wrapperRef}
        className="border rounded-xl overflow-hidden bg-white "
      >
        <SignatureCanvas
          ref={sigCanvasRef}
          penColor="black"
          canvasProps={{
            width: canvasWidth,
            height: 220,
            className: "w-full touch-none ",
          }}
        />
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleClear}
          disabled={disabled}
        >
          Clear
        </Button>

        <Button type="button" onClick={handleSave} disabled={disabled}>
          Save Signature
        </Button>
      </div>
    </div>
  );
}
