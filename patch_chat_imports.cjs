const fs = require('fs');
let content = fs.readFileSync('src/components/chat.tsx', 'utf-8');

if (!content.includes('Check,')) {
  content = content.replace(
    "import { Send, Paperclip, Users, User as UserIcon, FileText, Image as ImageIcon, X, MessageSquare, PlusCircle } from 'lucide-react';",
    "import { Send, Paperclip, Users, User as UserIcon, FileText, Image as ImageIcon, X, MessageSquare, PlusCircle, Check, CheckCheck, Smile } from 'lucide-react';"
  );
}

fs.writeFileSync('src/components/chat.tsx', content);

