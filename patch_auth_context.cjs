const fs = require('fs');
let content = fs.readFileSync('src/context/AuthContext.tsx', 'utf-8');

// Add avatarUrl to AppUser
if (!content.includes('avatarUrl?: string;')) {
  content = content.replace(
    "  assignedReaderId?: string;\n}",
    "  assignedReaderId?: string;\n  avatarUrl?: string;\n}"
  );
}

// When logging in, load avatar from MockDB users
const loginReplace = `
  const login = async (newUser: AppUser) => {
    const dbUsers = MockDB.getUsers();
    const dbUser = dbUsers.find(u => u.id === newUser.uid);
    if (dbUser && dbUser.avatarUrl) {
      newUser.avatarUrl = dbUser.avatarUrl;
    }
    
    setUser(newUser);
`;
content = content.replace(
  "  const login = async (newUser: AppUser) => {\n    setUser(newUser);",
  loginReplace
);

fs.writeFileSync('src/context/AuthContext.tsx', content);

