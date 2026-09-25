import React from "react";
import { useState } from 'react';
import { X, Building2, User, Users, MapPin, Contact, FileText } from 'lucide-react';

type AddPublicBodyModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
};

export default function AddPublicBodyModal({ isOpen, onClose, onSave }: AddPublicBodyModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    headOfDepartmentName: '',
    headOfDepartmentDesignation: '',
    designatedOfficialName: '',
    designatedOfficialDesignation: '',
    district: '',
    division: '',
    reader: '',
    website: '',
    email: '',
    contactNumber: '',
    address: '',
    additionalFields: [] as { name: string; value: string }[]
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: `pb-${Date.now()}`,
      srNo: Math.floor(Math.random() * 100) + 10, // Mock ID for now
      ...formData
    });
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddCustomField = () => {
    setFormData(prev => ({
      ...prev,
      additionalFields: [...(prev.additionalFields || []), { name: '', value: '' }]
    }));
  };

  const handleCustomFieldChange = (index: number, field: 'name' | 'value', value: string) => {
    setFormData(prev => {
      const newFields = [...(prev.additionalFields || [])];
      newFields[index] = { ...newFields[index], [field]: value };
      return { ...prev, additionalFields: newFields };
    });
  };

  const handleRemoveCustomField = (index: number) => {
    setFormData(prev => {
      const newFields = [...(prev.additionalFields || [])];
      newFields.splice(index, 1);
      return { ...prev, additionalFields: newFields };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-neutral-900/50 dark:bg-black/75 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 transition-colors">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950/70 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Add New Public Body</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Register a new public body and its associated officials.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white dark:bg-neutral-900">
          <form id="add-public-body-form" onSubmit={handleSubmit} className="space-y-8">
            
            {/* Section: Public Body Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-2">
                <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Public Body Details
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Public Body Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Department of Health"
                    className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Section: Head of Department */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-2">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Head of Department (HOD)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    HOD Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="headOfDepartmentName"
                    required
                    value={formData.headOfDepartmentName}
                    onChange={handleChange}
                    placeholder="e.g. Mr. Ali Jan"
                    className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    HOD Designation <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="headOfDepartmentDesignation"
                    required
                    value={formData.headOfDepartmentDesignation}
                    onChange={handleChange}
                    placeholder="e.g. Secretary Health"
                    className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Section: Designated Official */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-2">
                <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Designated Official
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Official Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="designatedOfficialName"
                    required
                    value={formData.designatedOfficialName}
                    onChange={handleChange}
                    placeholder="e.g. Dr. Ayesha Khan"
                    className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Official Designation <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="designatedOfficialDesignation"
                    required
                    value={formData.designatedOfficialDesignation}
                    onChange={handleChange}
                    placeholder="e.g. Deputy Secretary"
                    className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Section: Location & Assignment */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-2">
                <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Location
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    District <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="district"
                    required
                    value={formData.district}
                    onChange={handleChange}
                    placeholder="e.g. Lahore"
                    className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Division <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="division"
                    required
                    value={formData.division}
                    onChange={handleChange}
                    placeholder="e.g. Lahore"
                    className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Section: Contact Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-2">
                <Contact className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    placeholder="e.g. 042-99200000"
                    className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. info@domain.gov.pk"
                    className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Website URL
                  </label>
                  <input
                    type="text"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="e.g. www.domain.gov.pk"
                    className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Physical Address <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Enter complete physical address"
                    className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Section: Additional Fields */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  Additional Fields
                </h3>
                <button
                  type="button"
                  onClick={handleAddCustomField}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium cursor-pointer"
                >
                  + Add Field
                </button>
              </div>
              
              {formData.additionalFields && formData.additionalFields.map((field, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Field Name (e.g. Fax)"
                      value={field.name}
                      onChange={(e) => handleCustomFieldChange(index, 'name', e.target.value)}
                      className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Value"
                      value={field.value}
                      onChange={(e) => handleCustomFieldChange(index, 'value', e.target.value)}
                      className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                     type="button"
                     onClick={() => handleRemoveCustomField(index)}
                     className="p-2 text-neutral-400 hover:text-rose-500 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                  >
                     <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-950 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded-md transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-public-body-form"
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors cursor-pointer shadow-sm"
          >
            Save Public Body
          </button>
        </div>

      </div>
    </div>
  );
}
