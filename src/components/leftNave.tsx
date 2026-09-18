import { useState, useEffect, ComponentType } from 'react';
import { ChevronLeft, ChevronRight, LayoutDashboard, AlertCircle, Building2, UserCheck, ClipboardList, Users, Shield, LogOut, History, Key, MessageSquare, Camera, Edit2, Sun, Moon, BookOpen, BellRing } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Role } from '../context/AuthContext';
import { MockDB } from '../lib/mockDb';
import { ChangePasswordModal } from './ChangePasswordModal';
import EditProfileModal from './EditProfileModal';
import { getUnreadDraftsCount } from '../utils/draftStorage';
import DraftNotificationModal from './DraftNotificationModal';

interface LeftNaveProps {
  onSelect?: (view: string) => void;
  activeView?: string;
  userRole?: Role;
}

interface NavItemProps {
  label: string;
  icon: ComponentType<{ className?: string }>;
  active: boolean;
  activeClass: string;
  onClick: () => void;
  isExpanded: boolean;
  badge?: number | string;
}

function NavItem({
  label,
  icon: Icon,
  active,
  activeClass,
  onClick,
  isExpanded,
  badge,
}: NavItemProps) {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`w-full flex items-center ${
          isExpanded ? 'gap-2.5 px-2.5' : 'justify-center px-2'
        } py-2 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
          active
            ? `bg-neutral-100 font-medium border border-transparent shadow-2xs ${activeClass}`
            : 'text-neutral-600 dark:text-slate-200 hover:bg-neutral-50 dark:hover:bg-slate-800/80 hover:text-neutral-900 dark:hover:text-white'
        }`}
        title={!isExpanded ? (badge ? `${label} (${badge} new)` : label) : undefined}
      >
        <div className="relative shrink-0 flex items-center justify-center">
          <Icon className="w-4 h-4" />
          {!isExpanded && badge !== undefined && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-600 border border-white dark:border-slate-900" />
          )}
        </div>
        {isExpanded && (
          <span className="whitespace-nowrap text-sm font-medium flex-1 text-left truncate">
            {label}
          </span>
        )}
        {isExpanded && badge !== undefined && (
          <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-emerald-600 text-white ml-auto shrink-0 shadow-2xs">
            {badge}
          </span>
        )}
      </button>

      {/* Floating tooltip label displayed when leftNav is collapsed */}
      {!isExpanded && (
        <div 
          role="tooltip"
          className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-neutral-900 dark:bg-slate-800 text-white text-xs font-semibold rounded-md shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 z-50 flex items-center border border-neutral-700/60 dark:border-slate-700"
        >
          {/* Left arrow pointer */}
          <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-neutral-900 dark:bg-slate-800 border-l border-b border-neutral-700/60 dark:border-slate-700 rotate-45 pointer-events-none" />
          <span className="relative z-10">{label}</span>
        </div>
      )}
    </div>
  );
}

