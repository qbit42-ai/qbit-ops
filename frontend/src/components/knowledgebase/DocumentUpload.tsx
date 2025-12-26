import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { uploadDocument } from '@/utils/gatewayApi';

interface DocumentUploadProps {
  userId: string | null;
  datasetId: string | null;
  onUploadComplete: () => void;
}

export const DocumentUpload = ({ userId, datasetId, onUploadComplete }: DocumentUploadProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files) {
      setFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleUpload = async () => {
    if (!userId || !datasetId || files.length === 0) return;

    setUploading(true);
    setUploadProgress({});

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));

        try {
          await uploadDocument(userId, datasetId, file);
          setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));
        } catch (error: any) {
          console.error(`Failed to upload ${file.name}:`, error);
          alert(`Failed to upload ${file.name}: ${error.response?.data?.error || error.message}`);
        }
      }

      setFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onUploadComplete();
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress({}), 2000);
    }
  };

  const removeFile = (fileName: string) => {
    setFiles(files.filter((f) => f.name !== fileName));
  };

  if (!userId || !datasetId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Select a user and dataset to upload documents</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Documents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="text-gray-600">
              <p className="text-sm">Drag and drop files here, or click to select</p>
              <p className="text-xs mt-2 text-gray-400">Multiple files supported</p>
            </div>
          </label>
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Selected Files:</div>
            {files.map((file) => (
              <div
                key={file.name}
                className="flex items-center justify-between p-2 bg-gray-50 rounded border"
              >
                <div className="flex-1">
                  <div className="text-sm">{file.name}</div>
                  <div className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                  {uploadProgress[file.name] !== undefined && (
                    <div className="mt-1">
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full transition-all"
                          style={{ width: `${uploadProgress[file.name]}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeFile(file.name)}
                  disabled={uploading}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={files.length === 0 || uploading}
          className="w-full"
        >
          {uploading ? 'Uploading...' : `Upload ${files.length} File${files.length !== 1 ? 's' : ''}`}
        </Button>
      </CardContent>
    </Card>
  );
};

