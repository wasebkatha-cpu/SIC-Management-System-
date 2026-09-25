import React from "react";
import { useState } from 'react';
import { X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface AddSummaryModalProps {
  onClose: () => void;
}

export default function AddSummaryModal({ onClose }: AddSummaryModalProps) {
  const { addEnforcementAction } = useAppContext();
  const [type, setType] = useState('Penalty');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState('');
  const [summary, setSummary] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !status || !summary) return;
    
    // Normalize date format for UI consistency (YYYY-MM-DD to DD-MM-YYYY)
    const [year, month, day] = date.split('-');
    const formattedDate = `${day}-${month}-${year}`;

    addEnforcementAction({
      type,
      title,
      date: formattedDate,
      status,
      summary
    });
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 dark:bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] transition-colors">
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-950">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Add Summary / Enforcement Action</h2>
          <button onClick={onClose} className="p-2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white dark:bg-neutral-900">
          <form id="summary-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Category Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="Penalty">Penalty Imposed</option>
                <option value="Non-Maintainable">Non-Maintainable Complaint</option>
                <option value="Proactive Disclosure">Proactive Disclosure (Section 4)</option>
                <option value="Order">General Order / Notice</option>
                <option value="Compliance">Compliance Status</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Action Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Fine of Rs. 25,000 imposed..."
                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Status / Result</label>
                <input
                  type="text"
                  required
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  placeholder="e.g. Recovered, Disposed"
                  className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Comprehensive Summary</label>
              <textarea
                required
                rows={5}
                value={summary}
                onChange={e => setSummary(e.target.value)}
                placeholder="Enter detailed summary, findings, or observations..."
                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
              ></textarea>
            </div>
          </form>
        </div>
        
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="summary-form"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm cursor-pointer"
          >
            Save Summary Record
          </button>
        </div>
      </div>
    </div>
  );
}
