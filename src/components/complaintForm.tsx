import { useState } from 'react';
import { ArrowLeft, Upload, Save } from 'lucide-react';

interface ComplaintFormProps {
  onBack: () => void;
}

export default function ComplaintForm({ onBack }: ComplaintFormProps) {
  const [firstAppMethod, setFirstAppMethod] = useState('');
  const [internalReviewMethod, setInternalReviewMethod] = useState('');

  const submitMethods = ['By Hand', 'By Courier', 'By Mail', 'By Web Portal'];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Complaints List
      </button>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-neutral-900">Complaint Registration</h1>
        <p className="text-sm text-neutral-500 mt-1">Fill out the details below to register a new complaint.</p>
      </div>

      <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
        {/* Complainant Information */}
        <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
            <h2 className="font-medium text-neutral-900">Complainant Information</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Complainant Name</label>
              <input type="text" className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Enter full name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Father's Name</label>
              <input type="text" className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Enter father's name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">CNIC No.</label>
              <input type="text" className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. 12345-1234567-1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">CNIC Attachment</label>
              <input type="file" className="block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-neutral-200 rounded-md cursor-pointer" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Contact No</label>
              <input type="tel" className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Enter contact number" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Mail Address</label>
              <input type="email" className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Enter email address" />
            </div>
          </div>
        </div>

        {/* Public Body Details */}
        <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
            <h2 className="font-medium text-neutral-900">Public Body Details</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-1">Public Body Name</label>
              <input type="text" className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Enter public body name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Designated Official Name</label>
              <input type="text" className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Enter official's name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Designation</label>
              <input type="text" className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Enter designation" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Contact No. of Designated Official</label>
              <input type="tel" className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Enter contact number" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Website</label>
              <input type="url" className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="https://" />
            </div>
          </div>
        </div>

        {/* First Application Details */}
        <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
            <h2 className="font-medium text-neutral-900">First Application Details</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">First Application Date</label>
                <input type="date" className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Submitted Through</label>
                <select 
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  value={firstAppMethod}
                  onChange={(e) => setFirstAppMethod(e.target.value)}
                >
                  <option value="">Select method...</option>
                  {submitMethods.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Conditional Uploads for First Application */}
            {firstAppMethod === 'By Hand' && (
              <div className="bg-blue-50/50 p-4 rounded-md border border-blue-100">
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Upload First Application Receipt
                </label>
                <p className="text-xs text-neutral-500 mb-3">Please upload the application containing signature, stamp, and date of the receipt by the Designated Official.</p>
                <input type="file" className="block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-white file:border-neutral-200 file:border file:text-neutral-700 hover:file:bg-neutral-50 border border-neutral-200 rounded-md cursor-pointer bg-white" />
              </div>
            )}
            {firstAppMethod === 'By Courier' && (
              <div className="bg-blue-50/50 p-4 rounded-md border border-blue-100">
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Upload Courier Receipt & Delivery Report
                </label>
                <p className="text-xs text-neutral-500 mb-3">Please upload the courier receipt along with the delivery report.</p>
                <input type="file" className="block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-white file:border-neutral-200 file:border file:text-neutral-700 hover:file:bg-neutral-50 border border-neutral-200 rounded-md cursor-pointer bg-white" />
              </div>
            )}
          </div>
        </div>

        {/* Internal Review Details */}
        <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
            <h2 className="font-medium text-neutral-900">Internal Review Details</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Internal Review Application Dated</label>
                <input type="date" className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Submitted Through</label>
                <select 
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  value={internalReviewMethod}
                  onChange={(e) => setInternalReviewMethod(e.target.value)}
                >
                  <option value="">Select method...</option>
                  {submitMethods.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Conditional Uploads for Internal Review */}
            {internalReviewMethod === 'By Hand' && (
              <div className="bg-amber-50/50 p-4 rounded-md border border-amber-100">
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Upload Internal Review Receipt
                </label>
                <p className="text-xs text-neutral-500 mb-3">Please upload the application containing signature, stamp, and date of the receipt by the Head of the Department.</p>
                <input type="file" className="block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-white file:border-neutral-200 file:border file:text-neutral-700 hover:file:bg-neutral-50 border border-neutral-200 rounded-md cursor-pointer bg-white" />
              </div>
            )}
            {internalReviewMethod === 'By Courier' && (
              <div className="bg-amber-50/50 p-4 rounded-md border border-amber-100">
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Upload Courier Receipt & Delivery Report
                </label>
                <p className="text-xs text-neutral-500 mb-3">Please upload the courier receipt along with the delivery report for the internal review.</p>
                <input type="file" className="block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-white file:border-neutral-200 file:border file:text-neutral-700 hover:file:bg-neutral-50 border border-neutral-200 rounded-md cursor-pointer bg-white" />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <Save className="w-4 h-4" />
            Submit Complaint
          </button>
        </div>
      </form>
    </div>
  );
}
