"use client";

import { Loader2 } from "lucide-react";

interface LoadingOverlayProps {
  isVisible: boolean;
  title?: string;
  progressText?: string;
}

export default function LoadingOverlay({ isVisible, title = "Synthesizing...", progressText = "This might take a moment" }: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="loading-wrapper">
      <div className="loading-shadow-wrapper bg-white shadow-soft-lg">
        <div className="loading-shadow">
          <Loader2 className="loading-animation w-12 h-12 text-brand" />
          <div className="text-center">
            <h3 className="loading-title">{title}</h3>
            <p className="text-muted-foreground mt-2">{progressText}</p>
          </div>
          <div className="loading-progress">
            <div className="loading-progress-item">
              <span className="loading-progress-status"></span>
              <span>Processing content</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
