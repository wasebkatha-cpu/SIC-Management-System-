import { ArrowLeft, Paperclip, FileText, Calendar, Users, Scale, Phone, Mail, FileWarning, Gavel, CheckCircle, BookOpen } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface ComplaintDetailsProps {
  complaintId: string;
  onBack: () => void;
}

export default function ComplaintDetails({ complaintId, onBack }: ComplaintDetailsProps) {
  const { complaints } = useAppContext();
  
  const complaint = complaints.find(c => c.complaintNo === complaintId);

  if (!complaint) {
    return (
      <div className="p-8 text-center">
        <p className="text-neutral-500 mb-4">Complaint not found.</p>
        <button onClick={onBack} className="text-blue-600 hover:underline">Go back</button>
      </div>
    );
  }

  const partiesName = `${complaint.complainantName} V/S ${complaint.respondentName}`;

  // Helper to map icon names to actual Lucide components dynamically
  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Phone': return Phone;
      case 'Mail': return Mail;
      case 'Gavel': return Gavel;
      case 'FileWarning': return FileWarning;
      case 'CheckCircle': return CheckCircle;
      default: return FileText;
    }
  };

  const getColors = (iconName?: string) => {
    switch (iconName) {
      case 'Phone': return { color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" };
      case 'Mail': return { color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" };
      case 'Gavel': return { color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" };
      case 'FileWarning': return { color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-100" };
      case 'CheckCircle': return { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" };
      default: return { color: "text-neutral-500", bg: "bg-neutral-100", border: "border-neutral-200" };
    }
  };

  return (
    <div className="p-8">
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Complaints List
      </button>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Complaint Details</h1>
          <p className="text-sm text-neutral-500 mt-1">Viewing details for {complaintId}</p>
        </div>
      </div>

      {/* Horizontal sections */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        
        {/* Case Information */}
        <div className="bg-white border border-neutral-200 rounded-lg shadow-sm flex flex-col h-full">
          <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-50 rounded-t-lg">
            <h2 className="font-medium text-neutral-900 flex items-center gap-2">
              <Scale className="w-4 h-4 text-neutral-500" />
              Case Information
            </h2>
          </div>
          <div className="p-5 flex-1 flex flex-col gap-4 text-sm">
            <div>
              <span className="block text-neutral-500 mb-1">Complaint No.</span>
              <span className="font-medium text-neutral-900">{complaint.complaintNo}</span>
            </div>
            <div>
              <span className="block text-neutral-500 mb-1">Parties Name</span>
              <span className="font-medium text-neutral-900 leading-snug">{partiesName}</span>
            </div>
            <div>
              <span className="block text-neutral-500 mb-1">Councilor/Advocate for the Complainant</span>
              <span className="text-neutral-900">{complaint.counselorComplainant}</span>
            </div>
            <div>
              <span className="block text-neutral-500 mb-1">Councilor/Advocate for the respondent</span>
              <span className="text-neutral-900">{complaint.counselorRespondent}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-100 mt-auto">
              <div>
                <span className="block text-neutral-500 mb-1">Previous Hearing Date</span>
                <span className="text-neutral-900 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-neutral-400"/>{complaint.previousHearingDate || '-'}
                </span>
              </div>
              <div>
                <span className="block text-neutral-500 mb-1">Next Hearing Date</span>
                <span className="text-neutral-900 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-neutral-400"/>{complaint.nextHearingDate || '-'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance History */}
        <div className="bg-white border border-neutral-200 rounded-lg shadow-sm flex flex-col h-full overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-50">
            <h2 className="font-medium text-neutral-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-neutral-500" />
              Attendance History
            </h2>
          </div>
          <div className="p-0 flex-1 overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-600 min-w-[400px]">
              <thead className="bg-white border-b border-neutral-100 text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium w-16 text-center">Sr. No.</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Hearing Date</th>
                  <th className="px-4 py-3 font-medium">Complainant</th>
                  <th className="px-4 py-3 font-medium">Respondent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {complaint.attendanceHistory.length > 0 ? (
                  complaint.attendanceHistory.map((record) => (
                    <tr key={record.srNo} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-4 py-3 text-center text-neutral-500">{record.srNo}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{record.date}</td>
                      <td className="px-4 py-3 leading-relaxed">{record.complainant}</td>
                      <td className="px-4 py-3 leading-relaxed">{record.respondent}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-neutral-400">No attendance records found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Proceeding History */}
        <div className="bg-white border border-neutral-200 rounded-lg shadow-sm flex flex-col h-full max-h-[600px]">
          <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-50 rounded-t-lg shrink-0">
            <h2 className="font-medium text-neutral-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-neutral-500" />
              Proceeding History
            </h2>
          </div>
          <div className="p-6 flex-1 overflow-y-auto">
            {complaint.proceedings.length > 0 ? (
              <div className="relative pl-7 border-l-2 border-neutral-100 space-y-6">
                {complaint.proceedings.map((proc, index) => {
                  const Icon = getIcon(proc.iconType);
                  const colors = getColors(proc.iconType);
                  
                  return (
                    <div key={index} className="relative group">
                      {/* Timeline Dot */}
                      <div className={`absolute -left-[45px] w-8 h-8 rounded-full ${colors.bg} border-4 border-white flex items-center justify-center ring-1 ring-inset ${colors.border}`}>
                        <Icon className={`w-3.5 h-3.5 ${colors.color}`} />
                      </div>
                      
                      {/* Content Card */}
                      <div className="bg-white border border-neutral-100 rounded-lg p-3.5 shadow-sm hover:shadow-md hover:border-neutral-200 transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-medium text-neutral-900">{proc.title}</h3>
                            <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1.5">
                              <Calendar className="w-3 h-3" />
                              {proc.date}
                            </p>
                          </div>
                          
                          <button className="self-start flex items-center gap-1.5 px-3 py-1.5 bg-neutral-50 hover:bg-blue-50 text-neutral-600 hover:text-blue-700 border border-neutral-200 hover:border-blue-200 rounded-md text-xs font-medium transition-colors shrink-0">
                            <Paperclip className="w-3.5 h-3.5" />
                            Attachment
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-neutral-400 text-center py-8">No proceedings found</p>
            )}
          </div>
        </div>

      </div>

      {/* Diary Section */}
      <div className="mt-6 bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-50">
          <h2 className="font-medium text-neutral-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-neutral-500" />
            Diary (Case Proceeding)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-600">
            <thead className="bg-white border-b border-neutral-100 text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium w-16 text-center">Sr. No.</th>
                <th className="px-4 py-3 font-medium">Diary</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap w-32">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {complaint.diaries.length > 0 ? (
                complaint.diaries.map((entry) => (
                  <tr key={entry.srNo} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-4 text-center text-neutral-500 align-top">{entry.srNo}</td>
                    <td className="px-4 py-4 leading-relaxed text-neutral-700 align-top">{entry.diary}</td>
                    <td className="px-4 py-4 whitespace-nowrap align-top">{entry.date}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-neutral-400">No diary entries found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
