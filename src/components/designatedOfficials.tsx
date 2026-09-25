import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Plus, User, Building2, MapPin, Globe, Mail, Phone, Upload, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppContext, PublicBody } from '../context/AppContext';

export default function DesignatedOfficials() {
  const [searchTerm, setSearchTerm] = useState('');
  const { user, logActivity } = useAuth();
  const { readers, getReaderForLocation, publicBodies, addBulkPublicBodies } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleFocusDO = (e: any) => {
      if (e.detail?.search) {
        setSearchTerm(e.detail.search);
      }
    };
    window.addEventListener('focus_designated_official', handleFocusDO as EventListener);
    return () => {
      window.removeEventListener('focus_designated_official', handleFocusDO as EventListener);
    };
  }, []);

  // Instead of mock data, use publicBodies from context
  const filteredOfficials = useMemo(() => {
    let officials = publicBodies;

    // Apply reader-based filtering for admin
    if (user?.role === 'admin' && user.assignedReaderId) {
      const assignedReader = readers.find(r => r.id === user.assignedReaderId);
      if (assignedReader) {
        officials = officials.filter(doffic => getReaderForLocation(doffic.division, doffic.district) === assignedReader.name);
      }
    }

    return officials.filter(official => 
      official.designatedOfficialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      official.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      official.district.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, user, readers, getReaderForLocation, publicBodies]);

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
          parsedData = parseCSV(content);
        } else {
          alert('Unsupported file format. Please upload CSV or JSON.');
          return;
        }
        
        if (!Array.isArray(parsedData) || parsedData.length === 0) {
           alert('File must contain an array of objects.');
           return;
        }
        
        // Define standard fields expected
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
        await logActivity(`Bulk uploaded ${newBodies.length} designated officials from file ${file.name}`);
        alert(`Successfully added ${newBodies.length} officials!`);
      } catch (err) {
        alert('Error parsing file.');
        console.error(err);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const parseCSV = (csv: string) => {
    const lines = csv.split('\n').filter(line => line.trim().length > 0);
    if (lines.length < 2) return [];
    
    // Simplistic CSV parsing (does not handle quoted commas properly, but fine for basic uses)
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
      // Very basic split
      const values = line.split(',');
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] ? values[index].trim() : '';
      });
      return obj;
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <User className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Designated Officials Directory
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-300 mt-1">
            Manage and view all designated officials and their associated public bodies.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search officials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-full sm:w-64 rounded-md border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          
          <input 
            type="file" 
            accept=".csv,.json" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm whitespace-nowrap cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Bulk Upload (CSV/JSON)</span>
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-gradient-to-b dark:from-slate-900/95 dark:to-emerald-950/30 border border-neutral-200 dark:border-emerald-900/50 rounded-xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-180px)]">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm text-neutral-600 dark:text-neutral-200">
            <thead className="bg-neutral-50 dark:bg-slate-800/90 border-b border-neutral-200 dark:border-emerald-900/40 text-neutral-500 dark:text-white sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 font-medium w-16 text-center whitespace-nowrap">Sr. No.</th>
                <th className="px-4 py-3 font-medium min-w-[200px] whitespace-nowrap">Designated Official</th>
                <th className="px-4 py-3 font-medium min-w-[250px] whitespace-nowrap">Public Body Name</th>
                <th className="px-4 py-3 font-medium min-w-[150px] whitespace-nowrap">Location (Dist/Div)</th>
                <th className="px-4 py-3 font-medium text-center min-w-[120px] whitespace-nowrap">Reader</th>
                <th className="px-4 py-3 font-medium min-w-[300px] whitespace-nowrap">Contact & Other Information</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-slate-800/80">
              {filteredOfficials.length > 0 ? (
                filteredOfficials.map((official) => (
                  <tr key={official.id} className="hover:bg-neutral-50 dark:hover:bg-emerald-950/40 transition-colors">
                    <td className="px-4 py-4 text-center font-medium text-neutral-500 dark:text-neutral-300">{official.srNo}</td>
                    
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center shrink-0 mt-0.5">
                          <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <div className="font-medium text-neutral-800 dark:text-white">{official.designatedOfficialName || 'N/A'}</div>
                          <div className="text-[11px] text-neutral-500 dark:text-neutral-300 uppercase tracking-wide font-medium mt-0.5">
                            {official.designatedOfficialDesignation || 'No Designation'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-semibold text-neutral-900 dark:text-white">{official.name}</div>
                    </td>
                    
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-1.5 text-neutral-700 dark:text-neutral-200">
                        <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-neutral-400" />
                        <div>
                          <div className="font-medium text-neutral-800 dark:text-white">{official.district || '-'}</div>
                          <div className="text-xs text-neutral-500 dark:text-neutral-300">Div: {official.division || '-'}</div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center justify-center px-2 py-1 rounded-md text-xs font-bold bg-neutral-100 dark:bg-slate-800 text-neutral-700 dark:text-emerald-300 border border-neutral-200 dark:border-emerald-800/50">
                        {official.reader || getReaderForLocation(official.division, official.district) || 'Unassigned'}
                      </span>
                    </td>
                    
                    <td className="px-4 py-4">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                        <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300">
                          <Globe className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <a href={official.website ? `https://${official.website}` : '#'} target="_blank" rel="noreferrer" className="hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline truncate">
                            {official.website || '-'}
                          </a>
                        </div>
                        <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300">
                          <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <a href={official.email ? `mailto:${official.email}` : '#'} className="hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline truncate">
                            {official.email || '-'}
                          </a>
                        </div>
                        <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300">
                          <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <span>{official.contactNumber || '-'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300 col-span-2">
                          <Building2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <span className="truncate" title={official.address}>{official.address || '-'}</span>
                        </div>
                        {official.additionalFields && official.additionalFields.length > 0 && (
                          <div className="col-span-2 mt-2 pt-2 border-t border-neutral-100 dark:border-slate-800 grid grid-cols-2 gap-2">
                            {official.additionalFields.map((field, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 px-2 py-1 rounded">
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
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-neutral-400">
                      <User className="w-12 h-12 mb-3 text-neutral-300 dark:text-neutral-600" />
                      <p className="text-base font-medium text-neutral-600 dark:text-neutral-200">No designated officials found</p>
                      <p className="text-sm dark:text-neutral-400">Adjust your search query or upload officials.</p>
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
            Showing <span className="font-medium text-neutral-900 dark:text-white">{filteredOfficials.length}</span> results
          </div>
        </div>
      </div>
    </div>
  );
}
