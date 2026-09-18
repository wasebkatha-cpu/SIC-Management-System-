import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MockDB } from '../lib/mockDb';

interface ChangePasswordModalProps {
  onClose: () => void;
}

export function ChangePasswordModal({ onClose }: ChangePasswordModalProps) {
  const { user, logActivity } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    setSubmitting(true);
    
    try {
      MockDB.updateUser(user.uid, { password: newPassword });
      await logActivity('Changed own password');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-neutral-200 dark:border-neutral-800 transition-colors">
        <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-950">
          <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">Change Password</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 p-3 rounded-md">{error}</div>}
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">New Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm disabled:opacity-70 cursor-pointer"
            >
              {submitting ? 'Saving...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
