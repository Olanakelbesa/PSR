"use client";

import { useState, useEffect } from "react";
import dynamicImport from "next/dynamic";
import { motion } from "framer-motion";
import { Footer } from "@/components/landing/Footer";
import {
  Download,
  ZoomIn,
  ZoomOut,
  BookOpen,
  ArrowUp,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

// Dynamically import react-pdf with SSR disabled to prevent DOMMatrix error
const Document = dynamicImport(
  () => import("react-pdf").then((mod) => mod.Document),
  { ssr: false },
);

const Page = dynamicImport(() => import("react-pdf").then((mod) => mod.Page), {
  ssr: false,
});

// Prevent prerendering - react-pdf requires browser APIs like DOMMatrix
export const dynamic = "force-dynamic";

export default function ManualsPage() {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [error, setError] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Configure PDF.js worker on client-side using jsdelivr CDN (more reliable with Turbopack)
  useEffect(() => {
    import("react-pdf").then((mod) => {
      mod.pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${mod.pdfjs.version}/build/pdf.worker.min.mjs`;
    });

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setError(null);
  }

  function onDocumentLoadError(err: Error) {
    console.error("Error loading PDF:", err);
    setError("Failed to load PDF. Please verify the file exists.");
  }

  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 3.0));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="grow w-full">
        {/* Hero Section */}
        <section className="relative w-full h-[450px] md:h-[550px] overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 dark:from-gray-950/95 dark:via-gray-900/90 dark:to-gray-950/95 z-10"></div>

          {/* Animated Background Blobs */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <motion.div
              className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-primary/20 dark:bg-primary/30 rounded-full blur-3xl"
              animate={{
                x: [0, 50, 0],
                y: [0, -30, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            ></motion.div>
            <motion.div
              className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-accent/20 dark:bg-accent/30 rounded-full blur-3xl"
              animate={{
                x: [0, -40, 0],
                y: [0, 40, 0],
                scale: [1, 1.15, 1],
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2,
              }}
            ></motion.div>
          </div>

          <Image
            alt="University library interior"
            className="absolute inset-0 w-full h-full object-cover grayscale opacity-30 dark:opacity-20 z-0"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAtgWFKZBVsEOSRkoLY3wofXYPogSclpr4XJi_LJd4PJKJajUAhkbVLRP1ISrqfT4tUXl-VLa50fsXGE2aKsaBeVv7f82AUHXQzkQHDjvtQH2Q6FwxeuRy6d-jJogv8paV9H9Pcs4tXNqv2197HzLN92bnLTlflxCOwN2DCkP04vt-Ph5FWxE3KMjI_jG1TqPDNICU0pV17idJVpcuGTezwgwxxEPEg6JhHdrD_1_cmREbRKPA5ZDE35bTvpZ3P4K59XlJorLRdpgo"
            width={1920}
            height={1080}
          />

          <div className="relative z-20 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-accent/20 text-secondary dark:text-secondary text-sm font-medium mb-6"
            >
              <BookOpen className="w-4 h-4" />
              Resource Center
            </motion.div>

            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <span className="text-accent">User Manuals & Guides</span>
            </motion.h1>

            <motion.p
              className="max-w-2xl text-lg text-slate-300 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Comprehensive resources and step-by-step guides for using the
              research portal. Master all features with our detailed
              documentation.
            </motion.p>
          </div>
        </section>

        {/* PDF Viewer Section */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            {/* PDF Controls */}
            <div className="flex flex-wrap items-center justify-between p-6 border-b border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Portal Documentation
                </h2>
              </div>

              <div className="flex items-center gap-3 mt-4 sm:mt-0">
                <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 p-1">
                  <Button
                    onClick={zoomOut}
                    variant="ghost"
                    size="icon"
                    disabled={scale <= 0.5}
                    className="h-9 w-9 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300 min-w-14 text-center">
                    {Math.round(scale * 100)}%
                  </span>
                  <Button
                    onClick={zoomIn}
                    variant="ghost"
                    size="icon"
                    disabled={scale >= 3.0}
                    className="h-9 w-9 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </div>

                <Button
                  asChild
                  className="bg-primary hover:bg-primary/90 text-white rounded-lg shadow-md transition-all active:scale-95"
                >
                  <a href="/manualpi.pdf" download>
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </a>
                </Button>
              </div>
            </div>

            {/* PDF Viewer - Scrollable */}
            <div
              className="overflow-y-auto bg-slate-100 dark:bg-gray-950 p-6 md:p-10"
              style={{ maxHeight: "calc(100vh - 300px)", minHeight: "600px" }}
            >
              {error ? (
                <div className="flex flex-col items-center justify-center h-[500px] text-red-500 space-y-4">
                  <div className="p-4 rounded-full bg-red-50 dark:bg-red-900/20">
                    <AlertTriangle className="w-12 h-12" />
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold">Failed to load PDF</p>
                    <p className="text-slate-600 dark:text-slate-400 max-w-md mt-2">
                      {error}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                  >
                    Try Again
                  </Button>
                </div>
              ) : (
                <Document
                  file="/manualpi.pdf"
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading={
                    <div className="flex flex-col items-center justify-center h-[500px] space-y-4">
                      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                      <div className="text-slate-500 dark:text-slate-400 font-medium">
                        Preparing document...
                      </div>
                    </div>
                  }
                  error={
                    <div className="flex flex-col items-center justify-center h-[500px] text-red-500 space-y-4">
                      <div className="p-4 rounded-full bg-red-50 dark:bg-red-900/20">
                        <AlertTriangle className="w-12 h-12" />
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold">Failed to load PDF</p>
                        <p className="text-slate-600 dark:text-slate-400 mt-2">
                          Please check the browser console for details
                        </p>
                      </div>
                    </div>
                  }
                >
                  <div className="flex flex-col items-center gap-8">
                    {Array.from(new Array(numPages), (el, index) => (
                      <motion.div
                        key={`page_container_${index + 1}`}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: index * 0.05 }}
                        className="shadow-2xl rounded-lg overflow-hidden border border-slate-200 dark:border-gray-800"
                      >
                        <Page
                          key={`page_${index + 1}`}
                          pageNumber={index + 1}
                          scale={scale}
                          renderTextLayer={false}
                          renderAnnotationLayer={false}
                        />
                      </motion.div>
                    ))}
                  </div>
                </Document>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Scroll to top */}
      {showScrollTop && (
        <motion.button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 p-3 rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 transition z-50"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ArrowUp className="w-5 h-5" />
        </motion.button>
      )}
    </div>
  );
}
