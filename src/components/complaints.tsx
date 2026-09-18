import { useState, useMemo, ReactNode } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  X, 
  RotateCcw, 
  User, 
  Building2, 
  MapPin, 
  Scale, 
  FileText, 
  ChevronDown, 
  ChevronUp,
  SlidersHorizontal
} from 'lucide-react';
import ComplaintForm from './complaintForm';
import { useAppContext, getComplaintCurrentStage, ComplaintData } from '../context/AppContext';

// Helper component for filter fields with width dynamically sized to their text content
interface FilterSelectProps {
  label: string;
  icon: ReactNode;
  value: string;
  onChange: (val: string) => void;
  onClear?: () => void;
  options: { value: string; label: string }[];
  placeholder: string;
  theme?: 'blue' | 'indigo' | 'emerald' | 'amber' | 'purple' | 'teal';
}

function FilterSelect({
  label,
  icon,
  value,
  onChange,
  onClear,
  options,
  placeholder,
  theme = 'blue',
}: FilterSelectProps) {
  const themeClasses = {
    blue: value 
      ? 'border-blue-500 bg-blue-50/70 text-blue-900 font-semibold dark:bg-blue-950/70 dark:border-blue-500 dark:text-blue-200' 
      : 'border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-neutral-800 dark:text-neutral-200 hover:border-neutral-400 dark:hover:border-slate-600',
    indigo: value 
      ? 'border-indigo-500 bg-indigo-50/70 text-indigo-900 font-semibold dark:bg-indigo-950/70 dark:border-indigo-500 dark:text-indigo-200' 
      : 'border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-neutral-800 dark:text-neutral-200 hover:border-neutral-400 dark:hover:border-slate-600',
    emerald: value 
      ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 font-semibold dark:bg-emerald-950/70 dark:border-emerald-500 dark:text-emerald-200' 
      : 'border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-neutral-800 dark:text-neutral-200 hover:border-neutral-400 dark:hover:border-slate-600',
    amber: value 
      ? 'border-amber-500 bg-amber-50/70 text-amber-900 font-semibold dark:bg-amber-950/70 dark:border-amber-500 dark:text-amber-200' 
      : 'border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-neutral-800 dark:text-neutral-200 hover:border-neutral-400 dark:hover:border-slate-600',
    purple: value 
      ? 'border-purple-500 bg-purple-50/70 text-purple-900 font-semibold dark:bg-purple-950/70 dark:border-purple-500 dark:text-purple-200' 
      : 'border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-neutral-800 dark:text-neutral-200 hover:border-neutral-400 dark:hover:border-slate-600',
    teal: value 
      ? 'border-teal-500 bg-teal-50/70 text-teal-900 font-semibold dark:bg-teal-950/70 dark:border-teal-500 dark:text-teal-200' 
      : 'border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-neutral-800 dark:text-neutral-200 hover:border-neutral-400 dark:hover:border-slate-600',
  };

  return (
    <div className="flex flex-col space-y-1 w-fit shrink-0">
      <div className="flex items-center justify-between gap-1.5 px-0.5">
        <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 flex items-center gap-1 whitespace-nowrap">
          {icon}
          <span>{label}</span>
        </label>
        {value && onClear && (
          <button 
            type="button"
            onClick={onClear}
            className="text-[10px] text-neutral-400 hover:text-rose-500 dark:hover:text-rose-400 font-medium cursor-pointer"
            title={`Clear ${label}`}
          >
            Clear
          </button>
        )}
      </div>

      {/* Sizer container that sets the field width strictly to match its placeholder text */}
      <div className="relative inline-flex items-center w-fit">
        {/* Invisible measurement element that establishes container width based strictly on the placeholder text */}
        <span 
          aria-hidden="true" 
          className="invisible whitespace-nowrap pl-3 pr-7 py-1.5 text-xs font-medium select-none pointer-events-none"
        >
          {placeholder}
        </span>

        {/* Real select element positioned absolutely to fit container width exactly */}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`absolute inset-0 w-full h-full pl-3 pr-7 py-1.5 text-xs rounded-lg border appearance-none transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium truncate ${themeClasses[theme]}`}
        >
          <option value="">{placeholder}</option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Dropdown Chevron */}
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
      </div>
    </div>
  );
}

