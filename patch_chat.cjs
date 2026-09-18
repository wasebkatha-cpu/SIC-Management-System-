const fs = require('fs');
let content = fs.readFileSync('src/components/chat.tsx', 'utf-8');

// Add Check, CheckCheck icon imports
if (!content.includes('Check,')) {
  content = content.replace(
    "import { Send, Paperclip, X, File, FileText, Image as ImageIcon, Users, User, PlusCircle } from 'lucide-react';",
    "import { Send, Paperclip, X, File, FileText, Image as ImageIcon, Users, User, PlusCircle, Check, CheckCheck, Smile } from 'lucide-react';"
  );
}

// Add read marking logic
const loadMessagesReplace = `
  const loadMessages = () => {
    const allMessages = MockDB.getMessages();
    setMessages(allMessages);
    
    // Mark as read/received logic
    if (user) {
      let updated = false;
      allMessages.forEach(msg => {
        // If message is not from me
        if (msg.senderId !== user.uid) {
          // If in group chat, or if it's sent to me
          if (msg.receiverId === 'group' || msg.receiverId === user.uid) {
            
            // Mark received if not already
            if (!msg.receivedBy?.includes(user.uid)) {
              msg.receivedBy = [...(msg.receivedBy || []), user.uid];
              updated = true;
            }
            
            // Mark read if it's the active chat
            if ((activeChat === 'group' && msg.receiverId === 'group') || 
                (activeChat !== 'group' && msg.senderId === activeChat)) {
              if (!msg.readBy?.includes(user.uid)) {
                msg.readBy = [...(msg.readBy || []), user.uid];
                updated = true;
              }
            }
          }
        }
      });
      if (updated) {
        localStorage.setItem('mock_messages', JSON.stringify(allMessages));
      }
    }
  };
`;
content = content.replace(
  /const loadMessages = \(\) => \{[\s\S]*?setMessages\(allMessages\);\n  \};/,
  loadMessagesReplace
);

// Reaction handler
const reactionHandler = `
  const handleReaction = (messageId: string, reaction: string) => {
    if (!user) return;
    const msg = messages.find(m => m.id === messageId);
    if (!msg) return;
    
    const reactions = msg.reactions || {};
    if (reactions[user.uid] === reaction) {
      delete reactions[user.uid];
    } else {
      reactions[user.uid] = reaction;
    }
    
    MockDB.updateMessage(messageId, { reactions });
    loadMessages();
  };
`;
if (!content.includes('const handleReaction =')) {
  content = content.replace(
    "const handleSendMessage = () => {",
    reactionHandler + "\n\n  const handleSendMessage = () => {"
  );
}

fs.writeFileSync('src/components/chat.tsx', content);

