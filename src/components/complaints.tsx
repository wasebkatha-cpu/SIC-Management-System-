import { useState } from 'react';
import { Plus } from 'lucide-react';
import ComplaintForm from './complaintForm';
import { useAppContext } from '../context/AppContext';

export default function Complaints({ onSelectComplaint }: { onSelectComplaint?: (id: string) => void }) {
  const { complaints } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);

  if (isAdding) {
    return <ComplaintForm onBack={() => setIsAdding(false)} />;
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Complaints List</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage and track all registered complaints.</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-md font-medium text-sm transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Complaint
        </button>
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-600">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-900">
              <tr>
                <th className="px-4 py-3 font-medium text-center w-16">Sr. No.</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Complaint No.</th>
                <th className="px-4 py-3 font-medium min-w-[150px]">Complainant Name</th>
                <th className="px-4 py-3 font-medium min-w-[300px]">Respondent Name</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Previous Hearing</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Next Hearing</th>
                <th className="px-4 py-3 font-medium">Status/Stage</th>
                <th className="px-4 py-3 font-medium">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {complaints.map((complaint, index) => (
                <tr 
                  key={complaint.complaintNo} 
                  onClick={() => onSelectComplaint && onSelectComplaint(complaint.complaintNo)}
                  className="hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 text-center">{index + 1}</td>
                  <td className="px-4 py-3 font-medium text-neutral-900 whitespace-nowrap">{complaint.complaintNo}</td>
                  <td className="px-4 py-3">{complaint.complainantName}</td>
                  <td className="px-4 py-3">{complaint.respondentName}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{complaint.previousHearingDate || '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{complaint.nextHearingDate || '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/10">
                      {complaint.statusStage}
                    </span>
                  </td>
                  <td className="px-4 py-3">{complaint.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
