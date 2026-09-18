import { 
  ArrowLeft, 
  Eye, 
  BookOpen, 
  FileText, 
  Calendar, 
  Clock, 
  UserCheck, 
  Building2,
  Scale,
  Users,
  FilePlus2,
  ArrowRight,
  AlertCircle,
  Plus,
  Trash2,
  Sparkles,
  Printer,
  Lock,
  CheckCircle2,
  X,
  Save,
  Edit3,
  Check
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useAppContext, ProceedingRecord, getMostRecentProceeding, getSortedProceedings, isComplaintInformationDisclosed } from '../context/AppContext';
import { printDiaries } from '../utils/printUtils';
import { toInputDateFormat, toDisplayDateFormat } from '../utils/dateUtils';
import { DocumentViewerModal } from './documentViewerModal';
import { ComprehensiveReportModal } from './ComprehensiveReportModal';
import { NoticeDraftModal, NOTICE_TYPES, NoticeTypeConfig } from './noticeDraftModal';
import { CustomNoticeModal } from './customNoticeModal';
import ComplaintSubmissions from './complaintSubmissions';
import { getStoredCustomNotices, saveCustomNotice, removeCustomNotice, initCustomNoticesListener } from '../utils/customNoticesStorage';
import { useAuth } from '../context/AuthContext';

interface ComplaintDetailsProps {
  complaintId: string;
  onBack: () => void;
}

