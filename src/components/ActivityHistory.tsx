import React, { useState, useEffect } from 'react';
import { History, User, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MockDB, MockLog, MockUser } from '../lib/mockDb';

export default function ActivityHistory() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<MockLog[]>([]);
  const [admins, setAdmins] = useState<MockUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchLogs = () => {
      if (!user) return;
      setLoading(true);
      try {
        if (user.role === 'superUser' || user.role === 'admin') {
          const allUsers = MockDB.getUsers();
          setAdmins(allUsers.filter(u => u.role === 'admin'));
        }
        
        const allLogs = MockDB.getLogs();
        if (user.role === 'superUser' || user.role === 'admin') {
          setLogs(allLogs);
        } else {
          setLogs(allLogs.filter(log => log.userId === user.uid));
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };

    fetchLogs();
  }, [user]);

  const formatTime = (ts: string) => {
    if (!ts) return '';
    const date = new Date(ts);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true
    }).format(date);
  };

  const isToday = (ts: string) => {
    if (!ts) return false;
    const date = new Date(ts);
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const displayedLogs = logs.filter(log => {
    if (filter === 'all') return true;
    if (filter === 'me') return log.userId === user?.uid;
    if (filter === 'all_admins') return log.role === 'admin';
    return log.userId === filter; // Specific admin ID
  });

  const todaysLogs = displayedLogs.filter(log => isToday(log.timestamp));
  const previousLogs = displayedLogs.filter(log => !isToday(log.timestamp));

  const renderLogTable = (logsToRender: MockLog[], emptyMessage: string) => (
    <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-neutral-50 text-neutral-600 font-medium border-b border-neutral-200">
          <tr>
            <th className="px-6 py-4">Date & Time</th>
            <th className="px-6 py-4">User</th>
            <th className="px-6 py-4">Role</th>
            <th className="px-6 py-4">Activity</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {loading ? (
            <tr><td colSpan={4} className="px-6 py-12 text-center text-neutral-500">Loading activity...</td></tr>
          ) : logsToRender.length === 0 ? (
            <tr><td colSpan={4} className="px-6 py-12 text-center text-neutral-500">{emptyMessage}</td></tr>
          ) : (
            logsToRender.map(log => (
              <tr key={log.id} className="hover:bg-neutral-50">
                <td className="px-6 py-4 text-neutral-500 font-mono text-xs">{formatTime(log.timestamp)}</td>
                <td className="px-6 py-4 font-medium text-neutral-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-neutral-400" />
                  {log.username}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    log.role === 'superUser' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {log.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-neutral-700">{log.activity}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <History className="w-6 h-6 text-blue-600" />
            Activity History
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {user?.role === 'superUser' || user?.role === 'admin' ? 'View all system activity across all users.' : 'View your recent session activity.'}
          </p>
        </div>
        
        {(user?.role === 'superUser' || user?.role === 'admin') && (
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-neutral-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white shadow-sm"
            >
              <option value="all">All Activity</option>
              <option value="me">My Activity</option>
              <option value="all_admins">All Admins</option>
              {admins.length > 0 && (
                <optgroup label="Specific Admins">
                  {admins.map(admin => (
                    <option key={admin.id} value={admin.id}>
                      {admin.name} (@{admin.username})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
        )}
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Today's Activity</h2>
          {renderLogTable(todaysLogs, "No activity recorded today.")}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Previous Activity</h2>
          {renderLogTable(previousLogs, "No previous activity found.")}
        </div>
      </div>
    </div>
  );
}
