import { ArrowLeft, Save, Plus, Eye, BookOpen, FileText, Users, Calendar, Clock, CheckCircle, RefreshCw, Upload, Paperclip, X, FilePlus2, ArrowRight, AlertCircle, Edit3, Trash2, Sparkles, Lock, CheckCircle2, Check } from 'lucide-react';
import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import { useAppContext, ProceedingRecord, ProceedingAttachment, getMostRecentProceeding, getComplaintCurrentStage, getSortedProceedings, isComplaintInformationDisclosed } from '../context/AppContext';
import { toInputDateFormat, toDisplayDateFormat, addDaysToDate } from '../utils/dateUtils';
import { DocumentViewerModal } from './documentViewerModal';
import { NoticeDraftModal, NOTICE_TYPES, NoticeTypeConfig } from './noticeDraftModal';
import { CustomNoticeModal } from './customNoticeModal';
import ComplaintSubmissions from './complaintSubmissions';
import { getStoredCustomNotices, saveCustomNotice, removeCustomNotice, initCustomNoticesListener } from '../utils/customNoticesStorage';

import { useAuth } from '../context/AuthContext';
interface CauseListProceedingProps {
  complaintNo: string;
  parties: string;
  hearingDate: string;
  onBack: () => void;
  onNavigateToDate?: (date: string) => void;
}

