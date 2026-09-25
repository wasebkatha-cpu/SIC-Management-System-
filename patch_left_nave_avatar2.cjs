const fs = require('fs');
let content = fs.readFileSync('src/components/leftNave.tsx', 'utf-8');

const fileUploadHTML = `
      <div className="p-3 border-t border-neutral-200 bg-neutral-50/50 space-y-1">
        {isExpanded && (
          <div className="mb-3 px-2 flex items-center gap-3">
            <div className="relative group shrink-0">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-neutral-200" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  {(user?.name || user?.username || 'U')[0].toUpperCase()}
                </div>
              )}
              <label className="absolute inset-0 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                <Camera className="w-4 h-4" />
                <input 
                  type="file" 
                  accept="image/*"
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 1024 * 1024) {
                      alert("Please select an image under 1MB.");
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      const dataUrl = ev.target?.result;
                      if (dataUrl && user) {
                        MockDB.updateUser(user.uid, { avatarUrl: dataUrl });
                        window.location.reload();
                      }
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-neutral-900 truncate" title={user?.username}>{user?.name || user?.username}</div>
              <div className="text-[11px] text-neutral-500 capitalize">{user?.role}</div>
            </div>
          </div>
        )}
`;

content = content.replace(
  /<div className="p-3 border-t border-neutral-200 bg-neutral-50\/50 space-y-1">[\s\S]*?<\/div>\s*<button/,
  fileUploadHTML + "\n        <button"
);

fs.writeFileSync('src/components/leftNave.tsx', content);

