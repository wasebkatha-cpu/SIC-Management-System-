const fs = require('fs');
let content = fs.readFileSync('src/context/AuthContext.tsx', 'utf-8');

// The first patch didn't match because the var was appUser, not newUser
const loginReplace = `
  const login = async (appUser: AppUser) => {
    const dbUsers = MockDB.getUsers();
    const dbUser = dbUsers.find(u => u.id === appUser.uid);
    if (dbUser && dbUser.avatarUrl) {
      appUser.avatarUrl = dbUser.avatarUrl;
    }
    
    setUser(appUser);
`;
content = content.replace(
  "  const login = async (appUser: AppUser) => {\n    setUser(appUser);",
  loginReplace
);

fs.writeFileSync('src/context/AuthContext.tsx', content);

