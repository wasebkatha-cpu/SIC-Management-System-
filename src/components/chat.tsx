import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { MockDB, ChatMessage, MockUser, ChatAttachment, getMessageAttachments } from '../lib/mockDb';
import { apiFetch } from '../lib/apiConfig';
import {
  Send,
  Paperclip,
  Users,
  User as UserIcon,
  FileText,
  Image as ImageIcon,
  X,
  MessageSquare,
  PlusCircle,
  Check,
  CheckCheck,
  Smile,
  Reply,
  Info,
  Camera,
  Eye,
  Download,
  Edit2
} from 'lucide-react';
import AttachComplaintModal from './AttachComplaintModal';
import MessageInfoModal from './MessageInfoModal';
import AttachmentViewerModal from './AttachmentViewerModal';
import EditProfileModal from './EditProfileModal';
import { useAppContext } from '../context/AppContext';
import { ChatAutocompletePopover, ChatAutocompleteRef } from './ChatAutocompletePopover';
import { ChatMessageRenderer } from './ChatMessageRenderer';

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '👏', '🎉'];

interface ChatProps {
  onNavigateToComplaint?: (complaintId: string) => void;
  onNavigateToCauseList?: (date?: string) => void;
  onNavigateToPublicBody?: (publicBodyName: string) => void;
  onNavigateToDesignatedOfficial?: (officialName: string) => void;
}

