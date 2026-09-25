const fs = require('fs');
let content = fs.readFileSync('src/components/chat.tsx', 'utf-8');

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
    "const handleSend =",
    reactionHandler + "\n\n  const handleSend ="
  );
}

// Fix 'unknown' index type
content = content.replace(
  "Object.values(reactions).forEach(r => {",
  "Object.values(reactions).forEach((r: any) => {"
);

fs.writeFileSync('src/components/chat.tsx', content);

