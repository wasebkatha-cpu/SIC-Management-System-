import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  Mail, 
  Phone, 
  CheckCircle2, 
  ExternalLink, 
  AlertCircle, 
  User, 
  Building2, 
  Clock, 
  FileText, 
  Copy, 
  Check, 
  MessageSquare,
  Sparkles,
  Share2,
  FileDown,
  Eye,
  Calendar,
  ShieldCheck,
  Download
} from 'lucide-react';
import { NoticeDraftRecord, recordDraftDispatch, formatWhatsAppNumber } from '../utils/draftStorage';
import { useAuth } from '../context/AuthContext';
import { useAppContext, toDisplayDateFormat } from '../context/AppContext';
import { 
  DraftPdfData, 
  downloadDraftNoticePdf, 
  getDraftNoticePdfDataUrl,
  getDraftNoticePdfBlob 
} from '../utils/draftPdfGenerator';

interface DraftDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  draft: NoticeDraftRecord | null;
  onDispatchRecorded?: () => void;
}

export default function DraftDispatchModal({
  isOpen,
  onClose,
  draft,
  onDispatchRecorded
}: DraftDispatchModalProps) {
  const { user, logActivity } = useAuth();
  const { complaints, publicBodies } = useAppContext();

  // Matched complaint record from system
  const matchedComplaint = draft 
    ? complaints.find(c => c.complaintNo.toLowerCase() === draft.complaintNo.toLowerCase()) 
    : null;

  // Complainant form state
  const [compEmail, setCompEmail] = useState('');
  const [compPhone, setCompPhone] = useState('');
  
  // Respondent / Designated Officer form state
  const [respEmail, setRespEmail] = useState('');
  const [respPhone, setRespPhone] = useState('');

  // Next hearing date state
  const [nextHearingDate, setNextHearingDate] = useState('');

  // Toast / status feedback
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [hasDownloadedPdf, setHasDownloadedPdf] = useState(false);

  useEffect(() => {
    if (draft) {
      setCompEmail(draft.complainant.email || '');
      setCompPhone(draft.complainant.contactNumber || '');
      setRespEmail(draft.respondent.email || '');
      setRespPhone(draft.respondent.contactNumber || '');
      setNextHearingDate(draft.nextHearingDate || matchedComplaint?.nextHearingDate || '');
      setHasDownloadedPdf(false);
    }
  }, [draft, matchedComplaint]);

  if (!isOpen || !draft) return null;

  // Resolved metadata required by user:
  // 1. Complaint No.
  const complaintNo = draft.complaintNo;

  // 2. Complainant name
  const complainantName = draft.complainant.name || matchedComplaint?.complainantName || 'Complainant';

  // 3. Respondent public body & designated official name
  const respondentDept = draft.respondent.department || matchedComplaint?.respondentName || 'Respondent Public Body';
  const designatedOfficerName = draft.respondent.officialName || matchedComplaint?.designatedOfficialName || '';
  const designatedOfficerDesignation = draft.respondent.designation || '';
  const designatedOfficerFull = designatedOfficerName 
    ? `${designatedOfficerName}${designatedOfficerDesignation ? ` (${designatedOfficerDesignation})` : ''}`
    : 'Designated Public Information Officer (PIO)';

  // 4. Next date of hearing
  const displayNextHearing = nextHearingDate 
    ? toDisplayDateFormat(nextHearingDate) 
    : (matchedComplaint?.nextHearingDate ? toDisplayDateFormat(matchedComplaint.nextHearingDate) : 'Not Yet Scheduled / To be Notified');

  // 5. PDF file details
  const cleanComplaintNo = draft.complaintNo.replace(/[^a-zA-Z0-9_-]/g, '_');
  const pdfFileName = `Notice_Draft_${cleanComplaintNo}.pdf`;

  // Construct PDF dataset
  const getPdfData = (): DraftPdfData => ({
    complaintNo: draft.complaintNo,
    complainantName: complainantName,
    respondentDept: respondentDept,
    designatedOfficialName: designatedOfficerName || (matchedComplaint?.designatedOfficialName || ''),
    designatedOfficialDesignation: designatedOfficerDesignation,
    nextHearingDate: nextHearingDate || matchedComplaint?.nextHearingDate || '',
    title: draft.title,
    category: draft.category,
    contentText: draft.contentText || '',
    createdAt: draft.createdAt,
    createdByName: draft.createdBy?.name || user?.name || 'Official',
    createdByRole: draft.createdBy?.role === 'superUser' ? 'SuperUser' : 'Admin'
  });

  // Action: Manual Download PDF
  const handleDownloadPdf = () => {
    downloadDraftNoticePdf(getPdfData());
    setHasDownloadedPdf(true);
    setSuccessToast(`Official PDF "${pdfFileName}" downloaded successfully!`);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Action: Preview PDF in new window/tab
  const handlePreviewPdf = () => {
    try {
      const dataUrl = getDraftNoticePdfDataUrl(getPdfData());
      const win = window.open();
      if (win) {
        win.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${pdfFileName} - Sindh Information Commission</title>
              <style>body { margin: 0; padding: 0; background: #525659; }</style>
            </head>
            <body>
              <iframe src="${dataUrl}" frameborder="0" style="width:100vw; height:100vh;" allowfullscreen></iframe>
            </body>
          </html>
        `);
        win.document.close();
      }
    } catch (e) {
      console.error('Error opening PDF preview:', e);
      handleDownloadPdf();
    }
  };

  // Build formal WhatsApp message containing all required details:
  // - Complaint No.
  // - Complainant name
  // - Respondent public body / designated official name
  // - Next date of hearing
  // - Attached PDF file of the draft
  const generateWhatsAppMessage = (recipientType: 'complainant' | 'respondent') => {
    const greeting = recipientType === 'complainant'
      ? `Dear Mr./Ms. ${complainantName},`
      : `To: ${designatedOfficerFull},\nDepartment: ${respondentDept},`;

    const summaryText = draft.contentText 
      ? (draft.contentText.length > 400 ? draft.contentText.slice(0, 400) + '...' : draft.contentText)
      : 'Please refer to the attached official notice PDF for full proceedings and directives.';

    return `${greeting}

⚖️ *SINDH INFORMATION COMMISSION (SIC)*
*OFFICIAL ${draft.category.toUpperCase()} TRANSMISSION*

📋 *Complaint No:* ${complaintNo}
👤 *Complainant Name:* ${complainantName}
🏢 *Respondent Public Body:* ${respondentDept}
🏛️ *Designated Official:* ${designatedOfficerFull}
📅 *Next Date of Hearing:* ${displayNextHearing}

📄 *Document Title:* ${draft.title}
📎 *Enclosed PDF File:* ${pdfFileName}
(Official PDF of this draft prepared via Future Proceedings is attached/enclosed)

📝 *DIRECTIVE / ORDER SUMMARY:*
${summaryText}

⚠️ *STATUTORY NOTICE:*
Under the Sindh Transparency and Right to Information Act, 2016, both parties are strictly advised to take note of the proceedings and the Next Date of Hearing (*${displayNextHearing}*).

Issued by SIC Electronic Registry
Sindh Information Commission, Karachi.
Web: https://sic.gos.pk`;
  };

  // Build subject and body for Gmail containing all required details:
  // - Complaint No.
  // - Complainant name
  // - Respondent public body / designated official name
  // - Next date of hearing
  // - Attached PDF file of the draft
  const emailSubject = `[SIC Official ${draft.category}] Case No: ${complaintNo} - ${draft.title} (Next Hearing: ${displayNextHearing})`;

  const generateEmailBody = (recipientType: 'complainant' | 'respondent') => {
    const recipientHeader = recipientType === 'complainant'
      ? `Respected ${complainantName},`
      : `To,\nThe Designated Public Information Officer / Head of Department,\n${respondentDept}\nAttn: ${designatedOfficerFull}`;

    const draftDateDisplay = new Date(draft.createdAt).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    return `${recipientHeader}

================================================================================
SINDH INFORMATION COMMISSION (SIC) - OFFICIAL STATUTORY TRANSMISSION
================================================================================
CASE DETAILS:
1. Complaint Reference No.     : ${complaintNo}
2. Complainant Name            : ${complainantName}
3. Respondent Public Body      : ${respondentDept}
4. Designated Official Name    : ${designatedOfficerFull}
5. Next Date of Hearing        : ${displayNextHearing}
6. Enclosed PDF Document       : ${pdfFileName}
================================================================================

DOCUMENT TITLE: ${draft.title}
CATEGORY: ${draft.category.toUpperCase()}
DATE OF DRAFT / NOTICE: ${draftDateDisplay}

OFFICIAL PDF DOCUMENT ATTACHMENT:
An official, formal PDF document "${pdfFileName}" has been generated from the Future Proceedings draft registry with the seal and letterhead of the Sindh Information Commission. Please find the enclosed PDF file attached to this message.

--------------------------------------------------------------------------------
FULL PROCEEDING / ORDER TEXT:
--------------------------------------------------------------------------------

${draft.contentText || draft.title}

--------------------------------------------------------------------------------
STATUTORY INSTRUCTIONS & LEGAL COMPLIANCE:
This transmission is issued under the provisions of the Sindh Transparency and Right to Information Act, 2016.
Public authorities, designated officers, and parties are required to ensure strict attendance and compliance on or before the Next Date of Hearing: ${displayNextHearing}.

Registry Office,
Sindh Information Commission,
Government of Sindh, Karachi.
Helpline: 021-99203300 | Web: https://sic.gos.pk
`;
  };

  // Auto-download PDF helper for seamless attachment
  const ensurePdfDownloaded = () => {
    try {
      downloadDraftNoticePdf(getPdfData());
      setHasDownloadedPdf(true);
    } catch (err) {
      console.warn('Auto download error:', err);
    }
  };

  // Dispatch via Gmail
  const handleSendGmail = async (recipientType: 'complainant' | 'respondent') => {
    const targetEmail = (recipientType === 'complainant' ? compEmail : respEmail).trim();
    const recipientName = recipientType === 'complainant' ? complainantName : `${respondentDept} (${designatedOfficerFull})`;

    if (!targetEmail) {
      setErrorToast(`Please specify a valid Gmail/Email address for ${recipientType === 'complainant' ? 'complainant' : 'respondent / designated officer'}.`);
      setTimeout(() => setErrorToast(null), 3500);
      return;
    }

    // Auto-download PDF so user has the exact file ready in Downloads to attach to Gmail
    ensurePdfDownloaded();

    const bodyText = generateEmailBody(recipientType);
    
    // Standard web Gmail compose link
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(targetEmail)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(bodyText)}`;

    const win = window.open(gmailUrl, '_blank');
    if (!win) {
      window.location.href = `mailto:${encodeURIComponent(targetEmail)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(bodyText)}`;
    }

    // Record dispatch history
    recordDraftDispatch(draft.id, {
      channel: 'gmail',
      recipientRole: recipientType,
      recipientName: recipientName,
      recipientAddress: targetEmail,
      dispatchedBy: user?.name || 'SuperUser'
    });

    await logActivity(`Dispatched draft notice "${draft.title}" (${draft.complaintNo}) to ${recipientType} via Gmail (${targetEmail}) with Next Hearing: ${displayNextHearing}`);

    setSuccessToast(`Draft opened in Gmail! Official PDF "${pdfFileName}" has been downloaded to your computer — simply drag and attach it to your email.`);
    setTimeout(() => setSuccessToast(null), 6000);
    onDispatchRecorded?.();
  };

  // Dispatch via WhatsApp
  const handleSendWhatsApp = async (recipientType: 'complainant' | 'respondent') => {
    const targetPhone = (recipientType === 'complainant' ? compPhone : respPhone).trim();
    const recipientName = recipientType === 'complainant' ? complainantName : `${respondentDept} (${designatedOfficerFull})`;

    if (!targetPhone) {
      setErrorToast(`Please specify a WhatsApp / contact number for ${recipientType === 'complainant' ? 'complainant' : 'respondent / designated officer'}.`);
      setTimeout(() => setErrorToast(null), 3500);
      return;
    }

    const cleanPhone = formatWhatsAppNumber(targetPhone);
    if (!cleanPhone || cleanPhone.length < 9) {
      setErrorToast(`The contact number "${targetPhone}" is invalid. Please provide a valid mobile or WhatsApp number.`);
      setTimeout(() => setErrorToast(null), 3500);
      return;
    }

    // Auto-download PDF so user has the file ready to attach
    ensurePdfDownloaded();

    const waText = generateWhatsAppMessage(recipientType);
    const waUrl = `https://api.whatsapp.com/send?phone=${encodeURIComponent(cleanPhone)}&text=${encodeURIComponent(waText)}`;

    window.open(waUrl, '_blank');

    // Record dispatch history
    recordDraftDispatch(draft.id, {
      channel: 'whatsapp',
      recipientRole: recipientType,
      recipientName: recipientName,
      recipientAddress: cleanPhone,
      dispatchedBy: user?.name || 'SuperUser'
    });

    await logActivity(`Dispatched draft notice "${draft.title}" (${draft.complaintNo}) to ${recipientType} via WhatsApp (+${cleanPhone}) with Next Hearing: ${displayNextHearing}`);

    setSuccessToast(`Draft opened in WhatsApp! Official PDF "${pdfFileName}" has been downloaded to your computer — attach it to the WhatsApp chat.`);
    setTimeout(() => setSuccessToast(null), 6000);
    onDispatchRecorded?.();
  };

  // Direct Mobile Web Share (if supported on mobile)
  const handleShareDirectPdf = async () => {
    try {
      const pdfBlob = getDraftNoticePdfBlob(getPdfData());
      const file = new File([pdfBlob], pdfFileName, { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: draft.title,
          text: `Sindh Information Commission Notice - Complaint No: ${complaintNo} (Next Hearing: ${displayNextHearing})`
        });
      } else {
        handleDownloadPdf();
      }
    } catch (err) {
      console.warn('Direct share cancelled or failed:', err);
    }
  };

  const handleCopyNoticeText = () => {
    if (draft.contentText) {
      navigator.clipboard.writeText(draft.contentText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-slate-800 w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden transition-all animate-in fade-in duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-slate-800 bg-neutral-50/90 dark:bg-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                  Dispatch Draft Notice via Gmail &amp; WhatsApp
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {draft.category}
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-slate-400 mt-0.5">
                Case No: <strong>{complaintNo}</strong> • Created by <strong>{draft.createdBy.name}</strong> ({draft.createdBy.role})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded-lg hover:bg-neutral-200/60 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Alerts */}
        {successToast && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-medium">{successToast}</span>
          </div>
        )}

        {errorToast && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-800 dark:text-red-200 flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            <span>{errorToast}</span>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-neutral-800 dark:text-slate-200">
          
          {/* Statutory Required Transmission Details Banner */}
          <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-blue-200/60 dark:border-blue-900/60">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300">
                  Case Transmission Metadata (Included in Email &amp; WhatsApp)
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded-full">
                5 Mandatory Elements
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-blue-100 dark:border-slate-800">
                <span className="text-[10px] font-medium text-neutral-400 block uppercase">1. Complaint No.</span>
                <span className="font-bold text-blue-700 dark:text-blue-400 text-sm">{complaintNo}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-blue-100 dark:border-slate-800">
                <span className="text-[10px] font-medium text-neutral-400 block uppercase">2. Complainant Name</span>
                <span className="font-semibold text-neutral-900 dark:text-white truncate block">{complainantName}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-blue-100 dark:border-slate-800">
                <span className="text-[10px] font-medium text-neutral-400 block uppercase">3. Respondent / Officer</span>
                <span className="font-semibold text-neutral-900 dark:text-white truncate block" title={`${respondentDept} (${designatedOfficerFull})`}>
                  {respondentDept}
                </span>
                <span className="text-[11px] text-neutral-500 dark:text-slate-400 truncate block">
                  {designatedOfficerFull}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-blue-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-neutral-400 block uppercase">4. Next Hearing Date</span>
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <input
                  type="text"
                  value={nextHearingDate}
                  onChange={(e) => setNextHearingDate(e.target.value)}
                  placeholder="e.g. 25-09-2026"
                  className="w-full mt-1 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  title="Next Hearing Date can be updated before sending"
                />
              </div>
            </div>
          </div>

          {/* 5. PDF Document Box */}
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-slate-800/50 border border-neutral-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900 shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                    5. Draft Notice PDF Document
                  </h4>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200">
                    Auto-Attached on Send
                  </span>
                </div>
                <p className="text-xs font-mono text-neutral-600 dark:text-slate-300 mt-0.5">
                  {pdfFileName}
                </p>
                <p className="text-[11px] text-neutral-500 dark:text-slate-400">
                  Contains official letterhead, complaint number, complainant, respondent official, and next hearing date.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handlePreviewPdf}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-neutral-700 dark:text-slate-200 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Preview official PDF document"
              >
                <Eye className="w-3.5 h-3.5 text-neutral-500" />
                <span>Preview PDF</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                title="Download official PDF file to attach"
              >
                <FileDown className="w-3.5 h-3.5 text-red-500" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>

          {/* Draft Notice Text Preview */}
          <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-slate-800/40 border border-neutral-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-800 dark:text-slate-200 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-neutral-500" />
                Draft Directive Content: {draft.title}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyNoticeText}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-600 dark:text-slate-300 hover:text-neutral-900 dark:hover:text-white py-1 px-2 rounded-md hover:bg-neutral-200/60 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Copy complete draft text"
                >
                  {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText ? 'Copied' : 'Copy Text'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowFullPreview(!showFullPreview)}
                  className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  {showFullPreview ? 'Collapse' : 'Expand Text'}
                </button>
              </div>
            </div>

            <div className={`text-xs text-neutral-600 dark:text-slate-400 p-2.5 rounded-lg bg-white dark:bg-slate-950 border border-neutral-200/80 dark:border-slate-800 font-mono whitespace-pre-wrap leading-relaxed ${
              showFullPreview ? 'max-h-60' : 'max-h-16'
            } overflow-y-auto`}>
              {draft.contentText || draft.title}
            </div>
          </div>

          {/* Two Columns for Complainant and Respondent Dispatches */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* 1. Complainant Section */}
            <div className="p-5 rounded-xl border border-neutral-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                      Complainant Details
                    </h4>
                  </div>
                  <span className="text-[10px] font-medium text-neutral-500">Citizen</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 dark:text-slate-300 mb-1">
                    Complainant Name
                  </label>
                  <input
                    type="text"
                    value={complainantName}
                    disabled
                    className="w-full rounded-lg border border-neutral-200 dark:border-slate-800 bg-neutral-100/70 dark:bg-slate-800/60 px-3 py-1.5 text-xs text-neutral-800 dark:text-slate-200 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 dark:text-slate-300 mb-1">
                    Gmail / Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                    <input
                      type="email"
                      value={compEmail}
                      onChange={(e) => setCompEmail(e.target.value)}
                      placeholder="e.g. complainant@gmail.com"
                      className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <span className="text-[10px] text-neutral-400 mt-0.5 block">
                    {draft.complainant.email ? '✓ Resolved from Complaint Record' : 'Enter recipient Gmail'}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 dark:text-slate-300 mb-1">
                    WhatsApp / Contact Number
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={compPhone}
                      onChange={(e) => setCompPhone(e.target.value)}
                      placeholder="e.g. 03001234567 or +923001234567"
                      className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <span className="text-[10px] text-neutral-400 mt-0.5 block">
                    {draft.complainant.contactNumber ? '✓ Resolved from Complaint Contact Number' : 'Enter mobile/WhatsApp number'}
                  </span>
                </div>
              </div>

              {/* Action Buttons for Complainant */}
              <div className="pt-3 border-t border-neutral-100 dark:border-slate-800 space-y-2">
                <button
                  type="button"
                  onClick={() => handleSendGmail('complainant')}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  title="Transmits email containing Case No, Complainant, Respondent, Next Hearing Date, and attaches PDF"
                >
                  <Mail className="w-4 h-4" />
                  <span>Send via Gmail to Complainant</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </button>

                <button
                  type="button"
                  onClick={() => handleSendWhatsApp('complainant')}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  title="Sends WhatsApp message with Case No, Complainant, Respondent, Next Hearing Date, and attached PDF"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Send via WhatsApp to Complainant</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </button>
              </div>
            </div>

            {/* 2. Respondent / Designated Officer Section */}
            <div className="p-5 rounded-xl border border-neutral-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                      Respondent / Designated Officer
                    </h4>
                  </div>
                  <span className="text-[10px] font-medium text-neutral-500">Public Authority</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 dark:text-slate-300 mb-1">
                    Public Body &amp; Designated Official
                  </label>
                  <input
                    type="text"
                    value={`${respondentDept} — ${designatedOfficerFull}`}
                    disabled
                    className="w-full rounded-lg border border-neutral-200 dark:border-slate-800 bg-neutral-100/70 dark:bg-slate-800/60 px-3 py-1.5 text-xs text-neutral-800 dark:text-slate-200 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 dark:text-slate-300 mb-1">
                    Official Gmail / Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                    <input
                      type="email"
                      value={respEmail}
                      onChange={(e) => setRespEmail(e.target.value)}
                      placeholder="e.g. officer@department.gov.pk or gmail"
                      className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <span className="text-[10px] text-neutral-400 mt-0.5 block">
                    {draft.respondent.email ? '✓ Resolved from Public Body Directory' : 'Provide official email'}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 dark:text-slate-300 mb-1">
                    Official WhatsApp / Contact Number
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={respPhone}
                      onChange={(e) => setRespPhone(e.target.value)}
                      placeholder="e.g. 03001234567 or +923001234567"
                      className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <span className="text-[10px] text-neutral-400 mt-0.5 block">
                    {draft.respondent.contactNumber ? '✓ Resolved from Designated Official Directory' : 'Provide official WhatsApp/phone'}
                  </span>
                </div>
              </div>

              {/* Action Buttons for Respondent */}
              <div className="pt-3 border-t border-neutral-100 dark:border-slate-800 space-y-2">
                <button
                  type="button"
                  onClick={() => handleSendGmail('respondent')}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  title="Transmits email containing Case No, Complainant, Respondent, Next Hearing Date, and attaches PDF"
                >
                  <Mail className="w-4 h-4" />
                  <span>Send via Gmail to Designated Officer</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </button>

                <button
                  type="button"
                  onClick={() => handleSendWhatsApp('respondent')}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  title="Sends WhatsApp message with Case No, Complainant, Respondent, Next Hearing Date, and attached PDF"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Send via WhatsApp to Designated Officer</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </button>
              </div>
            </div>

          </div>

          {/* Dispatch History Log */}
          {draft.dispatches && draft.dispatches.length > 0 && (
            <div className="p-4 rounded-xl border border-neutral-200 dark:border-slate-800 bg-neutral-50/70 dark:bg-slate-800/40 space-y-2">
              <h4 className="text-xs font-bold text-neutral-800 dark:text-slate-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-neutral-500" />
                Dispatch &amp; Transmission Log ({draft.dispatches.length} recorded)
              </h4>
              <div className="divide-y divide-neutral-200 dark:divide-slate-800 text-xs">
                {draft.dispatches.map((disp) => (
                  <div key={disp.id} className="py-2 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        disp.channel === 'gmail' 
                          ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300' 
                          : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                      }`}>
                        {disp.channel === 'gmail' ? <Mail className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                        {disp.channel}
                      </span>
                      <span className="font-medium text-neutral-900 dark:text-white">
                        {disp.recipientRole === 'complainant' ? 'Complainant' : 'Designated Official'}:
                      </span>
                      <span className="text-neutral-600 dark:text-slate-300">{disp.recipientName}</span>
                      <span className="text-neutral-400 font-mono text-[11px]">({disp.recipientAddress})</span>
                    </div>
                    <div className="text-[11px] text-neutral-500 dark:text-slate-400">
                      Dispatched by <strong>{disp.dispatchedBy}</strong> at {new Date(disp.dispatchedAt).toLocaleString('en-GB')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-slate-400">
            <span>Sindh Information Commission Electronic Notice Dispatch System</span>
            <span>•</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">
              Case No. {complaintNo}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 dark:text-slate-200 bg-neutral-100 hover:bg-neutral-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5 text-red-600" />
              <span>Download PDF File</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-neutral-600 dark:text-slate-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-lg border border-neutral-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
