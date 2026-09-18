import React, { useState, useEffect } from 'react';
import { FileText, Plus, User, Building2, UploadCloud, Eye } from 'lucide-react';
import { useAppContext, ComplaintData, SubmissionRecord } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { DocumentViewerModal } from './documentViewerModal';
import { getStoredCustomSubmissions, saveCustomSubmission } from '../utils/customSubmissionsStorage';

interface ComplaintSubmissionsProps {
  complaint: ComplaintData;
}

const SUBMISSION_TYPES = {
  Complainant: [
    'Satisfaction Application',
    'Non-Satisfaction Application',
    'Application for Penal Proceedings (Designated Official)'
  ],
  Respondent: [
    'Reply',
    'Written Statement',
    'Adjournment Application',
    'Exception Claim (Section-10)'
  ]
};

export default function ComplaintSubmissions({ complaint }: ComplaintSubmissionsProps) {
  const { addSubmission } = useAppContext();
  const { user } = useAuth();
  
  const [isAdding, setIsAdding] = useState(false);
  const [submittedBy, setSubmittedBy] = useState<'Complainant' | 'Respondent'>('Complainant');
  
  const [customStoredTypes, setCustomStoredTypes] = useState(getStoredCustomSubmissions);
  
  const [type, setType] = useState(SUBMISSION_TYPES.Complainant[0]);
  const [customType, setCustomType] = useState('');
  const [remarks, setRemarks] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attachment, setAttachment] = useState<any>(null);

  const [viewingAttachment, setViewingAttachment] = useState<any>(null);

  const canAddCustom = user?.role === 'superUser' || (user?.role === 'admin' && user?.permissions?.includes('complaints'));

  const handleSubmittedByChange = (val: 'Complainant' | 'Respondent') => {
    setSubmittedBy(val);
    setType(SUBMISSION_TYPES[val][0]);
    setCustomType('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachment({
          name: file.name,
          type: file.type,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          dataUrl: event.target?.result as string,
          uploadedAt: new Date().toISOString()
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalType = type === 'Custom' && customType.trim() ? customType.trim() : type;
    if (!finalType || !date) return;
    
    if (type === 'Custom' && customType.trim()) {
      const updatedStorage = saveCustomSubmission(submittedBy, finalType);
      setCustomStoredTypes(updatedStorage);
      if (user) {
        // Log this structural change
        const { MockDB } = await import('../lib/mockDb');
        await MockDB.addLog({
          userId: user.uid,
          username: user.username,
          role: user.role as string,
          activity: `Created new custom submission template: "${finalType}" for ${submittedBy}`
        });
      }
    }

    addSubmission(complaint.complaintNo, {
      date,
      submittedBy,
      type: finalType,
      remarks,
      attachment: attachment || undefined
    });

    setIsAdding(false);
    setRemarks('');
    setAttachment(null);
    setCustomType('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const submissions = complaint.submissions || [];

  return (
    <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden flex flex-col h-full">
      <div className="px-5 py-3.5 border-b border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800/90 flex items-center justify-between shrink-0">
        <h3 className="font-semibold text-neutral-900 dark:text-white text-sm flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          Submissions / Applications
        </h3>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-1 rounded transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Submission
          </button>
        )}
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        {isAdding && (
          <form onSubmit={handleSubmit} className="mb-6 bg-neutral-50 dark:bg-slate-800/70 border border-neutral-200 dark:border-slate-700 rounded-lg p-4 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium text-sm text-neutral-800 dark:text-white">Record New Submission</h4>
              <button type="button" onClick={() => setIsAdding(false)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer">
                Cancel
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-200 mb-1">Submitted By</label>
                <div className="flex bg-white dark:bg-slate-900 rounded-md border border-neutral-300 dark:border-slate-700 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => handleSubmittedByChange('Complainant')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium transition-colors cursor-pointer ${
                      submittedBy === 'Complainant' ? 'bg-blue-600 text-white' : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    Complainant
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmittedByChange('Respondent')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium transition-colors cursor-pointer ${
                      submittedBy === 'Respondent' ? 'bg-blue-600 text-white' : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    Respondent
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-200 mb-1">Submission Type</label>
                  <select
                    required
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full rounded-md border border-neutral-300 dark:border-slate-700 px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-900 text-neutral-900 dark:text-white"
                  >
                    {SUBMISSION_TYPES[submittedBy].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                    {customStoredTypes[submittedBy].map(t => (
                      <option key={`custom-${t}`} value={t}>{t}</option>
                    ))}
                    {canAddCustom && <option value="Custom">Custom (Specify...)</option>}
                  </select>
                </div>
                {type === 'Custom' && (
                  <div>
                    <input
                      type="text"
                      required
                      value={customType}
                      onChange={(e) => setCustomType(e.target.value)}
                      placeholder="Enter custom submission type"
                      className="w-full rounded-md border border-neutral-300 dark:border-slate-700 px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-900 text-neutral-900 dark:text-white"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-200 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 dark:border-slate-700 px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-900 text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-200 mb-1">Attachment (Optional)</label>
                <label className="flex items-center justify-center w-full px-3 py-2 border border-neutral-300 dark:border-slate-700 border-dashed rounded-md cursor-pointer hover:bg-neutral-50 dark:hover:bg-slate-800 transition-colors bg-white dark:bg-slate-900">
                  <span className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-300">
                    <UploadCloud className="w-4 h-4 text-blue-500" />
                    {attachment ? attachment.name : 'Choose file'}
                  </span>
                  <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.png,.jpg,.jpeg" />
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-200 mb-1">Remarks / Summary (Optional)</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-neutral-300 dark:border-slate-700 px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 resize-none bg-white dark:bg-slate-900 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500"
                  placeholder="Enter details about this submission..."
                />
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-neutral-200 dark:border-slate-700">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-xs transition-colors cursor-pointer"
              >
                Save Submission
              </button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {submissions.length > 0 ? (
            submissions.map((sub) => (
              <div key={sub.id} className="border border-neutral-200 dark:border-slate-800 rounded-lg p-3 bg-white dark:bg-slate-800/80 shadow-sm flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-slate-700 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-slate-600">
                      {sub.date}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                      sub.submittedBy === 'Complainant' 
                        ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' 
                        : 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                    }`}>
                      {sub.submittedBy}
                    </span>
                    <span className="text-sm font-medium text-neutral-900 dark:text-white">
                      {sub.type}
                    </span>
                  </div>
                  {sub.remarks && (
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1.5 leading-relaxed">
                      {sub.remarks}
                    </p>
                  )}
                </div>
                
                {sub.attachment && (
                  <button
                    onClick={() => setViewingAttachment(sub.attachment)}
                    className="shrink-0 self-start flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-100 dark:hover:bg-blue-900/60 px-2.5 py-1.5 rounded transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Doc
                  </button>
                )}
              </div>
            ))
          ) : (
            !isAdding && (
              <div className="text-center py-8 text-neutral-400 text-xs">
                No submissions recorded yet.
              </div>
            )
          )}
        </div>
      </div>

      {viewingAttachment && (
        <DocumentViewerModal
          isOpen={!!viewingAttachment}
          onClose={() => setViewingAttachment(null)}
          title={`Attachment - ${viewingAttachment.name}`}
          attachment={viewingAttachment}
        />
      )}
    </div>
  );
}
