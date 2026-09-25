import React, { useState, useRef, useEffect } from 'react';
import { X, Printer, Edit3, FileText } from 'lucide-react';
import { ComplaintData, getSortedProceedings } from '../context/AppContext';

interface ComprehensiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  complaint: ComplaintData;
}

export function ComprehensiveReportModal({ isOpen, onClose, complaint }: ComprehensiveReportModalProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  
  // Set initial content when modal opens
  useEffect(() => {
    if (isOpen && editorRef.current && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = generateInitialReportHtml(complaint);
    }
  }, [isOpen, complaint]);

  if (!isOpen) return null;

  const handlePrint = () => {
    if (!editorRef.current) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to print.");
      return;
    }
    
    const content = editorRef.current.innerHTML;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Comprehensive Report - ${complaint.complaintNo}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #111; padding: 2rem; max-width: 900px; margin: 0 auto; }
            h1 { font-size: 1.75rem; margin-bottom: 0.5rem; text-align: center; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 1rem; }
            h2 { font-size: 1.25rem; margin-top: 2rem; margin-bottom: 1rem; border-bottom: 1px solid #ccc; padding-bottom: 0.25rem; }
            h3 { font-size: 1.1rem; margin-top: 1.5rem; margin-bottom: 0.5rem; }
            table { border-collapse: collapse; margin-bottom: 1.5rem; width: 100%; }
            th, td { border: 1px solid #ccc; padding: 0.5rem 0.75rem; text-align: left; }
            th { background-color: #f9f9f9; font-weight: 600; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem; }
            .meta-item { margin-bottom: 0.5rem; }
            .diary-entry { border-left: 3px solid #666; padding-left: 1rem; margin-bottom: 1rem; }
            @media print {
              body { padding: 0; max-width: 100%; }
              @page { margin: 2cm; }
            }
          </style>
        </head>
        <body>
          ${content}
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-neutral-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Comprehensive Case Report</h2>
              <p className="text-xs text-neutral-500">Edit the report directly below before printing.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-2 border-b border-neutral-200 bg-white flex items-center gap-2 shrink-0">
           <div className="text-xs text-neutral-500 flex items-center gap-1.5 flex-1">
             <Edit3 className="w-3.5 h-3.5" />
             Rich text editing enabled. Click anywhere in the document to edit or add details.
           </div>
           <button 
             onClick={handlePrint}
             className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors"
           >
             <Printer className="w-4 h-4" />
             Print Report
           </button>
        </div>

        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto bg-neutral-100 p-4 sm:p-8">
          <div className="max-w-4xl mx-auto bg-white shadow-sm border border-neutral-200 rounded-sm min-h-full">
            <div 
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              className="p-8 sm:p-12 outline-none max-w-none focus:ring-2 focus:ring-inset focus:ring-indigo-500/20 text-neutral-800 text-sm leading-relaxed"
              style={{ minHeight: '100%', fontFamily: 'system-ui, sans-serif' }}
            >
              {/* Content injected here via useEffect */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Function to generate the HTML
function generateInitialReportHtml(c: ComplaintData) {
  // Sort data properly
  const proceedings = getSortedProceedings(c.proceedings).reverse(); // chronological (oldest to newest)
  const attendance = [...(c.attendanceHistory || [])].sort((a, b) => a.srNo - b.srNo);
  const submissions = [...(c.submissions || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const diaries = [...(c.diaries || [])].sort((a, b) => a.srNo - b.srNo);
  
  // Collect unique hearing dates
  const uniqueHearingDates = new Set([
    ...attendance.map(a => a.date),
    ...diaries.map(d => d.date)
  ]);
  const totalHearings = uniqueHearingDates.size;

  return `
    <h1 style="text-align: center; font-size: 1.8rem; margin-bottom: 0.5rem; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 1rem;">
      COMPREHENSIVE CASE REPORT
    </h1>
    <p style="text-align: center; color: #555; margin-bottom: 2rem;">Generated on ${new Date().toLocaleDateString()}</p>
    
    <h2 style="font-size: 1.25rem; margin-top: 2rem; margin-bottom: 1rem; border-bottom: 1px solid #ccc; padding-bottom: 0.25rem;">1. Case Overview</h2>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
      <div><strong>Complaint No:</strong> ${c.complaintNo}</div>
      <div><strong>Current Stage:</strong> ${c.statusStage || 'Hearing in Progress'}</div>
      <div><strong>Complainant:</strong> ${c.complainantName}</div>
      <div><strong>Respondent:</strong> ${c.respondentName}</div>
      <div><strong>Public Body:</strong> ${c.district || c.division || 'N/A'}</div>
      <div><strong>Designated Official:</strong> ${c.designatedOfficialName || 'N/A'}</div>
      <div><strong>Total Hearing Dates Fixed:</strong> ${totalHearings}</div>
    </div>

    <h2 style="font-size: 1.25rem; margin-top: 2rem; margin-bottom: 1rem; border-bottom: 1px solid #ccc; padding-bottom: 0.25rem;">2. Attendance History</h2>
    ${attendance.length > 0 ? `
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 1.5rem;">
      <thead>
        <tr>
          <th style="border: 1px solid #ccc; padding: 8px; text-align: left; background: #f5f5f5;">Sr. No</th>
          <th style="border: 1px solid #ccc; padding: 8px; text-align: left; background: #f5f5f5;">Date</th>
          <th style="border: 1px solid #ccc; padding: 8px; text-align: left; background: #f5f5f5;">Complainant</th>
          <th style="border: 1px solid #ccc; padding: 8px; text-align: left; background: #f5f5f5;">Respondent</th>
        </tr>
      </thead>
      <tbody>
        ${attendance.map(a => `
        <tr>
          <td style="border: 1px solid #ccc; padding: 8px;">${a.srNo}</td>
          <td style="border: 1px solid #ccc; padding: 8px;">${a.date}</td>
          <td style="border: 1px solid #ccc; padding: 8px;">${a.complainant}</td>
          <td style="border: 1px solid #ccc; padding: 8px;">${a.respondent}</td>
        </tr>`).join('')}
      </tbody>
    </table>
    ` : '<p>No attendance records available.</p>'}

    <h2 style="font-size: 1.25rem; margin-top: 2rem; margin-bottom: 1rem; border-bottom: 1px solid #ccc; padding-bottom: 0.25rem;">3. Proceedings History</h2>
    ${proceedings.length > 0 ? `
    <ul style="list-style-type: none; padding-left: 0;">
      ${proceedings.map(p => `
        <li style="margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px dashed #eee;">
          <strong>Date:</strong> ${p.date} <br/>
          <strong>Title/Stage:</strong> ${p.title} <br/>
          ${p.attachment ? `<em>(Document Attached: ${p.attachment.name})</em>` : ''}
        </li>
      `).join('')}
    </ul>
    ` : '<p>No proceedings recorded.</p>'}

    <h2 style="font-size: 1.25rem; margin-top: 2rem; margin-bottom: 1rem; border-bottom: 1px solid #ccc; padding-bottom: 0.25rem;">4. Submissions & Remarks</h2>
    ${submissions.length > 0 ? `
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 1.5rem;">
      <thead>
        <tr>
          <th style="border: 1px solid #ccc; padding: 8px; text-align: left; background: #f5f5f5;">Date</th>
          <th style="border: 1px solid #ccc; padding: 8px; text-align: left; background: #f5f5f5;">Submitted By</th>
          <th style="border: 1px solid #ccc; padding: 8px; text-align: left; background: #f5f5f5;">Type</th>
          <th style="border: 1px solid #ccc; padding: 8px; text-align: left; background: #f5f5f5;">Remarks</th>
        </tr>
      </thead>
      <tbody>
        ${submissions.map(s => `
        <tr>
          <td style="border: 1px solid #ccc; padding: 8px; vertical-align: top;">${s.date}</td>
          <td style="border: 1px solid #ccc; padding: 8px; vertical-align: top;">${s.submittedBy}</td>
          <td style="border: 1px solid #ccc; padding: 8px; vertical-align: top;">${s.type}</td>
          <td style="border: 1px solid #ccc; padding: 8px; vertical-align: top;">${s.remarks}</td>
        </tr>`).join('')}
      </tbody>
    </table>
    ` : '<p>No submissions recorded.</p>'}

    <h2 style="font-size: 1.25rem; margin-top: 2rem; margin-bottom: 1rem; border-bottom: 1px solid #ccc; padding-bottom: 0.25rem;">5. Complete Case Diaries</h2>
    ${diaries.length > 0 ? `
    <div>
      ${diaries.map(d => `
        <div style="margin-bottom: 1.5rem; padding-left: 1rem; border-left: 4px solid #4f46e5;">
          <strong>Date:</strong> ${d.date} (Sr. No: ${d.srNo})<br/>
          <p style="white-space: pre-wrap; margin-top: 0.5rem; font-family: inherit;">${d.diary}</p>
        </div>
      `).join('')}
    </div>
    ` : '<p>No case diaries available.</p>'}
    
    <br/><br/>
    <p><em>End of Report. (You can type additional notes here before printing...)</em></p>
  `;
}
