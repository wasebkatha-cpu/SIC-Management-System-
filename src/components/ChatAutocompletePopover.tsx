import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Shield, Users, FileText, Calendar, Clock, ChevronRight, Hash, AtSign, Building2, UserCheck, User, MapPin } from 'lucide-react';
import { ComplaintData, isComplaintOnCauseList, getComplaintCurrentStage, PublicBody } from '../context/AppContext';
import { MockUser } from '../lib/mockDb';
import { toDisplayDateFormat, isTodayDate, isUpcomingDate, getDaysFromToday, getNormalizedDateTimestamp } from '../utils/dateUtils';

export interface ChatAutocompleteRef {
  moveUp: () => void;
  moveDown: () => void;
  selectCurrent: () => boolean;
  hasSelection: () => boolean;
}

interface CauseListItem {
  date: string;
  isToday: boolean;
  daysDiff: number;
  caseCount: number;
}

interface ChatAutocompletePopoverProps {
  inputText: string;
  isOpen: boolean;
  complaints: ComplaintData[];
  users: MockUser[];
  publicBodies?: PublicBody[];
  onSelect: (replacementText: string) => void;
  onClose: () => void;
}

export const ChatAutocompletePopover = forwardRef<ChatAutocompleteRef, ChatAutocompletePopoverProps>(
  ({ inputText, isOpen, complaints, users, publicBodies = [], onSelect, onClose }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Determine mode based on trigger character
    const trimmed = inputText.trim();
    const mode: 'mentions' | 'complaints' | 'causelist' | 'publicbodies' | 'officials' | null =
      trimmed.startsWith('@')
        ? 'mentions'
        : trimmed.startsWith('#')
        ? 'complaints'
        : trimmed.startsWith('>')
        ? 'causelist'
        : trimmed.startsWith('!') || trimmed.startsWith('$') || trimmed.toLowerCase().startsWith('/pb')
        ? 'publicbodies'
        : trimmed.startsWith('*') || trimmed.startsWith('~') || trimmed.startsWith('^') || trimmed.startsWith('?') || trimmed.toLowerCase().startsWith('/do')
        ? 'officials'
        : null;

    // Filter admins and superusers for '@'
    const adminUsers = React.useMemo(() => {
      if (mode !== 'mentions') return [];
      const query = trimmed.slice(1).trim().toLowerCase();
      const allAdmins = users.filter(u => u.role === 'superUser' || u.role === 'admin');
      if (!query) return allAdmins;
      return allAdmins.filter(
        u =>
          (u.name && u.name.toLowerCase().includes(query)) ||
          (u.username && u.username.toLowerCase().includes(query))
      );
    }, [users, mode, trimmed]);

    // Filter complaints for '#'
    const filteredComplaints = React.useMemo(() => {
      if (mode !== 'complaints') return [];
      const query = trimmed.slice(1).trim().toLowerCase();
      if (!query) return complaints.slice(0, 20);
      return complaints
        .filter(c => {
          return (
            c.complaintNo.toLowerCase().includes(query) ||
            c.complainantName.toLowerCase().includes(query) ||
            c.respondentName.toLowerCase().includes(query) ||
            (c.district && c.district.toLowerCase().includes(query)) ||
            (c.statusStage && c.statusStage.toLowerCase().includes(query))
          );
        })
        .slice(0, 25);
    }, [complaints, mode, trimmed]);

    // Compute Today's and Upcoming cause lists for '>'
    const causeLists = React.useMemo(() => {
      if (mode !== 'causelist') return [];
      const query = trimmed.slice(1).trim().toLowerCase();

      const now = new Date();
      const todayStr = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;

      // Extract all unique dates from complaints plus today and initial seed dates
      const seedDates = [todayStr, '15-09-2026', '16-09-2026', '17-09-2026'];
      const complaintDates = complaints.flatMap(c => [
        ...(c.causeListDates || []),
        c.nextHearingDate,
        c.previousHearingDate,
        ...(c.attendanceHistory || []).map(a => a.date),
        ...(c.diaries || []).map(d => d.date),
        ...(c.proceedings || []).map(p => p.date),
      ]).map(d => toDisplayDateFormat(d)).filter(Boolean);

      const uniqueDates = Array.from(new Set([...seedDates, ...complaintDates]));

      const list: CauseListItem[] = uniqueDates
        .filter(d => isTodayDate(d) || isUpcomingDate(d))
        .sort((a, b) => {
          if (isTodayDate(a)) return -1;
          if (isTodayDate(b)) return 1;
          return getNormalizedDateTimestamp(a) - getNormalizedDateTimestamp(b);
        })
        .map(dateStr => {
          const isToday = isTodayDate(dateStr);
          const daysDiff = getDaysFromToday(dateStr);
          const count = complaints.filter(c => isComplaintOnCauseList(c, dateStr)).length;
          return {
            date: dateStr,
            isToday,
            daysDiff,
            caseCount: count
          };
        });

      if (!query) return list;
      return list.filter(item => {
        return (
          item.date.toLowerCase().includes(query) ||
          (item.isToday && 'today'.includes(query)) ||
          (!item.isToday && 'upcoming'.includes(query))
        );
      });
    }, [complaints, mode, trimmed]);

    // Filter public bodies for '!' or '$'
    const filteredPublicBodies = React.useMemo(() => {
      if (mode !== 'publicbodies') return [];
      let query = trimmed;
      if (query.startsWith('!') || query.startsWith('$')) {
        query = query.slice(1).trim().toLowerCase();
      } else if (query.toLowerCase().startsWith('/pb')) {
        query = query.slice(3).trim().toLowerCase();
      } else {
        query = query.trim().toLowerCase();
      }

      if (!query) return publicBodies.slice(0, 25);
      return publicBodies.filter(pb =>
        pb.name.toLowerCase().includes(query) ||
        pb.district.toLowerCase().includes(query) ||
        pb.division.toLowerCase().includes(query) ||
        pb.designatedOfficialName.toLowerCase().includes(query)
      ).slice(0, 25);
    }, [publicBodies, mode, trimmed]);

    // Filter designated officials for '*' or '~' or '^'
    const filteredOfficials = React.useMemo(() => {
      if (mode !== 'officials') return [];
      let query = trimmed;
      if (query.startsWith('*') || query.startsWith('~') || query.startsWith('^') || query.startsWith('?')) {
        query = query.slice(1).trim().toLowerCase();
      } else if (query.toLowerCase().startsWith('/do')) {
        query = query.slice(3).trim().toLowerCase();
      } else {
        query = query.trim().toLowerCase();
      }

      // Valid officials from public bodies
      const list = publicBodies.filter(
        pb => pb.designatedOfficialName && pb.designatedOfficialName.trim() !== '' && pb.designatedOfficialName.toLowerCase() !== 'unknown official'
      );

      if (!query) return list.slice(0, 25);
      return list.filter(pb =>
        pb.designatedOfficialName.toLowerCase().includes(query) ||
        pb.designatedOfficialDesignation.toLowerCase().includes(query) ||
        pb.name.toLowerCase().includes(query) ||
        pb.district.toLowerCase().includes(query)
      ).slice(0, 25);
    }, [publicBodies, mode, trimmed]);

    // Count of active items
    const itemCount =
      mode === 'mentions'
        ? adminUsers.length
        : mode === 'complaints'
        ? filteredComplaints.length
        : mode === 'causelist'
        ? causeLists.length
        : mode === 'publicbodies'
        ? filteredPublicBodies.length
        : mode === 'officials'
        ? filteredOfficials.length
        : 0;

    // Reset selected index when query/mode changes
    useEffect(() => {
      setSelectedIndex(0);
    }, [trimmed, mode]);

    // Expose keyboard navigation methods to parent textarea
    useImperativeHandle(ref, () => ({
      moveUp: () => {
        if (itemCount === 0) return;
        setSelectedIndex(prev => (prev - 1 + itemCount) % itemCount);
      },
      moveDown: () => {
        if (itemCount === 0) return;
        setSelectedIndex(prev => (prev + 1) % itemCount);
      },
      hasSelection: () => itemCount > 0,
      selectCurrent: () => {
        if (itemCount === 0) return false;
        if (mode === 'mentions' && adminUsers[selectedIndex]) {
          const u = adminUsers[selectedIndex];
          onSelect(`@${u.name || u.username} `);
          return true;
        }
        if (mode === 'complaints' && filteredComplaints[selectedIndex]) {
          const c = filteredComplaints[selectedIndex];
          onSelect(`#${c.complaintNo} `);
          return true;
        }
        if (mode === 'causelist' && causeLists[selectedIndex]) {
          const item = causeLists[selectedIndex];
          const tag = item.isToday ? ' (Today)' : ` (Upcoming - in ${item.daysDiff}d)`;
          onSelect(`> Cause List: ${item.date}${tag} `);
          return true;
        }
        if (mode === 'publicbodies' && filteredPublicBodies[selectedIndex]) {
          const pb = filteredPublicBodies[selectedIndex];
          onSelect(`!${pb.name} `);
          return true;
        }
        if (mode === 'officials' && filteredOfficials[selectedIndex]) {
          const pb = filteredOfficials[selectedIndex];
          onSelect(`*${pb.designatedOfficialName} (${pb.name}) `);
          return true;
        }
        return false;
      }
    }));

    if (!isOpen || !mode) return null;

    return (
      <div className="absolute bottom-full left-0 right-0 mb-2 z-40 bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150">
        {/* Header Bar */}
        <div className="px-3.5 py-2.5 bg-neutral-50 dark:bg-slate-950/80 border-b border-neutral-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {mode === 'mentions' && (
              <>
                <div className="p-1 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <AtSign className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-neutral-800 dark:text-white uppercase tracking-wider">
                  Mention Admin or SuperUser ({adminUsers.length})
                </span>
              </>
            )}
            {mode === 'complaints' && (
              <>
                <div className="p-1 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                  <Hash className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-neutral-800 dark:text-white uppercase tracking-wider">
                  Link Complaint from Registry ({filteredComplaints.length})
                </span>
              </>
            )}
            {mode === 'causelist' && (
              <>
                <div className="p-1 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-neutral-800 dark:text-white uppercase tracking-wider">
                  Link Cause List (Today & Upcoming) ({causeLists.length})
                </span>
              </>
            )}
            {mode === 'publicbodies' && (
              <>
                <div className="p-1 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-neutral-800 dark:text-white uppercase tracking-wider">
                  Link Public Body / Department ({filteredPublicBodies.length})
                </span>
              </>
            )}
            {mode === 'officials' && (
              <>
                <div className="p-1 rounded-md bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400">
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-neutral-800 dark:text-white uppercase tracking-wider">
                  Link Designated Official / PIO ({filteredOfficials.length})
                </span>
              </>
            )}
          </div>
          <span className="text-[11px] text-neutral-400 dark:text-slate-500 hidden sm:inline">
            Use <kbd className="px-1 py-0.5 rounded bg-neutral-200 dark:bg-slate-800 text-[10px]">↑</kbd> <kbd className="px-1 py-0.5 rounded bg-neutral-200 dark:bg-slate-800 text-[10px]">↓</kbd> to navigate, <kbd className="px-1 py-0.5 rounded bg-neutral-200 dark:bg-slate-800 text-[10px]">Enter</kbd> to select
          </span>
        </div>

        {/* Quick Trigger Chips */}
        <div className="px-3 py-1.5 bg-neutral-100/70 dark:bg-slate-950/40 border-b border-neutral-200/70 dark:border-slate-800/60 flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <span className="text-neutral-400 dark:text-slate-500 text-[10px] uppercase font-semibold shrink-0">Shortcuts:</span>
          <button
            type="button"
            onClick={() => onSelect('@')}
            className={`px-2 py-0.5 rounded-full font-medium transition-colors shrink-0 cursor-pointer ${
              mode === 'mentions'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-white dark:bg-slate-800 text-neutral-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/50'
            }`}
          >
            @ Admins
          </button>
          <button
            type="button"
            onClick={() => onSelect('#')}
            className={`px-2 py-0.5 rounded-full font-medium transition-colors shrink-0 cursor-pointer ${
              mode === 'complaints'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-white dark:bg-slate-800 text-neutral-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/50'
            }`}
          >
            # Complaints
          </button>
          <button
            type="button"
            onClick={() => onSelect('> ')}
            className={`px-2 py-0.5 rounded-full font-medium transition-colors shrink-0 cursor-pointer ${
              mode === 'causelist'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-white dark:bg-slate-800 text-neutral-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
            }`}
          >
            &gt; Cause List
          </button>
          <button
            type="button"
            onClick={() => onSelect('!')}
            className={`px-2 py-0.5 rounded-full font-medium transition-colors shrink-0 cursor-pointer ${
              mode === 'publicbodies'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-white dark:bg-slate-800 text-neutral-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50'
            }`}
          >
            ! Public Body
          </button>
          <button
            type="button"
            onClick={() => onSelect('*')}
            className={`px-2 py-0.5 rounded-full font-medium transition-colors shrink-0 cursor-pointer ${
              mode === 'officials'
                ? 'bg-teal-600 text-white shadow-2xs'
                : 'bg-white dark:bg-slate-800 text-neutral-600 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-teal-950/50'
            }`}
          >
            * Designated Official
          </button>
        </div>

        {/* Scrollable List Container */}
        <div className="max-h-64 overflow-y-auto divide-y divide-neutral-100 dark:divide-slate-800/60 p-1">
          {/* MODE 1: MENTIONS */}
          {mode === 'mentions' && (
            <>
              {adminUsers.length === 0 ? (
                <div className="p-4 text-center text-xs text-neutral-500 dark:text-slate-400">
                  No matching admins or superusers found for "{trimmed.slice(1)}"
                </div>
              ) : (
                adminUsers.map((u, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onMouseEnter={() => setSelectedIndex(idx)}
                      onClick={() => onSelect(`@${u.name || u.username} `)}
                      className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-950 dark:text-blue-100'
                          : 'hover:bg-neutral-50 dark:hover:bg-slate-800/60 text-neutral-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {u.avatarUrl ? (
                          <img
                            src={u.avatarUrl}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover border border-neutral-200 dark:border-slate-700 shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {(u.name || u.username).charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-semibold truncate text-neutral-900 dark:text-white">
                            {u.name || u.username}
                          </div>
                          <div className="text-[11px] text-neutral-500 dark:text-slate-400 truncate">
                            @{u.username}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            u.role === 'superUser'
                              ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                              : 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                          }`}
                        >
                          {u.role === 'superUser' ? 'Super User' : 'Admin'}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                      </div>
                    </button>
                  );
                })
              )}
            </>
          )}

          {/* MODE 2: COMPLAINTS */}
          {mode === 'complaints' && (
            <>
              {filteredComplaints.length === 0 ? (
                <div className="p-4 text-center text-xs text-neutral-500 dark:text-slate-400">
                  No complaints found matching "{trimmed.slice(1)}"
                </div>
              ) : (
                filteredComplaints.map((c, idx) => {
                  const isSelected = idx === selectedIndex;
                  const currentStage = getComplaintCurrentStage(c);
                  const party = c.publicBodyName || c.respondentName;
                  return (
                    <button
                      key={c.complaintNo}
                      type="button"
                      onMouseEnter={() => setSelectedIndex(idx)}
                      onClick={() => onSelect(`#${c.complaintNo} `)}
                      className={`w-full p-2.5 rounded-xl text-left flex items-start justify-between gap-3 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-950 dark:text-amber-100'
                          : 'hover:bg-neutral-50 dark:hover:bg-slate-800/60 text-neutral-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60">
                            #{c.complaintNo}
                          </span>
                          <span className="text-[11px] font-semibold text-neutral-900 dark:text-white truncate">
                            {c.complainantName}
                          </span>
                          <span className="text-[10px] text-neutral-400">vs</span>
                          <span className="text-[11px] font-medium text-neutral-700 dark:text-slate-300 truncate">
                            {party}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-slate-400">
                          {c.district && <span>📍 {c.district}</span>}
                          {c.reader && <span>• 📖 {c.reader}</span>}
                          <span className="truncate">• ⚖️ {currentStage}</span>
                        </div>
                      </div>

                      <div className="shrink-0 mt-0.5">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-300 border border-neutral-200 dark:border-slate-700">
                          Select
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </>
          )}

          {/* MODE 3: CAUSE LIST */}
          {mode === 'causelist' && (
            <>
              {causeLists.length === 0 ? (
                <div className="p-4 text-center text-xs text-neutral-500 dark:text-slate-400">
                  No upcoming cause lists found matching "{trimmed.slice(1)}"
                </div>
              ) : (
                causeLists.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  const tag = item.isToday ? ' (Today)' : ` (Upcoming - in ${item.daysDiff}d)`;
                  return (
                    <button
                      key={item.date}
                      type="button"
                      onMouseEnter={() => setSelectedIndex(idx)}
                      onClick={() => onSelect(`> Cause List: ${item.date}${tag} `)}
                      className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-100'
                          : 'hover:bg-neutral-50 dark:hover:bg-slate-800/60 text-neutral-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                            item.isToday
                              ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                              : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900'
                          }`}
                        >
                          <Calendar className="w-4 h-4" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-neutral-900 dark:text-white font-mono">
                              {item.date}
                            </span>
                            {item.isToday ? (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800">
                                Today's Docket
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                In {item.daysDiff} day{item.daysDiff === 1 ? '' : 's'}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-neutral-500 dark:text-slate-400 mt-0.5">
                            {item.caseCount} Case{item.caseCount === 1 ? '' : 's'} Fixed for Hearing
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-300 border border-neutral-200 dark:border-slate-700">
                          Select
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </>
          )}

          {/* MODE 4: PUBLIC BODIES */}
          {mode === 'publicbodies' && (
            <>
              {filteredPublicBodies.length === 0 ? (
                <div className="p-4 text-center text-xs text-neutral-500 dark:text-slate-400">
                  No public bodies found matching "{trimmed.replace(/^[!$/pb]+/i, '')}"
                </div>
              ) : (
                filteredPublicBodies.map((pb, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={pb.id}
                      type="button"
                      onMouseEnter={() => setSelectedIndex(idx)}
                      onClick={() => onSelect(`!${pb.name} `)}
                      className={`w-full p-2.5 rounded-xl text-left flex items-start justify-between gap-3 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-100'
                          : 'hover:bg-neutral-50 dark:hover:bg-slate-800/60 text-neutral-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900 flex items-center justify-center shrink-0 mt-0.5">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                            {pb.name}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-slate-400 mt-0.5 flex-wrap">
                            {pb.district && <span>📍 {pb.district}</span>}
                            {pb.division && <span>• Div: {pb.division}</span>}
                            {pb.designatedOfficialName && (
                              <span className="truncate">• 👤 DO: {pb.designatedOfficialName}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 mt-1">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-300 border border-neutral-200 dark:border-slate-700">
                          Select
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </>
          )}

          {/* MODE 5: DESIGNATED OFFICIALS */}
          {mode === 'officials' && (
            <>
              {filteredOfficials.length === 0 ? (
                <div className="p-4 text-center text-xs text-neutral-500 dark:text-slate-400">
                  No designated officials found matching "{trimmed.replace(/^[*~^?/do]+/i, '')}"
                </div>
              ) : (
                filteredOfficials.map((pb, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={pb.id}
                      type="button"
                      onMouseEnter={() => setSelectedIndex(idx)}
                      onClick={() => onSelect(`*${pb.designatedOfficialName} (${pb.name}) `)}
                      className={`w-full p-2.5 rounded-xl text-left flex items-start justify-between gap-3 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-950 dark:text-teal-100'
                          : 'hover:bg-neutral-50 dark:hover:bg-slate-800/60 text-neutral-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-900 flex items-center justify-center shrink-0 mt-0.5">
                          <UserCheck className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                              {pb.designatedOfficialName}
                            </span>
                            {pb.designatedOfficialDesignation && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-800/60 truncate max-w-[140px]">
                                {pb.designatedOfficialDesignation}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-neutral-600 dark:text-slate-300 truncate mt-0.5">
                            🏛️ {pb.name}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-neutral-400 dark:text-slate-400 mt-0.5">
                            {pb.district && <span>📍 {pb.district}</span>}
                            {pb.contactNumber && <span>• 📞 {pb.contactNumber}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 mt-1">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-300 border border-neutral-200 dark:border-slate-700">
                          Select
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </>
          )}
        </div>
      </div>
    );
  }
);