export default function LeftNave({ onSelect, activeView, userRole }: LeftNaveProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [unreadDrafts, setUnreadDrafts] = useState<number>(() => getUnreadDraftsCount());
  const [showDraftModal, setShowDraftModal] = useState<boolean>(false);
  const { logout, user, updateAvatar } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();

  useEffect(() => {
    const handleUpdate = () => {
      setUnreadDrafts(getUnreadDraftsCount());
    };
    const handleOpenModal = () => {
      setShowDraftModal(true);
    };

    window.addEventListener('notice_draft_added', handleUpdate);
    window.addEventListener('notice_drafts_updated', handleUpdate);
    window.addEventListener('open_draft_notifications', handleOpenModal);

    return () => {
      window.removeEventListener('notice_draft_added', handleUpdate);
      window.removeEventListener('notice_drafts_updated', handleUpdate);
      window.removeEventListener('open_draft_notifications', handleOpenModal);
    };
  }, []);

  const hasPermission = (perm: string) => {
    if (perm === 'documentation') return true;
    if (userRole === 'superUser') return true;
    if (userRole === 'admin') {
      if (!user?.permissions || user.permissions.length === 0) return true; // full access
      return user.permissions.includes(perm as any);
    }
    return false;
  };

  return (
    <aside
      className={`h-screen sticky top-0 shrink-0 bg-white dark:bg-slate-900 border-r border-neutral-200 dark:border-slate-800 transition-all duration-300 ease-in-out relative flex flex-col overflow-visible overscroll-none select-none z-30 ${
        isExpanded ? 'w-fit min-w-[210px]' : 'w-16'
      }`}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -right-3 top-3 bg-white dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 rounded-full p-1.5 hover:bg-neutral-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-slate-600 shadow-md z-40 cursor-pointer text-neutral-600 dark:text-white flex items-center justify-center transition-transform hover:scale-105"
        aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
      >
        {isExpanded ? (
          <ChevronLeft className="w-3.5 h-3.5 text-neutral-600 dark:text-white" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-neutral-600 dark:text-white" />
        )}
      </button>

      {/* App Header / Title */}
      <div
        className={`h-12 border-b border-neutral-200 dark:border-slate-800 flex items-center shrink-0 relative group ${
          isExpanded ? 'px-3 pr-6' : 'justify-center'
        }`}
      >
        {isExpanded ? (
          <h1 className="text-xs font-bold text-neutral-900 dark:text-white leading-tight tracking-tight whitespace-nowrap">
            SIC Management System
          </h1>
        ) : (
          <span className="text-xs font-bold text-neutral-800 dark:text-slate-200 tracking-wider select-none">
            SIC
          </span>
        )}
        {!isExpanded && (
          <div
            role="tooltip"
            className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-neutral-900 dark:bg-slate-800 text-white text-xs font-semibold rounded-md shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 z-50 flex items-center border border-neutral-700/60 dark:border-slate-700"
          >
            <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-neutral-900 dark:bg-slate-800 border-l border-b border-neutral-700/60 dark:border-slate-700 rotate-45 pointer-events-none" />
            <span className="relative z-10 font-bold">SIC Management System</span>
          </div>
        )}
      </div>

      <div className={`flex-1 py-4 px-2.5 flex flex-col justify-start ${isExpanded ? 'overflow-y-auto overflow-x-hidden' : 'overflow-visible'}`}>
        <nav className={`space-y-1 ${isExpanded ? 'overflow-hidden' : 'overflow-visible'}`}>
          {hasPermission('dashboard') && (
            <NavItem
              label="Dashboard"
              icon={LayoutDashboard}
              active={activeView === 'dashboard'}
              activeClass="dark:bg-blue-950/70 text-neutral-900 dark:text-white dark:border-blue-800/60"
              onClick={() => onSelect && onSelect('dashboard')}
              isExpanded={isExpanded}
            />
          )}

          {hasPermission('complaints') && (
            <NavItem
              label="Complaints"
              icon={AlertCircle}
              active={activeView === 'complaints'}
              activeClass="dark:bg-emerald-950/70 text-neutral-900 dark:text-white dark:border-emerald-800/60"
              onClick={() => onSelect && onSelect('complaints')}
              isExpanded={isExpanded}
            />
          )}

          {hasPermission('publicBodies') && (
            <NavItem
              label="Public Bodies"
              icon={Building2}
              active={activeView === 'publicBodies'}
              activeClass="dark:bg-purple-950/70 text-neutral-900 dark:text-white dark:border-purple-800/60"
              onClick={() => onSelect && onSelect('publicBodies')}
              isExpanded={isExpanded}
            />
          )}

          {hasPermission('designatedOfficials') && (
            <NavItem
              label="Designated Officials"
              icon={UserCheck}
              active={activeView === 'designatedOfficials'}
              activeClass="dark:bg-amber-950/70 text-neutral-900 dark:text-white dark:border-amber-800/60"
              onClick={() => onSelect && onSelect('designatedOfficials')}
              isExpanded={isExpanded}
            />
          )}

          {hasPermission('causeList') && (
            <NavItem
              label="Cause List"
              icon={ClipboardList}
              active={activeView === 'causeList'}
              activeClass="dark:bg-teal-950/70 text-neutral-900 dark:text-white dark:border-teal-800/60"
              onClick={() => onSelect && onSelect('causeList')}
              isExpanded={isExpanded}
            />
          )}

          {hasPermission('readers') && (
            <NavItem
              label="Readers"
              icon={Users}
              active={activeView === 'readers'}
              activeClass="dark:bg-cyan-950/70 text-neutral-900 dark:text-white dark:border-cyan-800/60"
              onClick={() => onSelect && onSelect('readers')}
              isExpanded={isExpanded}
            />
          )}
          
          <NavItem
            label="Internal Chat"
            icon={MessageSquare}
            active={activeView === 'chat'}
            activeClass="dark:bg-blue-950/70 text-neutral-900 dark:text-white dark:border-blue-800/60"
            onClick={() => onSelect && onSelect('chat')}
            isExpanded={isExpanded}
          />

          {hasPermission('activityHistory') && (
            <NavItem
              label="Activity History"
              icon={History}
              active={activeView === 'activityHistory'}
              activeClass="dark:bg-rose-950/70 text-neutral-900 dark:text-white dark:border-rose-800/60"
              onClick={() => onSelect && onSelect('activityHistory')}
              isExpanded={isExpanded}
            />
          )}

          {(userRole === 'superUser' || hasPermission('adminManagement')) && (
            <NavItem
              label="Admin Management"
              icon={Shield}
              active={activeView === 'adminManagement'}
              activeClass="dark:bg-indigo-950/80 text-blue-700 dark:text-white dark:border-indigo-700/60"
              onClick={() => onSelect && onSelect('adminManagement')}
              isExpanded={isExpanded}
            />
          )}

          {(userRole === 'superUser' || userRole === 'admin') && (
            <NavItem
              label="Draft Notices & Orders"
              icon={BellRing}
              badge={unreadDrafts > 0 ? unreadDrafts : undefined}
              active={showDraftModal}
              activeClass="dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 dark:border-emerald-800/60"
              onClick={() => setShowDraftModal(true)}
              isExpanded={isExpanded}
            />
          )}

          <NavItem
            label="Documentation"
            icon={BookOpen}
            active={activeView === 'documentation'}
            activeClass="dark:bg-amber-950/70 text-neutral-900 dark:text-white dark:border-amber-800/60"
            onClick={() => onSelect && onSelect('documentation')}
            isExpanded={isExpanded}
          />
        </nav>
      </div>

      <div className={`p-2.5 border-t border-neutral-200 dark:border-slate-800 bg-neutral-50/50 dark:bg-slate-900/90 space-y-1 ${isExpanded ? 'overflow-hidden' : 'overflow-visible'}`}>
        {/* Dual Theme Toggle */}
        <div className="relative group">
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center ${
              isExpanded ? 'justify-between gap-2 px-2.5' : 'justify-center px-2'
            } py-1.5 text-neutral-600 dark:text-white hover:bg-neutral-100 dark:hover:bg-slate-800 hover:text-neutral-900 dark:hover:text-white rounded-md transition-colors font-medium text-xs border border-neutral-200 dark:border-slate-700 cursor-pointer`}
            title={!isExpanded ? (isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode') : undefined}
          >
            <div className="flex items-center gap-2">
              {isDark ? (
                <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-neutral-600 dark:text-white shrink-0" />
              )}
              {isExpanded && <span className="whitespace-nowrap">{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
            </div>
            {isExpanded && (
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-200/70 dark:bg-slate-800 text-neutral-700 dark:text-white">
                {theme}
              </span>
            )}
          </button>

          {!isExpanded && (
            <div 
              role="tooltip"
              className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-neutral-900 dark:bg-slate-800 text-white text-xs font-semibold rounded-md shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 z-50 flex items-center border border-neutral-700/60 dark:border-slate-700"
            >
              <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-neutral-900 dark:bg-slate-800 border-l border-b border-neutral-700/60 dark:border-slate-700 rotate-45 pointer-events-none" />
              <span className="relative z-10">{isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
            </div>
          )}
        </div>

        {isExpanded ? (
          <div className="mb-1 px-1 flex items-center gap-2">
            <div className="relative group shrink-0">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-neutral-200 dark:border-slate-700" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                  {(user?.name || user?.username || 'U')[0].toUpperCase()}
                </div>
              )}
              <label 
                className="absolute inset-0 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                title="Click to upload profile photo"
              >
                <Camera className="w-3 h-3" />
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
                    reader.onload = async (ev) => {
                      const dataUrl = ev.target?.result;
                      if (dataUrl && user) {
                        await updateAvatar(dataUrl as string);
                      }
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <div
                  onClick={() => setShowEditProfileModal(true)}
                  className="text-xs font-medium text-neutral-900 dark:text-white truncate hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                  title="Click to edit actual name and photo"
                >
                  {user?.name || user?.username}
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(true)}
                  className="p-0.5 text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-neutral-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer shrink-0"
                  title="Set actual display name and profile picture"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
              <div className="text-[10px] text-neutral-500 dark:text-slate-300 capitalize truncate">{user?.role === 'superUser' ? 'Superuser' : user?.role}</div>
            </div>
          </div>
        ) : (
          <div className="mb-2 flex justify-center">
            <div className="relative group shrink-0">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-9 h-9 rounded-full object-cover border border-neutral-200 dark:border-slate-700" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                  {(user?.name || user?.username || 'U')[0].toUpperCase()}
                </div>
              )}
              <label 
                className="absolute inset-0 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                title="Click to upload profile photo"
              >
                <Camera className="w-3.5 h-3.5" />
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
                    reader.onload = async (ev) => {
                      const dataUrl = ev.target?.result;
                      if (dataUrl && user) {
                        await updateAvatar(dataUrl as string);
                      }
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </label>

              {/* Floating profile tooltip */}
              <div 
                role="tooltip"
                className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-neutral-900 dark:bg-slate-800 text-white text-xs rounded-md shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 z-50 flex flex-col border border-neutral-700/60 dark:border-slate-700"
              >
                <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-neutral-900 dark:bg-slate-800 border-l border-b border-neutral-700/60 dark:border-slate-700 rotate-45 pointer-events-none" />
                <span className="relative z-10 font-bold">{user?.name || user?.username}</span>
                <span className="relative z-10 text-[10px] text-neutral-300 capitalize">{user?.role === 'superUser' ? 'Superuser' : user?.role}</span>
              </div>
            </div>
          </div>
        )}

        {/* Change Password */}
        <div className="relative group">
          <button
            onClick={() => setShowPasswordModal(true)}
            className={`w-full flex items-center ${
              isExpanded ? 'gap-2.5 px-2.5' : 'justify-center px-2'
            } py-1.5 text-neutral-600 dark:text-white hover:bg-neutral-100 dark:hover:bg-slate-800 hover:text-neutral-900 dark:hover:text-white rounded-md transition-colors font-medium text-xs border border-transparent cursor-pointer`}
            title={!isExpanded ? "Change Password" : undefined}
          >
            <Key className="w-3.5 h-3.5 shrink-0" />
            {isExpanded && <span className="whitespace-nowrap">Change Password</span>}
          </button>
          {!isExpanded && (
            <div 
              role="tooltip"
              className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-neutral-900 dark:bg-slate-800 text-white text-xs font-semibold rounded-md shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 z-50 flex items-center border border-neutral-700/60 dark:border-slate-700"
            >
              <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-neutral-900 dark:bg-slate-800 border-l border-b border-neutral-700/60 dark:border-slate-700 rotate-45 pointer-events-none" />
              <span className="relative z-10">Change Password</span>
            </div>
          )}
        </div>

        {/* Sign Out */}
        <div className="relative group">
          <button
            onClick={() => logout()}
            className={`w-full flex items-center ${
              isExpanded ? 'gap-2.5 px-2.5' : 'justify-center px-2'
            } py-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors font-medium text-xs border border-transparent hover:border-rose-100 dark:hover:border-rose-900/50 cursor-pointer`}
            title={!isExpanded ? "Sign Out" : undefined}
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            {isExpanded && <span className="whitespace-nowrap">Sign Out</span>}
          </button>
          {!isExpanded && (
            <div 
              role="tooltip"
              className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-neutral-900 dark:bg-slate-800 text-white text-xs font-semibold rounded-md shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 z-50 flex items-center border border-neutral-700/60 dark:border-slate-700"
            >
              <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-neutral-900 dark:bg-slate-800 border-l border-b border-neutral-700/60 dark:border-slate-700 rotate-45 pointer-events-none" />
              <span className="relative z-10">Sign Out</span>
            </div>
          )}
        </div>
      </div>
      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
      {showEditProfileModal && <EditProfileModal isOpen={showEditProfileModal} onClose={() => setShowEditProfileModal(false)} />}
      {showDraftModal && (
        <DraftNotificationModal
          isOpen={showDraftModal}
          onClose={() => {
            setShowDraftModal(false);
            setUnreadDrafts(getUnreadDraftsCount());
          }}
        />
      )}
    </aside>
  );
}
