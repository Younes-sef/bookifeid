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
import LoadingOverlay from "@/components/LoadingOverlay";
import { cn } from "@/lib/utils";
import { UploadSchema } from "@/lib/zod";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";

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
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(UploadSchema),
    defaultValues: {
      title: "",
      author: "",
      persona: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    

    setIsSubmitting(true);
    // Simulate submission
    setTimeout(() => {
      setIsSubmitting(false);
      console.log("Submitted:", data);
    }, 3000);
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

      <LoadingOverlay isVisible={isSubmitting} />
    </div>
  );
}
