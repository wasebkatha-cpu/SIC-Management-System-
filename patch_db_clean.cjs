const fs = require('fs');
let content = fs.readFileSync('src/lib/mockDb.ts', 'utf-8');

// Remove our duplicated updateUser
const duplicateUpdate = `
  updateUser: (userId: string, updates: Partial<MockUser>) => {
    const users = MockDB.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates };
      localStorage.setItem('mock_users', JSON.stringify(users));
    }
  },
`;
content = content.replace(duplicateUpdate, "");

fs.writeFileSync('src/lib/mockDb.ts', content);

