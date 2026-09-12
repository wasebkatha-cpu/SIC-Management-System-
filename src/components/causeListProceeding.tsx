import { ArrowLeft, Save, Plus, Eye, BookOpen, FileText, Users, X } from 'lucide-react';
import { useState } from 'react';
import { useAppContext } from '../context/AppContext';

interface CauseListProceedingProps {
  complaintNo: string;
  parties: string;
  hearingDate: string;
  onBack: () => void;
}

export default function CauseListProceeding({ complaintNo, parties, hearingDate, onBack }: CauseListProceedingProps) {
  const { complaints, addAttendance, addProceeding, addDiary } = useAppContext();
  
  const complaint = complaints.find(c => c.complaintNo === complaintNo);
  
  const [complainantAttendance, setComplainantAttendance] = useState('');
  const [respondentAttendance, setRespondentAttendance] = useState('');
  
  const [isAddingProceeding, setIsAddingProceeding] = useState(false);
  const [newProceedingTitle, setNewProceedingTitle] = useState('');

  const [isAddingDiary, setIsAddingDiary] = useState(false);
  const [newDiaryEntry, setNewDiaryEntry] = useState('');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  
  if (!complaint) return null;

  const handleSaveAttendance = () => {
    if (complainantAttendance.trim() || respondentAttendance.trim()) {
      addAttendance(complaintNo, hearingDate, complainantAttendance, respondentAttendance);
      setComplainantAttendance('');
      setRespondentAttendance('');
      setSaveSuccessMessage("Attendance saved successfully!");
      setTimeout(() => setSaveSuccessMessage(null), 3000);
    }
  };

  const handleSaveProceeding = () => {
    if (newProceedingTitle.trim()) {
      addProceeding(complaintNo, hearingDate, newProceedingTitle);
      setNewProceedingTitle('');
      setIsAddingProceeding(false);
    }
  };

  const handleSaveDiary = () => {
    if (newDiaryEntry.trim()) {
      addDiary(complaintNo, hearingDate, newDiaryEntry);
      setNewDiaryEntry('');
      setIsAddingDiary(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-50 overflow-hidden rounded-xl">
      {/* Header */}
      <div className="px-6 py-4 border-b border-neutral-200 bg-white flex items-center shrink-0">
        <button
          onClick={onBack}
          className="mr-4 p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-300"
          title="Back to detailed cause list"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Manage Hearing: {complaintNo}</h2>
          <p className="text-sm text-neutral-500 line-clamp-1">{parties}</p>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        
        {/* Section 1: Attendance Form */}
        <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-50/50 flex items-center justify-between">
            <h3 className="font-medium text-neutral-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-neutral-500" />
              Update Attendance
            </h3>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Complainant / Advocate / Representative
              </label>
              <textarea 
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[80px]" 
                placeholder="Enter attendance details..."
                value={complainantAttendance}
                onChange={(e) => setComplainantAttendance(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Respondent Public Body / Representative / Advocate / Designated Officials
              </label>
              <textarea 
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[80px]" 
                placeholder="Enter attendance details..."
                value={respondentAttendance}
                onChange={(e) => setRespondentAttendance(e.target.value)}
              />
            </div>
          </div>
          <div className="px-5 py-3 border-t border-neutral-100 bg-neutral-50 flex items-center justify-between">
            {saveSuccessMessage ? (
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                {saveSuccessMessage}
              </span>
            ) : <div />}
            <button 
              onClick={handleSaveAttendance}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Attendance
            </button>
          </div>
        </div>

        {/* Section 2: Proceeding History */}
        <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-50/50 flex items-center justify-between">
            <h3 className="font-medium text-neutral-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-neutral-500" />
              Proceeding History
            </h3>
            {!isAddingProceeding && (
              <button 
                onClick={() => setIsAddingProceeding(true)}
                className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-sm font-medium bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Proceeding
              </button>
            )}
          </div>
          
          {isAddingProceeding && (
            <div className="p-5 border-b border-neutral-100 bg-blue-50/30">
              <div className="flex gap-3">
                <input 
                  type="text" 
                  value={newProceedingTitle}
                  onChange={(e) => setNewProceedingTitle(e.target.value)}
                  placeholder="Enter proceeding detail (e.g. Final Notice Issued)..."
                  className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
                <button 
                  onClick={handleSaveProceeding}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                >
                  Save
                </button>
                <button 
                  onClick={() => { setIsAddingProceeding(false); setNewProceedingTitle(''); }}
                  className="px-3 py-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-600">
              <thead className="bg-white border-b border-neutral-100 text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium w-16 text-center">Sr. No.</th>
                  <th className="px-4 py-3 font-medium">Notices/Orders Issued</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Issuance Date</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {complaint.proceedings.length > 0 ? (
                  complaint.proceedings.map((proc) => (
                    <tr key={proc.srNo} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-4 py-3 text-center text-neutral-500">{proc.srNo}</td>
                      <td className="px-4 py-3 text-neutral-900 font-medium">{proc.title}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{proc.date}</td>
                      <td className="px-4 py-3 text-right">
                        <button className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium text-xs bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors">
                          <Eye className="w-3.5 h-3.5" />
                          Click to view
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-neutral-400">No proceedings recorded</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Case Diary */}
        <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-50/50 flex items-center justify-between">
            <h3 className="font-medium text-neutral-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-neutral-500" />
              Case Diary
            </h3>
            {!isAddingDiary && (
              <button 
                onClick={() => setIsAddingDiary(true)}
                className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-sm font-medium bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Diary
              </button>
            )}
          </div>

          {isAddingDiary && (
            <div className="p-5 border-b border-neutral-100 bg-blue-50/30">
              <div className="flex gap-3 items-start">
                <textarea 
                  value={newDiaryEntry}
                  onChange={(e) => setNewDiaryEntry(e.target.value)}
                  placeholder="Enter case diary details..."
                  className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[80px]"
                  autoFocus
                />
                <div className="flex flex-col gap-2 shrink-0">
                  <button 
                    onClick={handleSaveDiary}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                  >
                    Save
                  </button>
                  <button 
                    onClick={() => { setIsAddingDiary(false); setNewDiaryEntry(''); }}
                    className="px-3 py-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

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
                    <td colSpan={3} className="px-4 py-8 text-center text-neutral-400">No diary entries recorded</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
