const fs = require('fs');
let content = fs.readFileSync('src/components/chat.tsx', 'utf-8');

// Replace avatars in direct chats sidebar
const sidebarUserAvatarHtml = `
              <div className={\`w-10 h-10 rounded-full flex items-center justify-center shrink-0 \${activeChat === u.id ? 'bg-blue-600 text-white' : 'bg-neutral-200 text-neutral-600'}\`}>
                {u.avatarUrl ? (
                   <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover rounded-full" />
                ) : (
                   <UserIcon className="w-5 h-5" />
                )}
              </div>
`;
content = content.replace(
  /<div className=\{\`w-10 h-10 rounded-full flex items-center justify-center shrink-0 \$\{activeChat === u.id \? 'bg-blue-600 text-white' : 'bg-neutral-200 text-neutral-600'\}\`\}>\s*<UserIcon className="w-5 h-5" \/>\s*<\/div>/,
  sidebarUserAvatarHtml
);

// Get sender avatar
if (!content.includes('const getSenderAvatar =')) {
  content = content.replace(
    "const getSenderName = (senderId: string) => {",
    "const getSenderAvatar = (senderId: string) => {\n    if (senderId === user?.uid) return user?.avatarUrl;\n    return users.find(u => u.id === senderId)?.avatarUrl;\n  };\n  const getSenderName = (senderId: string) => {"
  );
}

// Map loop UI replace
const chatUIHtml = `
            chatMessages.map(msg => {
              const isMine = msg.senderId === user?.uid;
              const senderAvatar = getSenderAvatar(msg.senderId);
              
              // Reactions processing
              const reactions = msg.reactions || {};
              const reactionCounts: Record<string, number> = {};
              Object.values(reactions).forEach(r => {
                reactionCounts[r] = (reactionCounts[r] || 0) + 1;
              });
              const myReaction = user ? reactions[user.uid] : null;
              
              // Read status
              const isRead = activeChat === 'group' 
                ? (msg.readBy && msg.readBy.length > 0) 
                : (msg.readBy && msg.readBy.includes(activeChat));
                
              const isReceived = activeChat === 'group' 
                ? (msg.receivedBy && msg.receivedBy.length > 0) 
                : (msg.receivedBy && msg.receivedBy.includes(activeChat));
              
              return (
                <div key={msg.id} className={\`flex \${isMine ? 'justify-end' : 'justify-start'}\`}>
                  <div className={\`flex max-w-[80%] \${isMine ? 'flex-row-reverse' : 'flex-row'} gap-2\`}>
                    
                    {/* Avatar */}
                    <div className="shrink-0 mt-1">
                      {senderAvatar ? (
                         <img src={senderAvatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-neutral-200 shadow-sm" />
                      ) : (
                         <div className={\`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs \${isMine ? 'bg-blue-600 text-white' : 'bg-neutral-200 text-neutral-600'}\`}>
                           {getSenderName(msg.senderId).charAt(0).toUpperCase()}
                         </div>
                      )}
                    </div>
                    
                    <div className={\`flex flex-col \${isMine ? 'items-end' : 'items-start'}\`}>
                      <div className="flex items-baseline gap-2 mb-1 px-1">
                        <span className="text-sm font-medium text-neutral-700">{getSenderName(msg.senderId)}</span>
                        <span className="text-[10px] text-neutral-400">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      <div className="relative group/message">
                        <div className={\`rounded-2xl px-4 py-2 shadow-sm \${
                          isMine ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-neutral-100 text-neutral-800 rounded-tl-sm'
                        }\`}>
                          {msg.text && <div className="whitespace-pre-wrap break-words">{msg.text}</div>}
                          
                          {msg.attachment && (
                            <div className={\`mt-2 rounded-lg overflow-hidden border \${isMine ? 'border-blue-500 bg-blue-700/10' : 'border-neutral-200 bg-white'}\`}>
                              {msg.attachment.type.startsWith('image/') ? (
                                <img src={msg.attachment.data} alt={msg.attachment.name} className="max-w-full max-h-64 object-contain bg-neutral-900/5" />
                              ) : (
                                <a 
                                   href={msg.attachment.data} 
                                   download={msg.attachment.name}
                                  className={\`flex items-center gap-2 p-3 \${isMine ? 'bg-blue-700/50 hover:bg-blue-700' : 'hover:bg-neutral-50'} transition-colors\`}
                                >
                                  <FileText className="w-5 h-5 shrink-0" />
                                  <span className="text-sm truncate font-medium">{msg.attachment.name}</span>
                                </a>
                              )}
                              <div className={\`flex justify-end p-1 border-t \${isMine ? 'border-blue-500' : 'border-neutral-200'}\`}>
                                <button 
                                   onClick={() => setAttachModalData(msg.attachment)}
                                  className={\`flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded hover:bg-opacity-20 transition-colors \${isMine ? 'text-blue-100 hover:bg-white' : 'text-neutral-500 hover:bg-neutral-900 hover:text-neutral-700'}\`}
                                  title="Add to Complaint"
                                >
                                  <PlusCircle className="w-3.5 h-3.5" />
                                  <span>Add to Case</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Status (Read/Received) */}
                        {isMine && (
                          <div className="absolute -bottom-5 right-1 flex items-center text-neutral-400">
                            {isRead ? (
                               <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                            ) : isReceived ? (
                               <CheckCheck className="w-3.5 h-3.5" />
                            ) : (
                               <Check className="w-3.5 h-3.5" />
                            )}
                          </div>
                        )}
                        
                        {/* Quick Reaction Button on Hover */}
                        <div className={\`absolute top-1/2 -translate-y-1/2 \${isMine ? '-left-10' : '-right-10'} opacity-0 group-hover/message:opacity-100 transition-opacity\`}>
                           <button 
                             onClick={() => handleReaction(msg.id, '👍')}
                             className="p-1.5 bg-white border border-neutral-200 rounded-full text-neutral-500 hover:bg-neutral-50 shadow-sm"
                           >
                             <Smile className="w-4 h-4" />
                           </button>
                        </div>
                      </div>
                      
                      {/* Render Reactions */}
                      {Object.keys(reactionCounts).length > 0 && (
                        <div className={\`flex gap-1 mt-1 z-10 \${isMine ? 'mr-2' : 'ml-2'}\`}>
                           {Object.entries(reactionCounts).map(([emoji, count]) => (
                             <button 
                               key={emoji}
                               onClick={() => handleReaction(msg.id, emoji)}
                               className={\`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border bg-white shadow-sm \${myReaction === emoji ? 'border-blue-300 bg-blue-50 text-blue-600' : 'border-neutral-200 text-neutral-600'}\`}
                             >
                               <span>{emoji}</span>
                               {count > 1 && <span>{count}</span>}
                             </button>
                           ))}
                        </div>
                      )}
                      
                    </div>
                  </div>
                </div>
              );
            })
`;
content = content.replace(
  /chatMessages\.map\(msg => \{[\s\S]*?\}\)[\s\n]*\)/,
  chatUIHtml + "\n          )"
);

fs.writeFileSync('src/components/chat.tsx', content);

