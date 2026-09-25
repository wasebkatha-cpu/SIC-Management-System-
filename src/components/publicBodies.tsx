import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Building2, MapPin, Globe, Mail, Phone, User, Users, Edit2, Upload, Info, Trash2 } from 'lucide-react';
import AddPublicBodyModal from './addPublicBodyModal';
import EditPublicBodyModal from './editPublicBodyModal';
import { useAppContext, PublicBody } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import Papa from 'papaparse';

export default function PublicBodies() {
  const { publicBodies, addPublicBody, getReaderForLocation, updatePublicBody, addBulkPublicBodies, deletePublicBody } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { logActivity, user, hasPermission } = useAuth();
  const canCreate = user?.role === 'superUser' || hasPermission('publicbody_create');
  const canEdit = user?.role === 'superUser' || hasPermission('publicbody_edit');
  const canDelete = user?.role === 'superUser' || hasPermission('publicbody_delete');
  const canUpload = user?.role === 'superUser' || hasPermission('publicbody_bulk_upload');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBody, setEditingBody] = useState<PublicBody | null>(null);

  useEffect(() => {
    const handleFocusPB = (e: any) => {
      if (e.detail?.search) {
        setSearchTerm(e.detail.search);
      }
    };
    const handleFocusDO = (e: any) => {
      if (e.detail?.search) {
        setSearchTerm(e.detail.search);
      }
    };

    window.addEventListener('focus_public_body', handleFocusPB as EventListener);
    window.addEventListener('focus_designated_official', handleFocusDO as EventListener);

    return () => {
      window.removeEventListener('focus_public_body', handleFocusPB as EventListener);
      window.removeEventListener('focus_designated_official', handleFocusDO as EventListener);
    };
  }, []);

  const filteredBodies = publicBodies.filter(body => 
    body.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    body.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
    body.designatedOfficialName.toLowerCase().includes(searchTerm.toLowerCase())
  );


  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        let parsedData: any[] = [];
        
        if (file.name.toLowerCase().endsWith('.json')) {
          parsedData = JSON.parse(content);
        } else if (file.name.toLowerCase().endsWith('.csv')) {
          parsedData = Papa.parse(content, { header: true, skipEmptyLines: true }).data as any[];
        } else {
          alert('Unsupported file format. Please upload CSV or JSON.');
          return;
        }
        
        if (!Array.isArray(parsedData) || parsedData.length === 0) {
           alert('File must contain an array of objects.');
           return;
        }
        
        const standardFields = [
          'id', 'srNo', 'name', 'publicBodyName', 'designatedOfficialName', 'do_name', 'officialName', 
          'designatedOfficialDesignation', 'designation', 'headOfDepartmentName', 'hod_name', 
          'headOfDepartmentDesignation', 'hod_designation', 'district', 'division', 'reader', 
          'website', 'email', 'contactNumber', 'phone', 'address'
        ];
        
        const newBodies: PublicBody[] = parsedData.map((row, index) => {
          const additionalFields: {name: string, value: string}[] = [];
          
          Object.keys(row).forEach(key => {
            if (!standardFields.includes(key)) {
              additionalFields.push({ name: key, value: String(row[key]) });
            }
          });
          
          return {
            id: `bulk-${Date.now()}-${index}`,
            srNo: parseInt(row.srNo) || publicBodies.length + index + 1,
            name: row.name || row.publicBodyName || 'Unknown Public Body',
            designatedOfficialName: row.designatedOfficialName || row.do_name || row.officialName || 'Unknown Official',
            designatedOfficialDesignation: row.designatedOfficialDesignation || row.designation || '',
            headOfDepartmentName: row.headOfDepartmentName || row.hod_name || '',
            headOfDepartmentDesignation: row.headOfDepartmentDesignation || row.hod_designation || '',
            district: row.district || '',
            division: row.division || '',
            reader: row.reader || getReaderForLocation(row.division, row.district) || 'Unassigned',
            website: row.website || '',
            email: row.email || '',
            contactNumber: row.contactNumber || row.phone || '',
            address: row.address || '',
            additionalFields: additionalFields.length > 0 ? additionalFields : undefined
          };
        });
        
        addBulkPublicBodies(newBodies);
        await logActivity(`Bulk uploaded ${newBodies.length} public bodies from file ${file.name}`);
        alert(`Successfully added ${newBodies.length} public bodies!`);
      } catch (err) {
        alert('Error parsing file.');
        console.error(err);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };


  const handleAddPublicBody = async (newBody: PublicBody) => {
    addPublicBody(newBody);
    await logActivity(`Added new public body: ${newBody.name}`);
  };


  const handleDeletePublicBody = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      deletePublicBody(id);
    }
  };

  const handleUpdatePublicBody = async (id: string, updates: Partial<PublicBody>) => {
    updatePublicBody(id, updates);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Public Bodies Directory
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-300 mt-1">
            Manage and view all registered public bodies, their designated officials, and contact details.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search public bodies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-full sm:w-64 rounded-md border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {canUpload && (<>
            <input 
              type="file" 
              accept=".csv,.json" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm whitespace-nowrap cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Bulk Upload</span>
            </button>
          </>)}
          {canCreate && (
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Public Body</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-gradient-to-b dark:from-slate-900/95 dark:to-cyan-950/30 border border-neutral-200 dark:border-cyan-900/50 rounded-xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-180px)]">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm text-neutral-600 dark:text-neutral-200">
            <thead className="bg-neutral-50 dark:bg-slate-800/90 border-b border-neutral-200 dark:border-cyan-900/40 text-neutral-500 dark:text-white sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 font-medium w-16 text-center whitespace-nowrap">Sr. No.</th>
                <th className="px-4 py-3 font-medium min-w-[250px] whitespace-nowrap">Public Body Name</th>
                <th className="px-4 py-3 font-medium min-w-[200px] whitespace-nowrap">Head of Department</th>
                <th className="px-4 py-3 font-medium min-w-[200px] whitespace-nowrap">Designated Official</th>
                <th className="px-4 py-3 font-medium min-w-[150px] whitespace-nowrap">Location (Dist/Div)</th>
                <th className="px-4 py-3 font-medium text-center min-w-[120px] whitespace-nowrap">Reader</th>
                <th className="px-4 py-3 font-medium min-w-[300px] whitespace-nowrap">Contact Information</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-slate-800/80">
              {filteredBodies.length > 0 ? (
                filteredBodies.map((body) => (
                  <tr key={body.id} className="hover:bg-neutral-50 dark:hover:bg-cyan-950/40 transition-colors">
                    <td className="px-4 py-4 text-center font-medium text-neutral-500 dark:text-neutral-300">{body.srNo}</td>
                    
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-neutral-900 dark:text-white">{body.name}</div>
                        <div className="flex items-center gap-1">
                          {canEdit && (
                            <button
                              onClick={() => setEditingBody(body)}
                              className="p-1 text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded transition-colors cursor-pointer"
                              title="Edit Public Body"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDeletePublicBody(body.id, body.name)}
                              className="p-1 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded transition-colors cursor-pointer"
                              title="Delete Public Body"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-start gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center shrink-0 mt-0.5">
                          <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <div className="font-medium text-neutral-800 dark:text-white">{body.headOfDepartmentName}</div>
                          <div className="text-[11px] text-neutral-500 dark:text-neutral-300 uppercase tracking-wide font-medium mt-0.5">
                            {body.headOfDepartmentDesignation}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center shrink-0 mt-0.5">
                          <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <div className="font-medium text-neutral-800 dark:text-white">{body.designatedOfficialName}</div>
                          <div className="text-[11px] text-neutral-500 dark:text-neutral-300 uppercase tracking-wide font-medium mt-0.5">
                            {body.designatedOfficialDesignation}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-1.5 text-neutral-700 dark:text-neutral-200">
                        <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-neutral-400 dark:text-neutral-400" />
                        <div>
                          <div className="font-medium text-neutral-800 dark:text-white">{body.district}</div>
                          <div className="text-xs text-neutral-500 dark:text-neutral-300">Div: {body.division}</div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center justify-center px-2 py-1 rounded-md text-xs font-bold bg-neutral-100 dark:bg-slate-800 text-neutral-700 dark:text-cyan-300 border border-neutral-200 dark:border-cyan-800/50">
                        {(body.reader && body.reader !== 'Unassigned') ? body.reader : (getReaderForLocation(body.division, body.district) || 'Unassigned')}
                      </span>
                    </td>
                    
                    <td className="px-4 py-4">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                        <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300">
                          <Globe className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <a href={body.website.startsWith('http') ? body.website : `https://${body.website}`} target="_blank" rel="noreferrer" className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline truncate">
                            {body.website}
                          </a>
                        </div>
                        <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300">
                          <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <a href={`mailto:${body.email}`} className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline truncate">
                            {body.email}
                          </a>
                        </div>
                        <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300">
                          <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <span>{body.contactNumber}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300 col-span-2">
                          <Building2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <span className="truncate" title={body.address}>{body.address}</span>
                        </div>
                        {body.additionalFields && body.additionalFields.length > 0 && (
                          <div className="col-span-2 mt-2 pt-2 border-t border-neutral-100 dark:border-slate-800 grid grid-cols-2 gap-2">
                            {body.additionalFields.map((field, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 px-2 py-1 rounded">
                                <Info className="w-3 h-3 shrink-0" />
                                <span className="font-semibold capitalize truncate">{field.name}:</span>
                                <span className="truncate" title={field.value}>{field.value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-neutral-400">
                      <Building2 className="w-12 h-12 mb-3 text-neutral-300 dark:text-neutral-600" />
                      <p className="text-base font-medium text-neutral-600 dark:text-neutral-200">No public bodies found</p>
                      <p className="text-sm dark:text-neutral-400">Adjust your search query or add a new public body.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination/Footer */}
        <div className="border-t border-neutral-200 dark:border-slate-800 bg-neutral-50 dark:bg-slate-900/90 px-4 py-3 flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-300 shrink-0">
          <div>
            Showing <span className="font-medium text-neutral-900 dark:text-white">{filteredBodies.length}</span> results
          </div>
        </div>
      </div>

      <AddPublicBodyModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddPublicBody}
      />
      
      <EditPublicBodyModal
        isOpen={!!editingBody}
        onClose={() => setEditingBody(null)}
        onSave={handleUpdatePublicBody}
        publicBody={editingBody}
      />
    </div>
  );
}
