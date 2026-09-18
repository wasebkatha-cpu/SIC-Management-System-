import React, { useState, useEffect } from 'react';
import { 
  X, 
  Bell, 
  Send, 
  Mail, 
  Phone, 
  FileText, 
  User, 
  Building2, 
  CheckCircle2, 
  Clock, 
  ExternalLink,
  MessageSquare,
  Search,
  Check,
  Sparkles,
  Trash2,
  FileDown,
  Calendar
} from 'lucide-react';
import { 
  NoticeDraftRecord, 
  getStoredDrafts, 
  markDraftAsRead, 
  deleteDraft 
} from '../utils/draftStorage';
import { downloadDraftNoticePdf } from '../utils/draftPdfGenerator';
import { toDisplayDateFormat } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import DraftDispatchModal from './DraftDispatchModal';

interface DraftNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenComplaint?: (complaintNo: string) => void;
}

export default function DraftNotificationModal({
  isOpen,
  onClose,
  onOpenComplaint
}: DraftNotificationModalProps) {
  const { user } = useAuth();
  const [drafts, setDrafts] = useState<NoticeDraftRecord[]>(() => getStoredDrafts());
  const [filter, setFilter] = useState<'all' | 'unread' | 'dispatched'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDispatchDraft, setActiveDispatchDraft] = useState<NoticeDraftRecord | null>(null);

  const isSuperUser = user?.role === 'superUser';

  useEffect(() => {
    const handleUpdate = () => {
      setDrafts(getStoredDrafts());
    };

    window.addEventListener('notice_draft_added', handleUpdate);
    window.addEventListener('notice_drafts_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('notice_draft_added', handleUpdate);
      window.removeEventListener('notice_drafts_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  if (!isOpen) return null;

  const filteredDrafts = drafts.filter(d => {
    if (filter === 'unread' && d.isReadBySuperUser) return false;
    if (filter === 'dispatched' && (!d.dispatches || d.dispatches.length === 0)) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchNo = d.complaintNo.toLowerCase().includes(q);
      const matchTitle = d.title.toLowerCase().includes(q);
      const matchComp = d.complainant.name.toLowerCase().includes(q);
      const matchResp = d.respondent.department.toLowerCase().includes(q);
      const matchCreator = d.createdBy.name.toLowerCase().includes(q);
      return matchNo || matchTitle || matchComp || matchResp || matchCreator;
    }
    return true;
  });

  const unreadCount = drafts.filter(d => !d.isReadBySuperUser).length;

  const handleMarkAllRead = () => {
    drafts.forEach(d => {
      if (!d.isReadBySuperUser) markDraftAsRead(d.id);
    });
    setDrafts(getStoredDrafts());
  };

  const handleOpenDispatch = (draft: NoticeDraftRecord) => {
    if (!draft.isReadBySuperUser) {
      markDraftAsRead(draft.id);
    }
    setActiveDispatchDraft(draft);
  };

  const handleDelete = (e: React.MouseEvent, draftId: string) => {
    e.stopPropagation();
    if (window.confirm('Delete this notice draft record?')) {
      deleteDraft(draftId);
      setDrafts(getStoredDrafts());
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-900/60 backdrop-blur-xs overflow-y-auto">
        <div 
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-neutral-200 dark:border-slate-800 bg-neutral-50/90 dark:bg-slate-800/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 relative">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                    Notice Drafts &amp; Dispatch Notifications
                  </h2>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {drafts.length} Total Drafts
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-slate-400 mt-0.5">
                  Notices &amp; Orders drafted by SuperUser &amp; Admin ready for review and transmission to Complainant &amp; Designated Officer
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded-lg hover:bg-neutral-200/60 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="px-6 py-3 border-b border-neutral-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search case, title, parties, creator..."
                className="w-full rounded-lg border border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800 pl-8 pr-3 py-1.5 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <div className="inline-flex rounded-lg border border-neutral-200 dark:border-slate-700 p-0.5 bg-neutral-100/70 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    filter === 'all' 
                      ? 'bg-white dark:bg-slate-900 text-neutral-900 dark:text-white shadow-2xs' 
                      : 'text-neutral-600 dark:text-slate-400 hover:text-neutral-900'
                  }`}
                >
                  All ({drafts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('unread')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    filter === 'unread' 
                      ? 'bg-white dark:bg-slate-900 text-neutral-900 dark:text-white shadow-2xs' 
                      : 'text-neutral-600 dark:text-slate-400 hover:text-neutral-900'
                  }`}
                >
                  New ({unreadCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('dispatched')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    filter === 'dispatched' 
                      ? 'bg-white dark:bg-slate-900 text-neutral-900 dark:text-white shadow-2xs' 
                      : 'text-neutral-600 dark:text-slate-400 hover:text-neutral-900'
                  }`}
                >
                  Dispatched
                </button>
              </div>

              {unreadCount > 0 && isSuperUser && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline px-2 py-1 cursor-pointer whitespace-nowrap"
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          {/* Drafts List */}
          <div className="p-6 overflow-y-auto space-y-3.5 flex-1 bg-neutral-50/50 dark:bg-slate-950/40">
            {filteredDrafts.length > 0 ? (
              filteredDrafts.map((draft) => {
                const isNew = !draft.isReadBySuperUser;
                const hasDispatches = draft.dispatches && draft.dispatches.length > 0;

                return (
                  <div
                    key={draft.id}
                    className={`p-4 rounded-xl border transition-all bg-white dark:bg-slate-900 shadow-xs hover:border-blue-300 dark:hover:border-blue-700 ${
                      isNew 
                        ? 'border-blue-300 dark:border-blue-700/80 ring-1 ring-blue-500/20 bg-blue-50/20 dark:bg-blue-950/10' 
                        : 'border-neutral-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      
                      {/* Left: Draft Info */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-blue-700 dark:text-blue-400">
                            {draft.complaintNo}
                          </span>
                          <span className="text-neutral-300 dark:text-slate-600">•</span>
                          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                            {draft.title}
                          </h3>
                          {isNew && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                              NEW DRAFT
                            </span>
                          )}
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            hasDispatches 
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200' 
                              : 'bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-400 border border-neutral-200'
                          }`}>
                            {hasDispatches ? `Dispatched (${draft.dispatches.length})` : 'Draft Pending Transmission'}
                          </span>
                        </div>

                        <p className="text-xs text-neutral-600 dark:text-slate-300 line-clamp-1">
                          <strong>Parties:</strong> {draft.complainant.name} <span className="text-neutral-400 mx-1">V/S</span> {draft.respondent.department}
                        </p>

                        <div className="flex items-center gap-3 text-[11px] text-neutral-500 dark:text-slate-400 flex-wrap pt-0.5">
                          <span>
                            Drafted by: <strong className="text-neutral-800 dark:text-slate-200">{draft.createdBy.name}</strong> ({draft.createdBy.role})
                          </span>
                          <span>•</span>
                          <span>{new Date(draft.createdAt).toLocaleString('en-GB')}</span>
                          {draft.complainant.contactNumber && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-600 dark:text-emerald-400">
                                WA: {draft.complainant.contactNumber}
                              </span>
                            </>
                          )}
                          {draft.respondent.email && (
                            <>
                              <span>•</span>
                              <span className="text-blue-600 dark:text-blue-400">
                                Mail: {draft.respondent.email}
                              </span>
                            </>
                          )}
                          {draft.nextHearingDate && (
                            <>
                              <span>•</span>
                              <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                                <Calendar className="w-3 h-3 text-emerald-600" />
                                Next Hearing: {toDisplayDateFormat(draft.nextHearingDate)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {isSuperUser && (
                          <button
                            type="button"
                            onClick={() => handleOpenDispatch(draft)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                            title="Send draft via Gmail / WhatsApp"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Send Draft</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            downloadDraftNoticePdf({
                              complaintNo: draft.complaintNo,
                              complainantName: draft.complainant.name,
                              respondentDept: draft.respondent.department,
                              designatedOfficialName: draft.respondent.officialName,
                              designatedOfficialDesignation: draft.respondent.designation,
                              nextHearingDate: draft.nextHearingDate,
                              title: draft.title,
                              category: draft.category,
                              contentText: draft.contentText,
                              createdAt: draft.createdAt,
                              createdByName: draft.createdBy.name,
                              createdByRole: draft.createdBy.role === 'superUser' ? 'SuperUser' : 'Admin'
                            });
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-neutral-200 dark:border-slate-700 text-neutral-700 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer"
                          title="Download official PDF of this draft"
                        >
                          <FileDown className="w-3.5 h-3.5 text-red-600" />
                          <span className="hidden md:inline">PDF</span>
                        </button>

                        {onOpenComplaint && (
                          <button
                            type="button"
                            onClick={() => {
                              onOpenComplaint(draft.complaintNo);
                              onClose();
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-slate-700 text-neutral-700 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer"
                            title="Open case in Complaints"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">View Case</span>
                          </button>
                        )}

                        {isSuperUser && (
                          <button
                            type="button"
                            onClick={(e) => handleDelete(e, draft.id)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors cursor-pointer"
                            title="Delete draft record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-neutral-400 dark:text-neutral-500 space-y-2">
                <FileText className="w-8 h-8 mx-auto text-neutral-300 dark:text-neutral-600" />
                <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  {searchTerm ? `No drafts match "${searchTerm}"` : 'No notice or order drafts saved yet'}
                </p>
                <p className="text-xs text-neutral-500">
                  Drafts created in Future Proceedings (Complaint Details or Cause List) by SuperUser &amp; Admin will appear here.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-neutral-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0">
            <span className="text-xs text-neutral-500 dark:text-slate-400">
              Only SuperUsers can dispatch official notices via Gmail &amp; WhatsApp.
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-neutral-600 dark:text-slate-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-lg border border-neutral-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Embedded Dispatch Modal if active */}
      {activeDispatchDraft && (
        <DraftDispatchModal
          isOpen={Boolean(activeDispatchDraft)}
          onClose={() => setActiveDispatchDraft(null)}
          draft={activeDispatchDraft}
          onDispatchRecorded={() => setDrafts(getStoredDrafts())}
        />
      )}
    </>
  );
}
