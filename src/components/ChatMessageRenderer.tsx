import React from 'react';
import { Scale, Calendar, ArrowRight, ExternalLink, Users, FileText, CheckCircle2, Building2, UserCheck, Phone, Mail, MapPin } from 'lucide-react';
import { ComplaintData, getComplaintCurrentStage, isComplaintOnCauseList, PublicBody } from '../context/AppContext';
import { isTodayDate, isUpcomingDate, getDaysFromToday } from '../utils/dateUtils';
import { MockUser } from '../lib/mockDb';

interface ChatMessageRendererProps {
  text: string;
  isMine: boolean;
  complaints: ComplaintData[];
  users: MockUser[];
  publicBodies?: PublicBody[];
  onNavigateToComplaint?: (complaintId: string) => void;
  onNavigateToCauseList?: (date?: string) => void;
  onNavigateToPublicBody?: (publicBodyName: string) => void;
  onNavigateToDesignatedOfficial?: (officialName: string) => void;
}

export const ChatMessageRenderer: React.FC<ChatMessageRendererProps> = ({
  text,
  isMine,
  complaints,
  users,
  publicBodies = [],
  onNavigateToComplaint,
  onNavigateToCauseList,
  onNavigateToPublicBody,
  onNavigateToDesignatedOfficial
}) => {
  // Navigation trigger for complaint details
  const handleOpenComplaint = (complaintNo: string) => {
    if (onNavigateToComplaint) {
      onNavigateToComplaint(complaintNo);
    }
    // Global fallback window event
    window.dispatchEvent(
      new CustomEvent('navigate_to_complaint', {
        detail: { complaintId: complaintNo }
      })
    );
  };

  // Navigation trigger for cause list
  const handleOpenCauseList = (date?: string) => {
    if (date) {
      localStorage.setItem('cause_list_target_date', date);
      window.dispatchEvent(new CustomEvent('switch_cause_list_date', { detail: date }));
    }
    if (onNavigateToCauseList) {
      onNavigateToCauseList(date);
    }
    // Global fallback window event
    window.dispatchEvent(
      new CustomEvent('navigate_to_cause_list', {
        detail: { date }
      })
    );
  };

  // Navigation trigger for public body
  const handleOpenPublicBody = (publicBodyName: string) => {
    if (onNavigateToPublicBody) {
      onNavigateToPublicBody(publicBodyName);
    }
    window.dispatchEvent(
      new CustomEvent('navigate_to_public_body', {
        detail: { search: publicBodyName }
      })
    );
  };

  // Navigation trigger for designated official
  const handleOpenDesignatedOfficial = (officialName: string) => {
    if (onNavigateToDesignatedOfficial) {
      onNavigateToDesignatedOfficial(officialName);
    }
    window.dispatchEvent(
      new CustomEvent('navigate_to_designated_official', {
        detail: { search: officialName }
      })
    );
  };

  // Detect linked complaints in text (e.g. #SIC-2026-01 or #SIC-...)
  const detectedComplaints = React.useMemo(() => {
    const list: ComplaintData[] = [];
    const hashRegex = /#([A-Za-z0-9_-]+)/g;
    let match: RegExpExecArray | null;

    while ((match = hashRegex.exec(text)) !== null) {
      const queryNo = match[1].toLowerCase();
      const found = complaints.find(
        c => c.complaintNo.toLowerCase() === queryNo || c.complaintNo.toLowerCase().replace(/[^a-z0-9]/g, '') === queryNo.replace(/[^a-z0-9]/g, '')
      );
      if (found && !list.some(item => item.complaintNo === found.complaintNo)) {
        list.push(found);
      }
    }

    // Also check if text starts with # and has a complaint number
    if (list.length === 0 && text.trim().startsWith('#')) {
      const matchStart = text.trim().match(/^#([A-Za-z0-9_-]+)/);
      if (matchStart) {
        const queryNo = matchStart[1].toLowerCase();
        const found = complaints.find(c => c.complaintNo.toLowerCase().includes(queryNo));
        if (found) list.push(found);
      }
    }

    return list;
  }, [text, complaints]);

  // Detect linked cause list in text (e.g. > Cause List: 15-09-2026 or > 15-09-2026)
  const detectedCauseLists = React.useMemo(() => {
    const list: { date: string; isToday: boolean; daysDiff: number; caseCount: number }[] = [];
    const dateRegex = /(\d{1,2}[-/.]\d{1,2}[-/.]\d{4})/;
    
    // If text has '>' indicator or 'Cause List'
    if (text.includes('>') || text.toLowerCase().includes('cause list')) {
      const match = text.match(dateRegex);
      if (match) {
        const dateStr = match[1].replace(/\//g, '-').replace(/\./g, '-');
        const count = complaints.filter(c => isComplaintOnCauseList(c, dateStr)).length;
        list.push({
          date: dateStr,
          isToday: isTodayDate(dateStr),
          daysDiff: getDaysFromToday(dateStr),
          caseCount: count
        });
      }
    }
    return list;
  }, [text, complaints]);

  // Detect linked public bodies in text (e.g. !Department Name or !PB: Name)
  const detectedPublicBodies = React.useMemo(() => {
    if (!publicBodies || publicBodies.length === 0) return [];
    const list: PublicBody[] = [];

    // Check for ! or $ prefix
    const pbRegex = /[!$]([^\n\r!$*#@<>]+)/g;
    let match: RegExpExecArray | null;
    while ((match = pbRegex.exec(text)) !== null) {
      const query = match[1].trim().toLowerCase();
      if (query.length < 2) continue;
      const found = publicBodies.find(
        pb =>
          pb.name.toLowerCase() === query ||
          query.startsWith(pb.name.toLowerCase()) ||
          pb.name.toLowerCase().startsWith(query)
      );
      if (found && !list.some(p => p.id === found.id)) {
        list.push(found);
      }
    }

    // Direct scan if ! or $ present
    if (list.length === 0 && (text.includes('!') || text.includes('$'))) {
      for (const pb of publicBodies) {
        if (pb.name.length > 3 && text.toLowerCase().includes(pb.name.toLowerCase())) {
          if (!list.some(p => p.id === pb.id)) {
            list.push(pb);
          }
        }
      }
    }

    return list;
  }, [text, publicBodies]);

  // Detect linked designated officials in text (e.g. *Official Name or *DO: Name)
  const detectedOfficials = React.useMemo(() => {
    if (!publicBodies || publicBodies.length === 0) return [];
    const list: PublicBody[] = [];

    // Check for * or ~ or ^ prefix
    const officialRegex = /[*~^]([^\n\r!$*#@<>()]+)/g;
    let match: RegExpExecArray | null;
    while ((match = officialRegex.exec(text)) !== null) {
      const query = match[1].trim().toLowerCase();
      if (query.length < 2) continue;
      const found = publicBodies.find(
        pb =>
          pb.designatedOfficialName &&
          pb.designatedOfficialName.trim() !== '' &&
          pb.designatedOfficialName.toLowerCase() !== 'unknown official' &&
          (pb.designatedOfficialName.toLowerCase() === query ||
           query.startsWith(pb.designatedOfficialName.toLowerCase()) ||
           pb.designatedOfficialName.toLowerCase().startsWith(query))
      );
      if (found && !list.some(p => p.id === found.id)) {
        list.push(found);
      }
    }

    // Direct scan if * or ~ or ^ present
    if (list.length === 0 && (text.includes('*') || text.includes('~') || text.includes('^'))) {
      for (const pb of publicBodies) {
        if (
          pb.designatedOfficialName &&
          pb.designatedOfficialName.length > 3 &&
          pb.designatedOfficialName.toLowerCase() !== 'unknown official' &&
          text.toLowerCase().includes(pb.designatedOfficialName.toLowerCase())
        ) {
          if (!list.some(p => p.id === pb.id)) {
            list.push(pb);
          }
        }
      }
    }

    return list;
  }, [text, publicBodies]);

  // Render stylized text tokens with @mentions, #complaints, >causelist, !publicbodies, and *officials
  const renderFormattedTokens = () => {
    const tokenRegex = /(@[A-Za-z0-9 _-]+|#[A-Za-z0-9_-]+|> Cause List: [^ \n]+|> [^ \n]+|![A-Za-z0-9 _&/.-]+|\*[A-Za-z0-9 _&/.-]+)/g;
    const parts = text.split(tokenRegex);

    return parts.map((part, index) => {
      if (!part) return null;

      // Handle @mention
      if (part.startsWith('@')) {
        const mentionName = part.slice(1).trim();
        const matchedUser = users.find(
          u =>
            (u.name && u.name.toLowerCase() === mentionName.toLowerCase()) ||
            (u.username && u.username.toLowerCase() === mentionName.toLowerCase())
        );

        return (
          <span
            key={index}
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-semibold text-xs transition-colors ${
              isMine
                ? 'bg-blue-700/80 text-white border border-blue-400/60'
                : 'bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-800'
            }`}
          >
            <Users className="w-3 h-3" />
            <span>{part}</span>
            {matchedUser && (
              <span className="text-[9px] opacity-80 uppercase">
                ({matchedUser.role === 'superUser' ? 'SuperUser' : 'Admin'})
              </span>
            )}
          </span>
        );
      }

      // Handle #complaint inline token
      if (part.startsWith('#')) {
        const cleanNo = part.slice(1);
        const comp = complaints.find(c => c.complaintNo.toLowerCase() === cleanNo.toLowerCase());
        return (
          <button
            key={index}
            type="button"
            onClick={() => handleOpenComplaint(comp ? comp.complaintNo : cleanNo)}
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-bold text-xs cursor-pointer hover:underline ${
              isMine
                ? 'bg-amber-400/20 text-amber-200 border border-amber-300/40 hover:bg-amber-400/30'
                : 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800 hover:bg-amber-200/70'
            }`}
            title={`Click to open complaint ${cleanNo} details`}
          >
            <Scale className="w-3 h-3" />
            <span>{part}</span>
          </button>
        );
      }

      // Handle > Cause List token
      if (part.startsWith('>')) {
        return (
          <span
            key={index}
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-semibold text-xs ${
              isMine
                ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-300/40'
                : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
            }`}
          >
            <Calendar className="w-3 h-3" />
            <span>{part}</span>
          </span>
        );
      }

      // Handle ! Public Body token
      if (part.startsWith('!')) {
        const cleanName = part.slice(1).trim();
        const matchedPb = publicBodies.find(
          pb => pb.name.toLowerCase().includes(cleanName.toLowerCase()) || cleanName.toLowerCase().includes(pb.name.toLowerCase())
        );
        return (
          <button
            key={index}
            type="button"
            onClick={() => handleOpenPublicBody(matchedPb ? matchedPb.name : cleanName)}
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-bold text-xs cursor-pointer hover:underline ${
              isMine
                ? 'bg-indigo-400/25 text-indigo-100 border border-indigo-300/40 hover:bg-indigo-400/35'
                : 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-200/70'
            }`}
            title={`Click to open Public Body: ${cleanName}`}
          >
            <Building2 className="w-3 h-3" />
            <span>{part}</span>
          </button>
        );
      }

      // Handle * Designated Official token
      if (part.startsWith('*')) {
        const cleanName = part.slice(1).trim();
        const matchedOfficial = publicBodies.find(
          pb =>
            pb.designatedOfficialName &&
            (pb.designatedOfficialName.toLowerCase().includes(cleanName.toLowerCase()) ||
             cleanName.toLowerCase().includes(pb.designatedOfficialName.toLowerCase()))
        );
        return (
          <button
            key={index}
            type="button"
            onClick={() =>
              handleOpenDesignatedOfficial(
                matchedOfficial ? matchedOfficial.designatedOfficialName : cleanName
              )
            }
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-bold text-xs cursor-pointer hover:underline ${
              isMine
                ? 'bg-teal-400/25 text-teal-100 border border-teal-300/40 hover:bg-teal-400/35'
                : 'bg-teal-100 dark:bg-teal-950/80 text-teal-900 dark:text-teal-200 border border-teal-200 dark:border-teal-800 hover:bg-teal-200/70'
            }`}
            title={`Click to open Designated Official profile: ${cleanName}`}
          >
            <UserCheck className="w-3 h-3" />
            <span>{part}</span>
          </button>
        );
      }

      return <span key={index}>{part}</span>;
    });
  };

  const isCaseShare = detectedComplaints.length > 0 && text.trim().startsWith('#');

  return (
    <div className={`space-y-2 min-w-0 ${isCaseShare ? 'w-full max-w-[280px] sm:max-w-[310px]' : 'max-w-full'}`}>
      {/* Primary Message Text */}
      <div className="whitespace-pre-wrap break-words text-sm leading-relaxed min-w-0 overflow-hidden">
        {renderFormattedTokens()}
      </div>

      {/* Interactive Complaint Cards */}
      {detectedComplaints.map(c => {
        const party = c.publicBodyName || c.respondentName;
        const currentStage = getComplaintCurrentStage(c);

        return (
          <div
            key={c.complaintNo}
            onClick={() => handleOpenComplaint(c.complaintNo)}
            className={`group mt-2 p-2.5 sm:p-3 rounded-xl border text-left cursor-pointer transition-all w-[280px] sm:w-[310px] max-w-full min-w-0 overflow-hidden ${
              isMine
                ? 'bg-blue-700/50 hover:bg-blue-700/70 border-blue-400/60 text-white'
                : 'bg-amber-50/70 dark:bg-slate-800/90 hover:bg-amber-100/70 dark:hover:bg-slate-750 border-amber-200 dark:border-slate-700 text-neutral-900 dark:text-white shadow-2xs hover:shadow-xs'
            }`}
            title={`Click to view details for complaint ${c.complaintNo}`}
          >
            <div className="flex items-center justify-between gap-1.5 mb-1.5 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <div
                  className={`p-1 rounded-md shrink-0 ${
                    isMine ? 'bg-blue-600 text-amber-200' : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  <Scale className="w-3.5 h-3.5" />
                </div>
                <span className="font-mono text-xs font-bold underline decoration-amber-400 shrink-0">
                  #{c.complaintNo}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border truncate max-w-[100px] shrink-0 ${
                    isMine
                      ? 'bg-white/10 text-white border-white/20'
                      : 'bg-neutral-100 dark:bg-slate-700 text-neutral-700 dark:text-slate-200 border-neutral-200 dark:border-slate-600'
                  }`}
                  title={currentStage}
                >
                  {currentStage}
                </span>
              </div>

              <div
                className={`flex items-center gap-0.5 text-[11px] font-semibold shrink-0 transition-transform group-hover:translate-x-0.5 ${
                  isMine ? 'text-amber-200' : 'text-blue-600 dark:text-blue-400'
                }`}
              >
                <span>Details</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            <div className="text-xs font-semibold truncate mb-1 min-w-0 block" title={`${c.complainantName} vs ${party}`}>
              <span>{c.complainantName}</span> <span className="opacity-70 font-normal">vs</span> <span>{party}</span>
            </div>

            <div
              className={`flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10.5px] leading-snug min-w-0 ${
                isMine ? 'text-blue-200' : 'text-neutral-500 dark:text-slate-400'
              }`}
            >
              {c.district && <span className="inline-flex items-center gap-0.5 shrink-0">📍 {c.district}</span>}
              {c.reader && <span className="inline-flex items-center gap-0.5 truncate max-w-[120px]" title={c.reader}>• 📖 {c.reader}</span>}
              {c.nextHearingDate && <span className="inline-flex items-center gap-0.5 shrink-0">• 📅 {c.nextHearingDate}</span>}
            </div>
          </div>
        );
      })}

      {/* Interactive Cause List Docket Cards */}
      {detectedCauseLists.map(cl => {
        return (
          <div
            key={cl.date}
            onClick={() => handleOpenCauseList(cl.date)}
            className={`group mt-2 p-2.5 sm:p-3 rounded-xl border text-left cursor-pointer transition-all w-[280px] sm:w-[310px] max-w-full min-w-0 overflow-hidden ${
              isMine
                ? 'bg-blue-700/50 hover:bg-blue-700/70 border-emerald-400/60 text-white'
                : 'bg-emerald-50/70 dark:bg-slate-800/90 hover:bg-emerald-100/70 dark:hover:bg-slate-750 border-emerald-200 dark:border-slate-700 text-neutral-900 dark:text-white shadow-2xs hover:shadow-xs'
            }`}
            title={`Click to open Cause List docket for ${cl.date}`}
          >
            <div className="flex items-start justify-between gap-2 mb-1.5 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
                <div
                  className={`p-1 rounded-md shrink-0 ${
                    isMine
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <span className="font-mono text-xs font-bold shrink-0">
                  Cause List: {cl.date}
                </span>
                {cl.isToday ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 shrink-0">
                    Today
                  </span>
                ) : (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0">
                    In {cl.daysDiff}d
                  </span>
                )}
              </div>

              <div
                className={`flex items-center gap-0.5 text-[11px] font-semibold shrink-0 transition-transform group-hover:translate-x-0.5 ${
                  isMine ? 'text-emerald-200' : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                <span>Docket</span>
                <ExternalLink className="w-3 h-3" />
              </div>
            </div>

            <div
              className={`text-xs line-clamp-2 leading-relaxed ${
                isMine ? 'text-blue-100' : 'text-neutral-600 dark:text-slate-300'
              }`}
            >
              Courtroom schedule with {cl.caseCount} case{cl.caseCount === 1 ? '' : 's'} listed. Click to view docket.
            </div>
          </div>
        );
      })}

      {/* Interactive Public Body Cards */}
      {detectedPublicBodies.map(pb => {
        return (
          <div
            key={pb.id}
            onClick={() => handleOpenPublicBody(pb.name)}
            className={`group mt-2 p-2.5 sm:p-3 rounded-xl border text-left cursor-pointer transition-all w-[280px] sm:w-[310px] max-w-full min-w-0 overflow-hidden ${
              isMine
                ? 'bg-indigo-900/60 hover:bg-indigo-900/80 border-indigo-400/60 text-white'
                : 'bg-indigo-50/70 dark:bg-slate-800/90 hover:bg-indigo-100/70 dark:hover:bg-slate-750 border-indigo-200 dark:border-slate-700 text-neutral-900 dark:text-white shadow-2xs hover:shadow-xs'
            }`}
            title={`Click to open Public Bodies directory and view ${pb.name}`}
          >
            <div className="flex items-center justify-between gap-1.5 mb-1.5 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <div
                  className={`p-1 rounded-md shrink-0 ${
                    isMine
                      ? 'bg-indigo-700 text-white'
                      : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <span className="font-semibold text-xs text-neutral-900 dark:text-white truncate max-w-[140px]" title={pb.name}>
                  {pb.name}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-800 shrink-0">
                  PB
                </span>
              </div>

              <div
                className={`flex items-center gap-0.5 text-[11px] font-semibold shrink-0 transition-transform group-hover:translate-x-0.5 ${
                  isMine ? 'text-indigo-200' : 'text-indigo-600 dark:text-indigo-400'
                }`}
              >
                <span>Dir</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            <div
              className={`flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10.5px] leading-snug min-w-0 ${
                isMine ? 'text-indigo-100' : 'text-neutral-600 dark:text-slate-300'
              }`}
            >
              {pb.district && <span className="shrink-0">📍 {pb.district}</span>}
              {pb.designatedOfficialName && (
                <span className="truncate max-w-[150px]" title={pb.designatedOfficialName}>• 👤 {pb.designatedOfficialName}</span>
              )}
              {pb.contactNumber && <span className="shrink-0">• 📞 {pb.contactNumber}</span>}
            </div>
          </div>
        );
      })}

      {/* Interactive Designated Official Cards */}
      {detectedOfficials.map(pb => {
        return (
          <div
            key={`do-${pb.id}`}
            onClick={() => handleOpenDesignatedOfficial(pb.designatedOfficialName)}
            className={`group mt-2 p-2.5 sm:p-3 rounded-xl border text-left cursor-pointer transition-all w-[280px] sm:w-[310px] max-w-full min-w-0 overflow-hidden ${
              isMine
                ? 'bg-teal-900/60 hover:bg-teal-900/80 border-teal-400/60 text-white'
                : 'bg-teal-50/70 dark:bg-slate-800/90 hover:bg-teal-100/70 dark:hover:bg-slate-750 border-teal-200 dark:border-slate-700 text-neutral-900 dark:text-white shadow-2xs hover:shadow-xs'
            }`}
            title={`Click to open Designated Officials directory and view ${pb.designatedOfficialName}`}
          >
            <div className="flex items-center justify-between gap-1.5 mb-1.5 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <div
                  className={`p-1 rounded-md shrink-0 ${
                    isMine
                      ? 'bg-teal-700 text-white'
                      : 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
                <span className="font-semibold text-xs text-neutral-900 dark:text-white truncate max-w-[140px]" title={pb.designatedOfficialName}>
                  {pb.designatedOfficialName}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 border border-teal-300 dark:border-teal-800 shrink-0">
                  PIO
                </span>
              </div>

              <div
                className={`flex items-center gap-0.5 text-[11px] font-semibold shrink-0 transition-transform group-hover:translate-x-0.5 ${
                  isMine ? 'text-teal-200' : 'text-teal-600 dark:text-teal-400'
                }`}
              >
                <span>View</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            <div className="text-xs text-neutral-800 dark:text-slate-200 mb-1 truncate" title={`${pb.name} ${pb.designatedOfficialDesignation ? `— ${pb.designatedOfficialDesignation}` : ''}`}>
              🏛️ <span className="font-semibold">{pb.name}</span>
            </div>

            <div
              className={`flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10.5px] leading-snug min-w-0 ${
                isMine ? 'text-teal-100' : 'text-neutral-500 dark:text-slate-400'
              }`}
            >
              {pb.district && <span className="shrink-0">📍 {pb.district}</span>}
              {pb.contactNumber && <span className="shrink-0">• 📞 {pb.contactNumber}</span>}
              {pb.email && <span className="truncate max-w-[120px]" title={pb.email}>• ✉️ {pb.email}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
};
