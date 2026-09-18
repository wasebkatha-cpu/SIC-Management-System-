const fs = require('fs');

let content = fs.readFileSync('src/components/chat.tsx', 'utf-8');

content = content.replace(
  "<AttachToComplaintModal \n          attachment={attachModalData}\n          onClose={() => setAttachModalData(null)}\n        />",
  "<AttachToComplaintModal \n          isOpen={!!attachModalData}\n          attachment={attachModalData}\n          onClose={() => setAttachModalData(null)}\n        />"
);

fs.writeFileSync('src/components/chat.tsx', content);

