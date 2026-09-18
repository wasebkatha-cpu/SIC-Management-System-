import React from "react";
import { useState } from 'react';
import { Plus, User, MapPin, Trash2, Edit2, AlertCircle } from 'lucide-react';
import { useAppContext, ReaderData, SINDH_DIVISIONS } from '../context/AppContext';

export default function Reader() {
  const { readers, addReader, updateReader, deleteReader } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form State (arrays)
  const [name, setName] = useState('');
  const [actualName, setActualName] = useState('');
  const [selectedDivisions, setSelectedDivisions] = useState<string[]>([]);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);

  // Custom additions in the current session
  const [sessionCustomDivisions, setSessionCustomDivisions] = useState<string[]>([]);
  const [sessionCustomDistricts, setSessionCustomDistricts] = useState<string[]>([]);
  
  const [newDivisionInput, setNewDivisionInput] = useState('');
  const [newDistrictInput, setNewDistrictInput] = useState('');

  // Toggle division selection
  const toggleDivision = (div: string) => {
    setSelectedDivisions(prev => {
      const isSelected = prev.includes(div);
      const newDivisions = isSelected ? prev.filter(d => d !== div) : [...prev, div];
      
      // Auto-update districts based on new divisions
      let autoDistricts: string[] = [];
      newDivisions.forEach(d => {
        const matchKey = Object.keys(SINDH_DIVISIONS).find(k => k.toLowerCase() === d.toLowerCase());
        if (matchKey) {
          autoDistricts = [...autoDistricts, ...SINDH_DIVISIONS[matchKey as keyof typeof SINDH_DIVISIONS]];
        }
      });
      // Retain previously selected custom districts that are not in the static map
      const existingCustomDistricts = selectedDistricts.filter(dist => 
        !Object.values(SINDH_DIVISIONS).flat().some(staticDist => staticDist.toLowerCase() === dist.toLowerCase())
      );
      
      setSelectedDistricts([...Array.from(new Set([...autoDistricts, ...existingCustomDistricts]))]);
      
      return newDivisions;
    });
  };

  // Toggle district selection
  const toggleDistrict = (dist: string) => {
    setSelectedDistricts(prev =>
      prev.includes(dist) ? prev.filter(d => d !== dist) : [...prev, dist]
    );
  };

  const handleAddCustomDivision = () => {
    const trimmed = newDivisionInput.trim();
    if (trimmed && !displayedDivisions.some(d => d.toLowerCase() === trimmed.toLowerCase())) {
      setSessionCustomDivisions(prev => [...prev, trimmed]);
      setSelectedDivisions(prev => [...prev, trimmed]);
    }
    setNewDivisionInput('');
  };

  const handleAddCustomDistrict = () => {
    const trimmed = newDistrictInput.trim();
    if (trimmed && !displayedDistricts.some(d => d.toLowerCase() === trimmed.toLowerCase())) {
      setSessionCustomDistricts(prev => [...prev, trimmed]);
      setSelectedDistricts(prev => [...prev, trimmed]);
    }
    setNewDistrictInput('');
  };

  const handleEdit = (r: ReaderData) => {
    setEditingId(r.id);
    setName(r.name);
    setActualName(r.actualName || '');
    setSelectedDivisions(r.assignedDivisions);
    setSelectedDistricts(r.assignedDistricts);
    setError(null);
    setIsAdding(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setActualName('');
    setSelectedDivisions([]);
    setSelectedDistricts([]);
    setError(null);
    setIsAdding(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setError(null);

    // Conflict Validation: Ensure a division or district isn't already assigned to ANOTHER reader
    for (const reader of readers) {
      if (editingId && reader.id === editingId) continue; // Skip self

      const divConflict = selectedDivisions.find(d => 
        reader.assignedDivisions.some(existing => existing.toLowerCase() === d.toLowerCase())
      );
      if (divConflict) {
        setError(`Conflict: Division "${divConflict}" is already assigned to ${reader.name}.`);
        return;
      }

      const distConflict = selectedDistricts.find(d => 
        reader.assignedDistricts.some(existing => existing.toLowerCase() === d.toLowerCase())
      );
      if (distConflict) {
        setError(`Conflict: District "${distConflict}" is already assigned to ${reader.name}.`);
        return;
      }
    }

    if (editingId) {
      updateReader(editingId, { name, actualName, assignedDivisions: selectedDivisions, assignedDistricts: selectedDistricts });
    } else {
      addReader({ name, actualName, assignedDivisions: selectedDivisions, assignedDistricts: selectedDistricts });
    }
    resetForm();
  };

  // Calculate available static districts based on selected divisions
  const availableStaticDistricts = selectedDivisions.length > 0 
    ? selectedDivisions.flatMap(div => SINDH_DIVISIONS[div as keyof typeof SINDH_DIVISIONS] || [])
    : Object.values(SINDH_DIVISIONS).flat();

  const displayedDivisions = Array.from(new Set([
    ...Object.keys(SINDH_DIVISIONS),
    ...readers.flatMap(r => r.assignedDivisions),
    ...selectedDivisions,
    ...sessionCustomDivisions
  ]));

  const displayedDistricts = Array.from(new Set([
    ...availableStaticDistricts,
    ...readers.flatMap(r => r.assignedDistricts),
    ...selectedDistricts,
    ...sessionCustomDistricts
  ]));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Readers Configuration
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-300 mt-1">
            Manage readers and their assigned divisions or districts for automatic complaint allotment.
          </p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-md font-medium text-sm transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Reader
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            {editingId ? 'Edit Reader' : 'Add New Reader'}
          </h2>
          <form onSubmit={handleSave} className="space-y-4 max-w-2xl">
            {error && (
              <div className="bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 px-4 py-3 rounded-md text-sm flex items-start gap-2">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1">Reader Number/Designation</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Reader IV"
                  className="w-full rounded-md border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1">Actual Name (Optional)</label>
                <input
                  type="text"
                  value={actualName}
                  onChange={e => setActualName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full rounded-md border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-2">Assigned Division(s)</label>
                <div className="flex flex-wrap gap-2">
                  {displayedDivisions.map(div => (
                    <button
                      key={div}
                      type="button"
                      onClick={() => toggleDivision(div)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border cursor-pointer ${
                        selectedDivisions.includes(div)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-slate-800 text-neutral-700 dark:text-neutral-200 border-neutral-300 dark:border-slate-700 hover:bg-neutral-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      {div}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 mt-3 items-center">
                  <input 
                    type="text"
                    value={newDivisionInput}
                    onChange={(e) => setNewDivisionInput(e.target.value)}
                    onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleAddCustomDivision(); } }}
                    placeholder="Other division..."
                    className="w-48 rounded-md border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm text-neutral-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <button type="button" onClick={handleAddCustomDivision} className="text-blue-600 dark:text-blue-400 hover:text-blue-700 text-sm font-medium flex items-center gap-1 cursor-pointer">
                    <Plus className="w-4 h-4"/> Add Custom
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-2">
                  Assigned District(s) 
                  <span className="text-neutral-500 dark:text-neutral-400 font-normal ml-1">
                    ({selectedDivisions.length === 0 ? 'Select a division to see specific districts' : 'Click to toggle specific districts'})
                  </span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {displayedDistricts.length > 0 ? (
                    displayedDistricts.map(dist => (
                      <button
                        key={dist}
                        type="button"
                        onClick={() => toggleDistrict(dist)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border cursor-pointer ${
                          selectedDistricts.includes(dist)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white dark:bg-slate-800 text-neutral-700 dark:text-neutral-200 border-neutral-300 dark:border-slate-700 hover:bg-neutral-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        {dist}
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 italic">No districts available.</p>
                  )}
                </div>
                <div className="flex gap-2 mt-3 items-center">
                  <input 
                    type="text"
                    value={newDistrictInput}
                    onChange={(e) => setNewDistrictInput(e.target.value)}
                    onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleAddCustomDistrict(); } }}
                    placeholder="Other district..."
                    className="w-48 rounded-md border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm text-neutral-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <button type="button" onClick={handleAddCustomDistrict} className="text-blue-600 dark:text-blue-400 hover:text-blue-700 text-sm font-medium flex items-center gap-1 cursor-pointer">
                    <Plus className="w-4 h-4"/> Add Custom
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-slate-800">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm cursor-pointer"
              >
                {editingId ? 'Save Changes' : 'Create Reader'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {readers.map((reader, idx) => {
          // Multicolor dark palette for reader cards
          const colorStyles = [
            'dark:bg-slate-900/90 dark:border-slate-800 hover:dark:border-blue-700',
            'dark:bg-cyan-950/40 dark:border-cyan-900/60 hover:dark:border-cyan-600',
            'dark:bg-indigo-950/40 dark:border-indigo-900/60 hover:dark:border-indigo-600',
            'dark:bg-teal-950/40 dark:border-teal-900/60 hover:dark:border-teal-600',
            'dark:bg-purple-950/40 dark:border-purple-900/60 hover:dark:border-purple-600'
          ];
          const darkCardStyle = colorStyles[idx % colorStyles.length];

          return (
            <div key={reader.id} className={`bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex flex-col group transition-all ${darkCardStyle}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/80 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900 dark:text-white">{reader.name}</h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-300">{reader.actualName || 'System Reader'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 transition-opacity">
                  <button 
                    onClick={() => handleEdit(reader)}
                    className="p-1.5 text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded cursor-pointer"
                    title="Edit Reader"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => deleteReader(reader.id)}
                    className="p-1.5 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 rounded cursor-pointer"
                    title="Delete Reader"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 mt-2 pt-4 border-t border-neutral-100 dark:border-slate-800 flex-1">
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-neutral-400 dark:text-neutral-400 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <span className="text-neutral-500 dark:text-neutral-300">Divisions: </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {reader.assignedDivisions.length > 0 ? reader.assignedDivisions.map(d => (
                        <span key={d} className="px-2 py-0.5 bg-neutral-100 dark:bg-slate-800/90 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-slate-700 rounded-md text-xs font-medium">{d}</span>
                      )) : <span className="text-neutral-400 italic text-xs">None explicitly assigned</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm mt-3">
                  <MapPin className="w-4 h-4 text-neutral-400 dark:text-neutral-400 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <span className="text-neutral-500 dark:text-neutral-300">Districts: </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {reader.assignedDistricts.length > 0 ? reader.assignedDistricts.map(d => (
                        <span key={d} className="px-2 py-0.5 bg-neutral-100 dark:bg-slate-800/90 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-slate-700 rounded-md text-xs font-medium">{d}</span>
                      )) : <span className="text-neutral-400 italic text-xs">None explicitly assigned</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {readers.length === 0 && (
          <div className="col-span-full text-center py-12 text-neutral-500 dark:text-neutral-400 bg-white dark:bg-slate-900 border border-dashed border-neutral-300 dark:border-slate-700 rounded-xl">
            No readers configured. Click "Add Reader" to get started.
          </div>
        )}
      </div>
    </div>
  );
}
