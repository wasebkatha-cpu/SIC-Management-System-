import React, { useState, useEffect } from 'react';
import { Archive, Download, Eye, Plus, Search } from 'lucide-react';
import { InwardRecord, OutwardRecord, getStoredInwards, getStoredOutwards } from '../utils/inwardOutwardStorage';
import InwardOutwardFormModal from './InwardOutwardFormModal';
import { useAuth } from '../context/AuthContext';
import AttachmentViewerModal from './AttachmentViewerModal';

export default function InwardOutwardRegistry() {
  const [activeTab, setActiveTab] = useState<'inward' | 'outward'>('inward');
  const [typeFilter, setTypeFilter] = useState<'all' | 'general' | 'complaints'>('all');
  const [inwards, setInwards] = useState<InwardRecord[]>([]);
  const [outwards, setOutwards] = useState<OutwardRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formType, setFormType] = useState<'inward' | 'outward'>('inward');
  
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerAttachment, setViewerAttachment] = useState<any | null>(null);

  const { isSuperUser, isAdmin, hasPermission } = useAuth();
  const canAdd = isSuperUser || hasPermission('inward_outward_create');

  const loadData = () => {
    setInwards(getStoredInwards());
    setOutwards(getStoredOutwards());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('inwards_updated', loadData);
    window.addEventListener('outwards_updated', loadData);
    return () => {
      window.removeEventListener('inwards_updated', loadData);
      window.removeEventListener('outwards_updated', loadData);
    };
  }, []);

  const openForm = (type: 'inward' | 'outward') => {
    setFormType(type);
    setIsFormOpen(true);
  };

  const handleViewAttachment = (attachment: any) => {
    setViewerAttachment({ id: 'doc_' + Date.now(), ...attachment });
    setViewerOpen(true);
  };

  const filteredInwards = inwards.filter(i => {
    const matchesSearch = i.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.inwardNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.complaintNo && i.complaintNo.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = typeFilter === 'all' ? true : 
      typeFilter === 'general' ? !i.complaintNo : !!i.complaintNo;

    return matchesSearch && matchesType;
  });

  const filteredOutwards = outwards.filter(o => {
    const matchesSearch = o.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.outwardNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.complaintNo && o.complaintNo.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = typeFilter === 'all' ? true : 
      typeFilter === 'general' ? !o.complaintNo : !!o.complaintNo;

    return matchesSearch && matchesType;
  });

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 dark:bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/5 dark:bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="px-8 py-6 border-b border-neutral-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl relative z-10">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Inward & Outward Registry
          </h1>
          <p className="text-sm text-neutral-500 dark:text-slate-400 mt-1">
            Manage all general and complaint-linked submissions and dispatches
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search registry..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-neutral-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
            />
          </div>
          {canAdd && (
            <button
              onClick={() => openForm(activeTab)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" />
              Log {activeTab === 'inward' ? 'Inward' : 'Outward'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-8 py-3 border-b border-neutral-200 dark:border-slate-800 bg-neutral-50/80 dark:bg-slate-900/80 backdrop-blur-xl relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('inward')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'inward'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-neutral-200 dark:border-slate-700'
                : 'text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-slate-800'
            }`}
          >
            Inward Register ({inwards.length})
          </button>
          <button
            onClick={() => setActiveTab('outward')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'outward'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-neutral-200 dark:border-slate-700'
                : 'text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-slate-800'
            }`}
          >
            Outward Register ({outwards.length})
          </button>
        </div>

        <div className="flex p-1 bg-neutral-200/50 dark:bg-slate-800/50 rounded-lg">
          {(['all', 'general', 'complaints'] as const).map(type => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                typeFilter === type
                  ? 'bg-white dark:bg-slate-700 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8 relative z-10">
        
        {activeTab === 'inward' && (
          <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 dark:bg-slate-800/50 border-b border-neutral-200 dark:border-slate-700">
                  <th className="px-6 py-4 text-xs font-semibold text-neutral-500 dark:text-slate-400 uppercase tracking-wider">Inward No</th>
                  <th className="px-6 py-4 text-xs font-semibold text-neutral-500 dark:text-slate-400 uppercase tracking-wider">Date Received</th>
                  <th className="px-6 py-4 text-xs font-semibold text-neutral-500 dark:text-slate-400 uppercase tracking-wider">Sender</th>
                  <th className="px-6 py-4 text-xs font-semibold text-neutral-500 dark:text-slate-400 uppercase tracking-wider">Subject</th>
                  {typeFilter !== 'general' && <th className="px-6 py-4 text-xs font-semibold text-neutral-500 dark:text-slate-400 uppercase tracking-wider">Complaint No</th>}
                  <th className="px-6 py-4 text-xs font-semibold text-neutral-500 dark:text-slate-400 uppercase tracking-wider">Attachments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-slate-800">
                {filteredInwards.map((record) => (
                  <tr key={record.id} className="hover:bg-neutral-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4 text-sm font-medium text-neutral-900 dark:text-white whitespace-nowrap">
                      {record.inwardNo}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600 dark:text-slate-400 whitespace-nowrap">
                      {new Date(record.dateReceived).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-900 dark:text-white">
                      {record.senderName}
                      <span className="block text-xs text-neutral-500 dark:text-slate-500 capitalize">{record.senderType.replace('_', ' ')}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-900 dark:text-white">
                      <p className="line-clamp-2">{record.subject}</p>
                    </td>
                    {typeFilter !== 'general' && (
                      <td className="px-6 py-4 text-sm">
                        {record.complaintNo ? (
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md font-medium text-xs">
                            {record.complaintNo}
                          </span>
                        ) : (
                          <span className="text-neutral-400 dark:text-slate-500 text-xs">-</span>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      {record.attachments && record.attachments.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {record.attachments.map((att: any, idx: number) => (
                            <button
                              key={idx}
                              onClick={() => handleViewAttachment(att)}
                              className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline font-medium text-xs bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md max-w-[120px]"
                              title={att.name}
                            >
                              <Archive className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{att.name}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-neutral-400 dark:text-slate-500 text-xs">None</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredInwards.length === 0 && (
                  <tr>
                    <td colSpan={typeFilter === 'general' ? 5 : 6} className="px-6 py-12 text-center text-neutral-500 dark:text-slate-400">
                      <Archive className="w-8 h-8 mx-auto mb-3 opacity-20" />
                      <p>No inward records found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'outward' && (
          <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 dark:bg-slate-800/50 border-b border-neutral-200 dark:border-slate-700">
                  <th className="px-6 py-4 text-xs font-semibold text-neutral-500 dark:text-slate-400 uppercase tracking-wider">Outward No</th>
                  <th className="px-6 py-4 text-xs font-semibold text-neutral-500 dark:text-slate-400 uppercase tracking-wider">Date Dispatched</th>
                  <th className="px-6 py-4 text-xs font-semibold text-neutral-500 dark:text-slate-400 uppercase tracking-wider">Recipient</th>
                  <th className="px-6 py-4 text-xs font-semibold text-neutral-500 dark:text-slate-400 uppercase tracking-wider">Subject</th>
                  {typeFilter !== 'general' && <th className="px-6 py-4 text-xs font-semibold text-neutral-500 dark:text-slate-400 uppercase tracking-wider">Complaint No</th>}
                  <th className="px-6 py-4 text-xs font-semibold text-neutral-500 dark:text-slate-400 uppercase tracking-wider">Attachments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-slate-800">
                {filteredOutwards.map((record) => (
                  <tr key={record.id} className="hover:bg-neutral-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4 text-sm font-medium text-neutral-900 dark:text-white whitespace-nowrap">
                      {record.outwardNo}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600 dark:text-slate-400 whitespace-nowrap">
                      {new Date(record.dateDispatched).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-900 dark:text-white">
                      {record.recipientName}
                      <span className="block text-xs text-neutral-500 dark:text-slate-500 capitalize">{record.recipientType.replace('_', ' ')}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-900 dark:text-white">
                      <p className="line-clamp-2">{record.subject}</p>
                      {record.trackingId && (
                        <span className="text-xs text-neutral-500 dark:text-slate-400 block mt-0.5">
                          Tracking: {record.trackingId}
                        </span>
                      )}
                    </td>
                    {typeFilter !== 'general' && (
                      <td className="px-6 py-4 text-sm">
                        {record.complaintNo ? (
                          <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-md font-medium text-xs">
                            {record.complaintNo}
                          </span>
                        ) : (
                          <span className="text-neutral-400 dark:text-slate-500 text-xs">-</span>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      {record.attachments && record.attachments.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {record.attachments.map((att: any, idx: number) => (
                            <button
                              key={idx}
                              onClick={() => handleViewAttachment(att)}
                              className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline font-medium text-xs bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md max-w-[120px]"
                              title={att.name}
                            >
                              <Archive className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{att.name}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-neutral-400 dark:text-slate-500 text-xs">None</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredOutwards.length === 0 && (
                  <tr>
                    <td colSpan={typeFilter === 'general' ? 5 : 6} className="px-6 py-12 text-center text-neutral-500 dark:text-slate-400">
                      <Archive className="w-8 h-8 mx-auto mb-3 opacity-20" />
                      <p>No outward records found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>

      <InwardOutwardFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        type={formType}
        onSave={loadData}
      />
      
      {viewerOpen && viewerAttachment && (
        <AttachmentViewerModal
          attachment={viewerAttachment}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </div>
  );
}
