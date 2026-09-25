import React, { useState, useEffect } from 'react';
import { UserCircle2, Lock, ShieldCheck, AlertCircle, Server, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MockDB } from '../lib/mockDb';
import { getApiUrl, setApiUrl, apiFetch, autoDiscoverServer } from '../lib/apiConfig';

export default function Login() {
  const { login } = useAuth();
  const [loading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [serverUrl, setServerUrl] = useState(getApiUrl());
  const [discovering, setDiscovering] = useState(false);
  const [connectionError, setConnectionError] = useState(false);

  // Auto-discover if current server is unreachable
  useEffect(() => {
    const checkServer = async () => {
      try {
        const res = await apiFetch('/api/ping', { signal: AbortSignal.timeout(2000) });
        if (!res.ok) throw new Error('Offline');
      } catch (e) {
        setConnectionError(true);
        // Automatically try to discover
        setDiscovering(true);
        const newServer = await autoDiscoverServer();
        if (newServer && newServer !== getApiUrl()) {
          setApiUrl(newServer); // This will reload the page
        } else {
          setDiscovering(false);
        }
      }
    };
    checkServer();
  }, []);

  const handleManualDiscover = async () => {
    setDiscovering(true);
    const newServer = await autoDiscoverServer();
    if (newServer) {
      setServerUrl(newServer);
    } else {
      alert("Could not automatically find the server on this network.");
    }
    setDiscovering(false);
  };
  
  const handleResetRole = async () => {
    if (window.confirm("Are you sure you want to reset the App Role? This will restart the app and take you back to the Setup Wizard.")) {
      if (window.electronAPI) {
        await window.electronAPI.setAppRole(null);
        window.location.reload();
      } else {
        localStorage.removeItem('app_role');
        window.location.reload();
      }
    }
  };

  // Superuser Reset Feature
  const [clickCount, setClickCount] = useState(0);
  const [showReset, setShowReset] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [resetStatus, setResetStatus] = useState<{ type: 'error' | 'success', msg: string } | null>(null);

  const handleShieldClick = () => {
    setClickCount(prev => {
      const newCount = prev + 1;
      if (newCount >= 7) {
        setShowReset(true);
        return 0;
      }
      return newCount;
    });
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetStatus(null);
    try {
      const res = await apiFetch('/api/reset-superuser', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: resetPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setResetStatus({ type: 'success', msg: 'Superuser password updated. You can now login.' });
        setResetPassword('');
      } else {
        setResetStatus({ type: 'error', msg: data.error || 'Failed to reset password.' });
      }
    } catch (err: any) {
      setResetStatus({ type: 'error', msg: 'Failed to communicate with server.' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const users = MockDB.getUsers();
      const foundUser = users.find(u => 
        u.username.toLowerCase() === username.trim().toLowerCase() && 
        u.password === password
      );
      
      if (foundUser) {
        await login({
          uid: foundUser.id,
          username: foundUser.username,
          name: foundUser.name,
          role: foundUser.role,
          permissions: foundUser.permissions,
          assignedReaderId: foundUser.assignedReaderId
        });
      } else {
        setError('Invalid username or password.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-neutral-50">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-slate-950 px-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-neutral-100 dark:border-slate-800 overflow-hidden">
        <div className="bg-blue-600 p-6 text-center text-white">
          <ShieldCheck 
            className="w-12 h-12 mx-auto mb-3 opacity-90 cursor-pointer" 
            onClick={handleShieldClick}
            title="System Login"
          />
          <h1 className="text-2xl font-bold">
            System Login
          </h1>
          <p className="text-blue-100 text-sm mt-1">
            Enter your credentials to continue
          </p>
        </div>
        
        <div className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 px-4 py-3 rounded-md text-sm border border-rose-200 dark:border-rose-900 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            
            {connectionError && !discovering && !error && (
              <div className="bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 px-4 py-3 rounded-md text-sm border border-amber-200 dark:border-amber-900 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>Cannot reach the server. Please check your network or configure the connection below.</span>
              </div>
            )}
            
            {discovering && (
              <div className="bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 px-4 py-3 rounded-md text-sm border border-blue-200 dark:border-blue-900 flex items-center gap-3">
                <RefreshCw className="w-5 h-5 shrink-0 animate-spin" />
                <span>Auto-discovering Server PC on the network...</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserCircle2 className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 bg-white dark:bg-slate-800 border border-neutral-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm text-neutral-900 dark:text-white"
                  placeholder="Enter username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 bg-white dark:bg-slate-800 border border-neutral-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm text-neutral-900 dark:text-white"
                  placeholder="Enter password (min 6 characters)"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors shadow-sm disabled:opacity-70"
            >
              {submitting ? 'Authenticating...' : 'Sign In'}
            </button>
            

            <div className="pt-4 border-t border-neutral-100 dark:border-slate-800 text-center">
              <button 
                type="button" 
                onClick={() => setShowConfig(true)}
                className="inline-flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
              >
                <Server className="w-4 h-4" />
                Configure Server Connection
              </button>
            </div>
          </form>
        </div>
      </div>

      {showConfig && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-sm w-full p-6 border border-neutral-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">Server Configuration</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              Enter the IP address or hostname of the main Server PC. For this machine (the Server PC), you can leave it as localhost.
            </p>
            
            <div className="mb-5">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Server URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder="http://192.168.1.100:3001"
                  className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-neutral-300 dark:border-slate-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleManualDiscover}
                  disabled={discovering}
                  className="px-3 py-2 bg-neutral-100 dark:bg-slate-800 border border-neutral-300 dark:border-slate-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 text-sm disabled:opacity-50"
                  title="Auto-discover Server on network"
                >
                  <RefreshCw className={`w-4 h-4 ${discovering ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfig(false)}
                className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-slate-800 hover:bg-neutral-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetRole}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Reset App Role
              </button>
              <button
                type="button"
                onClick={() => {
                  setApiUrl(serverUrl);
                  setShowConfig(false);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Save & Restart
              </button>
            </div>
          </div>
        </div>
      )}

      {showReset && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-sm w-full p-6 border border-neutral-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">Emergency Superuser Reset</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              Enter a new password for the superuser. This will only work if you are performing this action on the main Server PC.
            </p>
            
            <form onSubmit={handleResetSubmit}>
              <div className="mb-5">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-neutral-300 dark:border-slate-700 rounded-lg text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-600"
                  placeholder="Enter new password"
                />
              </div>

              {resetStatus && (
                <div className={`mb-4 px-3 py-2 rounded text-sm ${resetStatus.type === 'error' ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900' : 'bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900'}`}>
                  {resetStatus.msg}
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowReset(false)}
                  className="flex-1 px-4 py-2 text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-slate-800 hover:bg-neutral-200 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-white bg-rose-600 hover:bg-rose-700 rounded-lg font-medium transition-colors"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
