import React, { useState, useEffect } from 'react';
import { Eye, X, Calendar, AlertCircle, Archive, CheckCircle2, Clock, Search, Printer, BookOpen } from 'lucide-react';
import CauseListProceeding from './causeListProceeding';
import { useAppContext, ComplaintData, getComplaintCurrentStage, isComplaintInformationDisclosed } from '../context/AppContext';
import { printDiaries } from '../utils/printUtils';
import { 
  toDisplayDateFormat, 
  parseDateToTimestamp, 
  getNormalizedDateTimestamp, 
  isUpcomingDate, 
  isPastDate, 
  isTodayDate, 
  getDaysFromToday 
} from '../utils/dateUtils';

interface CauseListSummary {
  srNo: number;
  date: string;
  isUpcoming: boolean;
  isToday: boolean;
  daysDiff: number;
  totalCases: number;
  callReport: number;
  firstNotice: number;
  finalNotice: number;
  order: number;
  adjournment: number;
}

// Helper to check if a complaint belongs to a particular cause list date (active scheduled or historical archive)
function isComplaintOnCauseList(c: ComplaintData, dateStr: string): boolean {
  const normDate = toDisplayDateFormat(dateStr);
  if (!normDate) return false;

  // 1. Explicit causeListDates archival registry
  if (c.causeListDates && c.causeListDates.some(d => toDisplayDateFormat(d) === normDate)) {
    return true;
  }
  // 2. Next hearing date matches this cause list
  if (toDisplayDateFormat(c.nextHearingDate) === normDate) {
    return true;
  }
  // 3. Previous hearing date matches this cause list
  if (toDisplayDateFormat(c.previousHearingDate) === normDate) {
    return true;
  }
  // 4. Any recorded attendance on this date
  if (c.attendanceHistory && c.attendanceHistory.some(a => toDisplayDateFormat(a.date) === normDate)) {
    return true;
  }
  // 5. Any recorded diary on this date
  if (c.diaries && c.diaries.some(d => toDisplayDateFormat(d.date) === normDate)) {
    return true;
  }
  // 6. Any proceeding or order issued on this date
  if (c.proceedings && c.proceedings.some(p => toDisplayDateFormat(p.date) === normDate)) {
    return true;
  }

  return false;
}

