import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { MockDB, ChatMessage, MockUser, ChatAttachment, getMessageAttachments } from '../lib/mockDb';
import { apiFetch } from '../lib/apiConfig';
import {
  MessageSquare,
  X,
  Minus,
  Maximize2,
  Users,
  Paperclip,
  Send,
  FileText,
  PlusCircle,
  Check,
  CheckCheck,
  Reply,
  Info,
  ChevronDown,
  ArrowLeft,
  Circle,
  Eye,
  Download
} from 'lucide-react';
import AttachComplaintModal from './AttachComplaintModal';
import MessageInfoModal from './MessageInfoModal';
import AttachmentViewerModal from './AttachmentViewerModal';
import { useAppContext } from '../context/AppContext';
import { ChatAutocompletePopover, ChatAutocompleteRef } from './ChatAutocompletePopover';
import { ChatMessageRenderer } from './ChatMessageRenderer';

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '👏', '🎉'];

interface PopupChatProps {
  onOpenFullScreen: () => void;
  isOpenDirectly?: boolean;
  onNavigateToComplaint?: (complaintId: string) => void;
  onNavigateToCauseList?: (date?: string) => void;
  onNavigateToPublicBody?: (publicBodyName: string) => void;
  onNavigateToDesignatedOfficial?: (officialName: string) => void;
}

