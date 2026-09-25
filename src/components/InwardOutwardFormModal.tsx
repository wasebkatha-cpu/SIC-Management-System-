import React, { useState, useRef } from 'react';
import { X, Upload, File as FileIcon, Trash2 } from 'lucide-react';
import { InwardRecord, OutwardRecord, saveInward, saveOutward } from '../utils/inwardOutwardStorage';
import { useAuth } from '../context/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  type: 'inward' | 'outward';
  onSave?: () => void;
}

export default function InwardOutwardFormModal({ isOpen, onClose, type, onSave }: Props) {
  const { user } = useAuth();
  
  const [no, setNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [personName, setPersonName] = useState('');
  const [personType, setPersonType] = useState<'complainant' | 'respondent' | 'public_body' | 'other'>('other');
  const [subject, setSubject] = useState('');
  const [complaintNo, setComplaintNo] = useState('');
  const [description, setDescription] = useState('');
  const [trackingId, setTrackingId] = useState('');
  
  const [attachments, setAttachments] = useState<{ name: string; type: string; url: string; size?: number }[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files as Iterable<File>).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAttachments(prev => [
            ...prev,
            {
              name: file.name,
              type: file.type || 'application/octet-stream',
              url: event.target!.result as string,
              size: file.size
            }
          ]);
        }
      };
      reader.readAsDataURL(file as Blob);
    });
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (type === 'inward') {
      const record: InwardRecord = {
        id: `inward_${Date.now()}`,
        inwardNo: no || `INW-${Date.now()}`,
        dateReceived: date,
        senderName: personName,
        senderType: personType,
        subject,
        complaintNo,
        description,
        attachments,
        status: 'pending',
        createdAt: new Date().toISOString(),
        createdBy: {
          userId: user?.id || 'sys',
          name: user?.name || 'System User'
        }
      };
      saveInward(record);
    } else {
      const record: OutwardRecord = {
        id: `outward_${Date.now()}`,
        outwardNo: no || `OUT-${Date.now()}`,
        dateDispatched: date,
        recipientName: personName,
        recipientType: personType,
        subject,
        complaintNo,
        description,
        attachments,
        trackingId,
        createdAt: new Date().toISOString(),
        createdBy: {
          userId: user?.id || 'sys',
          name: user?.name || 'System User'
        }
      };
      saveOutward(record);
    }

    if (onSave) onSave();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            Log New {type === 'inward' ? 'Inward' : 'Outward'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-lg">
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="inward-outward-form" onSubmit={handleSubmit} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  {type === 'inward' ? 'Inward No' : 'Outward No'} (Optional)
                </label>
                <input
                  type="text"
                  value={no}
                  onChange={(e) => setNo(e.target.value)}
                  placeholder="Auto-generated if blank"
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-neutral-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  {type === 'inward' ? 'Date Received' : 'Date Dispatched'}
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-neutral-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  {type === 'inward' ? 'Sender Name' : 'Recipient Name'}
                </label>
                <input
                  type="text"
                  required
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-neutral-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Type
                </label>
                <select
                  value={personType}
                  onChange={(e) => setPersonType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-neutral-900 dark:text-white"
                >
                  <option value="other">Other / General</option>
                  <option value="complainant">Complainant</option>
                  <option value="respondent">Respondent</option>
                  <option value="public_body">Public Body</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Subject / Title
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-neutral-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Complaint No (Optional)
                </label>
                <input
                  type="text"
                  value={complaintNo}
                  onChange={(e) => setComplaintNo(e.target.value)}
                  placeholder="e.g. SIC-2026-01"
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-neutral-900 dark:text-white"
                />
              </div>
              {type === 'outward' && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Tracking/Postal ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-neutral-900 dark:text-white"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Description / Remarks
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-neutral-900 dark:text-white resize-none"
              />
            </div>

            {/* Attachments Section */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Attachments
              </label>
              
              <div 
                className="border-2 border-dashed border-neutral-300 dark:border-slate-700 rounded-xl p-6 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer bg-neutral-50 dark:bg-slate-800/50"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-neutral-900 dark:text-white">
                  Click to upload attachments
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  PDF, Images, or Documents
                </p>
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                />
              </div>

              {attachments.length > 0 && (
                <div className="mt-4 space-y-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-slate-800/50 rounded-lg border border-neutral-200 dark:border-slate-700">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <FileIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-900 dark:text-white">{file.name}</p>
                          <p className="text-xs text-neutral-500">
                            {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </form>
        </div>

        <div className="p-4 border-t border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800/50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="inward-outward-form"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Save {type === 'inward' ? 'Inward' : 'Outward'}
          </button>
        </div>
      </div>
    </div>
  );
}
