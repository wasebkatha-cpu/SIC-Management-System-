const fs = require('fs');

let content = fs.readFileSync('src/components/chat.tsx', 'utf-8');

// The component name should be AttachToComplaintModal
content = content.replace(
  "import attachToComplaintModal from './attachToComplaintModal';",
  "import AttachToComplaintModal from './attachToComplaintModal';"
);

content = content.replace(
  /<attachToComplaintModal/g,
  "<AttachToComplaintModal"
);

fs.writeFileSync('src/components/chat.tsx', content);