export default function PopupChat({
  onOpenFullScreen,
  isOpenDirectly,
  onNavigateToComplaint,
  onNavigateToCauseList,
  onNavigateToPublicBody,
  onNavigateToDesignatedOfficial
}: PopupChatProps) {
  const { user } = useAuth();
  const { complaints, publicBodies } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [activeChat, setActiveChat] = useState<string>('group'); // 'group' or userId
  const [viewMode, setViewMode] = useState<'chat' | 'list'>('list'); // 'chat' or 'list'
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<MockUser[]>([]);
  const [inputText, setInputText] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [attachModalData, setAttachModalData] = useState<ChatAttachment | null>(null);
  const [viewingAttachment, setViewingAttachment] = useState<ChatAttachment | null>(null);
  const [infoModalMessage, setInfoModalMessage] = useState<ChatMessage | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ id: string; senderId: string; senderName: string; text: string } | null>(null);
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [globalTypingUsers, setGlobalTypingUsers] = useState<Record<string, string[]>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autocompleteRef = useRef<ChatAutocompleteRef>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load all users
  useEffect(() => {
    const refreshUsers = () => {
      const allUsers = MockDB.getUsers();
      setUsers(allUsers.filter(u => u.id !== user?.uid));
    };
    refreshUsers();

    const handleSwitchChat = (e: any) => {
      if (e.detail) {
        setActiveChat(e.detail);
        setViewMode('chat');
        setIsOpen(true);
      }
    };

    window.addEventListener('switch_active_chat', handleSwitchChat);
    window.addEventListener('mock_users_update', refreshUsers);
    window.addEventListener('storage', refreshUsers);

    return () => {
      window.removeEventListener('switch_active_chat', handleSwitchChat);
      window.removeEventListener('mock_users_update', refreshUsers);
      window.removeEventListener('storage', refreshUsers);
    };
  }, [user]);

  const loadMessages = () => {
    const allMessages = MockDB.getMessages();

    // If chat is open, mark messages in current activeChat as read
    if (user && isOpen && viewMode === 'chat') {
      let updated = false;
      const syncedMsgs = new Set<ChatMessage>();
      
      allMessages.forEach(msg => {
        if (msg.senderId !== user.uid) {
          let msgUpdated = false;
          if (
            (activeChat === 'group' && msg.receiverId === 'group') ||
            (activeChat !== 'group' && msg.senderId === activeChat && msg.receiverId === user.uid)
          ) {
            if (!msg.readBy?.includes(user.uid)) {
              msg.readBy = [...(msg.readBy || []), user.uid];
              updated = true;
              msgUpdated = true;
            }
          }
          // Also mark received
          if (!msg.receivedBy?.includes(user.uid)) {
            msg.receivedBy = [...(msg.receivedBy || []), user.uid];
            updated = true;
            msgUpdated = true;
          }
          
          if (msgUpdated) {
            syncedMsgs.add(msg);
          }
        }
      });
      
      if (updated) {
        MockDB.setMessages(allMessages);
        window.dispatchEvent(new Event('mock_messages_update'));
        
        // Background sync to backend
        syncedMsgs.forEach(msg => {
          apiFetch(`/api/messages/${msg.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ readBy: msg.readBy, receivedBy: msg.receivedBy })
          }).catch(() => {});
        });
      }
    }
    
    setMessages(allMessages);
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 2000);
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'mock_messages' || e.key === 'mock_users') {
        loadMessages();
        const allUsers = MockDB.getUsers();
        setUsers(allUsers.filter(u => u.id !== user?.uid));
      }
    };
    const handleLocalUpdate = () => loadMessages();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('mock_messages_update', handleLocalUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('mock_messages_update', handleLocalUpdate);
    };
  }, [activeChat, user, isOpen, viewMode]);

  // Typing indicator monitoring
  useEffect(() => {
    const checkTyping = () => {
      if (user) {
        setTypingUsers(MockDB.getTypingUsers(activeChat, user.uid));
        setGlobalTypingUsers(MockDB.getAllTypingUsers(user.uid));
      }
    };
    checkTyping();
    const interval = setInterval(checkTyping, 800);
    const handleTypingEvent = () => checkTyping();
    window.addEventListener('mock_typing_update', handleTypingEvent);
    return () => {
      clearInterval(interval);
      window.removeEventListener('mock_typing_update', handleTypingEvent);
    };
  }, [activeChat, user]);

  useEffect(() => {
    if (isOpen && viewMode === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, activeChat, isOpen, viewMode]);

  // Unread counts
  const getUnreadCountForChat = (chatId: string) => {
    if (!user) return 0;
    return messages.filter(m => {
      if (m.senderId === user.uid) return false;
      const isRead = m.readBy?.includes(user.uid);
      if (isRead) return false;
      if (chatId === 'group') {
        return m.receiverId === 'group';
      } else {
        return m.senderId === chatId && m.receiverId === user.uid;
      }
    }).length;
  };

  const totalUnreadCount = messages.filter(m => {
    if (!user) return false;
    if (m.senderId === user.uid) return false;
    const isRead = m.readBy?.includes(user.uid);
    if (isRead) return false;
    return m.receiverId === 'group' || m.receiverId === user.uid;
  }).length;

  const allKnownUsers = MockDB.getUsers();

  const getSenderName = (senderId: string) => {
    if (senderId === user?.uid) return user?.name ? `${user.name} (You)` : 'You';
    const sender = allKnownUsers.find(u => u.id === senderId);
    return sender ? (sender.name || sender.username) : 'Unknown User';
  };

  const getSenderAvatar = (senderId: string) => {
    if (senderId === user?.uid) return user?.avatarUrl;
    return allKnownUsers.find(u => u.id === senderId)?.avatarUrl;
  };

  const switchChat = (newChatId: string) => {
    if (user && activeChat) {
      MockDB.setTyping(user.uid, user.name || user.username, activeChat, false);
    }
    setActiveChat(newChatId);
    setViewMode('chat');
    setReplyingTo(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files) as File[];
    fileList.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`File "${file.name}" is over 5MB. Please choose smaller files.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = event => {
        const data = event.target?.result as string;
        setAttachments(prev => [
          ...prev,
          {
            name: file.name,
            type: file.type || 'application/octet-stream',
            data: data
          }
        ]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (indexToRemove: number) => {
    setAttachments(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleReaction = (messageId: string, reaction: string) => {
    if (!user) return;
    const msg = messages.find(m => m.id === messageId);
    if (!msg) return;

    const reactions = { ...(msg.reactions || {}) };
    if (reactions[user.uid] === reaction) {
      delete reactions[user.uid];
    } else {
      reactions[user.uid] = reaction;
    }

    MockDB.updateMessage(messageId, { reactions });
    loadMessages();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputText(val);

    const trimmed = val.trim();
    if (
      trimmed.startsWith('@') ||
      trimmed.startsWith('#') ||
      trimmed.startsWith('>') ||
      trimmed.startsWith('!') ||
      trimmed.startsWith('$') ||
      trimmed.startsWith('*') ||
      trimmed.startsWith('~') ||
      trimmed.startsWith('^') ||
      trimmed.toLowerCase().startsWith('/pb') ||
      trimmed.toLowerCase().startsWith('/do')
    ) {
      setShowAutocomplete(true);
    } else {
      setShowAutocomplete(false);
    }

    if (!user) return;

    if (val.trim().length > 0) {
      MockDB.setTyping(user.uid, user.name || user.username, activeChat, true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (user) MockDB.setTyping(user.uid, user.name || user.username, activeChat, false);
      }, 2500);
    } else {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      MockDB.setTyping(user.uid, user.name || user.username, activeChat, false);
    }
  };

  const handleAutocompleteSelect = (replacementText: string) => {
    setInputText(replacementText);
    setShowAutocomplete(false);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  const handleSend = () => {
    if (!user) return;
    if (!inputText.trim() && attachments.length === 0) return;

    setShowAutocomplete(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    MockDB.setTyping(user.uid, user.name || user.username, activeChat, false);

    MockDB.addMessage({
      senderId: user.uid,
      receiverId: activeChat,
      text: inputText.trim(),
      attachments: attachments.length > 0 ? attachments : undefined,
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            senderId: replyingTo.senderId,
            senderName: replyingTo.senderName,
            text: replyingTo.text
          }
        : undefined
    });

    setInputText('');
    setAttachments([]);
    setReplyingTo(null);
    loadMessages();
  };

  const startReply = (msg: ChatMessage) => {
    const atts = getMessageAttachments(msg);
    setReplyingTo({
      id: msg.id,
      senderId: msg.senderId,
      senderName: getSenderName(msg.senderId),
      text: msg.text || (atts.length > 0 ? `[${atts.length} Attachment${atts.length > 1 ? 's' : ''}: ${atts[0].name}]` : '')
    });
    textareaRef.current?.focus();
  };

  const scrollToMessage = (msgId: string) => {
    const el = document.getElementById(`popup-msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMsgId(msgId);
      setTimeout(() => setHighlightedMsgId(null), 2000);
    }
  };

  // Filter messages for active chat
  const chatMessages = messages.filter(m => {
    if (activeChat === 'group') {
      return m.receiverId === 'group';
    } else {
      return (
        (m.senderId === user?.uid && m.receiverId === activeChat) ||
        (m.senderId === activeChat && m.receiverId === user?.uid)
      );
    }
  });

  const activePartner = activeChat !== 'group' ? allKnownUsers.find(u => u.id === activeChat) : null;

  return (
    <>
      {/* Floating Action Button (Bottom-Right) */}
      {!isOpen && (
        <button
          id="chat-floating-launcher"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl hover:shadow-2xl flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 cursor-pointer group"
          title="Open Team Chat"
          aria-label="Open Chat"
        >
          <div className="relative">
            <MessageSquare className="w-6 h-6" />
            {totalUnreadCount > 0 && (
              <span className="absolute -top-2.5 -right-2.5 bg-red-500 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white dark:border-slate-900 min-w-[20px] text-center shadow-xs animate-bounce">
                {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
              </span>
            )}
          </div>
          {/* Subtle hover label */}
          <span className="absolute right-16 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-medium px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md">
            Team Chat {totalUnreadCount > 0 && `(${totalUnreadCount} unread)`}
          </span>
        </button>
      )}

      {/* Floating Popup Chat Window */}
      {isOpen && (
        <div
          id="popup-chat-window"
          className="fixed bottom-6 right-6 z-50 w-[94vw] sm:w-[420px] h-[580px] max-h-[calc(100vh-40px)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          {/* Header */}
          <div className="bg-slate-900 dark:bg-slate-950 text-white px-3.5 py-2.5 flex items-center justify-between shrink-0 select-none border-b border-slate-800">
            <div className="flex items-center gap-2 min-w-0">
              {viewMode === 'chat' ? (
                <>
                  <button
                    onClick={() => setViewMode('list')}
                    className="p-1 hover:bg-neutral-800 rounded-lg transition-colors text-neutral-300 hover:text-white cursor-pointer"
                    title="All Conversations"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-2 min-w-0">
                    <div className="relative shrink-0">
                      {activeChat === 'group' ? (
                        <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center">
                          <Users className="w-4 h-4" />
                        </div>
                      ) : activePartner?.avatarUrl ? (
                        <img src={activePartner.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover border border-neutral-600" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                          {(activePartner?.name || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-white truncate flex items-center gap-1.5">
                        <span className="truncate">{activeChat === 'group' ? 'Team Group Chat' : activePartner?.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-300 truncate">
                        {typingUsers.length > 0 ? (
                          <span className="text-blue-400 font-medium animate-pulse">
                            {typingUsers[0]} typing...
                          </span>
                        ) : activeChat === 'group' ? (
                          `${users.length + 1} participants`
                        ) : (
                          activePartner?.role === 'superUser' ? 'Superuser' : 'Admin'
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  <span className="font-semibold text-xs text-white">Team Conversations</span>
                </div>
              )}
            </div>

            {/* Window Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenFullScreen();
                }}
                className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                title="Expand to Full-screen Chat"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                title="Minimize Chat"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                title="Close Chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Conversation List View */}
          {viewMode === 'list' && (
            <div className="flex-1 overflow-y-auto bg-neutral-50 dark:bg-slate-900 divide-y divide-neutral-100 dark:divide-slate-800">
              {/* Group Chat item */}
              <button
                onClick={() => switchChat('group')}
                className={`w-full flex items-center gap-3 p-3.5 hover:bg-neutral-100/90 dark:hover:bg-slate-800/90 transition-colors text-left cursor-pointer ${
                  activeChat === 'group' ? 'bg-blue-50/70 dark:bg-blue-950/70' : 'bg-white dark:bg-slate-900'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Users className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-neutral-900 dark:text-white">Team Group Chat</span>
                    {getUnreadCountForChat('group') > 0 && (
                      <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                        {getUnreadCountForChat('group')}
                      </span>
                    )}
                  </div>
                  {globalTypingUsers['group'] && globalTypingUsers['group'].length > 0 ? (
                    <div className="text-[11px] text-blue-500 dark:text-blue-400 truncate mt-0.5 italic animate-pulse font-medium">
                      {globalTypingUsers['group'].length === 1
                        ? `${globalTypingUsers['group'][0]} is typing...`
                        : `${globalTypingUsers['group'].length} typing...`}
                    </div>
                  ) : (
                    <p className="text-[11px] text-neutral-500 dark:text-slate-300 truncate mt-0.5">Superuser & All Admins group</p>
                  )}
                </div>
              </button>

              <div className="px-3 py-1.5 text-[10px] font-semibold text-neutral-400 dark:text-slate-400 uppercase tracking-wider bg-neutral-100/60 dark:bg-slate-800/60">
                Direct Messages
              </div>

              {users.map(u => {
                const unread = getUnreadCountForChat(u.id);
                return (
                  <button
                    key={u.id}
                    onClick={() => switchChat(u.id)}
                    className={`w-full flex items-center gap-3 p-3 hover:bg-neutral-100/90 dark:hover:bg-slate-800/90 transition-colors text-left cursor-pointer ${
                      activeChat === u.id ? 'bg-blue-50/70 dark:bg-blue-950/70' : 'bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="relative shrink-0">
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover border border-neutral-200 dark:border-slate-700" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-slate-700 text-neutral-700 dark:text-white font-bold flex items-center justify-center text-xs">
                          {(u.name || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-neutral-900 dark:text-white truncate">{u.name}</span>
                        {unread > 0 && (
                          <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                            {unread}
                          </span>
                        )}
                      </div>
                      {globalTypingUsers[u.id] && globalTypingUsers[u.id].length > 0 ? (
                        <div className="text-[11px] text-blue-500 dark:text-blue-400 truncate mt-0.5 italic animate-pulse font-medium">
                          typing...
                        </div>
                      ) : (
                        <p className="text-[11px] text-neutral-500 dark:text-slate-300 capitalize mt-0.5">
                          {u.role === 'superUser' ? 'Superuser' : 'Admin'}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Active Chat Conversation Feed */}
          {viewMode === 'chat' && (
            <div className="flex-1 flex flex-col min-h-0 bg-neutral-50/40 dark:bg-slate-950">
              
              {/* Message Feed */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-400 dark:text-slate-400">
                    <MessageSquare className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-xs">No messages yet in this conversation.</p>
                    <p className="text-[11px] text-neutral-400 dark:text-slate-400 mt-1">Send a message or attach case files below.</p>
                  </div>
                ) : (
                  chatMessages.map(msg => {
                    const isMine = msg.senderId === user?.uid;
                    const senderAvatar = getSenderAvatar(msg.senderId);
                    const isRead = isMine && msg.readBy && msg.readBy.length > 0;
                    const isReceived = isMine && msg.receivedBy && msg.receivedBy.length > 0;
                    const reactionCounts: { [emoji: string]: number } = {};
                    if (msg.reactions) {
                      Object.values(msg.reactions).forEach((em: string) => {
                        reactionCounts[em] = (reactionCounts[em] || 0) + 1;
                      });
                    }
                    const myReaction = msg.reactions && user ? msg.reactions[user.uid] : null;
                    const isHighlighted = highlightedMsgId === msg.id;

                    return (
                      <div
                        key={msg.id}
                        id={`popup-msg-${msg.id}`}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'} transition-colors duration-500 rounded-lg p-0.5 ${
                          isHighlighted ? 'bg-blue-100/60 dark:bg-blue-950/60 ring-2 ring-blue-400' : ''
                        }`}
                      >
                        <div className={`flex max-w-[88%] ${isMine ? 'flex-row-reverse' : 'flex-row'} gap-2 group/msg`}>
                          
                          {/* Sender Avatar */}
                          <div className="shrink-0 mt-0.5">
                            {senderAvatar ? (
                              <img src={senderAvatar} alt="" className="w-6 h-6 rounded-full object-cover border border-neutral-200 dark:border-slate-700" />
                            ) : (
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                                  isMine ? 'bg-blue-600 text-white' : 'bg-neutral-200 dark:bg-slate-700 text-neutral-700 dark:text-white'
                                }`}
                              >
                                {getSenderName(msg.senderId).charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>

                          <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} min-w-0`}>
                            {/* Sender Name & Time */}
                            <div className="flex items-baseline gap-1.5 mb-0.5 px-0.5">
                              <span className="text-[10px] font-medium text-neutral-600 dark:text-white">{getSenderName(msg.senderId)}</span>
                              <span className="text-[9px] text-neutral-400 dark:text-slate-300">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            {/* Bubble Container */}
                            <div className="relative">
                              <div
                                className={`rounded-xl px-3 py-2 shadow-2xs text-xs min-w-[105px] ${
                                  msg.text && msg.text.trim().startsWith('#') && !msg.text.includes('\n')
                                    ? 'w-fit max-w-[280px] sm:max-w-[320px]'
                                    : ''
                                } ${
                                  isMine
                                    ? 'bg-blue-600 text-white rounded-tr-xs'
                                    : 'bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 text-neutral-900 dark:text-white rounded-tl-xs'
                                }`}
                              >
                                {/* Replied-To Block */}
                                {msg.replyTo && (
                                  <button
                                    onClick={() => scrollToMessage(msg.replyTo!.id)}
                                    className={`mb-1.5 w-full text-left p-1.5 rounded border-l-2 transition-colors block text-[11px] cursor-pointer ${
                                      isMine
                                        ? 'bg-blue-700/60 border-white/80 text-blue-100 hover:bg-blue-700'
                                        : 'bg-neutral-50 dark:bg-slate-800 border-blue-500 text-neutral-700 dark:text-white hover:bg-neutral-100 dark:hover:bg-slate-750'
                                    }`}
                                  >
                                    <div className="font-semibold text-[10px] flex items-center gap-1">
                                      <Reply className="w-2.5 h-2.5" />
                                      <span>{msg.replyTo.senderName}</span>
                                    </div>
                                    <div className="truncate text-[10px] opacity-90">{msg.replyTo.text}</div>
                                  </button>
                                )}

                                {/* Message Text */}
                                {msg.text && (
                                  <ChatMessageRenderer
                                    text={msg.text}
                                    isMine={isMine}
                                    complaints={complaints}
                                    users={allKnownUsers}
                                    publicBodies={publicBodies}
                                    onNavigateToComplaint={onNavigateToComplaint}
                                    onNavigateToCauseList={onNavigateToCauseList}
                                    onNavigateToPublicBody={onNavigateToPublicBody}
                                    onNavigateToDesignatedOfficial={onNavigateToDesignatedOfficial}
                                  />
                                )}

                                {/* Attachments Box (Multi Attachment Support - Each separately added to case) */}
                                {getMessageAttachments(msg).length > 0 && (
                                  <div className="mt-2 space-y-1.5">
                                    {getMessageAttachments(msg).map((att, attIdx) => {
                                      const isImg = att.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(att.name);
                                      return (
                                        <div
                                          key={attIdx}
                                          className={`rounded-lg overflow-hidden border ${
                                            isMine ? 'border-blue-500/80 bg-blue-700/30' : 'border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800/80'
                                          }`}
                                        >
                                          {isImg ? (
                                            <div
                                              onClick={() => setViewingAttachment(att)}
                                              className="p-1 relative group/img cursor-pointer"
                                              title="Click to view full image"
                                            >
                                              <img
                                                src={att.data}
                                                alt={att.name}
                                                className="max-w-full max-h-48 rounded object-contain bg-neutral-950/5 hover:opacity-90 transition-opacity"
                                              />
                                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity rounded flex items-center justify-center">
                                                <span className="bg-white/90 dark:bg-slate-900/90 text-neutral-900 dark:text-white px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 shadow-sm">
                                                  <Eye className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                                  View
                                                </span>
                                              </div>
                                            </div>
                                          ) : (
                                            <div
                                              onClick={() => setViewingAttachment(att)}
                                              className={`flex items-center gap-1.5 p-2 cursor-pointer ${
                                                isMine ? 'hover:bg-blue-700/40 text-white' : 'hover:bg-neutral-100 dark:hover:bg-slate-700 text-neutral-800 dark:text-white'
                                              } transition-colors`}
                                              title="Click to view document"
                                            >
                                              <FileText className="w-4 h-4 shrink-0 text-blue-500" />
                                              <div className="min-w-0 flex-1">
                                                <span className="text-[11px] truncate font-medium block dark:text-white">{att.name}</span>
                                                <span className={`text-[9px] block ${isMine ? 'text-blue-200' : 'text-neutral-500 dark:text-slate-300'}`}>Click to preview</span>
                                              </div>
                                            </div>
                                          )}

                                          {/* Action Bar: View, Download, and Add to Case */}
                                          <div className={`flex items-center justify-between p-1 px-1.5 border-t gap-1 ${isMine ? 'border-blue-500/50' : 'border-neutral-200 dark:border-slate-700'}`}>
                                            <span className={`text-[10px] truncate max-w-[90px] sm:max-w-[120px] ${isMine ? 'text-blue-100' : 'text-neutral-500 dark:text-slate-300'}`}>
                                              {att.name}
                                            </span>

                                            <div className="flex items-center gap-1 shrink-0">
                                              <button
                                                type="button"
                                                onClick={() => setViewingAttachment(att)}
                                                className={`p-1 text-[10px] rounded transition-colors cursor-pointer ${
                                                  isMine
                                                    ? 'text-blue-100 hover:bg-white/15'
                                                    : 'text-neutral-700 dark:text-white hover:bg-neutral-200 dark:hover:bg-slate-700 bg-white dark:bg-slate-800 border border-neutral-200 dark:border-slate-700'
                                                }`}
                                                title={`View ${att.name}`}
                                              >
                                                <Eye className="w-3 h-3 text-blue-500" />
                                              </button>

                                              <a
                                                href={att.data}
                                                download={att.name}
                                                className={`p-1 text-[10px] rounded transition-colors cursor-pointer ${
                                                  isMine
                                                    ? 'text-blue-100 hover:bg-white/15'
                                                    : 'text-neutral-700 dark:text-white hover:bg-neutral-200 dark:hover:bg-slate-700 bg-white dark:bg-slate-800 border border-neutral-200 dark:border-slate-700'
                                                }`}
                                                title={`Download ${att.name}`}
                                              >
                                                <Download className="w-3 h-3 text-emerald-500" />
                                              </a>

                                              <button
                                                type="button"
                                                onClick={() => setAttachModalData(att)}
                                                className={`flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium rounded transition-colors cursor-pointer ${
                                                  isMine
                                                    ? 'text-blue-100 hover:bg-white/15'
                                                    : 'text-neutral-700 dark:text-white hover:bg-neutral-200 dark:hover:bg-slate-700 bg-white dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 shadow-2xs'
                                                }`}
                                                title={`Add "${att.name}" to Case`}
                                              >
                                                <PlusCircle className="w-3 h-3 text-blue-500" />
                                                <span className="hidden sm:inline">Case</span>
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>

                              {/* Floating Action Bar on Hover */}
                              <div
                                className="absolute top-0 -translate-y-1/2 right-1.5 opacity-0 pointer-events-none group-hover/msg:opacity-100 group-hover/msg:pointer-events-auto transition-all duration-150 z-20 flex items-center gap-0.5 bg-white dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 rounded-full shadow-md px-1 py-0.5"
                              >
                                {REACTION_EMOJIS.slice(0, 3).map(emoji => (
                                  <button
                                    key={emoji}
                                    onClick={() => handleReaction(msg.id, emoji)}
                                    className="p-0.5 hover:scale-125 transition-transform text-[11px] cursor-pointer"
                                    title={`React with ${emoji}`}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                                <button
                                  onClick={() => startReply(msg)}
                                  className="p-0.5 text-neutral-500 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-full transition-colors cursor-pointer"
                                  title="Reply"
                                >
                                  <Reply className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => setInfoModalMessage(msg)}
                                  className="p-0.5 text-neutral-500 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-full transition-colors cursor-pointer"
                                  title="Details"
                                >
                                  <Info className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Footer: Reactions & Status */}
                            <div className="flex flex-wrap items-center gap-1 mt-0.5 px-0.5">
                              {Object.keys(reactionCounts).length > 0 && (
                                <div className="flex flex-wrap gap-0.5">
                                  {Object.entries(reactionCounts).map(([emoji, count]) => (
                                    <button
                                      key={emoji}
                                      onClick={() => handleReaction(msg.id, emoji)}
                                      className={`flex items-center gap-0.5 text-[10px] px-1.5 py-0.2 rounded-full border shadow-2xs transition-colors cursor-pointer ${
                                        myReaction === emoji
                                          ? 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-200'
                                          : 'border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-neutral-700 dark:text-white hover:bg-neutral-50 dark:hover:bg-slate-750'
                                      }`}
                                    >
                                      <span>{emoji}</span>
                                      <span>{count}</span>
                                    </button>
                                  ))}
                                </div>
                              )}

                              {isMine && (
                                <div className="flex items-center text-[10px] text-neutral-400 dark:text-slate-400 ml-auto">
                                  {isRead ? (
                                    <div className="flex items-center text-blue-600 dark:text-blue-400" title="Read">
                                      <CheckCheck className="w-3 h-3" />
                                    </div>
                                  ) : isReceived ? (
                                    <div className="flex items-center text-neutral-400 dark:text-slate-400" title="Delivered">
                                      <CheckCheck className="w-3 h-3" />
                                    </div>
                                  ) : (
                                    <div className="flex items-center text-neutral-400 dark:text-slate-400" title="Sent">
                                      <Check className="w-3 h-3" />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Typing Indicator in Feed */}
                {typingUsers.length > 0 && (
                  <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-slate-300 italic px-2.5 py-1 bg-white dark:bg-slate-800 border border-neutral-200/80 dark:border-slate-700 rounded-full w-max shadow-2xs animate-pulse">
                    <div className="flex space-x-1 items-center">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
                    </div>
                    <span className="dark:text-white">
                      {typingUsers.length === 1
                        ? `${typingUsers[0]} is typing...`
                        : `${typingUsers[0]} & ${typingUsers.length - 1} others typing...`}
                    </span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-2.5 bg-white dark:bg-slate-900 border-t border-neutral-200 dark:border-slate-800 shrink-0 relative">
                
                {/* Autocomplete Popover for @, #, >, !, * */}
                <ChatAutocompletePopover
                  ref={autocompleteRef}
                  isOpen={showAutocomplete}
                  inputText={inputText}
                  complaints={complaints}
                  users={allKnownUsers}
                  publicBodies={publicBodies}
                  onSelect={handleAutocompleteSelect}
                  onClose={() => setShowAutocomplete(false)}
                />
                
                {/* Active Reply Banner */}
                {replyingTo && (
                  <div className="mb-2 flex items-center justify-between bg-blue-50/80 dark:bg-blue-950/70 border-l-2 border-blue-600 px-2.5 py-1.5 rounded-r-lg text-[11px]">
                    <div className="min-w-0 flex-1 mr-2">
                      <div className="font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-1">
                        <Reply className="w-3.5 h-3.5" />
                        <span>Replying to {replyingTo.senderName}</span>
                      </div>
                      <div className="text-neutral-600 dark:text-white truncate">{replyingTo.text}</div>
                    </div>
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="p-0.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Multiple Attachments Shelf */}
                {attachments.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 bg-blue-50/40 dark:bg-blue-950/50 rounded-lg border border-blue-100 dark:border-blue-900">
                    {attachments.map((att, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 text-neutral-800 dark:text-white px-2 py-1 rounded text-[11px] max-w-[180px] shadow-2xs"
                      >
                        {att.type.startsWith('image/') ? (
                          <img src={att.data} alt="" className="w-4 h-4 rounded object-cover shrink-0" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
                        )}
                        <span className="truncate font-medium text-neutral-700 dark:text-white">{att.name}</span>
                        <button
                          type="button"
                          onClick={() => removeAttachment(idx)}
                          className="p-0.5 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 rounded-full transition-colors cursor-pointer shrink-0 ml-0.5"
                          title="Remove"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center text-[10px] text-blue-600 dark:text-blue-400 font-medium px-1.5">
                      {attachments.length} attached
                    </div>
                  </div>
                )}

                <div className="flex items-end gap-1.5">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileUpload}
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-neutral-500 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Attach multiple files"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <div className="flex-1 bg-neutral-100 dark:bg-slate-800 rounded-lg border border-transparent focus-within:border-blue-400 dark:focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:ring-1 focus-within:ring-blue-200 dark:focus-within:ring-blue-900/30 transition-all flex items-center px-2.5 py-0.5">
                    <textarea
                      ref={textareaRef}
                      value={inputText}
                      onChange={handleInputChange}
                      onKeyDown={e => {
                        if (showAutocomplete && autocompleteRef.current) {
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            autocompleteRef.current.moveDown();
                            return;
                          }
                          if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            autocompleteRef.current.moveUp();
                            return;
                          }
                          if (e.key === 'Enter' || e.key === 'Tab') {
                            if (autocompleteRef.current.hasSelection()) {
                              const handled = autocompleteRef.current.selectCurrent();
                              if (handled) {
                                e.preventDefault();
                                return;
                              }
                            }
                          }
                          if (e.key === 'Escape') {
                            e.preventDefault();
                            setShowAutocomplete(false);
                            return;
                          }
                        }

                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder={replyingTo ? `Reply to ${replyingTo.senderName}...` : 'Type your message'}
                      className="w-full max-h-24 min-h-[36px] bg-transparent border-none focus:outline-none resize-none py-2 text-xs text-neutral-800 dark:text-white placeholder-neutral-400 dark:placeholder-slate-400"
                      rows={1}
                    />
                  </div>

                  <button
                    onClick={handleSend}
                    disabled={!inputText.trim() && attachments.length === 0}
                    className="p-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 rounded-lg transition-colors shrink-0 shadow-2xs cursor-pointer"
                    title="Send"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* Attach To Complaint Modal */}
      <AttachComplaintModal
        isOpen={!!attachModalData}
        attachment={attachModalData}
        onClose={() => setAttachModalData(null)}
      />

      {/* Message Info Modal */}
      <MessageInfoModal
        isOpen={!!infoModalMessage}
        message={infoModalMessage}
        allUsers={allKnownUsers}
        currentUserId={user?.uid || ''}
        onClose={() => setInfoModalMessage(null)}
      />

      {/* Attachment Full Lightbox Viewer Modal */}
      <AttachmentViewerModal
        attachment={viewingAttachment}
        onClose={() => setViewingAttachment(null)}
        onAddToCase={att => {
          setViewingAttachment(null);
          setAttachModalData(att);
        }}
      />
    </>
  );
}