export default function CauseListProceeding({ complaintNo, parties, hearingDate, onBack, onNavigateToDate }: CauseListProceedingProps) {
  const { user, hasPermission, logActivity } = useAuth();
  const { complaints, addAttendance, addProceeding, updateProceedingAttachment, addDiary, updateHearingDates, updateComplaint } = useAppContext();
  
  const complaint = complaints.find(c => c.complaintNo === complaintNo);

  const canManageCustomNotices = Boolean(
    user?.role === 'superUser' || 
    (user?.role === 'admin' && (hasPermission('causelist_update_future_proceedings') || hasPermission('complaints_edit')))
  );
  
  // Attendance states
  const [attendanceTab, setAttendanceTab] = useState<'record' | 'history'>('record');
  const [complainantAttendance, setComplainantAttendance] = useState('');
  const [respondentAttendance, setRespondentAttendance] = useState('');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Hearing Schedule states
  const [nextHearingDate, setNextHearingDate] = useState(complaint?.nextHearingDate || '');
  const [prevHearingDate, setPrevHearingDate] = useState(
    complaint?.previousHearingDate || hearingDate || ''
  );
  const [isAutoPrevDate, setIsAutoPrevDate] = useState(true);
  const [selectedStatusStage, setSelectedStatusStage] = useState(complaint?.statusStage || 'Hearing in Progress');
  const [hearingRemarks, setHearingRemarks] = useState(complaint?.remarks || '');
  const [scheduleSuccessMessage, setScheduleSuccessMessage] = useState<string | null>(null);

  // Proactive Disclosure states
  const [infoDisclosed, setInfoDisclosed] = useState<boolean>(complaint?.informationDisclosed ?? false);
  const [disclosureDate, setDisclosureDate] = useState<string>(
    complaint?.disclosureDate || (hearingDate ? toDisplayDateFormat(hearingDate) : '')
  );
  const [disclosedSubject, setDisclosedSubject] = useState<string>(complaint?.disclosedInformationSubject || '');
  const [disclosureMode, setDisclosureMode] = useState<string>(complaint?.disclosureMode || 'Direct Supply to Citizen');
  const [disclosureRemarks, setDisclosureRemarks] = useState<string>(complaint?.disclosureRemarks || '');
  const [proactiveSuccessMsg, setProactiveSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (complaint) {
      setInfoDisclosed(Boolean(complaint.informationDisclosed));
      setDisclosureDate(complaint.disclosureDate || (hearingDate ? toDisplayDateFormat(hearingDate) : ''));
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
    complaint?.disclosureRemarks,
    hearingDate
  ]);

  const handleQuickSaveDisclosure = async () => {
    const effectiveDate = infoDisclosed
      ? (disclosureDate.trim() ? toDisplayDateFormat(disclosureDate.trim()) : toDisplayDateFormat(hearingDate || new Date().toISOString().split('T')[0]))
      : '';

    await updateComplaint(complaintNo, {
      informationDisclosed: infoDisclosed,
      disclosureDate: effectiveDate,
      disclosedInformationSubject: infoDisclosed ? disclosedSubject.trim() : '',
      disclosureMode: infoDisclosed ? disclosureMode : '',
      disclosureRemarks: infoDisclosed ? disclosureRemarks.trim() : ''
    });

    setProactiveSuccessMsg("Proactive disclosure saved! Synchronized with RTI Dashboard.");
    setTimeout(() => setProactiveSuccessMsg(null), 3500);
    await logActivity(`Updated Proactive Disclosure for ${complaintNo} during cause list hearing: ${infoDisclosed ? `Disclosed (${effectiveDate})` : 'Pending'}`);
  };
  
  // Proceeding states
  const [isAddingProceeding, setIsAddingProceeding] = useState(false);
  const [newProceedingTitle, setNewProceedingTitle] = useState('');
  const [newProceedingDate, setNewProceedingDate] = useState(
    hearingDate ? toDisplayDateFormat(hearingDate) : toDisplayDateFormat(new Date().toISOString().split('T')[0])
  );
  const [newProceedingAttachment, setNewProceedingAttachment] = useState<ProceedingAttachment | null>(null);
  const [viewingProceeding, setViewingProceeding] = useState<ProceedingRecord | null>(null);
  const [selectedDraftNotice, setSelectedDraftNotice] = useState<NoticeTypeConfig | null>(null);
  
  // Custom Notice / Order states
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customNotices, setCustomNotices] = useState<NoticeTypeConfig[]>(() => getStoredCustomNotices());
  const [justAddedNoticeId, setJustAddedNoticeId] = useState<string | null>(null);
  const [successNoticeMsg, setSuccessNoticeMsg] = useState<string | null>(null);

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
      alert('Permission required: Only Superuser or Admin with Future Proceedings / Edit permission can remove custom templates.');
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

  const proceedingFileInputRef = useRef<HTMLInputElement>(null);

  // Case Diary states
  const [isAddingDiary, setIsAddingDiary] = useState(false);
  const [newDiaryEntry, setNewDiaryEntry] = useState('');
  const [expandedDiaryIds, setExpandedDiaryIds] = useState<Set<number>>(new Set());

  // Derive Current Stage: explicitly resolved as the most recent notice/order or whatever was issued
  const lastIssuedProceeding = getMostRecentProceeding(complaint);
  const currentStage = lastIssuedProceeding?.title || complaint?.statusStage || 'Hearing in Progress';

  const standardStages = [
    "Call Report",
    "First Notice issued",
    "Final Notice issued",
    "Repeat Final Notice issued",
    "Order issued",
    "Show Cause Notice Issued",
    "Final Show Cause Notice Issued",
    "Adjournment Order Issued",
    "Hearing in Progress",
    "Order Reserved",
    "Disposed-Off Order issued"
  ];
  const allStages = standardStages.includes(selectedStatusStage) 
    ? standardStages 
    : [selectedStatusStage, ...standardStages];

  // Sync state when complaint updates
  useEffect(() => {
    if (complaint) {
      const latestIssued = getComplaintCurrentStage(complaint);

      setNextHearingDate(complaint.nextHearingDate || '');
      setPrevHearingDate(complaint.previousHearingDate || hearingDate || '');
      setSelectedStatusStage(latestIssued);
      setHearingRemarks(complaint.remarks || '');
    }
  }, [
    complaint?.complaintNo,
    complaint?.nextHearingDate,
    complaint?.previousHearingDate,
    complaint?.statusStage,
    complaint?.remarks,
    complaint?.proceedings
  ]);

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
  
  if (!complaint) return null;

  const handleSaveAttendance = () => {
    if (complainantAttendance.trim() || respondentAttendance.trim()) {
      addAttendance(complaintNo, hearingDate, complainantAttendance, respondentAttendance);
      setComplainantAttendance('');
      setRespondentAttendance('');
      setSaveSuccessMessage("Attendance saved successfully!");
      setTimeout(() => setSaveSuccessMessage(null), 3000);
    }
  };

  const handleSaveSchedule = () => {
    const effectivePrev = prevHearingDate.trim() || (isAutoPrevDate ? hearingDate : complaint?.previousHearingDate || '');
    const effectiveNext = nextHearingDate.trim();

    if (!effectiveNext) {
      setScheduleSuccessMessage("Please specify a Next Hearing Date before saving.");
      setTimeout(() => setScheduleSuccessMessage(null), 3000);
      return;
    }

    const normalizedNext = toDisplayDateFormat(effectiveNext);
    const normalizedPrev = toDisplayDateFormat(effectivePrev);
    
    // Update local state to normalized format immediately
    setNextHearingDate(normalizedNext);
    setPrevHearingDate(normalizedPrev);

    const effectiveDisclosureDate = infoDisclosed
      ? (disclosureDate.trim() ? toDisplayDateFormat(disclosureDate.trim()) : toDisplayDateFormat(hearingDate || new Date().toISOString().split('T')[0]))
      : '';

    const proactiveUpdates = {
      informationDisclosed: infoDisclosed,
      disclosureDate: effectiveDisclosureDate,
      disclosedInformationSubject: infoDisclosed ? disclosedSubject.trim() : '',
      disclosureMode: infoDisclosed ? disclosureMode : '',
      disclosureRemarks: infoDisclosed ? disclosureRemarks.trim() : ''
    };

    updateHearingDates(
      complaintNo,
      normalizedNext,
      normalizedPrev,
      selectedStatusStage,
      hearingRemarks,
      true,
      hearingDate,
      proactiveUpdates
    );

    updateComplaint(complaintNo, proactiveUpdates);

    setScheduleSuccessMessage(
      `Hearing schedule saved! Next: ${normalizedNext} | Previous: ${normalizedPrev}. Preserved in Cause List of ${hearingDate} for data archive and scheduled in Cause List of ${normalizedNext}.`
    );
    setTimeout(() => setScheduleSuccessMessage(null), 4000);
  };

  const handleProceedingFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const formattedSize = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

      setNewProceedingAttachment({
        name: file.name,
        type: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/png'),
        dataUrl,
        size: formattedSize,
        uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });

      // Auto-suggest title if user hasn't typed one yet
      if (!newProceedingTitle.trim()) {
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        setNewProceedingTitle(cleanName);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveProceeding = () => {
    if (newProceedingTitle.trim() || newProceedingAttachment) {
      const effectiveTitle = newProceedingTitle.trim() || newProceedingAttachment?.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ") || 'Issued Notice / Order';
      const effectiveDate = newProceedingDate.trim() || (hearingDate ? toDisplayDateFormat(hearingDate) : toDisplayDateFormat(new Date().toISOString().split('T')[0]));
      addProceeding(
        complaintNo,
        effectiveDate,
        effectiveTitle,
        newProceedingAttachment?.type.includes('pdf') ? 'FileText' : 'FileText',
        newProceedingAttachment || undefined
      );
      setSelectedStatusStage(effectiveTitle);
      setNewProceedingTitle('');
      setNewProceedingDate(hearingDate ? toDisplayDateFormat(hearingDate) : toDisplayDateFormat(new Date().toISOString().split('T')[0]));
      setNewProceedingAttachment(null);
      setIsAddingProceeding(false);
    }
  };

  const handleSaveDiary = () => {
    if (newDiaryEntry.trim()) {
      addDiary(complaintNo, hearingDate, newDiaryEntry);
      setNewDiaryEntry('');
      setIsAddingDiary(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-50 dark:bg-slate-900 text-neutral-900 dark:text-white overflow-hidden rounded-xl">
      {/* Header */}
      <div className="px-6 py-4 border-b border-neutral-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="mr-4 p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-slate-600 cursor-pointer"
            title="Back to detailed cause list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Manage Hearing: {complaintNo}</h2>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800" title={`Current Stage / Last Order: ${currentStage}`}>
                {currentStage}
              </span>
              {complaint && isComplaintInformationDisclosed(complaint) ? (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Information Disclosed
                </span>
              ) : (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-400 border border-neutral-200 dark:border-slate-700">
                  Pending Proactive Disclosure
                </span>
              )}
            </div>
            <p className="text-sm text-neutral-500 dark:text-slate-400 line-clamp-1">{parties}</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3">
          <div className="text-right">
            <span className="block text-xs text-neutral-500 dark:text-slate-400">Active Hearing Date</span>
            <span className="text-sm font-semibold text-neutral-900 dark:text-white">{hearingDate}</span>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto p-5 sm:p-6 space-y-6">
        
        {/* Archived Cause List Hearing Banner if adjourned to future date */}
        {complaint.nextHearingDate && toDisplayDateFormat(complaint.nextHearingDate) !== toDisplayDateFormat(hearingDate) && (
          <div className="p-3 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg text-xs text-blue-900 dark:text-blue-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>
                <strong>Archived Cause List Record ({hearingDate}):</strong> This matter was listed on {hearingDate} and adjourned to <strong>{complaint.nextHearingDate}</strong>. All proceedings, diaries, orders, and attendance for this hearing remain permanently archived here.
              </span>
            </div>
            {onNavigateToDate && (
              <button
                type="button"
                onClick={() => onNavigateToDate(complaint.nextHearingDate)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 underline shrink-0 cursor-pointer"
              >
                Open {complaint.nextHearingDate} Cause List &rarr;
              </button>
            )}
          </div>
        )}

        {/* Top Row: 4 Sections displayed side by side in ONE ROW */}
        <div className="overflow-x-auto pb-1">
          <div className="grid grid-cols-4 gap-2.5 xl:gap-3 items-stretch min-w-[760px] xl:min-w-0 w-full">
            
            {/* Column 1: Hearing Dates Schedule (Previous & Next Hearing Dates in One Unified Section) */}
            <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-lg shadow-sm flex flex-col overflow-hidden h-full">
              <div className="px-3 py-2.5 border-b border-neutral-200 dark:border-slate-800 bg-neutral-50 dark:bg-slate-800/90 flex items-center justify-between shrink-0">
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
                  
                  {/* Previous Hearing Date */}
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[10px] font-semibold text-neutral-700 dark:text-slate-300 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-neutral-500 dark:text-slate-400" />
                        Previous Hearing
                      </label>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-medium border ${
                        isAutoPrevDate ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                      }`}>
                        {isAutoPrevDate ? 'Auto' : 'Manual'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={prevHearingDate}
                        onChange={(e) => {
                          setPrevHearingDate(e.target.value);
                          setIsAutoPrevDate(false);
                        }}
                        placeholder="DD-MM-YYYY"
                        className="flex-1 min-w-0 rounded-md border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-neutral-900 dark:text-white px-2 py-1 text-[11px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="date"
                        value={toInputDateFormat(prevHearingDate)}
                        onChange={(e) => {
                          setPrevHearingDate(toDisplayDateFormat(e.target.value));
                          setIsAutoPrevDate(false);
                        }}
                        className="rounded-md border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-neutral-900 dark:text-white px-1 py-1 text-[11px] focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shrink-0"
                        title="Pick date from calendar"
                      />
                    </div>

                    <div className="flex items-center gap-1 mt-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => {
                          setPrevHearingDate(hearingDate);
                          setIsAutoPrevDate(true);
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 text-[10px] cursor-pointer"
                      >
                        <RefreshCw className="w-2.5 h-2.5 shrink-0" />
                        Auto-set ({hearingDate})
                      </button>
                    </div>
                  </div>

                  {/* Next Hearing Date */}
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[10px] font-semibold text-neutral-900 dark:text-white flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        Next Hearing Date
                      </label>
                      <span className="text-[9px] text-blue-600 dark:text-blue-400 font-medium">Required</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={nextHearingDate}
                        onChange={(e) => setNextHearingDate(e.target.value)}
                        placeholder="DD-MM-YYYY"
                        className="flex-1 min-w-0 rounded-md border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-950 px-2 py-1 text-[11px] font-medium text-blue-900 dark:text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="date"
                        value={toInputDateFormat(nextHearingDate)}
                        onChange={(e) => setNextHearingDate(toDisplayDateFormat(e.target.value))}
                        className="rounded-md border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-950 text-neutral-900 dark:text-white px-1 py-1 text-[11px] focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shrink-0"
                        title="Pick next hearing date from calendar"
                      />
                    </div>

                    {/* Quick Presets */}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {[
                        { label: '+7d', days: 7 },
                        { label: '+14d', days: 14 },
                        { label: '+21d', days: 21 },
                        { label: '+30d', days: 30 },
                      ].map((preset) => (
                        <button
                          key={preset.days}
                          type="button"
                          onClick={() => {
                            const calculated = addDaysToDate(hearingDate || new Date().toISOString(), preset.days);
                            setNextHearingDate(calculated);
                            if (isAutoPrevDate) {
                              setPrevHearingDate(hearingDate);
                            }
                          }}
                          className="px-1.5 py-0.5 text-[9px] rounded bg-neutral-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:text-blue-700 dark:hover:text-blue-300 text-neutral-700 dark:text-slate-300 border border-neutral-200 dark:border-slate-700 transition-colors cursor-pointer"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Case Status / Stage */}
                  <div>
                    <label className="block text-[10px] font-semibold text-neutral-700 dark:text-slate-300 mb-0.5">Case Status / Stage</label>
                    <select
                      value={selectedStatusStage}
                      onChange={(e) => setSelectedStatusStage(e.target.value)}
                      className="w-full rounded-md border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-neutral-900 dark:text-white px-2 py-1 text-[11px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {allStages.map((stage) => (
                        <option key={stage} value={stage}>{stage}</option>
                      ))}
                    </select>
                  </div>

                  {/* Bench Remarks / Order */}
                  <div>
                    <label className="block text-[10px] font-semibold text-neutral-700 dark:text-slate-300 mb-0.5">Bench Remarks / Order</label>
                    <input
                      type="text"
                      value={hearingRemarks}
                      onChange={(e) => setHearingRemarks(e.target.value)}
                      placeholder="Remarks / order details..."
                      className="w-full rounded-md border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-neutral-900 dark:text-white px-2 py-1 text-[11px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Proactive Disclosure Section */}
                  <div className="p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="text-[10px] font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">
                          Proactive Disclosure
                        </span>
                      </div>
                      <span className={`text-[9px] font-medium px-1.5 py-0.2 rounded ${
                        infoDisclosed 
                          ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200' 
                          : 'bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-400'
                      }`}>
                        {infoDisclosed ? 'Disclosed' : 'Pending'}
                      </span>
                    </div>

                    {/* Toggle */}
                    <div className="flex items-start gap-2 pt-0.5">
                      <input
                        type="checkbox"
                        id="causeListInfoDisclosed"
                        checked={infoDisclosed}
                        onChange={(e) => {
                          setInfoDisclosed(e.target.checked);
                          if (e.target.checked && !disclosureDate) {
                            setDisclosureDate(hearingDate ? toDisplayDateFormat(hearingDate) : toDisplayDateFormat(new Date().toISOString().split('T')[0]));
                          }
                        }}
                        className="mt-0.5 h-3.5 w-3.5 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <label htmlFor="causeListInfoDisclosed" className="text-[10px] text-neutral-800 dark:text-slate-200 font-medium cursor-pointer leading-tight">
                        Information Disclosed by Public Body
                      </label>
                    </div>

                    {/* Disclosure fields if checked */}
                    {infoDisclosed && (
                      <div className="space-y-2 pt-1">
                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="text-[9px] font-semibold text-neutral-700 dark:text-slate-300">
                              Date of Disclosure
                            </label>
                            {hearingDate && (
                              <button
                                type="button"
                                onClick={() => setDisclosureDate(toDisplayDateFormat(hearingDate))}
                                className="text-[8px] text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                              >
                                Hearing Date
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={disclosureDate}
                              onChange={(e) => setDisclosureDate(e.target.value)}
                              placeholder="DD-MM-YYYY"
                              className="flex-1 min-w-0 rounded border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-neutral-900 dark:text-white px-2 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                            <input
                              type="date"
                              value={toInputDateFormat(disclosureDate)}
                              onChange={(e) => setDisclosureDate(toDisplayDateFormat(e.target.value))}
                              className="rounded border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-1 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer shrink-0"
                              title="Pick date from calendar"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[9px] font-semibold text-neutral-700 dark:text-slate-300 mb-0.5">
                            Disclosed Information Subject
                          </label>
                          <input
                            type="text"
                            value={disclosedSubject}
                            onChange={(e) => setDisclosedSubject(e.target.value)}
                            placeholder="e.g. Seniority list / recruitment documents supplied..."
                            className="w-full rounded border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-neutral-900 dark:text-white px-2 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-semibold text-neutral-700 dark:text-slate-300 mb-0.5">
                            Mode of Disclosure
                          </label>
                          <select
                            value={disclosureMode}
                            onChange={(e) => setDisclosureMode(e.target.value)}
                            className="w-full rounded border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-neutral-900 dark:text-white px-1.5 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                          >
                            <option value="Direct Supply to Citizen">Direct Supply to Complainant</option>
                            <option value="Uploaded to Official Website / Proactive Portal">Uploaded to Official Website / Portal</option>
                            <option value="Published in Official Gazette / Public Notice">Published in Official Gazette / Notice</option>
                            <option value="Physical Inspection of Records Allowed">Physical Inspection Allowed</option>
                            <option value="Certified Copies Delivered by Post / Hand">Certified Copies by Post / Hand</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[9px] font-semibold text-neutral-700 dark:text-slate-300 mb-0.5">
                            Disclosure Remarks
                          </label>
                          <input
                            type="text"
                            value={disclosureRemarks}
                            onChange={(e) => setDisclosureRemarks(e.target.value)}
                            placeholder="Optional compliance / verification notes..."
                            className="w-full rounded border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-neutral-900 dark:text-white px-2 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>

                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={handleQuickSaveDisclosure}
                            className="w-full flex items-center justify-center gap-1 py-1 px-2 rounded bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-[10px] font-semibold transition-colors cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                            Update Disclosure Now
                          </button>
                        </div>
                      </div>
                    )}

                    {proactiveSuccessMsg && (
                      <p className="text-[9px] text-emerald-700 dark:text-emerald-300 font-medium mt-1">
                        {proactiveSuccessMsg}
                      </p>
                    )}
                  </div>

                </div>

                {/* Action / Save Bar */}
                <div className="pt-2 border-t border-neutral-100 dark:border-slate-800">
                  {scheduleSuccessMessage && (
                    <div className="mb-2 p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[10px] font-medium text-emerald-800 dark:text-emerald-300 space-y-1">
                      <div className="flex items-start gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">{scheduleSuccessMessage}</span>
                      </div>
                      {onNavigateToDate && nextHearingDate && (
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => onNavigateToDate(nextHearingDate)}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 underline cursor-pointer"
                          >
                            Open {nextHearingDate} Cause List &rarr;
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveSchedule}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-md text-xs font-medium transition-colors shadow-xs cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Hearing Schedule
                  </button>
                </div>

              </div>
            </div>

            {/* Column 2: Update Attendance & Attendance History */}
            <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-lg shadow-sm flex flex-col overflow-hidden h-full">
              <div className="px-3 py-2.5 border-b border-neutral-200 dark:border-slate-800 bg-neutral-50 dark:bg-slate-800/90 flex items-center justify-between shrink-0">
                <h3 className="font-semibold text-neutral-900 dark:text-white text-xs flex items-center gap-1.5 truncate">
                  <Users className="w-3.5 h-3.5 text-neutral-500 dark:text-slate-400 shrink-0" />
                  <span className="truncate">Attendance</span>
                </h3>

                {/* Tab Switcher between Record form and History list */}
                <div className="flex items-center bg-neutral-200/80 dark:bg-slate-800 p-0.5 rounded-md text-[10px]">
                  <button
                    type="button"
                    onClick={() => setAttendanceTab('record')}
                    className={`px-1.5 py-0.5 rounded font-medium transition-all cursor-pointer ${
                      attendanceTab === 'record'
                        ? 'bg-white dark:bg-slate-950 text-blue-700 dark:text-blue-400 shadow-2xs font-semibold'
                        : 'text-neutral-600 dark:text-slate-300 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    Record
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendanceTab('history')}
                    className={`px-1.5 py-0.5 rounded font-medium transition-all cursor-pointer flex items-center gap-1 ${
                      attendanceTab === 'history'
                        ? 'bg-white dark:bg-slate-950 text-blue-700 dark:text-blue-400 shadow-2xs font-semibold'
                        : 'text-neutral-600 dark:text-slate-300 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    <span>History</span>
                    {complaint.attendanceHistory.length > 0 && (
                      <span className="w-3.5 h-3.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 text-[8px] flex items-center justify-center font-bold">
                        {complaint.attendanceHistory.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {attendanceTab === 'record' ? (
                <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-neutral-700 dark:text-slate-300 mb-0.5">
                        Complainant / Advocate
                      </label>
                      <textarea 
                        className="w-full rounded-md border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-neutral-900 dark:text-white px-2 py-1 text-[11px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[80px]" 
                        placeholder="Enter complainant attendance details..."
                        value={complainantAttendance}
                        onChange={(e) => setComplainantAttendance(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-neutral-700 dark:text-slate-300 mb-0.5">
                        Respondent Public Body / Officials
                      </label>
                      <textarea 
                        className="w-full rounded-md border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-neutral-900 dark:text-white px-2 py-1 text-[11px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[80px]" 
                        placeholder="Enter respondent attendance details..."
                        value={respondentAttendance}
                        onChange={(e) => setRespondentAttendance(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Action / Save Bar */}
                  <div className="pt-2 border-t border-neutral-100 dark:border-slate-800">
                    {saveSuccessMessage && (
                      <div className="mb-2 p-1.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[10px] font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="truncate">{saveSuccessMessage}</span>
                      </div>
                    )}
                    <button 
                      type="button"
                      onClick={() => {
                        handleSaveAttendance();
                        setAttendanceTab('history');
                      }}
                      className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition-colors shadow-xs cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save Attendance
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-auto max-h-[360px] no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <table className="w-full text-left text-xs text-neutral-600 dark:text-slate-300">
                    <thead className="bg-white dark:bg-slate-900 border-b border-neutral-100 dark:border-slate-800 text-neutral-500 dark:text-slate-400 sticky top-0 text-[10px]">
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
                            <td className="px-2 py-1.5 text-center text-neutral-400 dark:text-slate-500 font-medium">{record.srNo}</td>
                            <td className="px-2 py-1.5 whitespace-nowrap text-neutral-900 dark:text-white font-medium">{record.date}</td>
                            <td className="px-2 py-1.5 leading-snug text-neutral-700 dark:text-slate-300">{record.complainant}</td>
                            <td className="px-2 py-1.5 leading-snug text-neutral-700 dark:text-slate-300">{record.respondent}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-3 py-10 text-center text-neutral-400 dark:text-slate-500 text-xs">
                            No attendance records found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Column 3: Future Proceedings (Notice or Order to be Issued) */}
            <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-lg shadow-sm flex flex-col overflow-hidden h-full">
              <div className="px-3 py-2.5 border-b border-neutral-200 dark:border-slate-800 bg-neutral-50 dark:bg-slate-800/90 flex items-center justify-between shrink-0">
                <h3 className="font-semibold text-neutral-900 dark:text-white text-xs flex items-center gap-1.5 truncate">
                  <FilePlus2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="truncate">Future Proceedings</span>
                </h3>
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                  Notice / Order
                </span>
              </div>

              {/* Action Button: Draft Custom Notice / Order */}
              <div className="p-1.5 border-b border-neutral-200 dark:border-slate-800 bg-neutral-50/70 dark:bg-slate-800/50">
                {canManageCustomNotices ? (
                  <button
                    type="button"
                    onClick={() => setIsCustomModalOpen(true)}
                    className="w-full py-1.5 px-2 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
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

              <div className="p-1.5 flex-1 overflow-y-auto space-y-1.5 max-h-[445px]">
                {/* Custom Notices / Orders Section */}
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
                              : 'border-purple-200/90 dark:border-purple-800/70 bg-purple-50/30 dark:bg-purple-950/20 hover:bg-purple-50/70 dark:hover:bg-purple-950/40 hover:border-purple-300 dark:hover:border-purple-600'
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
                            <p className="text-[10px] text-neutral-500 dark:text-slate-400 truncate mt-0.5 group-hover:text-neutral-700 dark:group-hover:text-slate-200">
                              {notice.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setSelectedDraftNotice(notice)}
                              className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-purple-800 dark:text-purple-300 bg-white dark:bg-slate-900 hover:bg-purple-600 hover:text-white border border-purple-200 dark:border-purple-700 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                              title={`Draft ${notice.title} for this complaint`}
                            >
                              <span>Draft</span>
                              <ArrowRight className="w-2.5 h-2.5" />
                            </button>
                            {canManageCustomNotices && (
                              <button
                                type="button"
                                onClick={(e) => handleRemoveCustomNotice(e, notice.id)}
                                className="p-0.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
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

                <div className="bg-neutral-50 dark:bg-slate-800/60 border border-neutral-200 dark:border-slate-700 rounded-md p-1.5 text-[10px] text-neutral-600 dark:text-slate-300 leading-snug">
                  Click any action button below to open its rich text draft with default RTI parawise comments:
                </div>

                <div className="space-y-1">
                  <div className="text-[9px] font-bold text-neutral-400 dark:text-slate-400 uppercase tracking-wider px-1 pt-1">
                    Notices to be Issued
                  </div>
                  {NOTICE_TYPES.filter(n => n.category === 'Notice').map((notice) => (
                    <button
                      key={notice.id}
                      type="button"
                      onClick={() => setSelectedDraftNotice(notice)}
                      className="w-full text-left p-1.5 rounded-lg border border-neutral-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30 hover:shadow-2xs transition-all group cursor-pointer flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-[11px] font-semibold text-neutral-800 dark:text-slate-200 group-hover:text-emerald-900 dark:group-hover:text-emerald-300 truncate">
                            {notice.title}
                          </span>
                          <span className={`text-[8px] font-semibold px-1 py-0.2 rounded-full border ${notice.tagColor}`}>
                            {notice.tag}
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {notice.description}
                        </p>
                      </div>
                      <ArrowRight className="w-3 h-3 text-neutral-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  ))}

                  <div className="text-[9px] font-bold text-neutral-400 dark:text-slate-400 uppercase tracking-wider px-1 pt-1.5">
                    Orders to be Passed
                  </div>
                  {NOTICE_TYPES.filter(n => n.category === 'Order').map((order) => (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => setSelectedDraftNotice(order)}
                      className="w-full text-left p-1.5 rounded-lg border border-neutral-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 hover:shadow-2xs transition-all group cursor-pointer flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-[11px] font-semibold text-neutral-800 dark:text-slate-200 group-hover:text-indigo-900 dark:group-hover:text-indigo-300 truncate">
                            {order.title}
                          </span>
                          <span className={`text-[8px] font-semibold px-1 py-0.2 rounded-full border ${order.tagColor}`}>
                            {order.tag}
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {order.description}
                        </p>
                      </div>
                      <ArrowRight className="w-3 h-3 text-neutral-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-2 border-t border-neutral-100 dark:border-slate-800 bg-neutral-50 dark:bg-slate-800/60 text-[10px] text-neutral-500 dark:text-slate-400 flex items-center justify-between">
                <span>9 Pre-configured Drafts</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <Edit3 className="w-2.5 h-2.5" />
                  Rich Text
                </span>
              </div>
            </div>

            {/* Column 4: Proceeding History */}
            <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-lg shadow-sm flex flex-col overflow-hidden h-full">
              <div className="px-3 py-2.5 border-b border-neutral-200 dark:border-slate-800 bg-neutral-50 dark:bg-slate-800/90 flex items-center justify-between shrink-0">
                <h3 className="font-semibold text-neutral-900 dark:text-white text-xs flex items-center gap-1.5 truncate">
                  <FileText className="w-3.5 h-3.5 text-neutral-500 dark:text-slate-400 shrink-0" />
                  <span className="truncate">Proceeding History</span>
                </h3>
                {!isAddingProceeding && (
                  <button 
                    onClick={() => setIsAddingProceeding(true)}
                    className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-[10px] font-medium bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-1.5 py-0.5 rounded transition-colors shrink-0 cursor-pointer"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    Add
                  </button>
                )}
              </div>

              {isAddingProceeding && (
                <div className="p-2 border-b border-neutral-200 dark:border-slate-800 bg-blue-50/40 dark:bg-slate-800/80 shrink-0">
                  <div className="flex flex-col gap-2">
                    <div>
                      <label className="block text-[10px] font-medium text-neutral-700 dark:text-slate-300 mb-0.5">
                        Notice / Order Title
                      </label>
                      <input 
                        type="text" 
                        value={newProceedingTitle}
                        onChange={(e) => setNewProceedingTitle(e.target.value)}
                        placeholder="e.g. Notice of Hearing..."
                        className="w-full rounded-md border border-neutral-300 dark:border-slate-700 px-2 py-1 text-[11px] focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 text-neutral-900 dark:text-white"
                        autoFocus
                      />
                    </div>

                    {/* Issuance Date Field */}
                    <div>
                      <label className="block text-[10px] font-medium text-neutral-700 dark:text-slate-300 mb-0.5">
                        Issuance Date (DD-MM-YYYY)
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input 
                          type="text" 
                          value={newProceedingDate}
                          onChange={(e) => setNewProceedingDate(e.target.value)}
                          placeholder="DD-MM-YYYY"
                          className="flex-1 rounded-md border border-neutral-300 dark:border-slate-700 px-2 py-1 text-[11px] focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 text-neutral-900 dark:text-white font-mono"
                        />
                        <div className="relative shrink-0">
                          <input 
                            type="date"
                            value={toInputDateFormat(newProceedingDate)}
                            onChange={(e) => {
                              if (e.target.value) {
                                setNewProceedingDate(toDisplayDateFormat(e.target.value));
                              }
                            }}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                            title="Select Issuance Date"
                          />
                          <button
                            type="button"
                            className="p-1 bg-white dark:bg-slate-950 border border-neutral-300 dark:border-slate-700 hover:border-blue-500 hover:text-blue-600 rounded-md text-neutral-500 dark:text-slate-400 transition-colors pointer-events-none"
                          >
                            <Calendar className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Attachment Upload (PDF / PNG) */}
                    <div>
                      <label className="block text-[10px] font-medium text-neutral-700 dark:text-slate-300 mb-0.5">
                        Attachment (PDF / PNG)
                      </label>
                      {newProceedingAttachment ? (
                        <div className="flex items-center justify-between p-1.5 bg-white dark:bg-slate-950 border border-blue-200 dark:border-blue-800 rounded-md shadow-2xs">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="p-0.5 bg-blue-50 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded shrink-0">
                              <Paperclip className="w-3 h-3" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-[11px] font-medium text-neutral-800 dark:text-white truncate max-w-[150px]">
                                {newProceedingAttachment.name}
                              </p>
                              <p className="text-[9px] text-neutral-400 dark:text-slate-500">
                                {newProceedingAttachment.size} • {newProceedingAttachment.type.includes('pdf') ? 'PDF' : 'Image'}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setNewProceedingAttachment(null)}
                            className="text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 p-0.5 rounded transition-colors cursor-pointer"
                            title="Remove attachment"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <input 
                            type="file"
                            ref={proceedingFileInputRef}
                            onChange={handleProceedingFileChange}
                            accept=".pdf,image/png,image/jpeg,image/webp"
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => proceedingFileInputRef.current?.click()}
                            className="w-full flex items-center justify-center gap-1 px-2 py-1.5 border border-dashed border-neutral-300 dark:border-slate-700 hover:border-blue-500 bg-white dark:bg-slate-950 hover:bg-blue-50/50 dark:hover:bg-blue-950/40 rounded-md text-[11px] text-neutral-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer"
                          >
                            <Upload className="w-3 h-3 text-neutral-400" />
                            <span>Upload Attachment</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-neutral-200/60 dark:border-slate-700 mt-1">
                      <button 
                        type="button"
                        onClick={() => { 
                          setIsAddingProceeding(false); 
                          setNewProceedingTitle(''); 
                          setNewProceedingAttachment(null); 
                        }}
                        className="px-2 py-1 text-[11px] text-neutral-500 dark:text-slate-400 hover:text-neutral-700 dark:hover:text-slate-200 hover:bg-neutral-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button 
                        type="button"
                        onClick={handleSaveProceeding}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        Save Proceeding
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-auto max-h-[360px] no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <table className="w-full text-left text-xs text-neutral-600 dark:text-slate-300">
                  <thead className="bg-white dark:bg-slate-900 border-b border-neutral-100 dark:border-slate-800 text-neutral-500 dark:text-slate-400 sticky top-0 text-[10px]">
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
                              <td className="px-2 py-1.5 text-center text-neutral-400 dark:text-slate-500 font-medium">{proc.srNo}</td>
                              <td className="px-2 py-1.5 text-neutral-900 dark:text-white font-medium leading-tight">
                                <div className="flex items-center gap-1 flex-wrap">
                                  <span>{proc.title}</span>
                                  {isLatest && (
                                    <span className="px-1 py-0.2 text-[8px] font-semibold rounded bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800" title="Most recent notice/order or whatever issued">
                                      Latest
                                    </span>
                                  )}
                                  {proc.attachment && (
                                    <span className={`px-1 py-0.2 text-[8px] font-semibold rounded ${
                                      proc.attachment.type.includes('pdf')
                                        ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                        : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                    }`}>
                                      {proc.attachment.type.includes('pdf') ? 'PDF' : 'PNG'}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-2 py-1.5 whitespace-nowrap text-neutral-500 dark:text-slate-400 font-medium text-[10px]">{proc.date}</td>
                              <td className="px-2 py-1.5 text-right whitespace-nowrap">
                                <button 
                                  type="button"
                                  onClick={() => setViewingProceeding(proc)}
                                  className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-medium text-[10px] bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
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
                          <td colSpan={4} className="px-3 py-10 text-center text-neutral-400 dark:text-slate-500 text-xs">No proceedings recorded</td>
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

        {/* Bottom Row (Below all these): Case Diary */}
        <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden h-full">
          <div className="px-5 py-3.5 border-b border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800/90 flex items-center justify-between shrink-0">
            <h3 className="font-semibold text-neutral-900 dark:text-white text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-neutral-500 dark:text-slate-400" />
              Case Diary (Case Proceeding)
            </h3>
            {!isAddingDiary && (
              <button 
                onClick={() => setIsAddingDiary(true)}
                className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-xs font-medium bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-3 py-1.5 rounded-md transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Diary
              </button>
            )}
          </div>

          {isAddingDiary && (
            <div className="p-4 border-b border-neutral-100 dark:border-slate-700 bg-blue-50/30 dark:bg-slate-800/70">
              <div className="flex gap-3 items-start">
                <textarea 
                  value={newDiaryEntry}
                  onChange={(e) => setNewDiaryEntry(e.target.value)}
                  placeholder="Enter case diary details..."
                  className="flex-1 rounded-md border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-neutral-900 dark:text-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[75px]"
                  autoFocus
                />
                <div className="flex flex-col gap-2 shrink-0">
                  <button 
                    onClick={handleSaveDiary}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition-colors cursor-pointer"
                  >
                    Save
                  </button>
                  <button 
                    onClick={() => { setIsAddingDiary(false); setNewDiaryEntry(''); }}
                    className="px-3 py-2 text-neutral-500 dark:text-slate-400 hover:text-neutral-700 dark:hover:text-slate-200 hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-md transition-colors text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-600 dark:text-slate-300">
              <thead className="bg-white dark:bg-slate-900 border-b border-neutral-100 dark:border-slate-800 text-neutral-500 dark:text-slate-400">
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
                        <td className="px-4 py-3 text-center text-neutral-500 dark:text-slate-400 align-top text-xs font-medium w-16 select-none">
                          {entry.srNo}
                        </td>
                        <td className="px-4 py-3 align-top text-xs">
                          {isExpanded ? (
                            <p className="leading-relaxed text-neutral-900 dark:text-white whitespace-pre-wrap">
                              {entry.diary}
                            </p>
                          ) : (
                            <p className="text-neutral-700 dark:text-slate-300 line-clamp-1 leading-relaxed hover:text-neutral-900 dark:hover:text-white">
                              {entry.diary}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap align-top text-neutral-500 dark:text-slate-400 text-xs w-32 font-medium">
                          {entry.date}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-neutral-400 dark:text-slate-500 text-xs">No diary entries recorded</td>
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
          complaintNo={complaintNo}
          complainantName={complaint?.complainantName}
          respondentName={complaint?.respondentName}
          proceeding={viewingProceeding}
          onUploadAttachment={(newAttachment) => {
            updateProceedingAttachment(complaintNo, viewingProceeding.srNo, newAttachment);
            setViewingProceeding((prev) => (prev ? { ...prev, attachment: newAttachment } : null));
          }}
        />
      )}

      {/* Rich Text Notice / Order Draft Modal */}
      {selectedDraftNotice && complaint && (
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
    </div>
  );
}

