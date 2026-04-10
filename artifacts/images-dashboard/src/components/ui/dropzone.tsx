import React, { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { UploadCloud } from "lucide-react";

interface DropzoneProps {
  onDrop: (file: File) => void;
  className?: string;
  accept?: string;
}

export function Dropzone({ onDrop, className, accept = "image/*" }: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        onDrop(files[0]);
      }
    },
    [onDrop]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onDrop(e.target.files[0]);
      }
    },
    [onDrop]
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-colors cursor-pointer bg-muted/20 hover:bg-muted/50",
        isDragging ? "border-primary bg-primary/5" : "border-border",
        className
      )}
    >
      <label className="cursor-pointer flex flex-col items-center w-full h-full">
        <input
          type="file"
          className="hidden"
          accept={accept}
          onChange={handleChange}
        />
        <UploadCloud className="w-10 h-10 text-muted-foreground mb-4" />
        <p className="text-sm font-medium text-foreground mb-1">
          Click to upload or drag and drop
        </p>
        <p className="text-xs text-muted-foreground">
          SVG, PNG, JPG or GIF (max. 10MB)
        </p>
      </label>
    </div>
  );
}