export default function Complaints({ onSelectComplaint }: { onSelectComplaint?: (id: string) => void }) {
  const { complaints, readers, publicBodies, getReaderForComplaint } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter States
  const [selectedComplainant, setSelectedComplainant] = useState('');
  const [selectedPublicBody, setSelectedPublicBody] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedReader, setSelectedReader] = useState('');
  const [selectedLastOrder, setSelectedLastOrder] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(true);

  // Helpers to resolve complaint division & district (with public body fallback)
  const getComplaintDivision = (c: ComplaintData): string => {
    if (c.division && c.division.trim()) return c.division.trim();
    if (c.respondentName) {
      const pb = publicBodies.find(p => p.name.toLowerCase() === c.respondentName.toLowerCase());
      if (pb?.division && pb.division.trim()) return pb.division.trim();
    }
    return '';
  };

  const getComplaintDistrict = (c: ComplaintData): string => {
    if (c.district && c.district.trim()) return c.district.trim();
    if (c.respondentName) {
      const pb = publicBodies.find(p => p.name.toLowerCase() === c.respondentName.toLowerCase());
      if (pb?.district && pb.district.trim()) return pb.district.trim();
    }
    return '';
  };

  // Derive unique options with counts for each of the 6 filters
  // 1. Complainant Names
  const complainantOptions = useMemo(() => {
    const counts = new Map<string, number>();
    complaints.forEach(c => {
      const name = (c.complainantName || '').trim();
      if (name) {
        counts.set(name, (counts.get(name) || 0) + 1);
      }
    });
    return Array.from(counts.entries())
      .map(([name, count]) => ({ value: name, label: `${name} (${count})`, raw: name }))
      .sort((a, b) => a.raw.localeCompare(b.raw));
  }, [complaints]);

  // 2. Public Body / Department Names
  const publicBodyOptions = useMemo(() => {
    const counts = new Map<string, number>();
    complaints.forEach(c => {
      const name = (c.respondentName || '').trim();
      if (name) {
        counts.set(name, (counts.get(name) || 0) + 1);
      }
    });
    return Array.from(counts.entries())
      .map(([name, count]) => ({ value: name, label: `${name} (${count})`, raw: name }))
      .sort((a, b) => a.raw.localeCompare(b.raw));
  }, [complaints]);

  // 3. Division Names
  const divisionOptions = useMemo(() => {
    const counts = new Map<string, number>();
    complaints.forEach(c => {
      const div = getComplaintDivision(c);
      if (div) {
        counts.set(div, (counts.get(div) || 0) + 1);
      }
    });
    return Array.from(counts.entries())
      .map(([div, count]) => ({ value: div, label: `${div} (${count})`, raw: div }))
      .sort((a, b) => a.raw.localeCompare(b.raw));
  }, [complaints, publicBodies]);

  // 4. District Names (filtered by selected division if one is picked)
  const districtOptions = useMemo(() => {
    const counts = new Map<string, number>();
    complaints.forEach(c => {
      const compDiv = getComplaintDivision(c);
      if (selectedDivision && compDiv.toLowerCase() !== selectedDivision.toLowerCase()) {
        return;
      }
      const dist = getComplaintDistrict(c);
      if (dist) {
        counts.set(dist, (counts.get(dist) || 0) + 1);
      }
    });
    return Array.from(counts.entries())
      .map(([dist, count]) => ({ value: dist, label: `${dist} (${count})`, raw: dist }))
      .sort((a, b) => a.raw.localeCompare(b.raw));
  }, [complaints, publicBodies, selectedDivision]);

  // 5. Reader Options (Reader I / II / III)
  const readerOptions = useMemo(() => {
    const counts = new Map<string, number>();
    
    // Seed standard readers so they are readily available
    ['Reader I', 'Reader II', 'Reader III'].forEach(r => counts.set(r, 0));
    readers.forEach(r => {
      if (!counts.has(r.name)) counts.set(r.name, 0);
    });

    complaints.forEach(c => {
      const reader = getReaderForComplaint(c);
      if (reader && reader !== 'Unassigned') {
        counts.set(reader, (counts.get(reader) || 0) + 1);
      }
    });

    return Array.from(counts.entries())
      .map(([reader, count]) => ({ value: reader, label: `${reader} (${count})`, raw: reader }))
      .sort((a, b) => a.raw.localeCompare(b.raw));
  }, [complaints, readers, getReaderForComplaint]);

  // 6. Last Order / Current Stage
  const lastOrderOptions = useMemo(() => {
    const counts = new Map<string, number>();
    complaints.forEach(c => {
      const orderTitle = getComplaintCurrentStage(c).trim();
      if (orderTitle) {
        counts.set(orderTitle, (counts.get(orderTitle) || 0) + 1);
      }
    });
    return Array.from(counts.entries())
      .map(([title, count]) => ({ value: title, label: `${title} (${count})`, raw: title }))
      .sort((a, b) => a.raw.localeCompare(b.raw));
  }, [complaints]);

  // Count active filters
  const activeFiltersCount = [
    selectedComplainant,
    selectedPublicBody,
    selectedDivision,
    selectedDistrict,
    selectedReader,
    selectedLastOrder
  ].filter(Boolean).length;

  const handleResetFilters = () => {
    setSelectedComplainant('');
    setSelectedPublicBody('');
    setSelectedDivision('');
    setSelectedDistrict('');
    setSelectedReader('');
    setSelectedLastOrder('');
    setSearchTerm('');
  };

  // Main filtered complaints list
  const filteredComplaints = useMemo(() => {
    return complaints.filter(complaint => {
      // 1. Complainant Name filter
      if (selectedComplainant && complaint.complainantName.trim().toLowerCase() !== selectedComplainant.trim().toLowerCase()) {
        return false;
      }

      // 2. Public Body / Department filter
      if (selectedPublicBody && complaint.respondentName.trim().toLowerCase() !== selectedPublicBody.trim().toLowerCase()) {
        return false;
      }

      // 3. Division Name filter
      if (selectedDivision) {
        const div = getComplaintDivision(complaint);
        if (div.toLowerCase() !== selectedDivision.toLowerCase()) {
          return false;
        }
      }

      // 4. District Name filter
      if (selectedDistrict) {
        const dist = getComplaintDistrict(complaint);
        if (dist.toLowerCase() !== selectedDistrict.toLowerCase()) {
          return false;
        }
      }

      // 5. Reader (Reader I / II / III) filter
      if (selectedReader) {
        const reader = getReaderForComplaint(complaint);
        if (reader.toLowerCase() !== selectedReader.toLowerCase()) {
          return false;
        }
      }

      // 6. Last Order filter
      if (selectedLastOrder) {
        const lastOrder = getComplaintCurrentStage(complaint);
        if (lastOrder.toLowerCase() !== selectedLastOrder.toLowerCase()) {
          return false;
        }
      }

      // General search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesSearch = (
          complaint.complaintNo.toLowerCase().includes(term) ||
          complaint.complainantName.toLowerCase().includes(term) ||
          complaint.respondentName.toLowerCase().includes(term) ||
          (complaint.designatedOfficialName || '').toLowerCase().includes(term) ||
          (complaint.district || '').toLowerCase().includes(term) ||
          (complaint.division || '').toLowerCase().includes(term) ||
          (complaint.remarks || '').toLowerCase().includes(term) ||
          getComplaintCurrentStage(complaint).toLowerCase().includes(term) ||
          getReaderForComplaint(complaint).toLowerCase().includes(term)
        );
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [
    complaints, 
    selectedComplainant, 
    selectedPublicBody, 
    selectedDivision, 
    selectedDistrict, 
    selectedReader, 
    selectedLastOrder, 
    searchTerm, 
    publicBodies, 
    getReaderForComplaint
  ]);

  if (isAdding) {
    return <ComplaintForm onBack={() => setIsAdding(false)} />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Complaints List</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
              {complaints.length} Total
            </span>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-300 mt-1">
            Filter, manage, and track all registered RTI complaints and hearings.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          {/* Quick Search */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search by keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-8 py-2 w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Toggle Filter Panel Button */}
          <button
            onClick={() => setIsFilterOpen(prev => !prev)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium text-sm transition-colors border shadow-xs cursor-pointer ${
              activeFiltersCount > 0 
                ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700/60' 
                : 'bg-white dark:bg-slate-900 text-neutral-700 dark:text-neutral-200 border-neutral-300 dark:border-slate-700 hover:bg-neutral-50 dark:hover:bg-slate-800'
            }`}
            title="Toggle filter controls"
          >
            <SlidersHorizontal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
            {isFilterOpen ? (
              <ChevronUp className="w-3.5 h-3.5 ml-0.5 text-neutral-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 ml-0.5 text-neutral-400" />
            )}
          </button>

          {/* Add Complaint Button */}
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Complaint</span>
          </button>
        </div>
      </div>

      {/* Filter Section Box */}
      {isFilterOpen && (
        <div className="bg-white dark:bg-slate-900/95 border border-neutral-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs transition-all space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                Filter Complaints By Criteria
              </span>
              {activeFiltersCount > 0 && (
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  ({activeFiltersCount} active {activeFiltersCount === 1 ? 'filter' : 'filters'})
                </span>
              )}
            </div>

            {activeFiltersCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 font-medium cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Filters</span>
              </button>
            )}
          </div>

          {/* 6 Filter Dropdowns - Width sized dynamically according to respective placeholder text */}
          <div className="flex flex-wrap items-end gap-3">
            {/* 1. Complainant Name */}
            <FilterSelect
              label="Complainant"
              icon={<User className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
              value={selectedComplainant}
              onChange={setSelectedComplainant}
              onClear={() => setSelectedComplainant('')}
              options={complainantOptions}
              placeholder={`All Complaints (${complaints.length})`}
              theme="blue"
            />

            {/* 2. Public Body / Department Name */}
            <FilterSelect
              label="Public Body"
              icon={<Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />}
              value={selectedPublicBody}
              onChange={setSelectedPublicBody}
              onClear={() => setSelectedPublicBody('')}
              options={publicBodyOptions}
              placeholder={`All Public Bodies (${publicBodyOptions.length})`}
              theme="indigo"
            />

            {/* 3. Division Name */}
            <FilterSelect
              label="Division"
              icon={<MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
              value={selectedDivision}
              onChange={(val) => {
                setSelectedDivision(val);
                setSelectedDistrict('');
              }}
              onClear={() => {
                setSelectedDivision('');
                setSelectedDistrict('');
              }}
              options={divisionOptions}
              placeholder={`All Division (${divisionOptions.length})`}
              theme="emerald"
            />

            {/* 4. District Name */}
            <FilterSelect
              label="District"
              icon={<MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
              value={selectedDistrict}
              onChange={setSelectedDistrict}
              onClear={() => setSelectedDistrict('')}
              options={districtOptions}
              placeholder={`All Districts (${districtOptions.length})`}
              theme="amber"
            />

            {/* 5. Reader (Reader I / II / III in dropdown, placeholder is 'All Readers') */}
            <FilterSelect
              label="Reader"
              icon={<Scale className="w-3.5 h-3.5 text-purple-500 shrink-0" />}
              value={selectedReader}
              onChange={setSelectedReader}
              onClear={() => setSelectedReader('')}
              options={readerOptions}
              placeholder="All Readers"
              theme="purple"
            />

            {/* 6. Last Order */}
            <FilterSelect
              label="Last Order"
              icon={<FileText className="w-3.5 h-3.5 text-teal-500 shrink-0" />}
              value={selectedLastOrder}
              onChange={setSelectedLastOrder}
              onClear={() => setSelectedLastOrder('')}
              options={lastOrderOptions}
              placeholder={`All last orders (${lastOrderOptions.length})`}
              theme="teal"
            />
          </div>

          {/* Active Filter Chips Bar */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-neutral-100 dark:border-slate-800/80 text-xs">
              <span className="text-neutral-500 dark:text-neutral-400 font-medium">Applied:</span>
              
              {selectedComplainant && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  <User className="w-3 h-3 text-blue-500" />
                  <span className="font-semibold">Complainant:</span> {selectedComplainant}
                  <button 
                    onClick={() => setSelectedComplainant('')} 
                    className="hover:text-blue-900 dark:hover:text-white ml-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedPublicBody && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  <Building2 className="w-3 h-3 text-indigo-500" />
                  <span className="font-semibold">Public Body:</span> {selectedPublicBody}
                  <button 
                    onClick={() => setSelectedPublicBody('')} 
                    className="hover:text-indigo-900 dark:hover:text-white ml-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedDivision && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <MapPin className="w-3 h-3 text-emerald-500" />
                  <span className="font-semibold">Division:</span> {selectedDivision}
                  <button 
                    onClick={() => {
                      setSelectedDivision('');
                      setSelectedDistrict('');
                    }} 
                    className="hover:text-emerald-900 dark:hover:text-white ml-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedDistrict && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  <MapPin className="w-3 h-3 text-amber-500" />
                  <span className="font-semibold">District:</span> {selectedDistrict}
                  <button 
                    onClick={() => setSelectedDistrict('')} 
                    className="hover:text-amber-900 dark:hover:text-white ml-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedReader && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  <Scale className="w-3 h-3 text-purple-500" />
                  <span className="font-semibold">Reader:</span> {selectedReader}
                  <button 
                    onClick={() => setSelectedReader('')} 
                    className="hover:text-purple-900 dark:hover:text-white ml-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedLastOrder && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  <FileText className="w-3 h-3 text-teal-500" />
                  <span className="font-semibold">Last Order:</span> {selectedLastOrder}
                  <button 
                    onClick={() => setSelectedLastOrder('')} 
                    className="hover:text-teal-900 dark:hover:text-white ml-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                onClick={handleResetFilters}
                className="text-xs text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white underline cursor-pointer ml-auto"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white dark:bg-gradient-to-b dark:from-slate-900/95 dark:to-blue-950/30 border border-neutral-200 dark:border-blue-900/50 rounded-lg shadow-sm overflow-hidden flex flex-col min-h-[480px]">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm text-neutral-600 dark:text-neutral-200 min-w-[1200px]">
            <thead className="bg-neutral-50 dark:bg-slate-800/90 border-b border-neutral-200 dark:border-blue-900/40 text-neutral-900 dark:text-white sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 font-medium text-center w-16">Sr. No.</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Complaint No.</th>
                <th className="px-4 py-3 font-medium min-w-[170px]">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-500" />
                    <span>Complainant Name</span>
                  </div>
                </th>
                <th className="px-4 py-3 font-medium min-w-[260px]">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Public Body / Respondent</span>
                  </div>
                </th>
                <th className="px-4 py-3 font-medium min-w-[140px]">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" />
                    <span>Location (Dist / Div)</span>
                  </div>
                </th>
                <th className="px-4 py-3 font-medium min-w-[120px]">
                  <div className="flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-purple-500" />
                    <span>Reader</span>
                  </div>
                </th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Previous Hearing</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Next Hearing</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap" title="Most recent notice/order or whatever issued">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-teal-500" />
                    <span>Current Stage (Last Order)</span>
                  </div>
                </th>
                <th className="px-4 py-3 font-medium">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-slate-800/80">
              {filteredComplaints.length > 0 ? (
                filteredComplaints.map((complaint, index) => {
                  const currentStage = getComplaintCurrentStage(complaint);
                  const readerName = getReaderForComplaint(complaint);
                  const resolvedDistrict = getComplaintDistrict(complaint);
                  const resolvedDivision = getComplaintDivision(complaint);

                  return (
                    <tr 
                      key={complaint.complaintNo} 
                      onClick={() => onSelectComplaint && onSelectComplaint(complaint.complaintNo)}
                      className="hover:bg-neutral-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3 text-center dark:text-neutral-300 font-mono text-xs">{index + 1}</td>
                      <td className="px-4 py-3 font-medium text-neutral-900 dark:text-white whitespace-nowrap group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {complaint.complaintNo}
                      </td>
                      <td className="px-4 py-3 font-medium text-neutral-800 dark:text-white">
                        {complaint.complainantName}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-neutral-800 dark:text-white line-clamp-2">{complaint.respondentName}</div>
                        {complaint.designatedOfficialName && (
                          <div className="text-xs text-neutral-500 dark:text-neutral-300 mt-0.5">DO: {complaint.designatedOfficialName}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {resolvedDistrict || resolvedDivision ? (
                          <div>
                            {resolvedDistrict && (
                              <div className="font-medium text-neutral-800 dark:text-white flex items-center gap-1">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                                {resolvedDistrict}
                              </div>
                            )}
                            {resolvedDivision && (
                              <div className="text-[11px] text-neutral-500 dark:text-neutral-300 mt-0.5">
                                Div: <span className="font-medium text-neutral-700 dark:text-neutral-200">{resolvedDivision}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-neutral-400 dark:text-neutral-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-700 dark:text-neutral-200 font-medium">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                          {readerName}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap dark:text-neutral-300">{complaint.previousHearingDate || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-emerald-700 dark:text-emerald-400">{complaint.nextHearingDate || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span 
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/20 dark:bg-blue-950/80 dark:text-blue-300 dark:ring-blue-700/50" 
                          title={`Last Order / Current Stage: ${currentStage}`}
                        >
                          {currentStage}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs dark:text-neutral-300 max-w-[200px] truncate" title={complaint.remarks}>
                        {complaint.remarks}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="px-6 py-16 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-neutral-400 dark:text-neutral-500">
                        <Filter className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                        No complaints found
                      </h3>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        No complaints match your current filter and search criteria. Try adjusting or clearing your filters.
                      </p>
                      {(activeFiltersCount > 0 || searchTerm) && (
                        <button
                          onClick={handleResetFilters}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Clear all filters &amp; search</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer */}
        <div className="border-t border-neutral-200 dark:border-slate-800 bg-neutral-50 dark:bg-slate-900/90 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm text-neutral-500 dark:text-neutral-300 shrink-0">
          <div>
            Showing <span className="font-bold text-neutral-900 dark:text-white">{filteredComplaints.length}</span> of <span className="font-bold text-neutral-900 dark:text-white">{complaints.length}</span> complaints
            {activeFiltersCount > 0 && (
              <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 font-medium">
                ({activeFiltersCount} {activeFiltersCount === 1 ? 'filter' : 'filters'} active)
              </span>
            )}
          </div>
          {activeFiltersCount > 0 && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

