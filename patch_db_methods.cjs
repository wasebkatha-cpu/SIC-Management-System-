const fs = require('fs');
let content = fs.readFileSync('src/lib/mockDb.ts', 'utf-8');

const updateMsgMethod = `
  updateMessage: (messageId: string, updates: Partial<ChatMessage>) => {
    const messages = MockDB.getMessages();
    const index = messages.findIndex(m => m.id === messageId);
    if (index !== -1) {
      messages[index] = { ...messages[index], ...updates };
      localStorage.setItem('mock_messages', JSON.stringify(messages));
    }
  },
  updateUser: (userId: string, updates: Partial<MockUser>) => {
    const users = MockDB.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates };
      localStorage.setItem('mock_users', JSON.stringify(users));
    }
  },
`;

if (!content.includes('updateMessage: (')) {
  content = content.replace(
    "  getMessages: (): ChatMessage[] => {",
    updateMsgMethod + "\n  getMessages: (): ChatMessage[] => {"
  );
}

fs.writeFileSync('src/lib/mockDb.ts', content);
