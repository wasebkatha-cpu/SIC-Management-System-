const fs = require('fs');
let content = fs.readFileSync('src/components/leftNave.tsx', 'utf-8');

content = content.replace(
  "MockDB.updateUser(user.uid, { avatarUrl: dataUrl });",
  "MockDB.updateUser(user.uid, { avatarUrl: dataUrl as string });"
);

fs.writeFileSync('src/components/leftNave.tsx', content);

