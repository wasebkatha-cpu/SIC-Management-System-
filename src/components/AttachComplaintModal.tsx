import React, { useState } from 'react';
import { X, Search, FileText, CheckCircle2 } from 'lucide-react';
import { useAppContext, ProceedingAttachment, ComplaintData } from '../context/AppContext';
import { toInputDateFormat } from '../utils/dateUtils';

interface AttachComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachment: { name: string; type: string; data: string } | null;
}

export default function AttachComplaintModal({ isOpen, onClose, attachment }: AttachComplaintModalProps) {
  const { complaints, addProceeding, addSubmission } = useAppContext();
  
  const [complaintSearch, setComplaintSearch] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintData | null>(null);
  const [attachTo, setAttachTo] = useState<'proceeding' | 'submission' | 'both'>('proceeding');
  
  // Proceeding fields
  const [proceedingDate, setProceedingDate] = useState(new Date().toISOString().split('T')[0]);
  const [proceedingTitle, setProceedingTitle] = useState('Document received');
  
  // Submission fields
  const [submissionDate, setSubmissionDate] = useState(new Date().toISOString().split('T')[0]);
  const [submissionType, setSubmissionType] = useState('Additional Document');
  const [submittedBy, setSubmittedBy] = useState<'Complainant' | 'Respondent'>('Complainant');
  const [submissionRemarks, setSubmissionRemarks] = useState('');

  if (!isOpen || !attachment) return null;

  const filteredComplaints = complaints.filter(c => 
    c.complaintNo.toLowerCase().includes(complaintSearch.toLowerCase()) ||
    c.complainantName.toLowerCase().includes(complaintSearch.toLowerCase())
  ).slice(0, 10);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) {
      alert("Please select a complaint first.");
      return;
    }

    const procAttachment: ProceedingAttachment = {
      name: attachment.name,
      type: attachment.type,
      dataUrl: attachment.data,
      uploadedAt: new Date().toISOString()
    };

    if (attachTo === 'proceeding' || attachTo === 'both') {
      addProceeding(
        selectedComplaint.complaintNo,
        proceedingDate,
        proceedingTitle,
        'FileText',
        procAttachment
      );
    }

    if (attachTo === 'submission' || attachTo === 'both') {
      addSubmission(selectedComplaint.complaintNo, {
        date: submissionDate,
        submittedBy,
        type: submissionType,
        remarks: submissionRemarks,
        attachment: procAttachment
      });
    }

    alert("Attachment successfully added to complaint!");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Add to Complaint Record</h2>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full text-neutral-500 dark:text-neutral-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="attach-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Attachment preview info */}
            <div className="flex items-center gap-3 p-4 border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 rounded-lg text-blue-700 dark:text-blue-300">
              <FileText className="w-6 h-6 shrink-0 text-blue-500" />
              <div className="min-w-0">
                <p className="font-medium truncate">{attachment.name}</p>
                <p className="text-xs text-blue-600/80 dark:text-blue-400/80">Ready to attach</p>
              </div>
            </div>

            {/* Complaint Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Select Complaint</label>
              {!selectedComplaint ? (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input 
                      type="text"
                      placeholder="Search by complaint no or name..."
                      value={complaintSearch}
                      onChange={e => setComplaintSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  {complaintSearch && (
                    <div className="border border-neutral-200 dark:border-neutral-700 rounded-md divide-y divide-neutral-100 dark:divide-neutral-800 max-h-48 overflow-y-auto bg-white dark:bg-neutral-800">
                      {filteredComplaints.length > 0 ? filteredComplaints.map(c => (
                        <div 
                          key={c.complaintNo}
                          onClick={() => setSelectedComplaint(c)}
                          className="p-3 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 cursor-pointer flex justify-between items-center"
                        >
                          <div>
                            <div className="font-medium text-sm text-neutral-900 dark:text-neutral-100">{c.complaintNo}</div>
                            <div className="text-xs text-neutral-500 dark:text-neutral-400">{c.complainantName} vs {c.publicBodyName}</div>
                          </div>
                          <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500">Select</span>
                        </div>
                      )) : <div className="p-3 text-sm text-neutral-500 dark:text-neutral-400 text-center">No complaints found</div>}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 rounded-md">
                  <div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-medium text-emerald-900 dark:text-emerald-200">{selectedComplaint.complaintNo}</span>
                    </div>
                    <div className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">{selectedComplaint.complainantName} vs {selectedComplaint.publicBodyName}</div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => { setSelectedComplaint(null); setComplaintSearch(''); }}
                    className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 underline cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              )}
            </div>

            {/* Target Selection */}
            {selectedComplaint && (
              <div className="space-y-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Where would you like to attach this?</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['proceeding', 'submission', 'both'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setAttachTo(type)}
                      className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors cursor-pointer ${
                        attachTo === type 
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300' 
                          : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                      }`}
                    >
                      <span className="capitalize">{type}</span>
                    </button>
                  ))}
                </div>

                {/* Conditional Fields based on selection */}
                <div className="space-y-6 pt-4">
                  {(attachTo === 'proceeding' || attachTo === 'both') && (
                    <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-lg border border-neutral-200 dark:border-neutral-700 space-y-4">
                      <h3 className="font-medium text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-700 pb-2">Proceeding Details</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">Date</label>
                          <input type="date" value={proceedingDate} onChange={e => setProceedingDate(e.target.value)} required className="w-full p-2 text-sm border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-md" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">Title/Event</label>
                          <input type="text" value={proceedingTitle} onChange={e => setProceedingTitle(e.target.value)} required className="w-full p-2 text-sm border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-md" />
                        </div>
                      </div>
                    </div>
                  )}

                  {(attachTo === 'submission' || attachTo === 'both') && (
                    <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-lg border border-neutral-200 dark:border-neutral-700 space-y-4">
                      <h3 className="font-medium text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-700 pb-2">Submission Details</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">Date</label>
                          <input type="date" value={submissionDate} onChange={e => setSubmissionDate(e.target.value)} required className="w-full p-2 text-sm border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-md" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">Submitted By</label>
                          <select value={submittedBy} onChange={e => setSubmittedBy(e.target.value as any)} className="w-full p-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100">
                            <option value="Complainant">Complainant</option>
                            <option value="Respondent">Respondent</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">Type</label>
                          <input type="text" value={submissionType} onChange={e => setSubmissionType(e.target.value)} required className="w-full p-2 text-sm border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-md" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">Remarks (Optional)</label>
                          <input type="text" value={submissionRemarks} onChange={e => setSubmissionRemarks(e.target.value)} className="w-full p-2 text-sm border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-md" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-3 bg-neutral-50 dark:bg-neutral-900 shrink-0 rounded-b-xl">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-750 cursor-pointer">
            Cancel
          </button>
          <button 
            type="submit" 
            form="attach-form"
            disabled={!selectedComplaint}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 cursor-pointer"
          >
            Attach to Complaint
          </button>
        </div>
      </div>
    </div>
  );
}
