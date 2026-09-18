import React, { useState } from 'react';
import { UserCircle2, Lock, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MockDB } from '../lib/mockDb';

export default function Login() {
  const { login } = useAuth();
  const [loading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

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
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-neutral-100 overflow-hidden">
        <div className="bg-blue-600 p-6 text-center text-white">
          <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-90" />
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
              <div className="bg-rose-50 text-rose-700 px-4 py-3 rounded-md text-sm border border-rose-200 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserCircle2 className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                  placeholder="Enter username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
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
            
            <div className="mt-4 p-3 bg-neutral-50 rounded-lg text-xs text-neutral-500 border border-neutral-200">
              <p className="font-medium text-neutral-700 mb-1">Demo Credentials:</p>
              <p>Super User: <strong>superuser</strong> / <strong>password123</strong></p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
