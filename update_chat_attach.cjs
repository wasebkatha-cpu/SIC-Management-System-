const fs = require('fs');

let content = fs.readFileSync('src/components/chat.tsx', 'utf-8');

if (!content.includes('AttachToComplaintModal')) {
  content = content.replace(
    "import { Send, Paperclip, Users, User as UserIcon, FileText, Image as ImageIcon, X, MessageSquare } from 'lucide-react';",
    "import { Send, Paperclip, Users, User as UserIcon, FileText, Image as ImageIcon, X, MessageSquare, PlusCircle } from 'lucide-react';\nimport AttachToComplaintModal from './attachToComplaintModal';"
  );
}

if (!content.includes('attachModalData')) {
  content = content.replace(
    "const [attachment, setAttachment] = useState<{name: string, type: string, data: string} | null>(null);",
    "const [attachment, setAttachment] = useState<{name: string, type: string, data: string} | null>(null);\n  const [attachModalData, setAttachModalData] = useState<{name: string, type: string, data: string} | null>(null);"
  );
}

if (!content.includes('setAttachModalData(')) {
  const attachmentHTML = `                    {msg.attachment && (
                      <div className="mt-2 flex flex-col gap-1">
                        <div className={\`rounded-lg overflow-hidden border \${isMine ? 'border-blue-500' : 'border-neutral-200'}\`}>
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
                        </div>
                        <button
                          onClick={() => setAttachModalData(msg.attachment!)}
                          className={\`flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-md w-max self-end \${
                            isMine 
                              ? 'text-blue-100 hover:text-white hover:bg-blue-700' 
                              : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200'
                          } transition-colors\`}
                          title="Attach to Complaint"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Add to Complaint</span>
                        </button>
                      </div>
                    )}`;

  content = content.replace(
    /\{msg\.attachment && \([\s\S]*?<\/div>\s*\}\)\s*<\/div>\s*<\/div>/,
    attachmentHTML + "\n                  </div>\n                </div>"
  );
}

if (!content.includes('<AttachToComplaintModal')) {
  content = content.replace(
    "return (",
    "return (\n    <>\n      {attachModalData && (\n        <AttachToComplaintModal \n          attachment={attachModalData}\n          onClose={() => setAttachModalData(null)}\n        />\n      )}"
  );
  content = content.replace(
    "</div>\n  );\n}",
    "</div>\n    </>\n  );\n}"
  );
}

fs.writeFileSync('src/components/chat.tsx', content);
