import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Camera, Check, User as UserIcon, Trash2 } from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState<string>(user?.avatarUrl || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !user) return null;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Please select an image smaller than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = ev => {
      const result = ev.target?.result as string;
      if (result) {
        setAvatarUrl(result);
        setError('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Name cannot be empty');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await updateProfile({
        name: trimmed,
        avatarUrl: avatarUrl || undefined
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err?.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-neutral-900 dark:bg-black text-white px-6 py-4 flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-base">
              {user.role === 'superUser' ? 'Set Superuser Profile' : 'Edit Profile'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 text-xs bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-900">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 text-xs bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-900 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Profile updated successfully!</span>
            </div>
          )}

          {/* Profile Picture Section */}
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="relative group">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-neutral-800 shadow-md"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-blue-600 text-white font-bold text-3xl flex items-center justify-center border-4 border-white dark:border-neutral-800 shadow-md">
                  {(name.trim() || user.username || 'U').charAt(0).toUpperCase()}
                </div>
              )}

              {/* Upload Overlay Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 text-white rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="Upload Photo"
              >
                <Camera className="w-6 h-6 mb-0.5" />
                <span className="text-[10px] font-medium">Change</span>
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-3 py-1.5 rounded-md transition-colors cursor-pointer"
              >
                Upload Photo
              </button>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-900/50 px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove
                </button>
              )}
            </div>
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
              This photo will be displayed beside your messages in chats.
            </p>
          </div>

          {/* Actual Name Field */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
              Actual Display Name (Shown in Chat)
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Justice A. Khan, Muhammad Ali"
              className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-neutral-900 transition-all text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500"
              required
            />
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
              Your actual name will appear in group chats, direct messages, and system notifications.
            </p>
          </div>

          {/* Read-Only Info */}
          <div className="bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-xl p-3 flex items-center justify-between text-xs">
            <div>
              <span className="text-neutral-500 dark:text-neutral-400 block text-[11px]">System Username:</span>
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">{user.username}</span>
            </div>
            <div>
              <span className="text-neutral-500 dark:text-neutral-400 block text-[11px]">Account Role:</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 capitalize">
                {user.role === 'superUser' ? 'Superuser' : user.role}
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              {isSubmitting ? 'Saving...' : 'Save Name & Photo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
