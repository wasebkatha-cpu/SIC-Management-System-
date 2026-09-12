import { useState } from 'react';
import { Eye, X } from 'lucide-react';
import CauseListProceeding from './causeListProceeding';
import { useAppContext, ComplaintData } from '../context/AppContext';

interface CauseListSummary {
  srNo: number;
  date: string;
  callReport: number;
  firstNotice: number;
  finalNotice: number;
  order: number;
  adjournment: number;
}

const mockSummaryList: CauseListSummary[] = [
  { srNo: 1, date: '14-09-2026', callReport: 5, firstNotice: 12, finalNotice: 8, order: 3, adjournment: 2 },
  { srNo: 2, date: '15-09-2026', callReport: 2, firstNotice: 8, finalNotice: 4, order: 1, adjournment: 1 },
  { srNo: 3, date: '16-09-2026', callReport: 7, firstNotice: 15, finalNotice: 10, order: 5, adjournment: 0 },
];

export default function CauseList() {
  const { complaints } = useAppContext();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintData | null>(null);

  const handleCloseModal = () => {
    setSelectedDate(null);
    setSelectedComplaint(null);
  };

  // Filter complaints based on the selected nextHearingDate
  const complaintsForSelectedDate = complaints.filter(
    (c) => c.nextHearingDate === selectedDate
  );

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Cause List</h1>
          <p className="text-sm text-neutral-500 mt-1">View the daily summary of hearings and proceedings.</p>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-600">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-900">
              <tr>
                <th className="px-4 py-3 font-medium text-center w-16">Sr. No.</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Date</th>
                <th className="px-4 py-3 font-medium text-center">Call Report</th>
                <th className="px-4 py-3 font-medium text-center">First Notice</th>
                <th className="px-4 py-3 font-medium text-center">Final Notice</th>
                <th className="px-4 py-3 font-medium text-center">Order</th>
                <th className="px-4 py-3 font-medium text-center">Adjournment</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {mockSummaryList.map((item) => (
                <tr key={item.srNo} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-4 py-4 text-center">{item.srNo}</td>
                  <td className="px-4 py-4 font-medium text-neutral-900">{item.date}</td>
                  <td className="px-4 py-4 text-center">{item.callReport}</td>
                  <td className="px-4 py-4 text-center">{item.firstNotice}</td>
                  <td className="px-4 py-4 text-center">{item.finalNotice}</td>
                  <td className="px-4 py-4 text-center">{item.order}</td>
                  <td className="px-4 py-4 text-center">{item.adjournment}</td>
                  <td className="px-4 py-4 text-right">
                    <button
                      onClick={() => setSelectedDate(item.date)}
                      className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium text-xs bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Click to View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cause List Detail Modal */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-neutral-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            
            {selectedComplaint ? (
              <CauseListProceeding 
                complaintNo={selectedComplaint.complaintNo}
                parties={`${selectedComplaint.complainantName} V/S ${selectedComplaint.respondentName}`}
                hearingDate={selectedDate}
                onBack={() => setSelectedComplaint(null)}
              />
            ) : (
              <>
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50 shrink-0">
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-900">Detailed Cause List</h2>
                    <p className="text-sm text-neutral-500">Showing proceedings scheduled for {selectedDate}</p>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-200 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body / Table */}
                <div className="flex-1 overflow-auto p-6">
                  <div className="border border-neutral-200 rounded-lg overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm text-neutral-600">
                      <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-900">
                        <tr>
                          <th className="px-4 py-3 font-medium text-center w-16">Sr. No.</th>
                          <th className="px-4 py-3 font-medium whitespace-nowrap">Complaint No.</th>
                          <th className="px-4 py-3 font-medium min-w-[300px]">Parties (Complainant Name vs Public Body Name)</th>
                          <th className="px-4 py-3 font-medium whitespace-nowrap">Stage/Status</th>
                          <th className="px-4 py-3 font-medium whitespace-nowrap">Reader (I, II, III)</th>
                          <th className="px-4 py-3 font-medium">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200">
                        {complaintsForSelectedDate.length > 0 ? (
                          complaintsForSelectedDate.map((c, index) => (
                            <tr 
                              key={c.complaintNo} 
                              onClick={() => setSelectedComplaint(c)}
                              className="hover:bg-blue-50 transition-colors cursor-pointer group"
                              title="Click to add attendance and proceeding details"
                            >
                              <td className="px-4 py-3 text-center align-top">{index + 1}</td>
                              <td className="px-4 py-3 font-medium text-blue-600 group-hover:text-blue-800 whitespace-nowrap align-top">{c.complaintNo}</td>
                              <td className="px-4 py-3 leading-relaxed align-top">
                                {c.complainantName} V/S {c.respondentName}
                              </td>
                              <td className="px-4 py-3 align-top">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/10 group-hover:bg-blue-100">
                                  {c.statusStage}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap align-top text-neutral-700">{c.reader}</td>
                              <td className="px-4 py-3 align-top">{c.remarks}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-neutral-400">
                              No complaints scheduled for this date.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50 flex justify-end shrink-0">
                  <button
                    onClick={handleCloseModal}
                    className="px-5 py-2.5 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md hover:bg-neutral-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
            
          </div>
        </div>
      )}
    </div>
  );
}
