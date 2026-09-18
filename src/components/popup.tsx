import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { toInputDateFormat } from '../utils/dateUtils';
import { X, Calendar, Bell } from 'lucide-react';

interface PopupProps {
  onOpenCauseList: () => void;
}

export default function Popup({ onOpenCauseList }: PopupProps) {
  const { complaints } = useAppContext();
  const { user } = useAuth();
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user || (user.role !== 'superUser' && user.role !== 'admin')) {
      setIsOpen(false);
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const todayMs = new Date(todayStr).getTime();

    const upcomingHearings = complaints.filter(c => {
      if (!c.nextHearingDate) return false;
      const hearingDateStr = toInputDateFormat(c.nextHearingDate);
      if (!hearingDateStr) return false;
      
      const hearingMs = new Date(hearingDateStr).getTime();
      const daysDiff = Math.ceil((hearingMs - todayMs) / (1000 * 60 * 60 * 24));
      
      return daysDiff >= 0 && daysDiff <= 3;
    });

    if (upcomingHearings.length > 0) {
      setUpcoming(upcomingHearings);
      // Only show popup automatically if we haven't dismissed it today
      const popupKey = `popup_dismissed_${todayStr}`;
      if (!localStorage.getItem(popupKey)) {
        setIsOpen(true);
      }
    } else {
      setIsOpen(false);
    }
  }, [complaints, user]);

  if (!isOpen || upcoming.length === 0) return null;

  const handleDismiss = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    localStorage.setItem(`popup_dismissed_${todayStr}`, 'true');
    setIsOpen(false);
  };

  const handleOpenCauseList = () => {
    handleDismiss();
    onOpenCauseList();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[70vh] transition-colors">
      <div className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          <h3 className="font-semibold text-sm">Upcoming Hearings (Next 3 Days)</h3>
        </div>
        <button 
          onClick={handleDismiss}
          className="text-white hover:text-blue-100 transition-colors bg-blue-700 hover:bg-blue-800 dark:bg-blue-800 dark:hover:bg-blue-900 p-1 rounded cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="overflow-y-auto p-4 space-y-3 bg-neutral-50 dark:bg-neutral-950 flex-1">
        {upcoming.map(complaint => (
          <div 
            key={complaint.complaintNo}
            onClick={handleOpenCauseList}
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-3 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-1">
              <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {complaint.complaintNo}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-200/50 dark:border-amber-900/50">
                <Calendar className="w-3 h-3" />
                {complaint.nextHearingDate}
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1">
              <span className="font-medium text-neutral-700 dark:text-neutral-300">Complainant:</span> {complaint.complainantName}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1 mt-0.5">
              <span className="font-medium text-neutral-700 dark:text-neutral-300">Public Body:</span> {complaint.publicBodyName}
            </p>
          </div>
        ))}
      </div>
      
      <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shrink-0">
        <button
          onClick={handleOpenCauseList}
          className="w-full text-center text-sm text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300 py-1 transition-colors cursor-pointer"
        >
          View Full Cause List
        </button>
      </div>
    </div>
  );
}
