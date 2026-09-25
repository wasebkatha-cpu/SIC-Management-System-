import React, { useState, useEffect } from 'react';
import { Server, Monitor, ArrowRight, ShieldCheck, Database, Network } from 'lucide-react';

export default function SetupWizard({ onComplete }: { onComplete: (role: 'server' | 'client') => void }) {
  const [selectedRole, setSelectedRole] = useState<'server' | 'client' | null>(null);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!selectedRole) return;
    setLoading(true);
    
    try {
      // If we are running in Electron, use the secure IPC bridge
      if (window.electronAPI) {
        await window.electronAPI.setAppRole(selectedRole);
      } else {
        // Fallback for browser testing
        localStorage.setItem('app_role', selectedRole);
      }
      
      // Artificial delay for UX
      setTimeout(() => {
        onComplete(selectedRole);
      }, 1000);
    } catch (error) {
      console.error('Failed to set role:', error);
      alert('Failed to set application role. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-700 flex flex-col md:flex-row">
        
        {/* Left Side - Info */}
        <div className="bg-blue-600 p-8 md:w-2/5 text-white flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <ShieldCheck className="w-7 h-7 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold">SIC Management</h1>
            </div>
            <h2 className="text-3xl font-light mb-4">First Launch Setup</h2>
            <p className="text-blue-100 text-sm leading-relaxed mb-8">
              Welcome to the SIC Management System. To complete your installation, please tell us how this specific computer will be used in your network.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Database className="w-5 h-5 text-blue-300 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-100">
                <strong>Server:</strong> Hosts the central database. Only choose this for ONE computer in your network.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Network className="w-5 h-5 text-blue-300 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-100">
                <strong>Client:</strong> Connects to the Server over WiFi/LAN. Choose this for all other computers.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Selection */}
        <div className="p-8 md:w-3/5 bg-slate-800 flex flex-col justify-center">
          <h3 className="text-xl font-semibold text-white mb-6 text-center">Select Computer Role</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {/* Server Option */}
            <button
              onClick={() => setSelectedRole('server')}
              className={`relative p-6 rounded-xl border-2 text-left transition-all duration-200 ${
                selectedRole === 'server' 
                  ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.2)]' 
                  : 'border-slate-700 bg-slate-750 hover:border-slate-500 hover:bg-slate-700'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-lg ${selectedRole === 'server' ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                  <Server className="w-6 h-6" />
                </div>
                {selectedRole === 'server' && (
                  <div className="w-4 h-4 rounded-full bg-blue-500 ring-4 ring-blue-500/30" />
                )}
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Main Server</h4>
              <p className="text-xs text-slate-400">
                I want to host the Database on this PC. (Requires PostgreSQL installed locally).
              </p>
            </button>

            {/* Client Option */}
            <button
              onClick={() => setSelectedRole('client')}
              className={`relative p-6 rounded-xl border-2 text-left transition-all duration-200 ${
                selectedRole === 'client' 
                  ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
                  : 'border-slate-700 bg-slate-750 hover:border-slate-500 hover:bg-slate-700'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-lg ${selectedRole === 'client' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                  <Monitor className="w-6 h-6" />
                </div>
                {selectedRole === 'client' && (
                  <div className="w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-emerald-500/30" />
                )}
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Client PC</h4>
              <p className="text-xs text-slate-400">
                I want to connect to an existing Server on my network. (No database required).
              </p>
            </button>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleConfirm}
              disabled={!selectedRole || loading}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                selectedRole && !loading
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg' 
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Configuring...
                </span>
              ) : (
                <>
                  Confirm Setup <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
