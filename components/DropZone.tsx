import React, { useRef, useState } from 'react';
import { UploadCloud, Folder } from 'lucide-react';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  isLoading: boolean;
}

const DropZone: React.FC<DropZoneProps> = ({ onFilesSelected, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    // Note: Standard Drag and Drop API doesn't easily support full directory structures deeply
    // without using the File System Access API or recursive webkitGetAsEntry.
    // For simplicity and robustness in this demo, we encourage the input click for folders,
    // but basic flat file drops are handled here.
    const items = Array.from(e.dataTransfer.files);
    if (items.length > 0) {
      onFilesSelected(items);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 ease-in-out cursor-pointer
        ${isDragging 
          ? 'border-blue-500 bg-blue-500/10 scale-[1.01]' 
          : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/50 bg-slate-800/20'}
        ${isLoading ? 'opacity-50 pointer-events-none' : ''}
      `}
      onClick={handleButtonClick}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple
        onChange={handleFileInput}
        {...({ webkitdirectory: "", directory: "" } as any)}
      />
      
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className={`p-4 rounded-full bg-slate-800 ring-1 ring-slate-700 ${isDragging ? 'text-blue-400' : 'text-slate-400'}`}>
          <UploadCloud size={32} />
        </div>
        <div className="space-y-1">
          <p className="text-lg font-medium text-slate-200">
            Click to upload project folder
          </p>
          <p className="text-sm text-slate-400">
            or drag and drop directory here
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-800">
          <Folder size={12} />
          <span>Supports recursive folder parsing</span>
        </div>
      </div>
    </div>
  );
};

export default DropZone;