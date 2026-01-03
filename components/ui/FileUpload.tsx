import React from 'react';
import { Upload, Check, FileText } from 'lucide-react';

export interface FileUploadProps {
  label: string;
  description?: string;
  isAttached: boolean;
  onFileSelect: (file: File) => void;
  icon?: React.ReactNode;
  accept?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  description,
  isAttached,
  onFileSelect,
  icon,
  accept
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative border-2 border-dashed rounded-xl p-5 cursor-pointer transition-all duration-300 flex items-center gap-4
        ${isAttached
          ? 'border-emerald-500 bg-emerald-50/50'
          : 'border-gray-200 hover:border-qatar hover:bg-slate-50'
        }`}
    >
      <input
        type="file"
        ref={inputRef}
        className="hidden"
        onChange={handleFileChange}
        accept={accept}
      />
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors
        ${isAttached
            ? 'bg-emerald-100 text-emerald-600'
            : 'bg-gray-100 text-gray-400 group-hover:bg-qatar/10 group-hover:text-qatar'
          }`}
      >
        {isAttached ? <Check size={20} /> : icon || <Upload size={20} />}
      </div>
      <div className="flex-1">
        <p className={`font-bold text-sm ${isAttached ? 'text-emerald-900' : 'text-gray-900'}`}>{label}</p>
        <p className={`text-xs ${isAttached ? 'text-emerald-700' : 'text-gray-500'}`}>
          {isAttached ? 'File attached successfully' : description || 'Click to browse or drag file here'}
        </p>
      </div>
      {isAttached && (
        <div className="bg-white rounded-full p-1 shadow-sm">
          <FileText size={16} className="text-emerald-500" />
        </div>
      )}
    </div>
  );
};


