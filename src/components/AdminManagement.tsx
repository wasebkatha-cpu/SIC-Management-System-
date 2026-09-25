import React, { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, X, User as UserIcon, Edit2, UserCheck, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MockDB, MockUser, MockLog } from '../lib/mockDb';
import { useAppContext } from '../context/AppContext';
import EditProfileModal from './EditProfileModal';

export default function AdminManagement() {
  const { user, hasPermission } = useAuth();
  const [admins, setAdmins] = useState<MockUser[]>([]);
  const [logs, setLogs] = useState<MockLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [assignedReaderId, setAssignedReaderId] = useState<string>('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'admins' | 'logs'>('admins');
  
  const { readers } = useAppContext();

  const PERMISSION_GROUPS = [
    {
      module: 'Admin Management',
      permissions: [
        { id: 'adminManagement', label: 'View Admins' },
        { id: 'admin_create', label: 'Create Admins' },
        { id: 'admin_edit', label: 'Edit Admins' },
        { id: 'admin_delete', label: 'Delete Admins' }
      ]
    },
    {
      module: 'Dashboard & History',
      permissions: [
        { id: 'dashboard', label: 'View Dashboard' },
        { id: 'activityHistory', label: 'View Activity History' }
      ]
    },
    {
      module: 'Cause List',
      permissions: [
        { id: 'causeList', label: 'View Cause List' },
        { id: 'causelist_update_hearing', label: 'Update Hearing Dates' },
        { id: 'causelist_update_attendance', label: 'Update Attendance' },
        { id: 'causelist_update_future_proceedings', label: 'Update Future Proceedings' },
        { id: 'causelist_update_proceedings_history', label: 'Update Proceedings History' },
        { id: 'causelist_update_submissions', label: 'Add/Update Submissions' },
        { id: 'causelist_add_diary', label: 'Add Case Diary' }
      ]
    },
    {
      module: 'Complaints',
      permissions: [
        { id: 'complaints', label: 'View Complaints' },
        { id: 'complaints_create', label: 'Create Complaints' },
        { id: 'complaints_edit', label: 'Edit Complaints' },
        { id: 'complaints_delete', label: 'Delete Complaints' }
      ]
    },
    {
      module: 'Public Bodies',
      permissions: [
        { id: 'publicBodies', label: 'View Public Bodies' },
        { id: 'publicbody_create', label: 'Create Public Bodies' },
        { id: 'publicbody_edit', label: 'Edit Public Bodies' },
        { id: 'publicbody_delete', label: 'Delete Public Bodies' },
        { id: 'publicbody_bulk_upload', label: 'Bulk Upload Public Bodies' }
      ]
    },
    {
      module: 'Communication',
      permissions: [
        { id: 'chat', label: 'Internal Chat' }
      ]
    },
    {
      module: 'Designated Officials',
      permissions: [
        { id: 'designatedOfficials', label: 'View Designated Officials' },
        { id: 'official_create', label: 'Create Officials' },
        { id: 'official_edit', label: 'Edit Officials' },
        { id: 'official_delete', label: 'Delete Officials' },
        { id: 'official_bulk_upload', label: 'Bulk Upload Officials' }
      ]
    },
    {
      module: 'Readers',
      permissions: [
        { id: 'readers', label: 'View Readers' },
        { id: 'reader_create', label: 'Create Readers' },
        { id: 'reader_edit', label: 'Edit Readers' },
        { id: 'reader_delete', label: 'Delete Readers' }
      ]
    },
    {
      module: 'Inward/Outward Registry',
      permissions: [
        { id: 'inwardOutward', label: 'View Registry' },
        { id: 'inward_outward_create', label: 'Log Entries' },
        { id: 'inward_outward_edit', label: 'Edit Entries' },
        { id: 'inward_outward_delete', label: 'Delete Entries' }
      ]
    },
    {
      module: 'System Documentation',
      permissions: [
        { id: 'documentation', label: 'View Documentation' }
      ]
    }
  ];

  const ALL_PERMISSIONS_FLAT = PERMISSION_GROUPS.flatMap(g => g.permissions);

  const handleTogglePermission = (perm: string) => {
    setSelectedPermissions(prev => 
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setLoading(true);
    try {
      const usersData = MockDB.getUsers().filter(u => u.role === 'admin');
      setAdmins(usersData);

      const logsData = MockDB.getLogs();
      setLogs(logsData);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (editingAdminId) {
        MockDB.updateUser(editingAdminId, {
          username: newUsername.trim().toLowerCase(),
          ...(newPassword ? { password: newPassword } : {}),
          name: newName.trim(),
          permissions: selectedPermissions as any,
          assignedReaderId: assignedReaderId || undefined
        });
        if (user) {
          await MockDB.addLog({
            userId: user.uid,
            username: user.username,
            role: user.role as string,
            activity: `Updated admin details for ${newName.trim()}`
          });
        }
      } else {
        MockDB.addUser({
          username: newUsername.trim().toLowerCase(),
          password: newPassword,
          name: newName.trim(),
          role: 'admin',
          permissions: selectedPermissions as any,
          assignedReaderId: assignedReaderId || undefined
        });
      }

      resetForm();
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to save admin');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setNewUsername('');
    setNewPassword('');
    setNewName('');
    setSelectedPermissions([]);
    setAssignedReaderId('');
    setIsAdding(false);
    setEditingAdminId(null);
  };

  const handleEditAdmin = (admin: MockUser) => {
    setEditingAdminId(admin.id);
    setNewUsername(admin.username);
    setNewName(admin.name);
    setNewPassword(''); // blank for no change
    setSelectedPermissions(admin.permissions || []);
    setAssignedReaderId(admin.assignedReaderId || '');
    setIsAdding(true);
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (!confirm('Are you sure you want to delete this admin? They will lose access immediately.')) return;
    try {
      MockDB.deleteUser(adminId);
      setAdmins(prev => prev.filter(a => a.id !== adminId));
    } catch (err) {
      console.error(err);
      alert('Failed to delete admin from database.');
    }
  };

  const formatTime = (ts: string) => {
    if (!ts) return '';
    const date = new Date(ts);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true
    }).format(date);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Admin Management
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-300 mt-1">
            Super User control panel for managing admins and viewing system activity logs.
          </p>
        </div>

        {/* Superuser Profile Quick Setting Card */}
        {user?.role === 'superUser' && (
          <div className="flex items-center gap-3 bg-white dark:bg-gradient-to-r dark:from-slate-900/90 dark:to-indigo-950/60 p-3 rounded-xl border border-neutral-200 dark:border-indigo-800/50 shadow-xs">
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                (user.name || user.username || 'S')[0].toUpperCase()
              )}
            </div>
            <div>
              <div className="text-xs text-neutral-500 dark:text-neutral-300">Superuser Name:</div>
              <div className="text-sm font-semibold text-neutral-900 dark:text-white truncate max-w-[160px]">
                {user.name || user.username}
              </div>
            </div>
            <button
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-200 bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-800/40 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
              title="Set actual display name shown in chat"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Set Actual Name</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-4 border-b border-neutral-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('admins')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'admins' ? 'border-blue-600 dark:border-blue-400 text-blue-700 dark:text-white font-semibold' : 'border-transparent text-neutral-500 dark:text-neutral-300 hover:text-neutral-700 dark:hover:text-white'
          }`}
        >
          Manage Admins
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'logs' ? 'border-blue-600 dark:border-blue-400 text-blue-700 dark:text-white font-semibold' : 'border-transparent text-neutral-500 dark:text-neutral-300 hover:text-neutral-700 dark:hover:text-white'
          }`}
        >
          Activity Logs
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-neutral-500 dark:text-neutral-300">Loading data...</div>
      ) : activeTab === 'admins' ? (
        <div className="space-y-6">
          <div className="flex justify-end">
            {!isAdding && hasPermission('admin_create') && (
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Admin
              </button>
            )}
          </div>

          {isAdding && (
            <div className="bg-white dark:bg-gradient-to-b dark:from-slate-900/95 dark:to-indigo-950/40 border border-neutral-200 dark:border-indigo-900/50 rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-4 border-b border-neutral-100 dark:border-slate-800 pb-4">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">{editingAdminId ? 'Edit Admin' : 'Create New Admin'}</h2>
                <button onClick={resetForm} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white cursor-pointer"><X className="w-5 h-5"/></button>
              </div>
              <form onSubmit={handleAddAdmin} className="space-y-6">
                {error && <div className="text-sm text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 p-3 rounded-md border border-rose-200 dark:border-rose-900">{error}</div>}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-white mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      className="w-full rounded-md border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-white mb-1">Username</label>
                    <input
                      type="text"
                      required
                      value={newUsername}
                      onChange={e => setNewUsername(e.target.value)}
                      className="w-full rounded-md border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-white mb-1">{editingAdminId ? 'New Password (Optional)' : 'Temporary Password'}</label>
                    <input
                      type="password"
                      required={!editingAdminId}
                      minLength={6}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder={editingAdminId ? "Leave blank to keep unchanged" : "Min 6 characters"}
                      className="w-full rounded-md border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-white mb-1">Assign Reader Jurisdiction (Optional)</label>
                    <select
                      value={assignedReaderId}
                      onChange={(e) => setAssignedReaderId(e.target.value)}
                      className="w-full rounded-md border border-neutral-300 dark:border-slate-700 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-900 text-neutral-900 dark:text-white"
                    >
                      <option value="">-- All Readers (Full Access) --</option>
                      {readers.map(r => (
                        <option key={r.id} value={r.id}>{r.name} {r.actualName ? `(${r.actualName})` : ''}</option>
                      ))}
                    </select>
                    <p className="text-xs text-neutral-500 dark:text-neutral-300 mt-1">If selected, this admin can only view and manage records associated with this Reader's assigned divisions/districts.</p>
                  </div>
                </div>
                
                <div className="pt-6 mt-4 border-t border-neutral-200 dark:border-slate-800">
                  <div className="mb-5">
                    <h3 className="text-base font-semibold text-neutral-800 dark:text-white">Role Based Access (Permissions)</h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Select the sections and granular actions this admin is allowed to access.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8">
                    {PERMISSION_GROUPS.map(group => (
                      <div key={group.module}>
                        <h4 className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500/70"></span>
                          {group.module}
                        </h4>
                        <div className="flex flex-col gap-1.5">
                          {group.permissions.map(perm => {
                            const isSelected = selectedPermissions.includes(perm.id);
                            return (
                              <label
                                key={perm.id}
                                className="flex items-center gap-2 cursor-pointer text-sm text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleTogglePermission(perm.id)}
                                  className="w-4 h-4 text-blue-600 rounded border-neutral-300 focus:ring-blue-500 cursor-pointer"
                                />
                                <span>{perm.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm disabled:opacity-70 cursor-pointer"
                  >
                    {submitting ? (editingAdminId ? 'Saving...' : 'Creating...') : (editingAdminId ? 'Save Changes' : 'Create Admin')}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white dark:bg-gradient-to-b dark:from-slate-900/95 dark:to-indigo-950/30 border border-neutral-200 dark:border-indigo-900/50 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 dark:bg-slate-800/90 text-neutral-600 dark:text-white font-medium border-b border-neutral-200 dark:border-indigo-900/40">
                <tr>
                  <th className="px-6 py-4">Admin Name</th>
                  <th className="px-6 py-4">Username</th>
                  <th className="px-6 py-4">Permissions</th>
                  <th className="px-6 py-4">Reader Assignment</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-slate-800/80">
                {admins.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-neutral-500 dark:text-neutral-300">No admins found.</td></tr>
                ) : (
                  admins.map(admin => {
                    const readerObj = readers.find(r => r.id === admin.assignedReaderId);
                    return (
                    <tr key={admin.id} className="hover:bg-neutral-50 dark:hover:bg-indigo-950/40">
                      <td className="px-6 py-4 font-medium text-neutral-900 dark:text-white">{admin.name}</td>
                      <td className="px-6 py-4 text-neutral-600 dark:text-neutral-300">{admin.username}</td>
                      <td className="px-6 py-4 text-neutral-500 dark:text-neutral-300 text-xs max-w-xs truncate" title={admin.permissions?.length ? admin.permissions.map(p => ALL_PERMISSIONS_FLAT.find(ap => ap.id === p)?.label).filter(Boolean).join(', ') : 'All Access'}>
                        {admin.permissions?.length ? admin.permissions.map(p => ALL_PERMISSIONS_FLAT.find(ap => ap.id === p)?.label).filter(Boolean).join(', ') : 'All Access'}
                      </td>
                      <td className="px-6 py-4 text-neutral-600 dark:text-neutral-300">
                        {readerObj ? (
                           <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200">
                             {readerObj.name}
                           </span>
                        ) : (
                           <span className="text-neutral-400 dark:text-neutral-500 italic text-sm">All</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-neutral-600 dark:text-neutral-300">{formatTime(admin.createdAt)}</td>
                      <td className="px-6 py-4 text-right">
                        {hasPermission('admin_edit') && (
                          <button
                            onClick={() => handleEditAdmin(admin)}
                            className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-2 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-md transition-colors mr-1 cursor-pointer"
                            title="Edit Admin"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {hasPermission('admin_delete') && (
                          <button
                            onClick={() => handleDeleteAdmin(admin.id)}
                            className="text-rose-500 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 p-2 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition-colors cursor-pointer"
                            title="Revoke Access"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gradient-to-b dark:from-slate-900/95 dark:to-indigo-950/30 border border-neutral-200 dark:border-indigo-900/50 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 dark:bg-slate-800/90 text-neutral-600 dark:text-white font-medium border-b border-neutral-200 dark:border-indigo-900/40">
              <tr>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-slate-800/80">
              {logs.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-neutral-500 dark:text-neutral-300">No activity logs found.</td></tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-neutral-50 dark:hover:bg-indigo-950/40">
                    <td className="px-6 py-4 text-neutral-500 dark:text-neutral-300 font-mono text-xs">{formatTime(log.timestamp)}</td>
                    <td className="px-6 py-4 font-medium text-neutral-900 dark:text-white">{log.username}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        log.role === 'superUser' ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300' : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                      }`}>
                        {log.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-neutral-700 dark:text-white">{log.activity}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showProfileModal && (
        <EditProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
      )}
    </div>
  );
}