export default function CauseList() {
  const { complaints, readers, getReaderForComplaint } = useAppContext();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedComplaintNo, setSelectedComplaintNo] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'upcoming' | 'past'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleSwitchDate = (e: any) => {
      if (e.detail) {
        setSelectedDate(e.detail);
        setSelectedComplaintNo(null);
      }
    };
    const targetDate = localStorage.getItem('cause_list_target_date');
    if (targetDate) {
      setSelectedDate(targetDate);
      setSelectedComplaintNo(null);
      localStorage.removeItem('cause_list_target_date');
    }
    window.addEventListener('switch_cause_list_date', handleSwitchDate as EventListener);
    return () => {
      window.removeEventListener('switch_cause_list_date', handleSwitchDate as EventListener);
    };
  }, []);

  const handleCloseModal = () => {
    setSelectedDate(null);
    setSelectedComplaintNo(null);
  };

  // Extract all unique dates where complaints have a scheduled nextHearingDate, previousHearingDate, or archived causeListDates
  const allCauseListDates = complaints.flatMap(c => [
    ...(c.causeListDates || []),
    c.nextHearingDate,
    c.previousHearingDate,
    ...(c.attendanceHistory || []).map(a => a.date),
    ...(c.diaries || []).map(d => d.date),
    ...(c.proceedings || []).map(p => p.date),
  ]).map(d => toDisplayDateFormat(d)).filter(Boolean);

  // Seed dates including both upcoming hearings and historical archive dates
  const initialDates = ['14-09-2026', '15-09-2026', '16-09-2026', '01-09-2026', '12-08-2026'];

  // All unique cause list dates
  const uniqueDates = Array.from(
    new Set([
      ...initialDates,
      ...allCauseListDates
    ])
  );

  // Separate and sort:
  // 1. Future/Upcoming dates at TOP (ordered chronologically: nearest upcoming hearing date first)
  const upcomingDates = uniqueDates
    .filter(d => isUpcomingDate(d))
    .sort((a, b) => getNormalizedDateTimestamp(a) - getNormalizedDateTimestamp(b));

  // 2. Old/Past dates at BOTTOM (ordered descending: most recent past date first down to oldest)
  const pastDates = uniqueDates
    .filter(d => isPastDate(d))
    .sort((a, b) => getNormalizedDateTimestamp(b) - getNormalizedDateTimestamp(a));

  // Combined list: future dates at top, old cause lists at bottom
  const orderedDates = [...upcomingDates, ...pastDates];

  // Extract available months for the filter in MM-YYYY format
  const availableMonths = Array.from(new Set(orderedDates.map(dateStr => {
    const parts = dateStr.split('-');
    return parts.length === 3 ? `${parts[1]}-${parts[2]}` : '';
  }))).filter(Boolean).sort((a, b) => {
    const [monthA, yearA] = a.split('-');
    const [monthB, yearB] = b.split('-');
    return new Date(`${yearB}-${monthB}-01`).getTime() - new Date(`${yearA}-${monthA}-01`).getTime();
  });

  // Filter based on selected view mode
  let displayedDates = filterMode === 'upcoming' 
    ? upcomingDates 
    : filterMode === 'past' 
    ? pastDates 
    : orderedDates;

  // Filter based on selected month
  if (selectedMonth) {
    displayedDates = displayedDates.filter(d => {
      const parts = d.split('-');
      return parts.length === 3 && `${parts[1]}-${parts[2]}` === selectedMonth;
    });
  }

  // Filter based on search query
  if (searchQuery.trim()) {
    const lowerQuery = searchQuery.toLowerCase().trim();
    displayedDates = displayedDates.filter(dateStr => {
      // Check if date matches
      if (dateStr.toLowerCase().includes(lowerQuery)) return true;
      
      // Check if any complaint in this cause list matches
      const listForDate = complaints.filter(c => isComplaintOnCauseList(c, dateStr));
      return listForDate.some(c => 
        c.complaintNo.toLowerCase().includes(lowerQuery) ||
        c.complainantName.toLowerCase().includes(lowerQuery) ||
        c.respondentName.toLowerCase().includes(lowerQuery) ||
        (c.publicBodyName && c.publicBodyName.toLowerCase().includes(lowerQuery))
      );
    });
  }

  // Compute live metrics for each cause list date based on all complaints on that cause list (including archive)
  const dynamicSummaryList: CauseListSummary[] = displayedDates.map((dateStr, index) => {
    const listForDate = complaints.filter(c => isComplaintOnCauseList(c, dateStr));
    const isUpcoming = isUpcomingDate(dateStr);
    const isToday = isTodayDate(dateStr);
    const daysDiff = getDaysFromToday(dateStr);

    return {
      srNo: index + 1,
      date: dateStr,
      isUpcoming,
      isToday,
      daysDiff,
      totalCases: listForDate.length,
      callReport: listForDate.filter(c => getComplaintCurrentStage(c).toLowerCase().includes('call')).length,
      firstNotice: listForDate.filter(c => getComplaintCurrentStage(c).toLowerCase().includes('first')).length,
      finalNotice: listForDate.filter(c => getComplaintCurrentStage(c).toLowerCase().includes('final')).length,
      order: listForDate.filter(c => {
        const s = getComplaintCurrentStage(c).toLowerCase();
        return s.includes('order') || s.includes('show cause') || s.includes('disposed');
      }).length,
      adjournment: listForDate.filter(c => {
        const s = getComplaintCurrentStage(c).toLowerCase();
        const r = (c.remarks || '').toLowerCase();
        return s.includes('adjourn') || r.includes('adjourn');
      }).length,
    };
  });

  const upcomingCasesCount = upcomingDates.reduce((acc, d) => {
    return acc + complaints.filter(c => isComplaintOnCauseList(c, d)).length;
  }, 0);
  const nextHearingDate = upcomingDates.length > 0 ? upcomingDates[0] : null;

  const normalizedSelectedDate = selectedDate ? toDisplayDateFormat(selectedDate) : null;

  // All complaints listed on this cause list date (both actively scheduled and preserved for data archive)
  let complaintsForSelectedDate = normalizedSelectedDate
    ? complaints.filter(c => isComplaintOnCauseList(c, normalizedSelectedDate))
    : [];

  if (searchQuery.trim() && normalizedSelectedDate) {
    const lowerQuery = searchQuery.toLowerCase().trim();
    // If the search query matches the date itself, don't filter the complaints inside
    if (!normalizedSelectedDate.toLowerCase().includes(lowerQuery)) {
      complaintsForSelectedDate = complaintsForSelectedDate.filter(c => 
        c.complaintNo.toLowerCase().includes(lowerQuery) ||
        c.complainantName.toLowerCase().includes(lowerQuery) ||
        c.respondentName.toLowerCase().includes(lowerQuery) ||
        (c.publicBodyName && c.publicBodyName.toLowerCase().includes(lowerQuery))
      );
    }
  }

  const activeComplaint = selectedComplaintNo
    ? complaints.find(c => c.complaintNo === selectedComplaintNo)
    : null;

  const hasAdjournedCases = complaintsForSelectedDate.some(
    c => toDisplayDateFormat(c.nextHearingDate) !== normalizedSelectedDate
  );

  const isSelectedDateUpcoming = normalizedSelectedDate ? isUpcomingDate(normalizedSelectedDate) : false;

  // Group complaints by stage
  const groupedComplaints = complaintsForSelectedDate.reduce((acc, c) => {
    const stage = getComplaintCurrentStage(c) || 'Unspecified Stage';
    if (!acc[stage]) acc[stage] = [];
    acc[stage].push(c);
    return acc;
  }, {} as Record<string, ComplaintData[]>);

  // Define a rough order for known stages, otherwise sort alphabetically
  const knownStageOrder = [
    'Hearing in Progress',
    'Call Report',
    'First Notice',
    'Final Notice',
    'Bailable Warrant',
    'Non Bailable Warrant',
    'Show Cause Notice',
    'Order Issued'
  ];

  const sortedStages = Object.keys(groupedComplaints).sort((a, b) => {
    const indexA = knownStageOrder.findIndex(s => a.includes(s));
    const indexB = knownStageOrder.findIndex(s => b.includes(s));
    
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    
    return a.localeCompare(b);
  });

  // Calculate Reader Summary metrics for the footer
  const readerSummaries = Object.entries(complaintsForSelectedDate.reduce((acc, c) => {
    const r = getReaderForComplaint(c) || 'Unassigned';
    acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, {} as Record<string, number>)).map(([name, count], index) => {
    const readerObj = readers.find(r => r.name === name);
    const actualName = readerObj?.actualName || 'System Reader';
    const no = readerObj ? readerObj.name.replace('Reader ', '') : '-';
    return { name: actualName, no, count, srNo: index + 1 };
  });

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Cause List</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Future at Top • Old at Bottom
            </span>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-300 mt-1">
            Upcoming cause lists are highlighted in green and placed at the top; archived historical cause lists are displayed at the bottom.
          </p>
        </div>

        {/* Filter Switcher and Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-neutral-400" />
            </div>
            <input
              type="text"
              placeholder="Search date, complaint, or party..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border-neutral-300 dark:border-slate-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 text-neutral-900 dark:text-white shadow-sm border w-full sm:w-64"
            />
          </div>
          <div className="flex items-center bg-neutral-100 dark:bg-slate-800/80 p-1 rounded-lg border border-neutral-200 dark:border-slate-700 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-white dark:bg-slate-700 text-neutral-900 dark:text-white shadow-xs font-semibold'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              All Cause Lists ({orderedDates.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('upcoming')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                filterMode === 'upcoming'
                  ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                  : 'text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${filterMode === 'upcoming' ? 'bg-white' : 'bg-emerald-500 animate-pulse'}`}></span>
              Upcoming ({upcomingDates.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('past')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                filterMode === 'past'
                  ? 'bg-neutral-800 dark:bg-purple-900 text-white shadow-xs font-semibold'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Archive className="w-3 h-3" />
              Old / Archived ({pastDates.length})
            </button>
          </div>
          
          {/* Monthly Filter */}
          <div className="relative self-start sm:self-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
            </div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="block w-full pl-9 pr-8 py-2 text-sm border-neutral-300 dark:border-slate-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 shadow-sm border text-neutral-700 dark:text-white appearance-none cursor-pointer"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
            >
              <option value="">All Months</option>
              {availableMonths.map(m => {
                const [month, year] = m.split('-');
                const date = new Date(Number(year), Number(month) - 1, 1);
                const monthName = date.toLocaleString('default', { month: 'long' });
                return (
                  <option key={m} value={m}>{`${monthName} ${year}`}</option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Top Stat Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Card 1: Upcoming Cause Lists */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50/90 to-emerald-100/50 dark:from-slate-900/95 dark:to-emerald-950/70 border border-emerald-300 dark:border-emerald-800/60 shadow-xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 text-xs font-semibold uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Upcoming Cause Lists (Top)
            </div>
            <div className="text-2xl font-bold text-emerald-950 dark:text-white mt-1">
              {upcomingDates.length} <span className="text-xs font-normal text-emerald-800 dark:text-emerald-300">Scheduled Dates</span>
            </div>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
              {nextHearingDate ? `Next hearing: ${nextHearingDate}` : 'No upcoming hearings'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-200/70 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-800 dark:text-emerald-300 shrink-0">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
        </div>

        {/* Card 2: Cases on Board */}
        <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-gradient-to-br dark:from-slate-900/95 dark:to-blue-950/70 border border-blue-200 dark:border-blue-800/60 shadow-xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-blue-800 dark:text-blue-300 text-xs font-semibold uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Cases on Upcoming Board
            </div>
            <div className="text-2xl font-bold text-blue-950 dark:text-white mt-1">
              {upcomingCasesCount} <span className="text-xs font-normal text-blue-800 dark:text-blue-300">Total Cases</span>
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
              Across {upcomingDates.length} future hearing dates
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-700 dark:text-blue-300 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Old Cause Lists */}
        <div className="p-4 rounded-xl bg-neutral-100/70 dark:bg-gradient-to-br dark:from-slate-900/95 dark:to-purple-950/60 border border-neutral-200 dark:border-purple-800/60 shadow-xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-neutral-600 dark:text-purple-300 text-xs font-semibold uppercase tracking-wider">
              <Archive className="w-3.5 h-3.5 text-neutral-500 dark:text-purple-400" />
              Old Cause Lists (Bottom)
            </div>
            <div className="text-2xl font-bold text-neutral-800 dark:text-white mt-1">
              {pastDates.length} <span className="text-xs font-normal text-neutral-500 dark:text-neutral-300">Archived Lists</span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-300 mt-0.5">
              Preserved at bottom for historical records
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-neutral-200/80 dark:bg-purple-900/50 flex items-center justify-center text-neutral-600 dark:text-purple-300 shrink-0">
            <Archive className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-600 dark:text-neutral-200">
            <thead className="bg-neutral-50 dark:bg-slate-800/90 border-b border-neutral-200 dark:border-slate-700 text-neutral-900 dark:text-white">
              <tr>
                <th className="px-4 py-3 font-medium text-center w-16">Sr. No.</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Hearing Date & Status</th>
                <th className="px-4 py-3 font-medium text-center whitespace-nowrap">Total Cases</th>
                <th className="px-4 py-3 font-medium text-center">Call Report</th>
                <th className="px-4 py-3 font-medium text-center">First Notice</th>
                <th className="px-4 py-3 font-medium text-center">Final Notice</th>
                <th className="px-4 py-3 font-medium text-center">Order</th>
                <th className="px-4 py-3 font-medium text-center">Adjournment</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-slate-800">
              {dynamicSummaryList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-neutral-500 dark:text-neutral-300">
                    No cause lists found for the selected filter.
                  </td>
                </tr>
              ) : (
                dynamicSummaryList.map((item) => (
                  <tr 
                    key={item.date} 
                    className={`transition-colors border-l-4 ${
                      item.isUpcoming 
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/30 hover:bg-emerald-100/60 dark:hover:bg-emerald-950/50 border-l-emerald-500' 
                        : 'bg-white dark:bg-slate-900/90 hover:bg-neutral-50 dark:hover:bg-slate-800/60 border-l-neutral-300 dark:border-l-slate-700'
                    }`}
                  >
                    <td className="px-4 py-4 text-center font-medium text-neutral-600 dark:text-neutral-300">{item.srNo}</td>
                    
                    {/* Hearing Date with Color Highlight and Status Badge */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <span className={`font-semibold text-base ${
                          item.isUpcoming ? 'text-emerald-950 dark:text-emerald-200 font-bold' : 'text-neutral-700 dark:text-white'
                        }`}>
                          {item.date}
                        </span>

                        {item.isToday ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700/50">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400 animate-ping"></span>
                            Today's Board
                          </span>
                        ) : item.isUpcoming ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700/50 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse"></span>
                            Upcoming {item.daysDiff > 0 ? `(in ${item.daysDiff}d)` : ''}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-neutral-100 dark:bg-slate-800/80 text-neutral-500 dark:text-cyan-400 border border-neutral-200 dark:border-cyan-800/50">
                            <Archive className="w-3 h-3 text-neutral-400 dark:text-cyan-500" />
                            Archived {item.daysDiff < 0 ? `(${Math.abs(item.daysDiff)}d ago)` : ''}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        item.isUpcoming
                          ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700/50'
                          : item.totalCases > 0 
                          ? 'bg-neutral-200 dark:bg-slate-700 text-neutral-800 dark:text-neutral-200' 
                          : 'bg-neutral-100 dark:bg-slate-800/50 text-neutral-400 dark:text-neutral-500'
                      }`}>
                        {item.totalCases} {item.totalCases === 1 ? 'Case' : 'Cases'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">{item.callReport}</td>
                    <td className="px-4 py-4 text-center">{item.firstNotice}</td>
                    <td className="px-4 py-4 text-center">{item.finalNotice}</td>
                    <td className="px-4 py-4 text-center">{item.order}</td>
                    <td className="px-4 py-4 text-center">{item.adjournment}</td>
                    <td className="px-4 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDate(item.date);
                          setSelectedComplaintNo(null);
                        }}
                        className={`inline-flex items-center gap-1.5 font-semibold text-xs px-3.5 py-1.5 rounded-md transition-colors cursor-pointer ${
                          item.isUpcoming
                            ? 'text-white bg-emerald-600 dark:bg-emerald-700 hover:bg-emerald-700 dark:hover:bg-emerald-600 shadow-xs'
                            : 'text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-slate-800 hover:bg-neutral-200 dark:hover:bg-slate-700 border border-neutral-200 dark:border-slate-700'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {item.isUpcoming ? 'View Board' : 'View Archive'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cause List Detail Modal */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-neutral-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-7xl max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden text-neutral-900 dark:text-white">
            
            {activeComplaint ? (
              <CauseListProceeding 
                complaintNo={activeComplaint.complaintNo}
                parties={`${activeComplaint.complainantName} V/S ${activeComplaint.respondentName}`}
                hearingDate={selectedDate}
                onBack={() => setSelectedComplaintNo(null)}
                onNavigateToDate={(targetDate) => {
                  setSelectedDate(toDisplayDateFormat(targetDate));
                  setSelectedComplaintNo(null);
                }}
              />
            ) : (
              <>
                {/* Modal Header */}
                <div className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${
                  isSelectedDateUpcoming 
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60' 
                    : 'bg-neutral-50 dark:bg-slate-800/90 border-neutral-200 dark:border-slate-700'
                }`}>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Cause List: {selectedDate}</h2>

                      {isSelectedDateUpcoming ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                          Upcoming Board
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-200 dark:bg-slate-800 text-neutral-700 dark:text-neutral-200 border border-neutral-300 dark:border-slate-700">
                          <Archive className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                          Historical Cause List Archive
                        </span>
                      )}

                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {complaintsForSelectedDate.length} {complaintsForSelectedDate.length === 1 ? 'Case on Board' : 'Cases on Board'}
                      </span>
                      {hasAdjournedCases && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-200/70 dark:bg-slate-800 text-neutral-700 dark:text-neutral-300 border border-neutral-300/60 dark:border-slate-700">
                          Preserved Archive Record
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-300 mt-0.5">
                      {isSelectedDateUpcoming 
                        ? `Showing all complaints scheduled on board for ${selectedDate}.`
                        : `Showing all complaints listed on board for ${selectedDate}. All historical records are permanently archived.`
                      }
                    </p>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-slate-800 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-300 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body / Table */}
                <div className="flex-1 overflow-auto p-6 space-y-4">
                  
                  {/* Archive info banner */}
                  {hasAdjournedCases && (
                    <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 rounded-lg text-xs text-blue-900 dark:text-blue-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span>
                          <strong>Cause List Archive:</strong> Cases adjourned to subsequent hearing dates remain preserved in this Cause List for official data archival and historical record.
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="border border-neutral-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm text-neutral-600 dark:text-neutral-200">
                      <thead className="bg-neutral-50 dark:bg-slate-800/90 border-b border-neutral-200 dark:border-slate-700 text-neutral-900 dark:text-white">
                        <tr>
                          <th className="px-4 py-3 font-medium text-center w-16">Sr. No.</th>
                          <th className="px-4 py-3 font-medium whitespace-nowrap">Complaint No.</th>
                          <th className="px-4 py-3 font-medium whitespace-nowrap">Time</th>
                          <th className="px-4 py-3 font-medium min-w-[260px]">Parties Name</th>
                          <th className="px-4 py-3 font-medium whitespace-nowrap">Reader</th>
                          <th className="px-4 py-3 font-medium whitespace-nowrap">Stage</th>
                          <th className="px-4 py-3 font-medium whitespace-nowrap">Proactive Disclosure</th>
                          <th className="px-4 py-3 font-medium">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200 dark:divide-slate-800">
                        {sortedStages.length > 0 ? (
                          sortedStages.map(stage => (
                            <React.Fragment key={stage}>
                              <tr className="bg-neutral-100/80 dark:bg-slate-800 border-y border-neutral-200 dark:border-slate-700">
                                <td colSpan={8} className="px-4 py-2.5 font-semibold text-neutral-800 dark:text-white text-xs tracking-wider uppercase">
                                  {stage} <span className="ml-1 text-neutral-500 dark:text-neutral-300 font-normal normal-case tracking-normal">({groupedComplaints[stage].length} cases)</span>
                                </td>
                              </tr>
                              {groupedComplaints[stage].map((c, index) => {
                                const currentStage = getComplaintCurrentStage(c);
                                const readerName = getReaderForComplaint(c);
                                const disclosed = isComplaintInformationDisclosed(c);

                                return (
                                  <tr 
                                    key={c.complaintNo} 
                                    onClick={() => setSelectedComplaintNo(c.complaintNo)}
                                    className="hover:bg-blue-50/60 dark:hover:bg-blue-950/40 transition-colors cursor-pointer group"
                                    title="Click to open Manage Hearing"
                                  >
                                    <td className="px-4 py-3 text-center align-top font-medium text-neutral-600 dark:text-neutral-300">{index + 1}</td>
                                    <td className="px-4 py-3 font-medium text-blue-600 dark:text-blue-400 group-hover:text-blue-800 dark:group-hover:text-blue-300 whitespace-nowrap align-top">
                                      {c.complaintNo}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap align-top font-medium text-neutral-700 dark:text-white">
                                      12:00 PM
                                    </td>
                                    <td className="px-4 py-3 leading-relaxed align-top text-neutral-900 dark:text-white">
                                      {c.complainantName} <span className="text-neutral-400 font-medium mx-1">V/S</span> {c.respondentName}
                                    </td>
                                    <td className="px-4 py-3 align-top whitespace-nowrap text-neutral-600 dark:text-neutral-300">
                                      {readerName}
                                    </td>
                                    <td className="px-4 py-3 align-top whitespace-nowrap">
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 ring-1 ring-inset ring-blue-700/10 dark:ring-blue-500/30 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40" title={`Stage: ${currentStage}`}>
                                        {currentStage}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 align-top whitespace-nowrap">
                                      {disclosed ? (
                                        <span 
                                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 ring-1 ring-inset ring-emerald-600/20 dark:ring-emerald-500/30"
                                          title={c.disclosedInformationSubject || 'Information disclosed by public body'}
                                        >
                                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                          Disclosed
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 dark:bg-slate-800 text-neutral-500 dark:text-slate-400 ring-1 ring-inset ring-neutral-500/20 dark:ring-slate-700">
                                          Pending
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 align-top text-neutral-600 dark:text-neutral-300">{c.remarks || '-'}</td>
                                  </tr>
                                );
                              })}
                            </React.Fragment>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={8} className="px-4 py-12 text-center text-neutral-400 dark:text-neutral-500">
                              <div className="max-w-md mx-auto space-y-2">
                                <p className="text-base font-semibold text-neutral-700 dark:text-neutral-200">
                                  {searchQuery.trim() && !selectedDate?.toLowerCase().includes(searchQuery.toLowerCase().trim()) 
                                    ? `No complaints found matching "${searchQuery}" for ${selectedDate}` 
                                    : `No complaints scheduled for ${selectedDate}`}
                                </p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                  Complaints assigned with Next Hearing Date of {selectedDate} will automatically be included in this Cause List.
                                </p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Reader Summary Table at the bottom of the Cause List */}
                  {complaintsForSelectedDate.length > 0 && (
                    <div className="mt-8 border border-neutral-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
                      <div className="bg-neutral-100 dark:bg-slate-800 px-4 py-3 border-b border-neutral-200 dark:border-slate-700">
                        <h3 className="font-semibold text-neutral-800 dark:text-white text-sm">Cause List Summary</h3>
                      </div>
                      <table className="w-full text-left text-sm text-neutral-600 dark:text-neutral-200">
                        <thead className="bg-neutral-50 dark:bg-slate-800/90 border-b border-neutral-200 dark:border-slate-700 text-neutral-900 dark:text-white">
                          <tr>
                            <th className="px-4 py-3 font-medium text-center w-16">Sr. No.</th>
                            <th className="px-4 py-3 font-medium">Name of the Reader</th>
                            <th className="px-4 py-3 font-medium whitespace-nowrap">Reader No.</th>
                            <th className="px-4 py-3 font-medium whitespace-nowrap text-center">Total Complaints</th>
                            <th className="px-4 py-3 font-medium">Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-slate-800">
                          {readerSummaries.map((summary) => (
                            <tr key={summary.name} className="hover:bg-neutral-50 dark:hover:bg-slate-800/60">
                              <td className="px-4 py-3 text-center text-neutral-600 dark:text-neutral-300">{summary.srNo}</td>
                              <td className="px-4 py-3 font-medium text-neutral-800 dark:text-white">{summary.name}</td>
                              <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">{summary.no}</td>
                              <td className="px-4 py-3 text-center font-medium text-neutral-800 dark:text-white">{summary.count}</td>
                              <td className="px-4 py-3 text-neutral-400 dark:text-neutral-500 italic">--</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Cause List Diaries View */}
                  <div className="mt-8 border border-neutral-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
                    <div className="bg-neutral-100 dark:bg-slate-800 px-4 py-3 border-b border-neutral-200 dark:border-slate-700 flex justify-between items-center">
                      <h3 className="font-semibold text-neutral-800 dark:text-white text-sm flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                        Cause List Diaries
                      </h3>
                      <button 
                        onClick={() => printDiaries(complaintsForSelectedDate, `Cause List Diaries - ${selectedDate}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700 rounded-md hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-colors cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" /> Print All Diaries
                      </button>
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-900 text-sm text-neutral-600 dark:text-neutral-300">
                      Click the <strong>Print All Diaries</strong> button above to open a unified, printable view of all case diaries for the complaints currently displayed in this Cause List.
                    </div>
                  </div>
                </div>
                
                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-neutral-200 dark:border-slate-800 bg-neutral-50 dark:bg-slate-800/90 flex items-center justify-between shrink-0">
                  <span className="text-xs text-neutral-500 dark:text-neutral-300">
                    Click any complaint to open <strong>Manage Hearing</strong>, record attendance, and update next hearing schedule.
                  </span>
                  <button
                    onClick={handleCloseModal}
                    className="px-5 py-2.5 text-sm font-medium text-neutral-700 dark:text-white bg-white dark:bg-slate-800 border border-neutral-300 dark:border-slate-700 rounded-md hover:bg-neutral-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
