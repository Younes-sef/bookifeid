"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Upload, FileText, Image as ImageIcon, X } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import UploadProgressStepper, { INITIAL_STEPS, UploadStep } from "@/components/UploadProgressStepper";
import { cn } from "@/lib/utils";
import { UploadSchema } from "@/lib/zod";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { checkBookExists, uploadBook, saveBookSegments } from "@/lib/action/book.actions";
import { parsePDFFile } from "@/lib/utils";

type FormValues = z.infer<typeof UploadSchema>;


const maleVoices = [
  { id: "dave", name: "Dave", description: "Clear, warm professional" },
  { id: "daniel", name: "Daniel", description: "Deep, authoritative tone" },
  { id: "chris", name: "Chris", description: "Friendly, casual energy" },
];

const femaleVoices = [
  { id: "rachel", name: "Rachel", description: "Articulate, calm & precise" },
  { id: "sarah", name: "Sarah", description: "Bright, engaging narrator" },
];

export default function UploadForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  // uploadSteps drives the stepper UI — each step has a status, optional progress
  // percentage, and a detail string. We reset to INITIAL_STEPS at the start of
  // every submission so re-uploads always begin with all steps pending.
  const [uploadSteps, setUploadSteps] = useState<UploadStep[]>(INITIAL_STEPS);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { userId } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(UploadSchema),
    defaultValues: {
      title: "",
      author: "",
      persona: "",
    },
  });

  // ── Helper: update a single step by id ──────────────────────────────────────
  // Instead of replacing the whole array, we map over it and only touch the one
  // step that changed. This keeps React re-renders minimal and ensures the other
  // steps keep their current status (done, pending, etc.) unchanged.
  const setStep = (id: string, updates: Partial<UploadStep>) => {
    setUploadSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const onSubmit = async (data: FormValues) => {
    if (!userId) {
      toast.error("You must be logged in to upload a book.");
      return;
    }

    try {
      // ── Pre-flight check (before showing the stepper overlay) ────────────────
      // We check for duplicates FIRST, before setting isSubmitting=true, so the
      // stepper overlay doesn't flash open just to immediately close with an error.
      const existsCheck = await checkBookExists(data.title);
      if (existsCheck.exists) {
        toast.error("A book with this title already exists.");
        return;
      }

      // Reset all steps to their initial pending state, then show the overlay.
      setUploadSteps(INITIAL_STEPS.map((s) => ({ ...s, status: "pending", progress: 0, detail: "" })));
      setIsSubmitting(true);

      // ── Step 1: Parse PDF ────────────────────────────────────────────────────
      // parsePDFFile runs entirely in the browser (pdfjs-dist). It reads the File
      // object, walks through each page, and returns an array of TextSegment objects.
      // We mark this step active first, await the result, then mark it done.
      setStep("parse", { status: "active", detail: "Scanning pages..." });
      const parsedData = await parsePDFFile(data.pdfFile);
      setStep("parse", {
        status: "done",
        detail: `${parsedData.content.length} segments extracted`,
      });

      // ── Step 2: Upload Files ─────────────────────────────────────────────────
      // Build the FormData payload, then call the uploadBook server action which
      // puts the PDF and cover in Vercel Blob and saves the Book doc to MongoDB.
      setStep("upload", { status: "active", detail: "Uploading to cloud storage..." });

      const formData = new FormData();
      formData.append("file", data.pdfFile);
      formData.append("title", data.title);
      formData.append("author", data.author);
      formData.append("persona", data.persona);
      formData.append("clerkId", userId);
      formData.append("fileSize", data.pdfFile.size.toString());

      if (data.coverImage) {
        formData.append("coverImage", data.coverImage);
      } else if (parsedData.cover) {
        const res = await fetch(parsedData.cover);
        const blob = await res.blob();
        formData.append("coverImage", blob, "cover.png");
      }

      const uploadRes = await uploadBook(formData);
      if (!uploadRes.success || !uploadRes.book) {
        setStep("upload", { status: "error", detail: uploadRes.error || "Upload failed" });
        throw new Error(uploadRes.error || "Upload failed");
      }
      setStep("upload", { status: "done", detail: "Files stored successfully" });

      // ── Step 3: Save Segments ────────────────────────────────────────────────
      // Segments are saved in chunks of 100 to avoid hitting Next.js payload limits.
      // Because we know the total count and we loop, we can compute a real progress
      // percentage after each chunk — this is the one step with a determinate bar.
      setStep("segments", { status: "active", detail: "Preparing..." });

      const chunkSize = 100;
      const total = parsedData.content.length;

      for (let i = 0; i < total; i += chunkSize) {
        await saveBookSegments(
          uploadRes.book._id,
          userId,
          parsedData.content.slice(i, i + chunkSize)
        );
        // After each chunk, calculate how many segments have been processed
        // and convert to a 0–100 integer for the progress bar.
        const processed = Math.min(i + chunkSize, total);
        const pct = Math.round((processed / total) * 100);
        setStep("segments", {
          progress: pct,
          detail: `Saved ${processed} of ${total} segments`,
        });
      }
      setStep("segments", { status: "done", progress: 100, detail: `${total} segments saved` });

      // ── Step 4: Generate Embeddings ──────────────────────────────────────────
      // This runs on the server (server action). We have no per-segment callbacks
      // from the server, so we show an indeterminate shimmer (progress stays 0).
      // The server action processes segments sequentially with a 200ms delay each
      // to avoid Gemini rate limits — for a 300-segment book this takes ~60 s.
      setStep("embed", { status: "active", detail: "Training AI on your book content..." });

      const { generateEmbeddingsForBook } = await import("@/lib/action/embeddings.actions");
      const embedRes = await generateEmbeddingsForBook(uploadRes.book._id);

      if (!embedRes.success) {
        setStep("embed", { status: "error", detail: "Some embeddings failed" });
        toast.warning("Book uploaded, but AI embeddings had some issues.");
      } else {
        setStep("embed", { status: "done", progress: 100, detail: "AI brain is ready!" });
      }

      // Brief pause so the user can see the completed state before navigating away
      await new Promise((resolve) => setTimeout(resolve, 900));
      router.push(`/books/${uploadRes.book.slug}`);

    } catch (error) {
      console.error("Submission error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to synthesize book. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      form.setValue("pdfFile", e.target.files[0], { shouldValidate: true });
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      form.setValue("coverImage", e.target.files[0], { shouldValidate: true });
    }
  };

  const removePdf = () => {
    form.setValue("pdfFile", undefined as any, { shouldValidate: true });
    if (pdfInputRef.current) pdfInputRef.current.value = "";
  };

  const removeCover = () => {
    form.setValue("coverImage", undefined, { shouldValidate: true });
    if (coverInputRef.current) coverInputRef.current.value = "";
  };

  const pdfFile = form.watch("pdfFile");
  const coverImage = form.watch("coverImage");
  const selectedPersona = form.watch("persona");

  return (
    <div className="new-book-wrapper">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 text-left">
          {/* PDF File Upload */}
          <FormField
            control={form.control}
            name="pdfFile"
            render={() => (
              <FormItem>
                <FormLabel className="form-label">Upload Book PDF</FormLabel>
                <FormControl>
                  <div
                    className={cn(
                      "upload-dropzone border-2 border-dashed border-[var(--border-medium)]",
                      pdfFile ? "upload-dropzone-uploaded" : ""
                    )}
                    onClick={() => !pdfFile && pdfInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      ref={pdfInputRef}
                      onChange={handlePdfChange}
                    />
                    {pdfFile ? (
                      <div className="flex flex-col items-center">
                        <FileText className="upload-dropzone-icon text-[#663820] w-12 h-12 mb-2" />
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#663820]">
                            {pdfFile.name}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removePdf();
                            }}
                            className="upload-dropzone-remove"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        <span className="upload-dropzone-hint mt-2">
                          Click to change file
                        </span>
                      </div>
                    ) : (
                      <>
                        <Upload className="upload-dropzone-icon" />
                        <p className="upload-dropzone-text">
                          Click to upload PDF
                        </p>
                        <p className="upload-dropzone-hint">
                          PDF file (max 50MB)
                        </p>
                      </>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Title Input */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="form-label">Title</FormLabel>
                <FormControl>
                  <Input
                    placeholder="ex: Rich Dad Poor Dad"
                    className="form-input"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Author Input */}
          <FormField
            control={form.control}
            name="author"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="form-label">Author Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="ex: Robert Kiyosaki"
                    className="form-input"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Voice Selector */}
          <FormField
            control={form.control}
            name="persona"
            render={() => (
              <FormItem>
                <FormLabel className="form-label">
                  Choose Assistant Voice
                </FormLabel>
                <FormControl>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                        Male Voices
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {maleVoices.map((voice) => (
                          <div
                            key={voice.id}
                            className={cn(
                              "voice-selector-option flex-col text-center !p-4",
                              selectedPersona === voice.id
                                ? "voice-selector-option-selected"
                                : "voice-selector-option-default"
                            )}
                            onClick={() => form.setValue("persona", voice.id, { shouldValidate: true })}
                          >
                            <span className="font-bold text-lg">{voice.name}</span>
                            <span className="text-sm text-muted-foreground mt-1">
                              {voice.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                        Female Voices
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {femaleVoices.map((voice) => (
                          <div
                            key={voice.id}
                            className={cn(
                              "voice-selector-option flex-col text-center !p-4",
                              selectedPersona === voice.id
                                ? "voice-selector-option-selected"
                                : "voice-selector-option-default"
                            )}
                            onClick={() => form.setValue("persona", voice.id, { shouldValidate: true })}
                          >
                            <span className="font-bold text-lg">{voice.name}</span>
                            <span className="text-sm text-muted-foreground mt-1">
                              {voice.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Cover Image Upload */}
          <FormField
            control={form.control}
            name="coverImage"
            render={() => (
              <FormItem>
                <FormLabel className="form-label">
                  Upload Book Cover Image
                </FormLabel>
                <FormControl>
                  <div
                    className={cn(
                      "upload-dropzone border-2 border-dashed border-[var(--border-medium)]",
                      coverImage ? "upload-dropzone-uploaded" : ""
                    )}
                    onClick={() => !coverImage && coverInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={coverInputRef}
                      onChange={handleCoverChange}
                    />
                    {coverImage ? (
                      <div className="flex flex-col items-center">
                        <ImageIcon className="upload-dropzone-icon text-[#663820] w-12 h-12 mb-2" />
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#663820]">
                            {coverImage.name}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeCover();
                            }}
                            className="upload-dropzone-remove"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        <span className="upload-dropzone-hint mt-2">
                          Click to change image
                        </span>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="upload-dropzone-icon" />
                        <p className="upload-dropzone-text">
                          Click to upload cover image
                        </p>
                        <p className="upload-dropzone-hint">
                          Leave empty to auto-generate from PDF
                        </p>
                      </>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <button type="submit" className="form-btn w-full">
            Begin Synthesis
          </button>
        </form>
      </Form>

      <UploadProgressStepper isVisible={isSubmitting} steps={uploadSteps} />
    </div>
  );
}