export default function ComplaintDetails({ complaintId, onBack }: ComplaintDetailsProps) {
  const { user, hasPermission, logActivity } = useAuth();
  const { 
    complaints, 
    updateProceedingAttachment,
    getReaderForComplaint,
    updateComplaint
  } = useAppContext();
  
  const complaint = complaints.find(c => c.complaintNo === complaintId);

  // Proactive Disclosure states
  const [isEditingDisclosure, setIsEditingDisclosure] = useState<boolean>(false);
  const [infoDisclosed, setInfoDisclosed] = useState<boolean>(complaint?.informationDisclosed ?? false);
  const [disclosureDate, setDisclosureDate] = useState<string>(complaint?.disclosureDate || '');
  const [disclosedSubject, setDisclosedSubject] = useState<string>(complaint?.disclosedInformationSubject || '');
  const [disclosureMode, setDisclosureMode] = useState<string>(complaint?.disclosureMode || 'Direct Supply to Citizen');
  const [disclosureRemarks, setDisclosureRemarks] = useState<string>(complaint?.disclosureRemarks || '');
  const [disclosureSuccessMsg, setDisclosureSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (complaint) {
      setInfoDisclosed(Boolean(complaint.informationDisclosed));
      setDisclosureDate(complaint.disclosureDate || '');
      setDisclosedSubject(complaint.disclosedInformationSubject || '');
      setDisclosureMode(complaint.disclosureMode || 'Direct Supply to Citizen');
      setDisclosureRemarks(complaint.disclosureRemarks || '');
    }
  }, [
    complaint?.complaintNo,
    complaint?.informationDisclosed,
    complaint?.disclosureDate,
    complaint?.disclosedInformationSubject,
    complaint?.disclosureMode,
    complaint?.disclosureRemarks
  ]);

  const handleSaveDisclosure = async () => {
    if (!complaint) return;
    const effectiveDate = infoDisclosed 
      ? (disclosureDate.trim() ? toDisplayDateFormat(disclosureDate.trim()) : toDisplayDateFormat(new Date().toISOString().split('T')[0]))
      : '';

    await updateComplaint(complaint.complaintNo, {
      informationDisclosed: infoDisclosed,
      disclosureDate: effectiveDate,
      disclosedInformationSubject: infoDisclosed ? disclosedSubject.trim() : '',
      disclosureMode: infoDisclosed ? disclosureMode : '',
      disclosureRemarks: infoDisclosed ? disclosureRemarks.trim() : ''
    });

    setDisclosureSuccessMsg("Proactive disclosure record saved successfully! Synchronized with RTI Dashboard.");
    setIsEditingDisclosure(false);
    setTimeout(() => setDisclosureSuccessMsg(null), 3500);
    await logActivity(`Updated Proactive Disclosure record for complaint ${complaint.complaintNo}: ${infoDisclosed ? `Disclosed on ${effectiveDate}` : 'Marked Pending'}`);
  };

  // Permission check: Superuser or Admin with Future Proceedings / Edit permission
  const canManageCustomNotices = Boolean(
    user?.role === 'superUser' || 
    (user?.role === 'admin' && (hasPermission('causelist_update_future_proceedings') || hasPermission('complaints_edit')))
  );

  // Proceeding states (Document viewing modal)
  const [viewingProceeding, setViewingProceeding] = useState<ProceedingRecord | null>(null);

  // Future Proceedings states (Draft Notice / Order Modal)
  const [selectedDraftNotice, setSelectedDraftNotice] = useState<NoticeTypeConfig | null>(null);

  // Custom Notice / Order states
  const [isCustomModalOpen, setIsCustomModalOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [customNotices, setCustomNotices] = useState<NoticeTypeConfig[]>(() => getStoredCustomNotices());
  const [justAddedNoticeId, setJustAddedNoticeId] = useState<string | null>(null);
  const [successNoticeMsg, setSuccessNoticeMsg] = useState<string | null>(null);

  // Synchronize custom notice templates across all complaints, tabs, and remote store
  useEffect(() => {
    initCustomNoticesListener((updated) => {
      setCustomNotices(updated);
    });

    const handleUpdate = () => {
      setCustomNotices(getStoredCustomNotices());
    };

    window.addEventListener('custom_notices_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('custom_notices_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // When complaintId changes, guarantee fresh custom notice templates are reloaded
  useEffect(() => {
    setCustomNotices(getStoredCustomNotices());
  }, [complaintId]);

  const handleCreateCustomNotice = async (newConfig: NoticeTypeConfig, openDraftNow = false) => {
    if (!canManageCustomNotices) {
      alert('Permission required: Only Superuser or Admin with Future Proceedings / Edit permission can create custom notices.');
      return;
    }
    const updated = saveCustomNotice(newConfig);
    setCustomNotices(updated);
    setJustAddedNoticeId(newConfig.id);
    setSuccessNoticeMsg(`"${newConfig.title}" added to Future Proceedings list! Ready to use for this and all complaints.`);
    if (openDraftNow) {
      setSelectedDraftNotice(newConfig);
    }
    await logActivity(`Created custom ${newConfig.category.toLowerCase()} template: ${newConfig.title}`);
  };

  const handleRemoveCustomNotice = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!canManageCustomNotices) {
      alert('Permission required: Only Superuser or Admin with Future Proceedings / Edit permission can delete custom notices.');
      return;
    }
    const notice = customNotices.find(n => n.id === id);
    if (!notice) return;
    if (window.confirm(`Are you sure you want to remove the custom template "${notice.title}" from the Future Proceedings list?`)) {
      const updated = removeCustomNotice(id);
      setCustomNotices(updated);
      if (justAddedNoticeId === id) setJustAddedNoticeId(null);
      await logActivity(`Removed custom notice template: ${notice.title}`);
    }
  };

  // Case Diary states (read-only view with row expansion)
  const [expandedDiaryIds, setExpandedDiaryIds] = useState<Set<number>>(new Set());

  // Derive Current Stage: explicitly resolved as the most recent notice/order or whatever was issued
  const lastIssuedProceeding = getMostRecentProceeding(complaint);
  const currentStage = lastIssuedProceeding?.title || complaint?.statusStage || 'Hearing in Progress';

  if (!complaint) {
    return (
      <div className="p-8 text-center">
        <p className="text-neutral-500 mb-4">Complaint not found.</p>
        <button onClick={onBack} className="text-blue-600 hover:underline">Go back</button>
      </div>
    );
  }

  const partiesName = `${complaint.complainantName} V/S ${complaint.respondentName}`;

  const toggleDiaryExpand = (srNo: number) => {
    setExpandedDiaryIds((prev) => {
      const next = new Set(prev);
      if (next.has(srNo)) {
        next.delete(srNo);
      } else {
        next.add(srNo);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full bg-neutral-50 dark:bg-slate-950 overflow-hidden rounded-xl">
      {/* Top Header */}
      <div className="px-6 py-4 border-b border-neutral-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="mr-4 p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-300 cursor-pointer"
            title="Back to complaints list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Complaint Details: {complaint.complaintNo}</h2>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800" title={`Current Stage: ${currentStage}`}>
                {currentStage}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-300 line-clamp-1 mt-0.5">{partiesName}</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-4">
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors mr-2 shadow-sm cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            Comprehensive Report
          </button>
          <div className="text-right">
            <span className="block text-[11px] text-neutral-400 dark:text-neutral-400 uppercase font-medium tracking-wider">Scheduled Hearing</span>
            <span className="text-sm font-semibold text-blue-900 dark:text-blue-300">
              {complaint.nextHearingDate || 'Not Scheduled'}
            </span>
          </div>
          {complaint.previousHearingDate && (
            <div className="text-right pl-3 border-l border-neutral-200 dark:border-slate-800">
              <span className="block text-[11px] text-neutral-400 dark:text-neutral-400 uppercase font-medium tracking-wider">Last Hearing</span>
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">{complaint.previousHearingDate}</span>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-auto p-5 sm:p-6 space-y-5">

        {/* Case Information Summary Strip */}
        <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-lg p-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-neutral-100 dark:divide-slate-800 text-xs">
            
            {/* Complainant Info */}
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-400 uppercase tracking-wider block mb-0.5">
                  Complainant
                </span>
                <p className="font-semibold text-neutral-900 dark:text-white truncate" title={complaint.complainantName}>
                  {complaint.complainantName}
                </p>
                <p className="text-neutral-500 dark:text-neutral-300 text-[11px] mt-0.5 truncate">
                  Adv: <span className="text-neutral-700 dark:text-neutral-200">{complaint.counselorComplainant || 'None'}</span>
                </p>
              </div>
            </div>

            {/* Respondent Info */}
            <div className="sm:pl-4 flex items-start gap-2.5 pt-3 sm:pt-0">
              <div className="p-2 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-400 uppercase tracking-wider block mb-0.5">
                  Respondent Public Body
                </span>
                <p className="font-semibold text-neutral-900 dark:text-white line-clamp-1" title={complaint.respondentName}>
                  {complaint.respondentName}
                </p>
                <p className="text-neutral-500 dark:text-neutral-300 text-[11px] mt-0.5 truncate">
                  Adv: <span className="text-neutral-700 dark:text-neutral-200">{complaint.counselorRespondent || 'None'}</span>
                </p>
              </div>
            </div>

            {/* Stage / Status */}
            <div className="sm:pl-4 flex items-start gap-2.5 pt-3 sm:pt-0">
              <div className="p-2 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 shrink-0">
                <Scale className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-400 uppercase tracking-wider block mb-0.5" title="Most recent notice/order or whatever issued">
                  Current Stage (Last Order)
                </span>
                <p className="font-semibold text-neutral-900 dark:text-white truncate" title={`Last Order / Current Stage: ${currentStage} (most recent notice/order or whatever issued)`}>
                  {currentStage}
                </p>
                <p className="text-neutral-500 dark:text-neutral-300 text-[11px] mt-0.5 truncate">
                  {lastIssuedProceeding?.date ? (
                    <span>Last Issued: <strong className="font-medium text-neutral-700 dark:text-neutral-200">{lastIssuedProceeding.date}</strong> &bull; Reader: <span className="text-neutral-700 dark:text-neutral-200">{getReaderForComplaint(complaint)}</span></span>
                  ) : (
                    <span>Reader: <span className="text-neutral-700 dark:text-neutral-200">{getReaderForComplaint(complaint)}</span></span>
                  )}
                </p>
              </div>
            </div>

            {/* Remarks / Bench Order */}
            <div className="sm:pl-4 flex items-start gap-2.5 pt-3 sm:pt-0">
              <div className="p-2 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-400 uppercase tracking-wider block mb-0.5">
                  Bench Remarks
                </span>
                <p className="text-neutral-700 dark:text-neutral-200 line-clamp-2 leading-tight" title={complaint.remarks || 'No remarks recorded'}>
                  {complaint.remarks || 'No order or remarks recorded for this case.'}
                </p>
              </div>
            </div>

            {/* Proactive Disclosure Status Column */}
            <div className="sm:pl-4 flex items-start gap-2.5 pt-3 sm:pt-0">
              <div className={`p-2 rounded-md ${isComplaintInformationDisclosed(complaint) ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' : 'bg-neutral-100 dark:bg-slate-800 text-neutral-500 dark:text-slate-400'} shrink-0`}>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-400 uppercase tracking-wider block mb-0.5">
                  Proactive Disclosure
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                    isComplaintInformationDisclosed(complaint)
                      ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-400 border border-neutral-200 dark:border-slate-700'
                  }`}>
                    {isComplaintInformationDisclosed(complaint) && <CheckCircle2 className="w-3 h-3" />}
                    {isComplaintInformationDisclosed(complaint) ? 'Disclosed' : 'Pending'}
                  </span>
                  {complaint.disclosureDate && (
                    <span className="text-[10px] text-neutral-500 dark:text-slate-400">{complaint.disclosureDate}</span>
                  )}
                </div>
                <p className="text-neutral-600 dark:text-neutral-300 text-[11px] mt-1 truncate" title={complaint.disclosedInformationSubject || (isComplaintInformationDisclosed(complaint) ? 'Information provided by public body' : 'Pending disclosure by public body')}>
                  {complaint.disclosedInformationSubject || (isComplaintInformationDisclosed(complaint) ? 'Information provided' : 'Pending disclosure')}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Proactive Disclosure & RTI Section 4 Compliance Section */}
        <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-200 dark:border-slate-800 bg-neutral-50 dark:bg-slate-800/90 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-md ${isComplaintInformationDisclosed(complaint) ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300' : 'bg-neutral-200 dark:bg-slate-700 text-neutral-600 dark:text-slate-300'}`}>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-neutral-900 dark:text-white text-xs sm:text-sm">
                    Proactive Disclosure &amp; RTI Compliance
                  </h3>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    isComplaintInformationDisclosed(complaint)
                      ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                  }`}>
                    {isComplaintInformationDisclosed(complaint) ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                    {isComplaintInformationDisclosed(complaint) ? 'Information Disclosed by Public Body' : 'Pending Proactive Disclosure'}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Certified record of requested public information disclosure under Sindh Transparency &amp; Right to Information Act (Synchronized with Dashboard Proactive Disclosure)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isEditingDisclosure ? (
                <button
                  type="button"
                  onClick={() => setIsEditingDisclosure(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {isComplaintInformationDisclosed(complaint) ? 'Edit Disclosure Details' : 'Record Proactive Disclosure'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingDisclosure(false);
                    setInfoDisclosed(Boolean(complaint.informationDisclosed));
                    setDisclosureDate(complaint.disclosureDate || '');
                    setDisclosedSubject(complaint.disclosedInformationSubject || '');
                    setDisclosureMode(complaint.disclosureMode || 'Direct Supply to Citizen');
                    setDisclosureRemarks(complaint.disclosureRemarks || '');
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-neutral-600 dark:text-slate-300 bg-neutral-100 dark:bg-slate-800 hover:bg-neutral-200 dark:hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Success message banner */}
          {disclosureSuccessMsg && (
            <div className="mx-4 mt-3 p-2 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{disclosureSuccessMsg}</span>
            </div>
          )}

          {/* Body Content */}
          <div className="p-4 text-xs">
            {!isEditingDisclosure ? (
              /* View Mode */
              isComplaintInformationDisclosed(complaint) ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-emerald-50/40 dark:bg-emerald-950/20 p-3.5 rounded-lg border border-emerald-100 dark:border-emerald-900/40">
                  <div>
                    <span className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block mb-0.5">
                      Compliance Status
                    </span>
                    <p className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                      Disclosed &amp; Provided
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block mb-0.5">
                      Date of Disclosure
                    </span>
                    <p className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      {complaint.disclosureDate || 'Recorded on Hearing'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block mb-0.5">
                      Mode of Disclosure
                    </span>
                    <p className="font-medium text-neutral-800 dark:text-slate-200">
                      {complaint.disclosureMode || 'Direct Supply to Citizen'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block mb-0.5">
                      Disclosing Department
                    </span>
                    <p className="font-medium text-neutral-800 dark:text-slate-200 truncate" title={complaint.respondentName}>
                      {complaint.respondentName}
                    </p>
                  </div>
                  <div className="md:col-span-4 pt-2 border-t border-emerald-200/50 dark:border-emerald-800/40">
                    <span className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                      Disclosed Information Subject / Records:
                    </span>
                    <p className="text-neutral-800 dark:text-slate-200 bg-white dark:bg-slate-900 p-2.5 rounded border border-emerald-200 dark:border-emerald-800/50 font-medium leading-relaxed">
                      {complaint.disclosedInformationSubject || complaint.remarks || 'Full requested public records disclosed to the applicant.'}
                    </p>
                    {complaint.disclosureRemarks && (
                      <p className="mt-1 text-[11px] text-neutral-500 dark:text-slate-400 italic">
                        Note: {complaint.disclosureRemarks}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-neutral-50 dark:bg-slate-800/50 rounded-lg border border-neutral-200 dark:border-slate-700/60">
                  <div className="space-y-0.5">
                    <p className="font-medium text-neutral-800 dark:text-slate-200">
                      No proactive disclosure record has been certified for this complaint yet.
                    </p>
                    <p className="text-neutral-500 dark:text-neutral-400 text-[11px]">
                      When the public body supplies the requested information or publishes it under Section 4, record it here to reflect on the Proactive Disclosure dashboard.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setInfoDisclosed(true);
                      if (!disclosureDate) {
                        setDisclosureDate(toDisplayDateFormat(new Date().toISOString().split('T')[0]));
                      }
                      setIsEditingDisclosure(true);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shrink-0 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Record Proactive Disclosure
                  </button>
                </div>
              )
            ) : (
              /* Edit Form */
              <div className="space-y-4 bg-neutral-50/70 dark:bg-slate-800/40 p-4 rounded-lg border border-neutral-200 dark:border-slate-700">
                {/* Checkbox / Toggle */}
                <div className="flex items-start gap-3 p-3 bg-white dark:bg-slate-900 rounded-lg border border-neutral-200 dark:border-slate-700">
                  <input
                    type="checkbox"
                    id="infoDisclosedCheckbox"
                    checked={infoDisclosed}
                    onChange={(e) => {
                      setInfoDisclosed(e.target.checked);
                      if (e.target.checked && !disclosureDate) {
                        setDisclosureDate(toDisplayDateFormat(new Date().toISOString().split('T')[0]));
                      }
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="infoDisclosedCheckbox" className="flex-1 cursor-pointer">
                    <span className="font-semibold text-neutral-900 dark:text-white block text-xs">
                      Information Disclosed by Public Body (Proactive Disclosure)
                    </span>
                    <span className="text-[11px] text-neutral-500 dark:text-slate-400 block mt-0.5">
                      Check this box when the respondent department has proactively disclosed, provided, or published the information requested by the citizen.
                    </span>
                  </label>
                </div>

                {infoDisclosed && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
                    {/* Disclosure Date */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-neutral-700 dark:text-slate-300 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          Date of Disclosure
                        </label>
                        <button
                          type="button"
                          onClick={() => setDisclosureDate(toDisplayDateFormat(new Date().toISOString().split('T')[0]))}
                          className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                        >
                          Today
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={disclosureDate}
                          onChange={(e) => setDisclosureDate(e.target.value)}
                          placeholder="DD-MM-YYYY"
                          className="flex-1 min-w-0 rounded-md border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-neutral-900 dark:text-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <input
                          type="date"
                          value={toInputDateFormat(disclosureDate)}
                          onChange={(e) => setDisclosureDate(toDisplayDateFormat(e.target.value))}
                          className="rounded-md border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-neutral-900 dark:text-white px-1.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shrink-0"
                          title="Pick date from calendar"
                        />
                      </div>
                    </div>

                    {/* Mode of Disclosure */}
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-700 dark:text-slate-300 mb-1">
                        Mode / Method of Disclosure
                      </label>
                      <select
                        value={disclosureMode}
                        onChange={(e) => setDisclosureMode(e.target.value)}
                        className="w-full rounded-md border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-neutral-900 dark:text-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                      >
                        <option value="Direct Supply to Citizen">Direct Supply to Complainant</option>
                        <option value="Uploaded to Official Website / Proactive Portal">Uploaded to Official Website / Proactive Portal</option>
                        <option value="Published in Official Gazette / Public Notice">Published in Official Gazette / Public Notice</option>
                        <option value="Physical Inspection of Records Allowed">Physical Inspection of Records Allowed</option>
                        <option value="Certified Copies Delivered by Post / Hand">Certified Copies Delivered by Post / Hand</option>
                      </select>
                    </div>

                    {/* Department / Public Body Verification */}
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-700 dark:text-slate-300 mb-1">
                        Disclosing Department
                      </label>
                      <input
                        type="text"
                        value={complaint.respondentName}
                        disabled
                        className="w-full rounded-md border border-neutral-200 dark:border-slate-800 bg-neutral-100 dark:bg-slate-900 text-neutral-600 dark:text-neutral-400 px-2.5 py-1.5 text-xs cursor-not-allowed"
                      />
                    </div>

                    {/* Disclosed Information Subject */}
                    <div className="sm:col-span-2 lg:col-span-3">
                      <label className="block text-[11px] font-semibold text-neutral-700 dark:text-slate-300 mb-1">
                        Disclosed Information Subject / Details <span className="text-emerald-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={disclosedSubject}
                        onChange={(e) => setDisclosedSubject(e.target.value)}
                        placeholder="e.g. Seniority list & cadre transfer notifications of Secretariat staff..."
                        className="w-full rounded-md border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-neutral-900 dark:text-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    {/* Compliance Remarks */}
                    <div className="sm:col-span-2 lg:col-span-3">
                      <label className="block text-[11px] font-semibold text-neutral-700 dark:text-slate-300 mb-1">
                        Compliance / Verification Remarks
                      </label>
                      <input
                        type="text"
                        value={disclosureRemarks}
                        onChange={(e) => setDisclosureRemarks(e.target.value)}
                        placeholder="Optional remarks regarding complainant verification or official compliance recording..."
                        className="w-full rounded-md border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-neutral-900 dark:text-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                )}

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setIsEditingDisclosure(false)}
                    className="px-3.5 py-1.5 text-xs font-medium rounded-md border border-neutral-300 dark:border-slate-700 text-neutral-700 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDisclosure}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Proactive Disclosure
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top Row: 4 Sections displayed side by side in ONE ROW */}
        <div className="overflow-x-auto pb-1">
          <div className="grid grid-cols-4 gap-2.5 xl:gap-3 items-stretch min-w-[760px] xl:min-w-0 w-full">
            
            {/* Column 1: Hearing Dates Schedule */}
            <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-lg shadow-sm flex flex-col overflow-hidden h-full">
              <div className="px-3 py-2.5 border-b border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800/90 flex items-center justify-between shrink-0">
                <h3 className="font-semibold text-neutral-900 dark:text-white text-xs flex items-center gap-1.5 truncate">
                  <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="truncate">Hearing Dates Schedule</span>
                </h3>
                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0 max-w-[80px] truncate" title={`Current Stage: ${currentStage}`}>
                  {currentStage}
                </span>
              </div>

              <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                <div className="space-y-2">
                  {/* Next Scheduled Hearing */}
                  <div className="p-2 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800/60">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        Next Hearing
                      </span>
                      <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-blue-100/80 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200">
                        Scheduled
                      </span>
                    </div>
                    <p className="text-sm font-bold text-blue-950 dark:text-white">
                      {complaint.nextHearingDate || 'Not Scheduled'}
                    </p>
                  </div>

                  {/* Previous Hearing Date */}
                  <div className="p-2 rounded-lg bg-neutral-50 dark:bg-slate-800/60 border border-neutral-200/80 dark:border-slate-700/80">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                        <Clock className="w-3 h-3 text-neutral-400" />
                        Previous Hearing
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-neutral-800 dark:text-white">
                      {complaint.previousHearingDate || 'Not Available'}
                    </p>
                  </div>

                  {/* Current Stage */}
                  <div className="p-2 rounded-lg bg-neutral-50 dark:bg-slate-800/60 border border-neutral-200/80 dark:border-slate-700/80">
                    <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block mb-0.5">
                      Current Stage / Status
                    </span>
                    <p className="text-xs font-semibold text-neutral-900 dark:text-white leading-snug truncate" title={currentStage}>
                      {currentStage}
                    </p>
                  </div>

                  {/* Bench Remarks / Order */}
                  <div className="p-2 rounded-lg bg-neutral-50 dark:bg-slate-800/60 border border-neutral-200/80 dark:border-slate-700/80">
                    <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block mb-0.5">
                      Bench Remarks / Order
                    </span>
                    <p className="text-xs text-neutral-700 dark:text-neutral-200 leading-relaxed line-clamp-2" title={complaint.remarks || 'No remarks recorded'}>
                      {complaint.remarks || 'No remarks recorded for this case.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Attendance History (Read-Only) */}
            <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-lg shadow-sm flex flex-col overflow-hidden h-full">
              <div className="px-3 py-2.5 border-b border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800/90 flex items-center justify-between shrink-0">
                <h3 className="font-semibold text-neutral-900 dark:text-white text-xs flex items-center gap-1.5 truncate">
                  <Users className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400 shrink-0" />
                  <span className="truncate">Attendance</span>
                </h3>
                {complaint.attendanceHistory.length > 0 && (
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0">
                    {complaint.attendanceHistory.length} {complaint.attendanceHistory.length === 1 ? 'Rec' : 'Recs'}
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-auto max-h-[360px] no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <table className="w-full text-left text-xs text-neutral-600 dark:text-neutral-300">
                  <thead className="bg-white dark:bg-slate-800/80 border-b border-neutral-100 dark:border-slate-700 text-neutral-500 dark:text-neutral-400 sticky top-0 text-[10px]">
                    <tr>
                      <th className="px-2 py-1.5 font-medium w-6 text-center">Sr.</th>
                      <th className="px-2 py-1.5 font-medium whitespace-nowrap">Date</th>
                      <th className="px-2 py-1.5 font-medium">Complainant</th>
                      <th className="px-2 py-1.5 font-medium">Respondent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-slate-800">
                    {complaint.attendanceHistory.length > 0 ? (
                      complaint.attendanceHistory.map((record) => (
                        <tr key={record.srNo} className="hover:bg-neutral-50 dark:hover:bg-slate-800/60 transition-colors text-[11px]">
                          <td className="px-2 py-1.5 text-center text-neutral-400 font-medium">{record.srNo}</td>
                          <td className="px-2 py-1.5 whitespace-nowrap text-neutral-900 dark:text-white font-medium">{record.date}</td>
                          <td className="px-2 py-1.5 leading-snug text-neutral-700 dark:text-neutral-200">{record.complainant}</td>
                          <td className="px-2 py-1.5 leading-snug text-neutral-700 dark:text-neutral-200">{record.respondent}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-3 py-10 text-center text-neutral-400 text-xs">
                          No attendance records found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Column 3: Future Proceedings (Notice / Order to be Issued) */}
            <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-lg shadow-sm flex flex-col overflow-hidden h-full">
              <div className="px-3 py-2.5 border-b border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800/90 flex items-center justify-between shrink-0">
                <h3 className="font-semibold text-neutral-900 dark:text-white text-xs flex items-center gap-1.5 truncate">
                  <FilePlus2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="truncate">Future Proceedings</span>
                </h3>
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                  Notice / Order
                </span>
              </div>

              {/* Action Button: Draft Custom Notice / Order */}
              <div className="p-1.5 border-b border-neutral-200 dark:border-slate-700 bg-neutral-50/70 dark:bg-slate-800/60">
                {canManageCustomNotices ? (
                  <button
                    type="button"
                    onClick={() => setIsCustomModalOpen(true)}
                    className="w-full py-1.5 px-2 rounded-md bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    title="Create a custom notice or order with any title/name to list in Future Proceedings for all complaints"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Draft Custom Notice / Order</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="w-full py-1.5 px-2 rounded-md bg-neutral-100 dark:bg-slate-800/80 text-neutral-400 dark:text-neutral-500 font-medium text-xs flex items-center justify-center gap-1.5 border border-dashed border-neutral-300 dark:border-slate-700 cursor-not-allowed"
                    title="Permission required: Only Superuser or Admin with Future Proceedings / Edit permission can create custom notices/orders"
                  >
                    <Lock className="w-3 h-3 text-neutral-400 dark:text-neutral-500" />
                    <span>+ Draft Custom Notice / Order</span>
                    <span className="text-[9px] font-normal text-neutral-400 dark:text-neutral-500 ml-0.5">(Restricted)</span>
                  </button>
                )}
              </div>

              <div className="px-2 py-1 bg-emerald-50/40 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-800/60 text-[10px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1 shrink-0">
                <AlertCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate">Click notice or order to draft for this case</span>
              </div>

              {/* Success Notification Banner for newly added custom notices */}
              {successNoticeMsg && (
                <div className="mx-1.5 mt-1.5 p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-[10px] flex items-start gap-1.5 animate-in fade-in slide-in-from-top-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span className="flex-1 font-medium leading-tight">{successNoticeMsg}</span>
                  <button 
                    type="button" 
                    onClick={() => setSuccessNoticeMsg(null)}
                    className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-200 p-0.5 cursor-pointer"
                    aria-label="Dismiss banner"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              <div className="flex-1 overflow-auto max-h-[295px] p-1.5 space-y-1.5 no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                
                {/* Custom Notices / Orders Section (if any created) */}
                {customNotices.length > 0 && (
                  <div className="space-y-1 mb-1.5">
                    <div className="flex items-center justify-between px-1 text-[9px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-purple-600 dark:text-purple-400" />
                        <span>Custom Notices &amp; Orders ({customNotices.length})</span>
                      </span>
                      <span className="text-[8px] font-normal lowercase text-purple-600 dark:text-purple-400">
                        available for all cases
                      </span>
                    </div>
                    {customNotices.map((notice) => {
                      const isNew = notice.id === justAddedNoticeId;
                      return (
                        <div
                          key={notice.id}
                          className={`w-full text-left p-1.5 rounded-lg border transition-all flex items-center justify-between group shadow-2xs ${
                            isNew 
                              ? 'border-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/50 dark:border-emerald-600 ring-1 ring-emerald-500/40'
                              : 'border-purple-200/90 dark:border-purple-800/70 bg-purple-50/30 dark:bg-purple-950/30 hover:bg-purple-50/70 dark:hover:bg-purple-950/60 hover:border-purple-300 dark:hover:border-purple-600'
                          }`}
                        >
                          <div 
                            className="min-w-0 pr-1.5 flex-1 cursor-pointer"
                            onClick={() => setSelectedDraftNotice(notice)}
                          >
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="text-[11px] font-semibold text-neutral-900 dark:text-white group-hover:text-purple-950 dark:group-hover:text-purple-200 truncate" title={notice.title}>
                                {notice.title}
                              </span>
                              <span className={`text-[8px] font-bold px-1 py-0.2 rounded border ${notice.tagColor}`}>
                                {notice.tag}
                              </span>
                              {isNew && (
                                <span className="text-[7.5px] font-bold px-1 py-0.2 rounded bg-emerald-600 text-white uppercase tracking-wider">
                                  New
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5 group-hover:text-neutral-700 dark:group-hover:text-neutral-200">
                              {notice.description}
                            </p>
                          </div>

                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setSelectedDraftNotice(notice)}
                              className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-purple-800 dark:text-purple-300 bg-white dark:bg-slate-800 hover:bg-purple-600 hover:text-white border border-purple-200 dark:border-purple-800 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                              title={`Draft ${notice.title} for this complaint`}
                            >
                              <span>Draft</span>
                              <ArrowRight className="w-2.5 h-2.5" />
                            </button>
                            {canManageCustomNotices && (
                              <button
                                type="button"
                                onClick={(e) => handleRemoveCustomNotice(e, notice.id)}
                                className="p-0.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded transition-colors cursor-pointer"
                                title="Remove custom template from all complaints"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Predefined Statutory Templates */}
                <div className="space-y-1">
                  {customNotices.length > 0 && (
                    <div className="px-1 text-[9px] font-bold text-neutral-400 uppercase tracking-wider">
                      Standard Templates
                    </div>
                  )}
                  {NOTICE_TYPES.map((notice) => (
                    <button
                      key={notice.id}
                      type="button"
                      onClick={() => setSelectedDraftNotice(notice)}
                      className="w-full text-left p-1.5 rounded-lg border border-neutral-200/90 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 bg-white dark:bg-slate-800/70 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30 transition-all flex items-center justify-between group cursor-pointer shadow-2xs"
                    >
                      <div className="min-w-0 pr-1.5">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-[11px] font-semibold text-neutral-900 dark:text-white group-hover:text-emerald-950 dark:group-hover:text-emerald-200 truncate">
                            {notice.title}
                          </span>
                          <span className={`text-[8px] font-bold px-1 py-0.2 rounded border ${notice.tagColor}`}>
                            {notice.tag}
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5 group-hover:text-neutral-700 dark:group-hover:text-neutral-200">
                          {notice.description}
                        </p>
                      </div>

                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 group-hover:bg-emerald-600 group-hover:text-white px-1.5 py-0.5 rounded transition-colors shrink-0">
                        <span>Draft</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 4: Proceeding History */}
            <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-lg shadow-sm flex flex-col overflow-hidden h-full">
              <div className="px-3 py-2.5 border-b border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800/90 flex items-center justify-between shrink-0">
                <h3 className="font-semibold text-neutral-900 dark:text-white text-xs flex items-center gap-1.5 truncate">
                  <FileText className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400 shrink-0" />
                  <span className="truncate">Proceeding History</span>
                </h3>
                {complaint.proceedings.length > 0 && (
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0">
                    {complaint.proceedings.length} {complaint.proceedings.length === 1 ? 'Rec' : 'Recs'}
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-auto max-h-[360px] no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <table className="w-full text-left text-xs text-neutral-600 dark:text-neutral-300">
                  <thead className="bg-white dark:bg-slate-800/80 border-b border-neutral-100 dark:border-slate-700 text-neutral-500 dark:text-neutral-400 sticky top-0 text-[10px]">
                    <tr>
                      <th className="px-2 py-1.5 font-medium w-6 text-center">Sr.</th>
                      <th className="px-2 py-1.5 font-medium">Orders / Notices</th>
                      <th className="px-2 py-1.5 font-medium whitespace-nowrap">Date</th>
                      <th className="px-2 py-1.5 font-medium text-right">View</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-slate-800">
                    {(() => {
                      const sortedProceedings = getSortedProceedings(complaint.proceedings);
                      return sortedProceedings.length > 0 ? (
                        sortedProceedings.map((proc) => {
                          const isLatest = proc.srNo === lastIssuedProceeding?.srNo && proc.title === lastIssuedProceeding?.title;
                          return (
                            <tr key={proc.srNo} className={`hover:bg-neutral-50 dark:hover:bg-slate-800/60 transition-colors text-[11px] ${isLatest ? 'bg-blue-50/30 dark:bg-blue-950/30' : ''}`}>
                              <td className="px-2 py-1.5 text-center text-neutral-400 font-medium">{proc.srNo}</td>
                              <td className="px-2 py-1.5 text-neutral-900 dark:text-white font-medium leading-tight">
                                <div className="flex items-center gap-1 flex-wrap">
                                  <span>{proc.title}</span>
                                  {isLatest && (
                                    <span className="px-1 py-0.2 text-[8px] font-semibold rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800" title="Most recent notice/order or whatever issued">
                                      Latest
                                    </span>
                                  )}
                                  {proc.attachment && (
                                    <span className={`px-1 py-0.2 text-[8px] font-semibold rounded ${
                                      proc.attachment.type.includes('pdf')
                                        ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                        : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                    }`}>
                                      {proc.attachment.type.includes('pdf') ? 'PDF' : 'PNG'}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-2 py-1.5 whitespace-nowrap text-neutral-500 dark:text-neutral-400 font-medium text-[10px]">{proc.date}</td>
                              <td className="px-2 py-1.5 text-right whitespace-nowrap">
                                <button 
                                  type="button"
                                  onClick={() => setViewingProceeding(proc)}
                                  className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium text-[10px] bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                                  title={`View ${proc.title}`}
                                >
                                  <Eye className="w-3 h-3" />
                                  <span className="hidden sm:inline">View</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-3 py-8 text-center text-neutral-400">No proceedings recorded</td>
                        </tr>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          {/* Submissions Section */}
          <ComplaintSubmissions complaint={complaint} />

          {/* Bottom Row: Case Diary (Case Proceeding) */}
          <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden h-full">
          <div className="px-5 py-3.5 border-b border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800/90 flex items-center justify-between shrink-0">
            <h3 className="font-semibold text-neutral-900 dark:text-white text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
              Case Diary (Case Proceeding)
            </h3>
            <div className="flex items-center gap-3">
              {complaint.diaries.length > 0 && (
                <>
                  <span className="text-xs text-neutral-500 dark:text-neutral-300 font-medium">
                    {complaint.diaries.length} {complaint.diaries.length === 1 ? 'entry' : 'entries'}
                  </span>
                  <button 
                    onClick={() => printDiaries([complaint], `Diaries for Complaint No: ${complaint.complaintNo}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-700 rounded-md hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print Diaries
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-600 dark:text-neutral-300">
              <thead className="bg-white dark:bg-slate-800/80 border-b border-neutral-100 dark:border-slate-700 text-neutral-500 dark:text-neutral-400">
                <tr>
                  <th className="px-4 py-3 font-medium w-16 text-center text-xs">Sr. No.</th>
                  <th className="px-4 py-3 font-medium text-xs">Diary</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap w-32 text-xs">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-slate-800">
                {complaint.diaries.length > 0 ? (
                  complaint.diaries.map((entry) => {
                    const isExpanded = expandedDiaryIds.has(entry.srNo);
                    return (
                      <tr 
                        key={entry.srNo} 
                        onClick={() => toggleDiaryExpand(entry.srNo)}
                        className="hover:bg-neutral-50/80 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                        title={isExpanded ? "Click to collapse diary" : "Click to read complete diary"}
                      >
                        <td className="px-4 py-3 text-center text-neutral-500 dark:text-neutral-400 align-top text-xs font-medium w-16 select-none">
                          {entry.srNo}
                        </td>
                        <td className="px-4 py-3 align-top text-xs">
                          {isExpanded ? (
                            <p className="leading-relaxed text-neutral-900 dark:text-white whitespace-pre-wrap">
                              {entry.diary}
                            </p>
                          ) : (
                            <p className="text-neutral-700 dark:text-neutral-200 line-clamp-1 leading-relaxed hover:text-neutral-900 dark:hover:text-white">
                              {entry.diary}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap align-top text-neutral-500 dark:text-neutral-400 text-xs w-32 font-medium">
                          {entry.date}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-neutral-400 text-xs">No diary entries recorded</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        </div>

      </div>

      {/* Notice / Order Document Viewer Modal */}
      {viewingProceeding && (
        <DocumentViewerModal
          isOpen={Boolean(viewingProceeding)}
          onClose={() => setViewingProceeding(null)}
          complaintNo={complaintId}
          complainantName={complaint.complainantName}
          respondentName={complaint.respondentName}
          proceeding={viewingProceeding}
          onUploadAttachment={(newAttachment) => {
            updateProceedingAttachment(complaintId, viewingProceeding.srNo, newAttachment);
            setViewingProceeding((prev) => (prev ? { ...prev, attachment: newAttachment } : null));
          }}
        />
      )}

      {/* Future Proceedings: Notice / Order Draft Modal */}
      {selectedDraftNotice && (
        <NoticeDraftModal
          isOpen={Boolean(selectedDraftNotice)}
          onClose={() => setSelectedDraftNotice(null)}
          complaint={complaint}
          noticeConfig={selectedDraftNotice}
        />
      )}

      {/* Custom Notice / Order Creation Modal */}
      <CustomNoticeModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onCreate={handleCreateCustomNotice}
      />

      {/* Comprehensive Report Modal */}
      <ComprehensiveReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        complaint={complaint}
      />
    </div>
  );
}
