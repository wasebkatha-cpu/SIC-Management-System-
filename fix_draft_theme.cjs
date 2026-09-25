const fs = require('fs');
let content = fs.readFileSync('src/components/noticeDraftModal.tsx', 'utf8');

// Container modal background
content = content.replace(/className=\"bg-white rounded-xl shadow-2xl border border-neutral-200/g, 'className=\"bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-neutral-200 dark:border-slate-700');

// Top Header
content = content.replace(/className=\"px-4 sm:px-6 py-3 sm:py-4 border-b border-neutral-200 bg-white/g, 'className=\"px-4 sm:px-6 py-3 sm:py-4 border-b border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-900');

// Toolbar
content = content.replace(/className=\"px-4 py-2 border-b border-neutral-200 bg-white flex items-center justify-between/g, 'className=\"px-4 py-2 border-b border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between');

// Editor canvas container (the main background)
content = content.replace(/className=\"bg-neutral-50 flex-1 overflow-y-auto p-4 sm:p-8/g, 'className=\"bg-neutral-50 dark:bg-slate-950 flex-1 overflow-y-auto p-4 sm:p-8');
content = content.replace(/className=\"bg-white rounded-lg shadow-md border border-neutral-300 p-8 sm:p-14/g, 'className=\"bg-white dark:bg-slate-800 rounded-lg shadow-md border border-neutral-300 dark:border-slate-600 p-8 sm:p-14');

// Editor text
content = content.replace(/className=\"outline-none min-h-\[650px\] text-neutral-900 leading-relaxed draft-editor-content focus:outline-none\"/g, 'className=\"outline-none min-h-[650px] text-neutral-900 dark:text-neutral-100 leading-relaxed draft-editor-content focus:outline-none\"');

// Bottom footer
content = content.replace(/className=\"px-6 py-3 border-t border-neutral-200 bg-white flex flex-col/g, 'className=\"px-6 py-3 border-t border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col');

// Select dropdowns in toolbar
content = content.replace(/className=\"text-xs bg-neutral-50 border border-neutral-200 text-neutral-700 rounded/g, 'className=\"text-xs bg-neutral-50 dark:bg-slate-800 border border-neutral-200 dark:border-slate-600 text-neutral-700 dark:text-neutral-200 rounded');

// Buttons in toolbar (without breaking classes)
content = content.replace(/className=\"p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded/g, 'className=\"p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-slate-700 rounded');

// Border rights in toolbar
content = content.replace(/border-r border-neutral-200/g, 'border-r border-neutral-200 dark:border-slate-700');

// Header Text
content = content.replace(/text-neutral-900 flex items-center/g, 'text-neutral-900 dark:text-white flex items-center');

// Other neutral texts
content = content.replace(/text-neutral-500/g, 'text-neutral-500 dark:text-neutral-400');
content = content.replace(/text-neutral-700/g, 'text-neutral-700 dark:text-neutral-300');

// Modal overlays / dropdowns
content = content.replace(/bg-white border border-neutral-200/g, 'bg-white dark:bg-slate-800 border border-neutral-200 dark:border-slate-700');

// Action Controls Close
content = content.replace(/text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/g, 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-slate-700');

fs.writeFileSync('src/components/noticeDraftModal.tsx', content);
console.log('Theme applied successfully');
