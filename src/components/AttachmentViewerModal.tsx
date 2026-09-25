import React, { useState } from 'react';
import { ChatAttachment } from '../lib/mockDb';
import {
  X,
  Download,
  PlusCircle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FileText,
  ExternalLink,
  ImageIcon,
  FileSpreadsheet,
  File
} from 'lucide-react';

interface AttachmentViewerModalProps {
  attachment: ChatAttachment | null;
  onClose: () => void;
  onAddToCase?: (attachment: ChatAttachment) => void;
}

export default function AttachmentViewerModal({
  attachment,
  onClose,
  onAddToCase
}: AttachmentViewerModalProps) {
  const [zoom, setZoom] = useState(1);

  if (!attachment) return null;

  const isImage = attachment.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(attachment.name);
  const isPdf = attachment.type === 'application/pdf' || attachment.name.toLowerCase().endsWith('.pdf');
  const isSpreadsheet =
    attachment.type.includes('spreadsheet') ||
    attachment.type.includes('excel') ||
    /\.(xlsx|xls|csv)$/i.test(attachment.name);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = attachment.data;
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenNewTab = () => {
    // If it's a data url, create an object URL or open directly
    const win = window.open();
    if (win) {
      if (isImage) {
        win.document.write(`<title>${attachment.name}</title><img src="${attachment.data}" style="max-width:100%; height:auto; margin:auto; display:block; padding:20px;" />`);
      } else {
        win.location.href = attachment.data;
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-neutral-700 dark:border-slate-800 w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-neutral-900 text-white px-4 sm:px-6 py-3.5 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-2.5 min-w-0 mr-4">
            {isImage ? (
              <ImageIcon className="w-5 h-5 text-blue-400 shrink-0" />
            ) : isPdf ? (
              <FileText className="w-5 h-5 text-red-400 shrink-0" />
            ) : isSpreadsheet ? (
              <FileSpreadsheet className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <File className="w-5 h-5 text-neutral-400 shrink-0" />
            )}
            <div className="min-w-0">
              <h3 className="font-semibold text-sm sm:text-base text-white truncate" title={attachment.name}>
                {attachment.name}
              </h3>
              <p className="text-[11px] text-neutral-400 truncate">
                {attachment.type || 'Document file'}
              </p>
            </div>
          </div>

          {/* Header Action Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Image Zoom Controls */}
            {isImage && (
              <div className="flex items-center gap-1 bg-neutral-800 px-2 py-1 rounded-lg mr-2 border border-neutral-700">
                <button
                  onClick={() => setZoom(prev => Math.max(0.5, prev - 0.25))}
                  className="p-1 hover:text-blue-400 text-neutral-300 rounded transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono text-neutral-300 min-w-[42px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom(prev => Math.min(3, prev + 0.25))}
                  className="p-1 hover:text-blue-400 text-neutral-300 rounded transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoom(1)}
                  className="p-1 hover:text-blue-400 text-neutral-300 rounded transition-colors ml-0.5"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Add to Case Button */}
            {onAddToCase && (
              <button
                onClick={() => onAddToCase(attachment)}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-2xs cursor-pointer"
                title="Add file to Complaint proceedings or submissions"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Add to Case</span>
              </button>
            )}

            {/* Open In New Tab */}
            <button
              onClick={handleOpenNewTab}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer hidden sm:block"
              title="Open in new window"
            >
              <ExternalLink className="w-4 h-4" />
            </button>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-neutral-700 shadow-2xs cursor-pointer"
              title="Download file to computer"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer ml-1"
              title="Close viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="flex-1 bg-neutral-950 flex items-center justify-center overflow-auto p-4 relative select-none">
          {isImage ? (
            <div className="w-full h-full flex items-center justify-center overflow-auto p-2">
              <img
                src={attachment.data}
                alt={attachment.name}
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-transform duration-150"
              />
            </div>
          ) : isPdf ? (
            <div className="w-full h-full bg-white rounded-lg overflow-hidden flex flex-col">
              <iframe
                src={attachment.data}
                title={attachment.name}
                className="w-full h-full border-none"
              />
            </div>
          ) : (
            <div className="bg-neutral-900 border border-neutral-800 text-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-4">
                {isSpreadsheet ? <FileSpreadsheet className="w-8 h-8" /> : <FileText className="w-8 h-8" />}
              </div>
              <h4 className="text-base font-semibold text-white break-words mb-1">
                {attachment.name}
              </h4>
              <p className="text-xs text-neutral-400 mb-6">
                {attachment.type || 'Document File'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleDownload}
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Attachment</span>
                </button>
                {onAddToCase && (
                  <button
                    onClick={() => onAddToCase(attachment)}
                    className="flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 px-5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4 text-blue-400" />
                    <span>Attach to Case</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Info */}
        <div className="bg-neutral-900 border-t border-neutral-800 px-4 py-2 flex items-center justify-between text-xs text-neutral-400 shrink-0">
          <span className="truncate">{attachment.name}</span>
          <span className="shrink-0 text-[11px]">
            {isImage ? 'Click Zoom buttons or Reset to scale' : isPdf ? 'Scroll or use PDF toolbar' : 'Ready to download or attach'}
          </span>
        </div>

      </div>
    </div>
  );
}
