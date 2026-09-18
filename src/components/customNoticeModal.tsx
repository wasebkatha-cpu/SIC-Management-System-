import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Scale, 
  ArrowRight, 
  Plus, 
  Sparkles,
  Tag,
  AlertCircle
} from 'lucide-react';
import { NoticeTypeConfig } from './noticeDraftModal';

interface CustomNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (config: NoticeTypeConfig, openDraftNow?: boolean) => void;
  defaultCategory?: 'Notice' | 'Order';
}

const NOTICE_SUGGESTIONS = [
  'Notice for Production of Records',
  'Summons for Personal Appearance',
  'Notice of Joint Inspection',
  'Compliance Requisition Notice',
  'Pre-Penalty Show Cause Notice',
  'Third-Party Consultation Notice'
];

const ORDER_SUGGESTIONS = [
  'Interim Direction Order',
  'Record Inspection & Attestation Order',
  'Restraining & Protection Order',
  'Order on Preliminary Objections',
  'Compliance & Penalty Recovery Order',
  'Ex-Parte Proceedings Order'
];

export function CustomNoticeModal({
  isOpen,
  onClose,
  onCreate,
  defaultCategory = 'Notice'
}: CustomNoticeModalProps) {
  const [category, setCategory] = useState<'Notice' | 'Order'>(defaultCategory);
  const [title, setTitle] = useState('');
  const [tag, setTag] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSuggestionClick = (suggestedTitle: string) => {
    setTitle(suggestedTitle);
    setError('');
    if (!tag) {
      if (suggestedTitle.includes('Notice') || suggestedTitle.includes('Summons')) {
        setTag('Special Notice');
      } else if (suggestedTitle.includes('Order')) {
        setTag('Bench Order');
      }
    }
  };

  const handleCreateDocument = (openDraftNow = false) => {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError('Please provide a name or title for this custom document.');
      return;
    }

    if (cleanTitle.length < 3) {
      setError('Title must be at least 3 characters long.');
      return;
    }

    const customId = `custom-${Date.now()}`;
    const derivedTag = tag.trim() || (category === 'Notice' ? 'Custom Notice' : 'Custom Order');
    const tagColor = category === 'Notice' 
      ? 'bg-amber-50 text-amber-800 border-amber-200' 
      : 'bg-indigo-50 text-indigo-800 border-indigo-200';
    
    const iconType = category === 'Notice' ? 'Mail' : 'Scale';

    const newConfig: NoticeTypeConfig = {
      id: customId,
      title: cleanTitle,
      stageName: cleanTitle,
      category,
      tag: derivedTag,
      tagColor,
      iconType,
      description: description.trim() || `Custom drafted ${category.toLowerCase()} by the Commission`,
      isCustom: true
    };

    onCreate(newConfig, openDraftNow);
    onClose();
    setTitle('');
    setTag('');
    setDescription('');
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCreateDocument(false);
  };

  const suggestions = category === 'Notice' ? NOTICE_SUGGESTIONS : ORDER_SUGGESTIONS;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 dark:bg-black/75 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-lg overflow-hidden transition-all duration-200 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 shrink-0">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Create Custom Notice / Order
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Creates a new custom document listed in Future Proceedings for all complaints
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 rounded-full transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {/* Category Selector */}
          <div>
            <label className="block font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider text-[11px] mb-2">
              Document Classification *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Notice Option */}
              <button
                type="button"
                onClick={() => {
                  setCategory('Notice');
                  setError('');
                }}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                  category === 'Notice'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 bg-white dark:bg-neutral-800'
                }`}
              >
                <div className={`p-2 rounded-md shrink-0 ${
                  category === 'Notice' ? 'bg-emerald-600 text-white' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
                }`}>
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-neutral-900 dark:text-neutral-100 text-sm">Notice</div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Summons, report requisitions, warnings &amp; call notices
                  </div>
                </div>
              </button>

              {/* Order Option */}
              <button
                type="button"
                onClick={() => {
                  setCategory('Order');
                  setError('');
                }}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                  category === 'Order'
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 bg-white dark:bg-neutral-800'
                }`}
              >
                <div className={`p-2 rounded-md shrink-0 ${
                  category === 'Order' ? 'bg-indigo-600 text-white' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
                }`}>
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-neutral-900 dark:text-neutral-100 text-sm">Order</div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Bench directions, interim rulings, adjournments &amp; disposals
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Title / Name Input */}
          <div>
            <label className="block font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider text-[11px] mb-1.5">
              Document Name / Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
              placeholder={category === 'Notice' ? 'e.g. Notice for Production of Muster Rolls' : 'e.g. Interim Restraining & Compliance Order'}
              className={`w-full px-3.5 py-2.5 text-sm bg-white dark:bg-neutral-800 border rounded-lg focus:outline-none focus:ring-2 transition-all text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 ${
                error ? 'border-rose-400 focus:ring-rose-400' : 'border-neutral-300 dark:border-neutral-700 focus:ring-emerald-500/40 focus:border-emerald-600'
              }`}
              autoFocus
            />
            {error && (
              <p className="mt-1.5 text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </p>
            )}
          </div>

          {/* Suggested Titles Chips */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5 text-neutral-500 dark:text-neutral-400 font-medium text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Quick Suggestions (click to use):</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => handleSuggestionClick(sug)}
                  className="text-[11px] px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-800 dark:hover:text-emerald-300 text-neutral-700 dark:text-neutral-300 rounded-md border border-neutral-200 dark:border-neutral-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors cursor-pointer text-left"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Tag / Badge */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider text-[11px] mb-1">
                Badge / Tag (Optional)
              </label>
              <div className="relative">
                <Tag className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-3" />
                <input
                  type="text"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder={category === 'Notice' ? 'e.g. Urgent Summons' : 'e.g. Bench Directive'}
                  className="w-full pl-8 pr-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider text-[11px] mb-1">
                Short Purpose / Note (Optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Issued on complaint's miscellaneous application"
                className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500"
              />
            </div>
          </div>

          {/* Footer Controls */}
          <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-800 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 transition-colors cursor-pointer text-center"
            >
              Cancel
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCreateDocument(false)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
                title="Add to Future Proceedings list so it can be used for any complaint"
              >
                <Plus className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>Add to Future Proceedings</span>
              </button>
              <button
                type="button"
                onClick={() => handleCreateDocument(true)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors cursor-pointer"
                title="Add to Future Proceedings and open the draft editor for this complaint right now"
              >
                <span>Save &amp; Draft Now</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