export default function Chat({
  onNavigateToComplaint,
  onNavigateToCauseList,
  onNavigateToPublicBody,
  onNavigateToDesignatedOfficial
}: ChatProps = {}) {
  const { user, updateAvatar } = useAuth();
  const { complaints, publicBodies } = useAppContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<MockUser[]>([]);
  const [activeChat, setActiveChat] = useState<string>('group'); // 'group' or userId
  const [inputText, setInputText] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [attachModalData, setAttachModalData] = useState<ChatAttachment | null>(null);
  const [viewingAttachment, setViewingAttachment] = useState<ChatAttachment | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [infoModalMessage, setInfoModalMessage] = useState<ChatMessage | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ id: string; senderId: string; senderName: string; text: string } | null>(null);
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [globalTypingUsers, setGlobalTypingUsers] = useState<Record<string, string[]>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autocompleteRef = useRef<ChatAutocompleteRef>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Load all users from DB
    const refreshUsers = () => {
      const allUsers = MockDB.getUsers();
      setUsers(allUsers.filter(u => u.id !== user?.uid)); // Exclude self for direct list
    };
    refreshUsers();

    // Check if there was an active chat target requested
    const target = localStorage.getItem('active_chat_target');
    if (target) {
      setActiveChat(target);
      localStorage.removeItem('active_chat_target');
    }

    const handleSwitchChat = (e: any) => {
      if (e.detail) {
        setActiveChat(e.detail);
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

    // Mark as read/received logic
    if (user) {
      let updated = false;
      const syncedMsgs = new Set<ChatMessage>();
      
      allMessages.forEach(msg => {
        // If message is not from me
        if (msg.senderId !== user.uid) {
          let msgUpdated = false;
          // If in group chat, or if it's sent to me
          if (msg.receiverId === 'group' || msg.receiverId === user.uid) {
            // Mark received if not already
            if (!msg.receivedBy?.includes(user.uid)) {
              msg.receivedBy = [...(msg.receivedBy || []), user.uid];
              updated = true;
              msgUpdated = true;
            }

            // Mark read if it's the active chat
            if (
              (activeChat === 'group' && msg.receiverId === 'group') ||
              (activeChat !== 'group' && msg.senderId === activeChat)
            ) {
              if (!msg.readBy?.includes(user.uid)) {
                msg.readBy = [...(msg.readBy || []), user.uid];
                updated = true;
                msgUpdated = true;
              }
            }
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
  }, [activeChat, user]);

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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, activeChat]);

  const switchChat = (newChatId: string) => {
    if (user && activeChat) {
      MockDB.setTyping(user.uid, user.name || user.username, activeChat, false);
    }
    setActiveChat(newChatId);
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

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      alert('Please select an image under 1MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async ev => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl && updateAvatar) {
        await updateAvatar(dataUrl);
      }
    };
    reader.readAsDataURL(file);
    if (avatarInputRef.current) avatarInputRef.current.value = '';
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
    const el = document.getElementById(`msg-${msgId}`);
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

  const allKnownUsers = MockDB.getUsers();

  const getSenderAvatar = (senderId: string) => {
    if (senderId === user?.uid) return user?.avatarUrl;
    return allKnownUsers.find(u => u.id === senderId)?.avatarUrl;
  };

  const getSenderName = (senderId: string) => {
    if (senderId === user?.uid) return user?.name ? `${user.name} (You)` : 'You';
    const sender = allKnownUsers.find(u => u.id === senderId);
    return sender ? (sender.name || sender.username) : 'Unknown User';
  };

  const getReactionUserNames = (msg: ChatMessage, emoji: string) => {
    const reactions = msg.reactions || {};
    const usersReacted = Object.entries(reactions)
      .filter(([_, em]) => em === emoji)
      .map(([uId]) => (uId === user?.uid ? (user?.name ? `${user.name} (You)` : 'You') : allKnownUsers.find(u => u.id === uId)?.name || 'User'));
    return usersReacted.join(', ');
  };

  const activeUserPartner = activeChat !== 'group' ? allKnownUsers.find(u => u.id === activeChat) : null;

  return (
    <div className="flex h-full bg-white dark:bg-slate-950 text-neutral-900 dark:text-white transition-colors">
      {/* Sidebar */}
      <div className="w-fit min-w-fit border-r border-neutral-200 dark:border-slate-800 bg-neutral-50 dark:bg-slate-900 flex flex-col h-full shrink-0">
        <div className="px-4 py-3.5 border-b border-neutral-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-semibold text-neutral-800 dark:text-white text-base whitespace-nowrap">Conversations</h2>
        </div>
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {/* Group Chat */}
          <button
            onClick={() => switchChat('group')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 border-b border-neutral-100 dark:border-slate-800 hover:bg-neutral-100/80 dark:hover:bg-slate-800/80 transition-colors text-left cursor-pointer ${
              activeChat === 'group' ? 'bg-blue-50/80 dark:bg-blue-950/70 border-blue-200 dark:border-blue-700' : ''
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                activeChat === 'group' ? 'bg-blue-600 text-white' : 'bg-neutral-200 dark:bg-slate-700 text-neutral-600 dark:text-white'
              }`}
            >
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0 pr-3">
              <div className="font-semibold text-neutral-900 dark:text-white text-sm whitespace-nowrap">Team Group Chat</div>
              {globalTypingUsers['group'] && globalTypingUsers['group'].length > 0 ? (
                <div className="text-xs text-blue-500 dark:text-blue-400 whitespace-nowrap italic animate-pulse font-medium">
                  {globalTypingUsers['group'].length === 1
                    ? `${globalTypingUsers['group'][0]} is typing...`
                    : `${globalTypingUsers['group'].length} typing...`}
                </div>
              ) : (
                <div className="text-xs text-neutral-500 dark:text-slate-300 whitespace-nowrap">Superuser & All Admins</div>
              )}
            </div>
          </button>

          <div className="px-4 py-2 mt-3 text-[11px] font-semibold text-neutral-400 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
            Direct Messages
          </div>

          {/* Direct Chats */}
          {users.map(u => {
            const isSelected = activeChat === u.id;
            return (
              <button
                key={u.id}
                onClick={() => switchChat(u.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 border-b border-neutral-100 dark:border-slate-800 hover:bg-neutral-100/80 dark:hover:bg-slate-800/80 transition-colors text-left cursor-pointer ${
                  isSelected ? 'bg-blue-50/80 dark:bg-blue-950/70 border-blue-200 dark:border-blue-700' : ''
                }`}
              >
                <div className="relative shrink-0">
                  {u.avatarUrl ? (
                    <img src={u.avatarUrl} alt={u.name} className="w-10 h-10 rounded-full object-cover border border-neutral-200 dark:border-slate-700" />
                  ) : (
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-neutral-200 dark:bg-slate-700 text-neutral-700 dark:text-white'
                      }`}
                    >
                      {(u.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
                </div>

                <div className="min-w-0 pr-3">
                  <div className="font-medium text-neutral-900 dark:text-white text-sm whitespace-nowrap">{u.name}</div>
                  {globalTypingUsers[u.id] && globalTypingUsers[u.id].length > 0 ? (
                    <div className="text-xs text-blue-500 dark:text-blue-400 whitespace-nowrap italic animate-pulse font-medium">
                      typing...
                    </div>
                  ) : (
                    <div className="text-xs text-neutral-500 dark:text-slate-300 whitespace-nowrap capitalize">{u.role === 'superUser' ? 'Superuser' : u.role}</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-950 relative min-w-0">
        
        {/* Header with Active Chat Info & Current User Profile Bar */}
        <div className="h-16 border-b border-neutral-200 dark:border-slate-800 flex items-center justify-between px-6 bg-white dark:bg-slate-900 shrink-0 shadow-2xs z-10">
          <div className="flex items-center gap-3 min-w-0">
            {activeChat === 'group' ? (
              <>
                <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-neutral-900 dark:text-white text-sm">Team Group Chat</div>
                  <div className="text-xs text-neutral-500 dark:text-slate-300">{users.length + 1} participants</div>
                </div>
              </>
            ) : (
              <>
                <div className="relative shrink-0">
                  {activeUserPartner?.avatarUrl ? (
                    <img src={activeUserPartner.avatarUrl} alt={activeUserPartner.name} className="w-9 h-9 rounded-full object-cover border border-neutral-200 dark:border-slate-700" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-sm">
                      {(activeUserPartner?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-semibold text-neutral-900 dark:text-white text-sm">{activeUserPartner?.name}</div>
                  <div className="text-xs text-neutral-500 dark:text-slate-300 capitalize">{activeUserPartner?.role === 'superUser' ? 'Superuser' : activeUserPartner?.role}</div>
                </div>
              </>
            )}
          </div>

          {/* User Profile Quick Uploader & Name Editor in Chat Header */}
          <div className="flex items-center gap-2.5 bg-neutral-50 dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 px-3 py-1.5 rounded-full">
            <div className="relative group shrink-0">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Your Avatar" className="w-7 h-7 rounded-full object-cover border border-neutral-300 dark:border-slate-600" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                  {(user?.name || user?.username || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowProfileModal(true)}
                className="absolute inset-0 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                title="Change profile picture & actual name"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-left hidden sm:block">
              <div className="flex items-center gap-1">
                <span
                  onClick={() => setShowProfileModal(true)}
                  className="text-xs font-semibold text-neutral-800 dark:text-white block truncate max-w-[140px] hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                  title="Click to change your display name"
                >
                  {user?.name || user?.username}
                </span>
                <button
                  type="button"
                  onClick={() => setShowProfileModal(true)}
                  className="text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 p-0.5 rounded transition-colors cursor-pointer"
                  title="Edit Actual Name & Photo"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
              <span className="text-[10px] text-neutral-500 dark:text-slate-300 capitalize block leading-none">{user?.role === 'superUser' ? 'Superuser' : user?.role}</span>
            </div>
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-neutral-50/40 dark:bg-neutral-950">
          {chatMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-500">
              <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                <MessageSquare className="w-7 h-7 text-neutral-300 dark:text-neutral-600" />
              </div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">No messages in this chat yet</p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">Send a message or share an attachment below</p>
            </div>
          ) : (
            chatMessages.map(msg => {
              const isMine = msg.senderId === user?.uid;
              const senderAvatar = getSenderAvatar(msg.senderId);

              // Reactions
              const reactions = msg.reactions || {};
              const reactionCounts: Record<string, number> = {};
              Object.values(reactions).forEach((r: any) => {
                reactionCounts[r] = (reactionCounts[r] || 0) + 1;
              });
              const myReaction = user ? reactions[user.uid] : null;

              // Read / Received Status
              const isRead =
                activeChat === 'group'
                  ? msg.readBy && msg.readBy.length > 0
                  : msg.readBy && msg.readBy.includes(activeChat);

              const isReceived =
                activeChat === 'group'
                  ? msg.receivedBy && msg.receivedBy.length > 0
                  : msg.receivedBy && msg.receivedBy.includes(activeChat);

              const readCount = msg.readBy?.length || 0;
              const receivedCount = msg.receivedBy?.length || 0;

              const isHighlighted = highlightedMsgId === msg.id;

              return (
                <div
                  key={msg.id}
                  id={`msg-${msg.id}`}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'} transition-colors duration-500 rounded-xl p-1 ${
                    isHighlighted ? 'bg-blue-100/60 dark:bg-blue-950/60 ring-2 ring-blue-400' : ''
                  }`}
                >
                  <div className={`flex max-w-[85%] md:max-w-[75%] ${isMine ? 'flex-row-reverse' : 'flex-row'} gap-2.5 group/message`}>
                    
                    {/* Sender Avatar */}
                    <div className="shrink-0 mt-1">
                      {senderAvatar ? (
                        <img
                          src={senderAvatar}
                          alt="Avatar"
                          className="w-8 h-8 rounded-full object-cover border border-neutral-200 dark:border-neutral-700 shadow-2xs"
                        />
                      ) : (
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-2xs ${
                            isMine ? 'bg-blue-600 text-white' : 'bg-neutral-200 dark:bg-slate-700 text-neutral-700 dark:text-white'
                          }`}
                        >
                          {getSenderName(msg.senderId).charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} min-w-0`}>
                      {/* Sender Name & Time */}
                      <div className="flex items-baseline gap-2 mb-1 px-1">
                        <span className="text-xs font-semibold text-neutral-700 dark:text-white">{getSenderName(msg.senderId)}</span>
                        <span className="text-[10px] text-neutral-400 dark:text-slate-300">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Bubble Container with Hover Actions */}
                      <div className="relative">
                        <div
                          className={`rounded-2xl px-4 py-2.5 shadow-xs transition-shadow min-w-[120px] ${
                            msg.text && msg.text.trim().startsWith('#') && !msg.text.includes('\n')
                              ? 'w-fit max-w-[320px] sm:max-w-[350px]'
                              : ''
                          } ${
                            isMine
                              ? 'bg-blue-600 text-white rounded-tr-xs'
                              : 'bg-white dark:bg-slate-900 border border-neutral-200/80 dark:border-slate-800 text-neutral-900 dark:text-white rounded-tl-xs'
                          }`}
                        >
                          {/* Replied-To Block */}
                          {msg.replyTo && (
                            <button
                              onClick={() => scrollToMessage(msg.replyTo!.id)}
                              className={`mb-2 w-full text-left p-2 rounded-lg border-l-3 transition-colors block text-xs cursor-pointer ${
                                isMine
                                  ? 'bg-blue-700/60 border-white/80 text-blue-100 hover:bg-blue-700'
                                  : 'bg-neutral-50 dark:bg-slate-800 border-blue-500 text-neutral-700 dark:text-white hover:bg-neutral-100 dark:hover:bg-slate-750'
                              }`}
                            >
                              <div className="font-semibold text-[11px] flex items-center gap-1 opacity-90">
                                <Reply className="w-3 h-3" />
                                <span>{msg.replyTo.senderName}</span>
                              </div>
                              <div className="truncate text-xs mt-0.5 opacity-90">{msg.replyTo.text}</div>
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

                          {/* Attachments Box (Multi Attachment Support) */}
                          {getMessageAttachments(msg).length > 0 && (
                            <div className="mt-2.5 space-y-2">
                              {getMessageAttachments(msg).map((att, attIdx) => {
                                const isImg = att.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(att.name);
                                return (
                                  <div
                                    key={attIdx}
                                    className={`rounded-xl overflow-hidden border ${
                                      isMine ? 'border-blue-500/80 bg-blue-700/30' : 'border-neutral-200 dark:border-slate-700 bg-neutral-50/50 dark:bg-slate-800/80'
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
                                          className="max-w-full max-h-60 rounded-lg object-contain bg-neutral-950/5 hover:opacity-90 transition-opacity"
                                        />
                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                                          <span className="bg-white/90 dark:bg-slate-900/90 text-neutral-900 dark:text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-md">
                                            <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                            View
                                          </span>
                                        </div>
                                      </div>
                                    ) : (
                                      <div
                                        onClick={() => setViewingAttachment(att)}
                                        className={`flex items-center gap-2.5 p-3 cursor-pointer ${
                                          isMine ? 'hover:bg-blue-700/40 text-white' : 'hover:bg-neutral-100 dark:hover:bg-slate-700 text-neutral-800 dark:text-white'
                                        } transition-colors`}
                                        title="Click to view file"
                                      >
                                        <FileText className="w-5 h-5 shrink-0 text-blue-500" />
                                        <div className="min-w-0 flex-1">
                                          <span className="text-xs truncate font-medium block dark:text-white">{att.name}</span>
                                          <span className={`text-[10px] block ${isMine ? 'text-blue-200' : 'text-neutral-500 dark:text-slate-300'}`}>Click to preview document</span>
                                        </div>
                                      </div>
                                    )}

                                    {/* Action Bar: View, Download, and Add to Case */}
                                    <div className={`flex items-center justify-between p-1.5 px-2.5 border-t gap-1.5 ${isMine ? 'border-blue-500/50' : 'border-neutral-200 dark:border-slate-700'}`}>
                                      <span className={`text-[11px] truncate max-w-[120px] sm:max-w-[160px] ${isMine ? 'text-blue-100' : 'text-neutral-500 dark:text-slate-300'}`}>
                                        {att.name}
                                      </span>

                                      <div className="flex items-center gap-1 shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => setViewingAttachment(att)}
                                          className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                                            isMine
                                              ? 'text-blue-100 hover:bg-white/15'
                                              : 'text-neutral-700 dark:text-white hover:bg-neutral-200 dark:hover:bg-slate-700 bg-white dark:bg-slate-800 border border-neutral-200 dark:border-slate-700'
                                          }`}
                                          title={`View ${att.name}`}
                                        >
                                          <Eye className="w-3.5 h-3.5 text-blue-500" />
                                          <span className="hidden sm:inline">View</span>
                                        </button>

                                        <a
                                          href={att.data}
                                          download={att.name}
                                          className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                                            isMine
                                              ? 'text-blue-100 hover:bg-white/15'
                                              : 'text-neutral-700 dark:text-white hover:bg-neutral-200 dark:hover:bg-slate-700 bg-white dark:bg-slate-800 border border-neutral-200 dark:border-slate-700'
                                          }`}
                                          title={`Download ${att.name}`}
                                        >
                                          <Download className="w-3.5 h-3.5 text-emerald-500" />
                                          <span className="hidden sm:inline">Download</span>
                                        </a>

                                        <button
                                          type="button"
                                          onClick={() => setAttachModalData(att)}
                                          className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                                            isMine
                                              ? 'text-blue-100 hover:bg-white/15'
                                              : 'text-neutral-700 dark:text-white hover:bg-neutral-200 dark:hover:bg-slate-700 bg-white dark:bg-slate-800 border border-neutral-200 dark:border-slate-700'
                                          }`}
                                          title={`Add "${att.name}" to Case Proceedings or Submissions`}
                                        >
                                          <PlusCircle className="w-3.5 h-3.5 text-blue-500" />
                                          <span className="hidden sm:inline">Add to Case</span>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Floating Action Bar on Hover (Reply, React, Message Info) */}
                        <div
                          className="absolute top-0 -translate-y-1/2 right-2 opacity-0 pointer-events-none group-hover/message:opacity-100 group-hover/message:pointer-events-auto transition-all duration-150 z-20 flex items-center gap-1 bg-white dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 rounded-full shadow-md px-1.5 py-0.5"
                        >
                          {/* Quick Reaction Emojis */}
                          <div className="flex items-center gap-0.5 border-r border-neutral-200 dark:border-slate-700 pr-1">
                            {REACTION_EMOJIS.slice(0, 3).map(emoji => (
                              <button
                                key={emoji}
                                onClick={() => handleReaction(msg.id, emoji)}
                                className="p-1 hover:scale-125 transition-transform text-xs cursor-pointer"
                                title={`React with ${emoji}`}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>

                          {/* Reply Button */}
                          <button
                            onClick={() => startReply(msg)}
                            className="p-1 text-neutral-500 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-neutral-100 dark:hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
                            title="Reply to message"
                          >
                            <Reply className="w-3.5 h-3.5" />
                          </button>

                          {/* Message Info Button */}
                          <button
                            onClick={() => setInfoModalMessage(msg)}
                            className="p-1 text-neutral-500 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-neutral-100 dark:hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
                            title="Message info (who read, received, reacted)"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Footer Row: Reactions, Read Receipts & Message Info Trigger */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-1 px-1">
                        
                        {/* Render Reactions Pills */}
                        {Object.keys(reactionCounts).length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(reactionCounts).map(([emoji, count]) => (
                              <button
                                key={emoji}
                                onClick={() => handleReaction(msg.id, emoji)}
                                className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border shadow-2xs transition-colors cursor-pointer ${
                                  myReaction === emoji
                                    ? 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-200 font-semibold'
                                    : 'border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-neutral-700 dark:text-white hover:bg-neutral-50 dark:hover:bg-slate-750'
                                }`}
                                title={`Reacted by: ${getReactionUserNames(msg, emoji)} (Click to toggle)`}
                              >
                                <span>{emoji}</span>
                                <span>{count}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Status Checkmarks (Delivered / Read) for Own Messages */}
                        {isMine && (
                          <button
                            onClick={() => setInfoModalMessage(msg)}
                            className="flex items-center gap-1 text-[11px] text-neutral-400 dark:text-slate-300 hover:text-neutral-700 dark:hover:text-white px-1 py-0.5 rounded transition-colors cursor-pointer"
                            title={
                              isRead
                                ? `Read by ${activeChat === 'group' ? `${readCount} members` : 'recipient'} (Click for details)`
                                : isReceived
                                ? `Delivered to ${activeChat === 'group' ? `${receivedCount} members` : 'recipient'} (Click for details)`
                                : 'Sent to server (Click for details)'
                            }
                          >
                            {isRead ? (
                              <CheckCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            ) : isReceived ? (
                              <CheckCheck className="w-3.5 h-3.5 text-neutral-400 dark:text-slate-400" />
                            ) : (
                              <Check className="w-3.5 h-3.5 text-neutral-400 dark:text-slate-400" />
                            )}
                            {activeChat === 'group' && readCount > 0 && (
                              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Read by {readCount}</span>
                            )}
                          </button>
                        )}

                        {/* Details Link on Others' Messages in Group */}
                        {!isMine && activeChat === 'group' && (
                          <button
                            onClick={() => setInfoModalMessage(msg)}
                            className="text-[10px] text-neutral-400 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                            title="View delivery, read receipts and reactions"
                          >
                            Details
                          </button>
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
            <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-slate-300 italic px-3 py-1.5 bg-neutral-100/70 dark:bg-slate-800/80 border border-neutral-200/50 dark:border-slate-700 rounded-full w-max animate-pulse my-1">
              <div className="flex space-x-1 items-center">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
              </div>
              <span className="dark:text-white">
                {typingUsers.length === 1
                  ? `${typingUsers[0]} is typing...`
                  : typingUsers.length === 2
                  ? `${typingUsers[0]} and ${typingUsers[1]} are typing...`
                  : `${typingUsers[0]} and ${typingUsers.length - 1} others are typing...`}
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-neutral-200 dark:border-slate-800 relative">
          
          {/* Autocomplete Mention / Complaint / Cause List Popover */}
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
            <div className="mb-2.5 flex items-center justify-between bg-blue-50/80 dark:bg-blue-950/70 border-l-4 border-blue-600 px-3 py-2 rounded-r-xl text-xs">
              <div className="min-w-0 flex-1 mr-2">
                <div className="font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                  <Reply className="w-3.5 h-3.5" />
                  <span>Replying to {replyingTo.senderName}</span>
                </div>
                <div className="text-neutral-600 dark:text-white truncate mt-0.5">{replyingTo.text}</div>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
                title="Cancel reply"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Multiple Attachments Preview Shelf */}
          {attachments.length > 0 && (
            <div className="mb-2.5 flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1.5 bg-blue-50/40 dark:bg-blue-950/50 rounded-xl border border-blue-100 dark:border-blue-900">
              {attachments.map((att, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 text-neutral-800 dark:text-white px-2.5 py-1.5 rounded-lg text-xs max-w-[240px] shadow-2xs"
                >
                  {att.type.startsWith('image/') ? (
                    <img src={att.data} alt={att.name} className="w-5 h-5 rounded object-cover shrink-0" />
                  ) : (
                    <FileText className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
                  )}
                  <span className="truncate font-medium text-neutral-700 dark:text-white">{att.name}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(idx)}
                    className="p-0.5 hover:bg-neutral-100 dark:hover:bg-slate-700 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 rounded-full transition-colors cursor-pointer shrink-0 ml-1"
                    title="Remove attachment"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <div className="flex items-center text-[11px] text-blue-600 dark:text-blue-400 font-medium px-2 py-1">
                {attachments.length} file{attachments.length > 1 ? 's' : ''} attached
              </div>
            </div>
          )}

          <div className="flex items-end gap-2">
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
              className="p-3 text-neutral-500 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Attach Files (Select multiple images, PDFs, documents)"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            
            <div className="flex-1 bg-neutral-100 dark:bg-slate-800 rounded-xl border border-transparent focus-within:border-blue-400 dark:focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/30 transition-all flex items-center px-4 py-1">
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
                className="w-full max-h-32 min-h-[44px] bg-transparent border-none focus:outline-none resize-none py-3 text-sm text-neutral-800 dark:text-white placeholder-neutral-400 dark:placeholder-slate-400"
                rows={1}
                style={{ height: '44px' }}
              />
            </div>
            
            <button
              onClick={handleSend}
              disabled={!inputText.trim() && attachments.length === 0}
              className="p-3 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 rounded-xl transition-colors shrink-0 shadow-sm cursor-pointer"
              title="Send Message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Attach To Complaint Modal */}
      <AttachComplaintModal
        isOpen={!!attachModalData}
        attachment={attachModalData}
        onClose={() => setAttachModalData(null)}
      />

      {/* Message Info Modal (Read receipts, delivery, and reactions) */}
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

      {/* Edit Profile & Actual Name Modal */}
      <EditProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  );
}
