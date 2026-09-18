import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { MockDB, ChatMessage, MockUser, getMessageAttachments } from '../lib/mockDb';
import { MessageSquare, Users, X, ArrowRight, Paperclip } from 'lucide-react';

interface ToastMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  receiverId: string;
  isGroup: boolean;
  previewText: string;
  timestamp: string;
}

interface ChatNotificationProps {
  onOpenChat: (chatId: string) => void;
}

export default function ChatNotification({ onOpenChat }: ChatNotificationProps) {
  const { user } = useAuth();
  const [activeToast, setActiveToast] = useState<ToastMessage | null>(null);
  const seenMsgIdsRef = useRef<Set<string>>(new Set());
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize with all existing message IDs on first mount to avoid spamming
  useEffect(() => {
    const existing = MockDB.getMessages();
    existing.forEach(m => seenMsgIdsRef.current.add(m.id));

    // Request notification permissions if supported
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  const handleIncomingMessage = (msg: ChatMessage) => {
    if (!user) return;

    // Rule 1: Never notify sender of their own message
    if (msg.senderId === user.uid) return;

    // Rule 2: Determine if this message is for this user:
    // - If receiverId is 'group': It's for all team members (group chat).
    // - If receiverId is a specific userId: ONLY notify the intended recipient user!
    const isGroup = msg.receiverId === 'group';
    if (!isGroup && msg.receiverId !== user.uid) {
      // One-on-one message sent to someone else -> DO NOT DISPLAY!
      return;
    }

    const allUsers: MockUser[] = MockDB.getUsers();
    const sender = allUsers.find(u => u.id === msg.senderId);
    const senderName = sender ? sender.name : 'Team Member';
    const senderAvatar = sender?.avatarUrl;

    const attachments = getMessageAttachments(msg);
    let previewText = msg.text || '';
    if (!previewText && attachments.length > 0) {
      previewText = `Sent ${attachments.length} attachment${attachments.length > 1 ? 's' : ''}: ${attachments[0].name}`;
    }

    const toast: ToastMessage = {
      id: msg.id,
      senderId: msg.senderId,
      senderName,
      senderAvatar,
      receiverId: msg.receiverId,
      isGroup,
      previewText,
      timestamp: msg.timestamp
    };

    // Show in-app floating banner
    setActiveToast(toast);

    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setActiveToast(null);
    }, 6000);

    // Also trigger HTML5 desktop notification if supported and window not focused
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const title = isGroup ? `${senderName} in Team Group Chat` : `Message from ${senderName}`;
        const desktopNotif = new Notification(title, {
          body: previewText,
          icon: senderAvatar || '/favicon.ico'
        });
        desktopNotif.onclick = () => {
          window.focus();
          onOpenChat(isGroup ? 'group' : msg.senderId);
          desktopNotif.close();
        };
      } catch (e) {
        // Ignore desktop notification failure in iframe
      }
    }
  };

  useEffect(() => {
    // Listen to custom new message event (fast in-memory)
    const handleNewMsgEvent = (e: any) => {
      const msg: ChatMessage = e.detail;
      if (msg && !seenMsgIdsRef.current.has(msg.id)) {
        seenMsgIdsRef.current.add(msg.id);
        handleIncomingMessage(msg);
      }
    };

    // Also poll periodically (fallback for multiple tabs)
    const pollMessages = () => {
      const allMsgs = MockDB.getMessages();
      allMsgs.forEach(msg => {
        if (!seenMsgIdsRef.current.has(msg.id)) {
          seenMsgIdsRef.current.add(msg.id);
          handleIncomingMessage(msg);
        }
      });
    };

    window.addEventListener('mock_new_message', handleNewMsgEvent);
    window.addEventListener('storage', pollMessages);
    const interval = setInterval(pollMessages, 1500);

    return () => {
      window.removeEventListener('mock_new_message', handleNewMsgEvent);
      window.removeEventListener('storage', pollMessages);
      clearInterval(interval);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, [user]);

  if (!activeToast) return null;

  const targetChatId = activeToast.isGroup ? 'group' : activeToast.senderId;

  return (
    <div className="fixed top-5 right-5 z-50 max-w-sm w-[92vw] sm:w-88 animate-in slide-in-from-top-4 fade-in duration-200">
      <div
        onClick={() => {
          onOpenChat(targetChatId);
          setActiveToast(null);
        }}
        className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white p-3.5 rounded-2xl shadow-xl hover:shadow-2xl border border-neutral-200 dark:border-neutral-700/80 cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-blue-500/10 dark:hover:shadow-blue-900/20 transition-all flex items-start gap-3 group select-none"
      >
        {/* Avatar or Group Icon */}
        <div className="relative shrink-0 mt-0.5">
          {activeToast.isGroup ? (
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
          ) : activeToast.senderAvatar ? (
            <img
              src={activeToast.senderAvatar}
              alt=""
              className="w-10 h-10 rounded-full object-cover border border-neutral-200 dark:border-neutral-700 shadow-xs"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
              {activeToast.senderName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-neutral-900 rounded-full"></span>
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="font-semibold text-xs text-neutral-900 dark:text-white truncate">
              {activeToast.senderName}
            </span>
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 shrink-0">
              {new Date(activeToast.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>

          <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium truncate mb-1">
            {activeToast.isGroup ? 'Team Group Chat' : 'Direct Message'}
          </div>

          <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2 leading-relaxed break-words">
            {activeToast.previewText}
          </p>

          <div className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 font-semibold mt-2">
            <span>Reply in chat</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            setActiveToast(null);
          }}
          className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
