"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";

interface SignaturePadProps {
  onSave: (file: File) => void;
  onClear?: () => void;
  initialImageUrl?: string;
  disabled?: boolean;
}

export default function SignaturePad({
  onSave,
  onClear,
  initialImageUrl,
  disabled = false,
}: SignaturePadProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const sigCanvasRef = useRef<SignatureCanvas | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(10);

  const autoSave = useCallback(() => {
    if (!sigCanvasRef.current || sigCanvasRef.current.isEmpty()) return;

    const canvas = sigCanvasRef.current.getTrimmedCanvas();

    canvas.toBlob((blob) => {
      if (!blob) return;

      const file = new File([blob], "signature.png", {
        type: "image/png",
      });

      onSave(file);
    }, "image/png");
  }, [onSave]);

  const handleStrokeEnd = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      autoSave();
    }, 800);
  }, [autoSave]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    const updateWidth = () => {
      if (!wrapperRef.current) return;

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

  useEffect(() => {
    if (!initialImageUrl || !sigCanvasRef.current) return;

    const canvas = sigCanvasRef.current.getCanvas();
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const image = new Image();
    image.crossOrigin = "anonymous";
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
    image.src = initialImageUrl;
  }, [initialImageUrl]);

  const handleClear = () => {
    sigCanvasRef.current?.clear();
    onClear?.();
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
          onEnd={handleStrokeEnd}
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
      </div>
    </div>
  );
}
