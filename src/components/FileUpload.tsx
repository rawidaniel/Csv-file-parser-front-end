import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isLoading: boolean;
  error: string | null;
}

export const FileUpload = ({
  onFileUpload,
  isLoading,
  error,
}: FileUploadProps) => {
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileUpload(acceptedFiles[0]);
      }
    },
    [onFileUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".csv"],
    },
    multiple: false,
    disabled: isLoading,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200",
          "hover:border-blue-400 hover:bg-blue-50/50",
          isDragActive || dragActive
            ? "border-blue-500 bg-blue-50 scale-105"
            : "border-gray-300",
          isLoading && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center space-y-4">
          {isLoading ? (
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
          ) : (
            <div className="p-4 bg-blue-100 rounded-full">
              <Upload className="h-8 w-8 text-blue-600" />
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {isLoading ? "Processing..." : "Drop your CSV file here"}
            </h3>
            <p className="text-gray-600">
              {isLoading
                ? "Please wait while we parse your file"
                : "or click to browse files"}
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <File className="h-4 w-4" />
            <span>Supports .csv files up to 10MB</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
