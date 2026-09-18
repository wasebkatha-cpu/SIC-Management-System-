import React, { useState } from 'react';
import { X, CheckCheck, Check, Smile, Eye, Send, FileText, Image as ImageIcon } from 'lucide-react';
import { ChatMessage, MockUser, getMessageAttachments } from '../lib/mockDb';

interface MessageInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: ChatMessage | null;
  allUsers: MockUser[];
  currentUserId: string;
}

export default function MessageInfoModal({
  isOpen,
  onClose,
  message,
  allUsers,
  currentUserId
}: MessageInfoModalProps) {
  const [activeTab, setActiveTab] = useState<'reactions' | 'read' | 'delivered'>('reactions');
  const [reactionFilter, setReactionFilter] = useState<string>('all');

  if (!isOpen || !message) return null;

  // Resolve user helper
  const getUser = (userId: string) => {
    return allUsers.find(u => u.id === userId);
  };

  // Reactions
  const reactionsMap = message.reactions || {};
  const reactionEntries = Object.entries(reactionsMap);
  const distinctEmojis = Array.from(new Set(Object.values(reactionsMap)));

  const filteredReactions = reactionFilter === 'all'
    ? reactionEntries
    : reactionEntries.filter(([_, emoji]) => emoji === reactionFilter);

  // Read By
  const readUserIds = message.readBy || [];
  // Delivered / Received By
  const receivedUserIds = message.receivedBy || [];

  // Group members (excluding sender)
  const isGroup = message.receiverId === 'group';
  const targetUsers = isGroup
    ? allUsers.filter(u => u.id !== message.senderId)
    : allUsers.filter(u => u.id === message.receiverId);

  const pendingReadUsers = targetUsers.filter(u => !readUserIds.includes(u.id));

  return (
    <div className="fixed inset-0 bg-neutral-900/60 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] border border-neutral-200 dark:border-neutral-800">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-850">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-semibold">
              <CheckCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Message Info</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Delivery, read receipts & reactions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Preview */}
        <div className="px-6 py-3 bg-neutral-50 dark:bg-neutral-950/50 border-b border-neutral-100 dark:border-neutral-800">
          <div className="p-3 bg-white dark:bg-neutral-850 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs">
            {message.replyTo && (
              <div className="mb-2 pl-2 border-l-2 border-blue-500 text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800 py-1 px-2 rounded-r">
                <span className="font-medium text-neutral-700 dark:text-neutral-300">Reply to {message.replyTo.senderName}: </span>
                <span className="truncate">{message.replyTo.text}</span>
              </div>
            )}
            {message.text && (
              <p className="text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap line-clamp-3">{message.text}</p>
            )}
            {getMessageAttachments(message).length > 0 && (
              <div className="mt-2 space-y-1.5">
                {getMessageAttachments(message).map((att, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/40 p-2 rounded-lg">
                    {att.type.startsWith('image/') ? <ImageIcon className="w-4 h-4 shrink-0" /> : <FileText className="w-4 h-4 shrink-0" />}
                    <span className="truncate">{att.name}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-400 dark:text-neutral-500">
              <span>Sent: {new Date(message.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
              <span>{isGroup ? 'Group Chat' : 'Direct Message'}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 px-6 bg-white dark:bg-neutral-900 shrink-0">
          <button
            onClick={() => setActiveTab('reactions')}
            className={`flex items-center gap-2 py-3 px-2 text-sm font-medium border-b-2 transition-colors cursor-pointer mr-6 ${
              activeTab === 'reactions'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Smile className="w-4 h-4" />
            <span>Reactions ({reactionEntries.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('read')}
            className={`flex items-center gap-2 py-3 px-2 text-sm font-medium border-b-2 transition-colors cursor-pointer mr-6 ${
              activeTab === 'read'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Read by ({readUserIds.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('delivered')}
            className={`flex items-center gap-2 py-3 px-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'delivered'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Delivered ({receivedUserIds.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* Reactions Tab */}
          {activeTab === 'reactions' && (
            <div>
              {distinctEmojis.length > 1 && (
                <div className="flex gap-1.5 mb-4 pb-2 border-b border-neutral-100 dark:border-neutral-800 overflow-x-auto">
                  <button
                    onClick={() => setReactionFilter('all')}
                    className={`px-3 py-1 text-xs rounded-full font-medium transition-colors cursor-pointer ${
                      reactionFilter === 'all' 
                        ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900' 
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                    }`}
                  >
                    All ({reactionEntries.length})
                  </button>
                  {distinctEmojis.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => setReactionFilter(emoji)}
                      className={`px-3 py-1 text-xs rounded-full font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                        reactionFilter === emoji 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                      }`}
                    >
                      <span>{emoji}</span>
                      <span>{reactionEntries.filter(([_, e]) => e === emoji).length}</span>
                    </button>
                  ))}
                </div>
              )}

              {filteredReactions.length === 0 ? (
                <div className="text-center py-8 text-neutral-400 dark:text-neutral-500">
                  <Smile className="w-10 h-10 mx-auto mb-2 text-neutral-300 dark:text-neutral-600" />
                  <p className="text-sm">No reactions yet</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {filteredReactions.map(([userId, emoji]) => {
                    const usr = getUser(userId);
                    const isSelf = userId === currentUserId;
                    return (
                      <div key={userId} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          {usr?.avatarUrl ? (
                            <img src={usr.avatarUrl} alt={usr.name} className="w-9 h-9 rounded-full object-cover border border-neutral-200 dark:border-neutral-700" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-sm">
                              {(usr?.name || 'U').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                              <span>{usr ? usr.name : 'Unknown User'}</span>
                              {isSelf && <span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 px-1.5 py-0.5 rounded font-normal">You</span>}
                            </div>
                            <div className="text-xs text-neutral-500 dark:text-neutral-400 capitalize">{usr?.role === 'superUser' ? 'Superuser' : usr?.role}</div>
                          </div>
                        </div>
                        <span className="text-2xl p-1.5 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-100 dark:border-neutral-700 shadow-2xs">{emoji}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Read By Tab */}
          {activeTab === 'read' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">
                  Read ({readUserIds.length})
                </h4>
                {readUserIds.length === 0 ? (
                  <p className="text-sm text-neutral-400 dark:text-neutral-500 py-3 italic">Not read by anyone yet</p>
                ) : (
                  <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {readUserIds.map(userId => {
                      const usr = getUser(userId);
                      const isSelf = userId === currentUserId;
                      return (
                        <div key={userId} className="flex items-center justify-between py-3">
                          <div className="flex items-center gap-3">
                            {usr?.avatarUrl ? (
                              <img src={usr.avatarUrl} alt={usr.name} className="w-9 h-9 rounded-full object-cover border border-neutral-200 dark:border-neutral-700" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-sm">
                                {(usr?.name || 'U').charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                                <span>{usr ? usr.name : 'Unknown User'}</span>
                                {isSelf && <span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 px-1.5 py-0.5 rounded font-normal">You</span>}
                              </div>
                              <div className="text-xs text-neutral-500 dark:text-neutral-400 capitalize">{usr?.role === 'superUser' ? 'Superuser' : usr?.role}</div>
                            </div>
                          </div>
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-1 rounded-full">
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Read</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {isGroup && pendingReadUsers.length > 0 && (
                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <h4 className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">
                    Delivered / Not read yet ({pendingReadUsers.length})
                  </h4>
                  <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {pendingReadUsers.map(usr => (
                      <div key={usr.id} className="flex items-center justify-between py-2.5 opacity-60">
                        <div className="flex items-center gap-3">
                          {usr.avatarUrl ? (
                            <img src={usr.avatarUrl} alt={usr.name} className="w-8 h-8 rounded-full object-cover border border-neutral-200 dark:border-neutral-700" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 font-bold flex items-center justify-center text-xs">
                              {usr.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{usr.name}</div>
                            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 capitalize">{usr.role === 'superUser' ? 'Superuser' : usr.role}</div>
                          </div>
                        </div>
                        <span className="text-xs text-neutral-400 dark:text-neutral-500">Pending</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Delivered Tab */}
          {activeTab === 'delivered' && (
            <div>
              <h4 className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">
                Delivered to ({receivedUserIds.length})
              </h4>
              {receivedUserIds.length === 0 ? (
                <div className="text-center py-8 text-neutral-400 dark:text-neutral-500">
                  <Check className="w-10 h-10 mx-auto mb-2 text-neutral-300 dark:text-neutral-600" />
                  <p className="text-sm">Not delivered to other active devices yet</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {receivedUserIds.map(userId => {
                    const usr = getUser(userId);
                    const isSelf = userId === currentUserId;
                    return (
                      <div key={userId} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          {usr?.avatarUrl ? (
                            <img src={usr.avatarUrl} alt={usr.name} className="w-9 h-9 rounded-full object-cover border border-neutral-200 dark:border-neutral-700" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-sm">
                              {(usr?.name || 'U').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                              <span>{usr ? usr.name : 'Unknown User'}</span>
                              {isSelf && <span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 px-1.5 py-0.5 rounded font-normal">You</span>}
                            </div>
                            <div className="text-xs text-neutral-500 dark:text-neutral-400 capitalize">{usr?.role === 'superUser' ? 'Superuser' : usr?.role}</div>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-full">
                          <CheckCheck className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                          <span>Delivered</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-xl text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
