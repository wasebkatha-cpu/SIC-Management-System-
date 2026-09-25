const fs = require('fs');
let content = fs.readFileSync('src/components/chat.tsx', 'utf-8');

// Insert import
if (!content.includes('AttachToComplaintModal')) {
  content = content.replace(
    "import { Send, Paperclip, Users, User as UserIcon, FileText, Image as ImageIcon, X, MessageSquare } from 'lucide-react';",
    "import { Send, Paperclip, Users, User as UserIcon, FileText, Image as ImageIcon, X, MessageSquare, PlusCircle } from 'lucide-react';\nimport AttachToComplaintModal from './AttachToComplaintModal';"
  );
}

// State
if (!content.includes('modalAttachment')) {
  content = content.replace(
    "const fileInputRef = useRef<HTMLInputElement>(null);",
    "const fileInputRef = useRef<HTMLInputElement>(null);\n  const [modalAttachment, setModalAttachment] = useState<{name: string, type: string, data: string} | null>(null);"
  );
}

// Add the button to attachment UI inside chat
// We need to find the attachment rendering section.
/*
                    {msg.attachment && (
                      <div className={`mt-2 rounded-lg overflow-hidden border ${isMine ? 'border-blue-500' : 'border-neutral-200'}`}>
                        {msg.attachment.type.startsWith('image/') ? (
                          <img src={msg.attachment.data} alt={msg.attachment.name} className="max-w-full max-h-64 object-contain bg-neutral-900/5" />
                        ) : (
                          <a 
                            href={msg.attachment.data} 
                            download={msg.attachment.name}
                            className={`flex items-center gap-2 p-3 ${isMine ? 'bg-blue-700/50 hover:bg-blue-700' : 'bg-white hover:bg-neutral-50'} transition-colors`}
                          >
                            <FileText className="w-5 h-5 shrink-0" />
                            <span className="text-sm truncate font-medium">{msg.attachment.name}</span>
                          </a>
                        )}
                      </div>
                    )}
*/

const targetHtml = `                      <div className={\`mt-2 rounded-lg overflow-hidden border \${isMine ? 'border-blue-500' : 'border-neutral-200'}\`}>
                        {msg.attachment.type.startsWith('image/') ? (
                          <img src={msg.attachment.data} alt={msg.attachment.name} className="max-w-full max-h-64 object-contain bg-neutral-900/5" />
                        ) : (
                          <a 
                            href={msg.attachment.data} 
                            download={msg.attachment.name}
                            className={\`flex items-center gap-2 p-3 \${isMine ? 'bg-blue-700/50 hover:bg-blue-700' : 'bg-white hover:bg-neutral-50'} transition-colors\`}
                          >
                            <FileText className="w-5 h-5 shrink-0" />
                            <span className="text-sm truncate font-medium">{msg.attachment.name}</span>
                          </a>
                        )}
                      </div>`;

const replacementHtml = `                      <div className={\`mt-2 rounded-lg overflow-hidden border \${isMine ? 'border-blue-500 bg-blue-700/10' : 'border-neutral-200 bg-white'}\`}>
                        {msg.attachment.type.startsWith('image/') ? (
                          <img src={msg.attachment.data} alt={msg.attachment.name} className="max-w-full max-h-64 object-contain bg-neutral-900/5" />
                        ) : (
                          <a 
                            href={msg.attachment.data} 
                            download={msg.attachment.name}
                            className={\`flex items-center gap-2 p-3 \${isMine ? 'bg-blue-700/50 hover:bg-blue-700' : 'hover:bg-neutral-50'} transition-colors\`}
                          >
                            <FileText className="w-5 h-5 shrink-0" />
                            <span className="text-sm truncate font-medium">{msg.attachment.name}</span>
                          </a>
                        )}
                        <div className={\`flex justify-end p-1 border-t \${isMine ? 'border-blue-500' : 'border-neutral-200'}\`}>
                          <button 
                            onClick={() => setModalAttachment(msg.attachment!)}
                            className={\`flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded hover:bg-opacity-20 transition-colors \${isMine ? 'text-blue-100 hover:bg-white' : 'text-neutral-500 hover:bg-neutral-900 hover:text-neutral-700'}\`}
                            title="Add to Complaint"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>Add to Case</span>
                          </button>
                        </div>
                      </div>`;

if (!content.includes('Add to Case')) {
  content = content.replace(targetHtml, replacementHtml);
}

// Add the modal component at the end of the return
if (!content.includes('<AttachToComplaintModal')) {
  content = content.replace(
    "    </div>\n  );\n}",
    "      <AttachToComplaintModal \n        isOpen={!!modalAttachment}\n        attachment={modalAttachment}\n        onClose={() => setModalAttachment(null)}\n      />\n    </div>\n  );\n}"
  );
}

fs.writeFileSync('src/components/chat.tsx', content);
