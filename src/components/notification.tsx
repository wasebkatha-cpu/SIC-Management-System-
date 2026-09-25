import React, { useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { toInputDateFormat } from '../utils/dateUtils';

interface NotificationProps {
  onOpenCauseList: () => void;
}

export default function AppNotification({ onOpenCauseList }: NotificationProps) {
  const { complaints } = useAppContext();
  const { user } = useAuth();

  useEffect(() => {
    if (!user || (user.role !== 'superUser' && user.role !== 'admin')) return;

    if (!("Notification" in window)) {
      console.log("This browser does not support desktop notification");
      return;
    }

    const checkAndNotify = () => {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
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

          upcomingHearings.forEach(complaint => {
            // Use a localstorage key to prevent spamming notifications on every reload
            const notifKey = `notif_${complaint.complaintNo}_${todayStr}`;
            if (!localStorage.getItem(notifKey)) {
              const notification = new Notification("Upcoming Hearing", {
                body: `Cause List: Complaint ${complaint.complaintNo} is scheduled for ${complaint.nextHearingDate}.`,
                icon: '/favicon.ico' // Assuming a default favicon
              });

              notification.onclick = () => {
                window.focus();
                onOpenCauseList();
                notification.close();
              };

              localStorage.setItem(notifKey, 'true');
            }
          });
        }
      });
    };

    checkAndNotify();
    // Optional: check every hour
    const interval = setInterval(checkAndNotify, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [complaints, user, onOpenCauseList]);

  return null;
}
