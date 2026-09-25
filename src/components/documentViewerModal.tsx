import React, { useState, useRef, useEffect } from 'react';
import { X, Download, ExternalLink, Printer, Upload, FileText, Image as ImageIcon, ZoomIn, ZoomOut, RotateCcw, CheckCircle } from 'lucide-react';
import { ProceedingRecord, ProceedingAttachment } from '../context/AppContext';
import { generateOfficialNoticeSvg } from '../utils/documentTemplates';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  complaintNo: string;
  complainantName: string;
  respondentName: string;
  proceeding: ProceedingRecord | null;
  onUploadAttachment?: (attachment: ProceedingAttachment) => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  complaintNo,
  complainantName,
  respondentName,
  proceeding,
  onUploadAttachment
}) => {
  const [zoom, setZoom] = useState<number>(100);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      setZoom(100);
      setUploadSuccess(false);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !proceeding) return null;

  // Determine effective document
  const hasUserAttachment = Boolean(proceeding.attachment?.dataUrl);
  const effectiveDataUrl = hasUserAttachment
    ? proceeding.attachment!.dataUrl
    : generateOfficialNoticeSvg({
        title: proceeding.title,
        complaintNo,
        date: proceeding.date,
        complainantName,
        respondentName
      });

  const effectiveType = proceeding.attachment?.type || 'image/svg+xml';
  const isPdf = effectiveType.includes('pdf') || (proceeding.attachment?.name?.toLowerCase().endsWith('.pdf') ?? false);
  const isImage = !isPdf;
  const documentName = proceeding.attachment?.name || `${proceeding.title.replace(/\s+/g, '_')}_${complaintNo}.png`;
  const documentSize = proceeding.attachment?.size || 'Official Electronic Record';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadAttachment) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const formattedSize = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

      const newAttachment: ProceedingAttachment = {
        name: file.name,
        type: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/png'),
        dataUrl,
        size: formattedSize,
        uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      onUploadAttachment(newAttachment);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = effectiveDataUrl;
    link.download = documentName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenNewTab = () => {
    const newWindow = window.open();
    if (newWindow) {
      if (isPdf) {
        newWindow.document.write(
          `<iframe src="${effectiveDataUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
        );
      } else {
        newWindow.document.write(
          `<title>${documentName}</title><body style="margin:0; background:#111; display:flex; justify-content:center; align-items:center; min-height:100vh;"><img src="${effectiveDataUrl}" style="max-width:100%; max-height:100vh; object-fit:contain;" /></body>`
        );
      }
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${documentName} - Print</title>
            <style>
              body { margin: 0; padding: 20px; display: flex; justify-content: center; }
              img { max-width: 100%; height: auto; }
            </style>
          </head>
          <body>
            ${isPdf 
              ? `<iframe src="${effectiveDataUrl}" style="width:100%; height:100vh; border:none;"></iframe>`
              : `<img src="${effectiveDataUrl}" onload="window.print();" />`
            }
          </body>
        </html>
      `);
      printWindow.document.close();
      if (!isPdf) {
        // Will auto print via onload
      } else {
        printWindow.focus();
        printWindow.print();
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-neutral-200 dark:border-slate-800 flex flex-col w-full max-w-5xl max-h-[92vh] overflow-hidden text-neutral-900 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-neutral-200 dark:border-slate-800 bg-neutral-50 dark:bg-slate-800/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
              {isPdf ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-semibold text-neutral-900 dark:text-white truncate">
                  {proceeding.title}
                </h3>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                  isPdf 
                    ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800' 
                    : hasUserAttachment 
                      ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                      : 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                }`}>
                  {isPdf ? 'PDF' : hasUserAttachment ? 'PNG / Image' : 'Official Notice'}
                </span>
                {uploadSuccess && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Updated
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 dark:text-slate-400 truncate mt-0.5">
                Case No: <span className="font-medium text-neutral-700 dark:text-slate-200">{complaintNo}</span> | Issuance Date: <span className="font-medium text-neutral-700 dark:text-slate-200">{proceeding.date}</span> | File: <span className="text-neutral-600 dark:text-slate-300">{documentName}</span> ({documentSize})
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0 ml-3">
            {/* Upload/Replace Button */}
            {onUploadAttachment && (
              <>
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,image/png,image/jpeg,image/webp"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 rounded-md transition-colors cursor-pointer"
                  title="Upload or replace attachment (PDF/PNG)"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{hasUserAttachment ? 'Replace File' : 'Upload File'}</span>
                </button>
              </>
            )}

            {/* Zoom Controls for Images */}
            {isImage && (
              <div className="hidden md:flex items-center bg-white dark:bg-slate-950 border border-neutral-200 dark:border-slate-700 rounded-md overflow-hidden text-xs">
                <button 
                  onClick={() => setZoom(z => Math.max(50, z - 20))}
                  className="p-1.5 hover:bg-neutral-100 dark:hover:bg-slate-800 text-neutral-600 dark:text-slate-300 cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="px-1.5 text-neutral-500 dark:text-slate-400 font-mono text-[11px] min-w-[3rem] text-center">
                  {zoom}%
                </span>
                <button 
                  onClick={() => setZoom(z => Math.min(200, z + 20))}
                  className="p-1.5 hover:bg-neutral-100 dark:hover:bg-slate-800 text-neutral-600 dark:text-slate-300 cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => setZoom(100)}
                  className="p-1.5 hover:bg-neutral-100 dark:hover:bg-slate-800 text-neutral-600 dark:text-slate-300 border-l border-neutral-200 dark:border-slate-700 cursor-pointer"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleDownload}
              className="p-1.5 text-neutral-600 dark:text-slate-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
              title="Download file"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleOpenNewTab}
              className="p-1.5 text-neutral-600 dark:text-slate-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
              title="Open in new window"
            >
              <ExternalLink className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="p-1.5 text-neutral-600 dark:text-slate-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
              title="Print document"
            >
              <Printer className="w-4 h-4" />
            </button>

            <div className="w-px h-5 bg-neutral-200 dark:bg-slate-700 mx-1" />

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              title="Close viewer (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Viewer */}
        <div className="flex-1 overflow-auto bg-neutral-100 dark:bg-slate-950 p-4 flex items-center justify-center min-h-[500px] max-h-[75vh]">
          {isPdf ? (
            <div className="w-full h-full flex flex-col items-center">
              <iframe 
                src={effectiveDataUrl} 
                title={proceeding.title}
                className="w-full h-[66vh] bg-white rounded-lg shadow-md border border-neutral-200 dark:border-slate-800"
              />
              <div className="mt-2 text-center text-xs text-neutral-500 dark:text-slate-400 flex items-center gap-2">
                <span>Displaying uploaded PDF: <strong>{documentName}</strong> ({documentSize})</span>
                <button 
                  onClick={handleOpenNewTab} 
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3" />
                  View fullscreen
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center justify-center p-2 overflow-auto">
              <div 
                className="transition-transform duration-150 ease-out origin-center"
                style={{ transform: `scale(${zoom / 100})` }}
              >
                <img 
                  src={effectiveDataUrl} 
                  alt={proceeding.title}
                  className="max-h-[68vh] max-w-full object-contain rounded-md shadow-lg border border-neutral-300 dark:border-slate-700 bg-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-5 py-2.5 bg-white dark:bg-slate-900 border-t border-neutral-200 dark:border-slate-800 flex items-center justify-between text-xs text-neutral-500 dark:text-slate-400 shrink-0">
          <div className="flex items-center gap-2 truncate">
            <span className="font-medium text-neutral-700 dark:text-slate-300">Complainant:</span>
            <span className="truncate max-w-[200px] sm:max-w-xs text-neutral-900 dark:text-white">{complainantName}</span>
            <span className="text-neutral-300 dark:text-slate-700">|</span>
            <span className="font-medium text-neutral-700 dark:text-slate-300">Respondent:</span>
            <span className="truncate max-w-[200px] sm:max-w-xs text-neutral-900 dark:text-white">{respondentName}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {hasUserAttachment ? (
              <span className="text-emerald-700 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 text-[11px]">
                Uploaded Attachment Attached
              </span>
            ) : (
              <span className="text-neutral-500 dark:text-slate-400 italic text-[11px]">
                Electronic Notice Template (upload PDF/PNG to override)
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
