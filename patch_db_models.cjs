const fs = require('fs');
let content = fs.readFileSync('src/lib/mockDb.ts', 'utf-8');

// Add avatar to MockUser
content = content.replace(
  "  createdAt: string;\n}",
  "  createdAt: string;\n  avatarUrl?: string;\n}"
);

// Add read/received state to ChatMessage
content = content.replace(
  "  timestamp: string;\n}",
  "  timestamp: string;\n  receivedBy?: string[];\n  readBy?: string[];\n  reactions?: { [userId: string]: string };\n}"
);

fs.writeFileSync('src/lib/mockDb.ts', content);
