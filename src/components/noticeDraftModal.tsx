import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Share2, FileDown, FileText, Mail, AlertCircle, Bookmark, Clock, Scale } from 'lucide-react';
import { ComplaintData, useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { 
  saveNoticeDraft, 
  resolveComplaintContacts, 
  NoticeDraftRecord, 
  getDraftsForComplaint 
} from '../utils/draftStorage';
import DraftDispatchModal from './DraftDispatchModal';

import { 
  DocumentEditorContainerComponent, 
  Toolbar,
  Print,
  SfdtExport,
  WordExport,
  Selection,
  Editor,
  EditorHistory,
  ContextMenu
} from '@syncfusion/ej2-react-documenteditor';

DocumentEditorContainerComponent.Inject(Toolbar, Print, SfdtExport, WordExport, Selection, Editor, EditorHistory, ContextMenu);

export interface NoticeTypeConfig {
  id: string;
  title: string;
  stageName: string;
  category: 'Notice' | 'Order';
  tag: string;
  tagColor: string;
  iconType: string;
  description: string;
  isCustom?: boolean;
}

export const NOTICE_TYPES: NoticeTypeConfig[] = [
  {
    id: 'call-report',
    title: 'Notice for Call Report',
    stageName: 'Call report',
    category: 'Notice',
    tag: 'Initial Report',
    tagColor: 'bg-blue-50 text-blue-700 border-blue-200',
    iconType: 'FileText',
    description: 'Directs the public body to submit preliminary comments & report'
  },
  {
    id: 'first-notice',
    title: 'First Notice',
    stageName: 'First Notice issued',
    category: 'Notice',
    tag: '1st Summons',
    tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    iconType: 'Mail',
    description: 'Initial formal summons to designated official & respondent body'
  },
  {
    id: 'final-notice',
    title: 'Final Notice',
    stageName: 'Final Notice issued',
    category: 'Notice',
    tag: 'Urgent Notice',
    tagColor: 'bg-amber-50 text-amber-700 border-amber-200',
    iconType: 'AlertCircle',
    description: 'Preemptory notice on failure to comply with initial notice'
  },
  {
    id: 'repeat-final-notice',
    title: 'Repeat Final Notice',
    stageName: 'Repeat Final Notice issued',
    category: 'Notice',
    tag: 'Final Warning',
    tagColor: 'bg-orange-50 text-orange-700 border-orange-200',
    iconType: 'AlertCircle',
    description: 'Last opportunity before initiating statutory penalty proceedings'
  },
  {
    id: 'show-cause-notice',
    title: 'Show Cause Notice',
    stageName: 'Show Cause Notice Issued',
    category: 'Notice',
    tag: 'Sec. 15 Penalty',
    tagColor: 'bg-rose-50 text-rose-700 border-rose-200',
    iconType: 'AlertCircle',
    description: 'Show cause why penalty under Section 15 should not be imposed'
  },
  {
    id: 'final-show-cause-notice',
    title: 'Final Show Cause Notice',
    stageName: 'Final Show Cause Notice Issued',
    category: 'Notice',
    tag: 'Conclusive Penalty',
    tagColor: 'bg-red-50 text-red-700 border-red-200',
    iconType: 'AlertCircle',
    description: 'Final show cause prior to recovery of fine or disciplinary action'
  },
  {
    id: 'adjournment-order',
    title: 'Adjournment Order',
    stageName: 'Adjournment Order Issued',
    category: 'Order',
    tag: 'Date Fixed',
    tagColor: 'bg-purple-50 text-purple-700 border-purple-200',
    iconType: 'Clock',
    description: 'Records reasons for adjournment and fixes next hearing date'
  },
  {
    id: 'hearing-order',
    title: 'Interim Hearing Order',
    stageName: 'Order issued',
    category: 'Order',
    tag: 'Bench Order',
    tagColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    iconType: 'Scale',
    description: 'Interim directions on production of documents and attendance'
  },
  {
    id: 'disposed-off-order',
    title: 'Final / Disposed-Off Order',
    stageName: 'Disposed-Off Order issued',
    category: 'Order',
    tag: 'Final Disposal',
    tagColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    iconType: 'Check',
    description: 'Final order disposing off complaint with statutory directives'
  }
];

export interface StatutoryClauseSnippet {
  id: string;
  label: string;
  html: string;
}

export const STATUTORY_SNIPPETS: StatutoryClauseSnippet[] = [
  {
    id: 'sec-11',
    label: 'Sec. 11 Cognizance',
    html: '<p><strong>Section 11 Cognizance:</strong> That the Commission, in exercise of powers conferred under <strong>Section 11(3) of the Sindh Transparency and Right to Information Act, 2016</strong>, takes cognizance of the non-provision of requested public records and directs the Designated Official to submit a comprehensive compliance report.</p>'
  },
  {
    id: 'sec-10',
    label: 'Sec. 10 Statutory 21 Days',
    html: '<p><strong>Statutory 21-Day Limitation:</strong> That under <strong>Section 10(1) of the Act</strong>, it is the statutory obligation of the Public Information Officer / Designated Official to either provide the requested certified records or convey justifiable reasons for refusal within <strong>twenty-one (21) working days</strong> of receipt of the request.</p>'
  },
  {
    id: 'sec-15',
    label: 'Sec. 15 Penal Warning',
    html: '<p><strong>Penal Warning under Section 15:</strong> Take notice that persistent default or failure to comply with the directions of this Commission shall render the Designated Official liable to penal proceedings under <strong>Section 15 of the Sindh Transparency and Right to Information Act, 2016</strong>, including fine up to statutory ceiling and recommendation for departmental disciplinary proceedings.</p>'
  },
  {
    id: 'art-19a',
    label: 'Article 19-A Constitutional Right',
    html: '<p><strong>Article 19-A Fundamental Right:</strong> That access to certified public information is a constitutionally guaranteed fundamental right under <strong>Article 19-A of the Constitution of the Islamic Republic of Pakistan</strong>, and public records cannot be withheld except under express statutory exemption provided under Section 5 of the Act.</p>'
  },
  {
    id: 'hearing-summon',
    label: 'Mandatory Hearing Attendance',
    html: '<p><strong>Mandatory Personal Appearance:</strong> Both parties are hereby directed to note that the hearing of this matter is fixed before the Commission at Karachi. Personal attendance of the Designated Official with original records is mandatory; failure to appear will result in <em>ex-parte</em> proceedings.</p>'
  },
  {
    id: 'certified-copies',
    label: 'Supply Certified Copies',
    html: '<p><strong>Direction to Supply Certified Copies:</strong> The Respondent Public Body is hereby ordered to provide certified and duly attested photocopies of the requisitioned public documents to the Complainant within <strong>seven (7) days</strong> under official receipt.</p>'
  }
];

export function generateDefaultDraftHtml(notice: NoticeTypeConfig, complaint: ComplaintData): string {
  const hearingDate = complaint.nextHearingDate || 'To be scheduled';
  const cName = complaint.complainantName || 'Complainant';
  const rName = complaint.respondentName || 'Respondent Public Body';
  const cNo = complaint.complaintNo || 'SIC-2026-01';
  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).replace(/\//g, '-');

  const drafts = getDraftsForComplaint(cNo);
  const outwardNo = (drafts.length + 1).toString().padStart(2, '0');
  
  let compSeq = '01';
  let compYear = new Date().getFullYear().toString();
  
  const complaintNoMatch = cNo.match(/SIC-(\d{4})-(\d+)/i);
  if (complaintNoMatch) {
    compYear = complaintNoMatch[1];
    compSeq = complaintNoMatch[2].padStart(2, '0');
  } else {
    const slashMatch = cNo.match(/(\d+)\/(\d{4})/);
    if (slashMatch) {
      compSeq = slashMatch[1].padStart(2, '0');
      compYear = slashMatch[2];
    } else {
      const numMatch = cNo.match(/\d+/g);
      if (numMatch && numMatch.length > 0) {
        compSeq = numMatch[numMatch.length - 1].padStart(2, '0');
      }
    }
  }
  const shortYear = compYear.slice(-2);
  const noticeTypeUpper = notice.title.toUpperCase();

  let parawiseHtml = '';

  switch (notice.id) {
    case 'call-report':
      parawiseHtml = `
<p>1. That the complainant, <strong>${cName}</strong>, has filed a complaint under <strong>Section 11 of the Sindh Transparency and Right to Information Act, 2016</strong>, stating that an application for provision of certified public records was duly submitted to the Designated Official of <strong>${rName}</strong>, but the requested information was not provided within the prescribed statutory period.</p>
<p>2. That under <strong>Section 10</strong> of the Sindh Transparency and Right to Information Act, 2016, it is the statutory obligation of the Public Information Officer / Designated Official to either provide the requested information or convey reasons for refusal within <strong>twenty-one (21) working days</strong> of receipt of the request.</p>
<p>3. That the Commission, in exercise of powers conferred under <strong>Section 11(3) of the Act</strong>, takes cognizance of the non-provision of information and calls upon the Respondent Public Body to submit a comprehensive <strong>Call Report</strong> on the status of the applicant's RTI request.</p>
<p>4. The Respondent Public Body is hereby directed to submit parawise comments along with attested copies of the requisite records, or explain justifiable statutory grounds under <strong>Section 5</strong> if any exemption is claimed, within <strong>seven (7) days</strong> of receipt of this notice.</p>
<p>5. Both parties are notified that the matter shall be taken up before the Commission on <strong>${hearingDate} at 10:30 AM</strong> at the Sindh Information Commission, Karachi. Failure to submit the report shall result in appropriate statutory orders.</p>
`;
      break;

    case 'first-notice':
      parawiseHtml = `
<p>1. That the complainant, <strong>${cName}</strong>, has preferred this appeal/complaint before the Sindh Information Commission against <strong>${rName}</strong> on grounds of non-compliance with the statutory mandate of the Sindh Transparency and Right to Information Act, 2016.</p>
<p>2. That the complainant's request for obtaining official documents and certified information has remained unanswered without lawful justification, prima facie frustrating the citizen's constitutional right to information as enshrined under <strong>Article 19-A of the Constitution of the Islamic Republic of Pakistan</strong>.</p>
<p>3. That this <strong>First Notice</strong> is hereby formally issued to the Designated Official / Head of <strong>${rName}</strong> to appear in person or through an authorized representative duly conversant with the facts of the case before the Commission.</p>
<p>4. The Respondent is directed to file detailed parawise comments addressing each question and document requisitioned by the Complainant, and to furnish one advance copy thereof to the Complainant prior to the scheduled hearing.</p>
<p>5. Take notice that the hearing of this case is fixed on <strong>${hearingDate} at 10:30 AM</strong>. In the event of default in appearance or submission of parawise comments, the Commission may proceed <em>ex-parte</em> and issue directions under the relevant schedule of the Act.</p>
`;
      break;

    case 'final-notice':
      parawiseHtml = `
<p>1. That despite issuance of initial notices and communications by the Commission in <strong>Complaint No. ${cNo}</strong>, the Designated Official / Public Body (<strong>${rName}</strong>) has failed to submit parawise comments or produce the certified public records sought by <strong>${cName}</strong>.</p>
<p>2. That non-compliance with the directions of the Commission violates <strong>Section 11</strong> of the Sindh Transparency and Right to Information Act, 2016 and causes unwarranted delay in the administration of justice.</p>
<p>3. That this <strong>Final Notice</strong> is hereby served as a preemptory opportunity to the Respondent Public Body to submit complete parawise comments and provide the requisitioned records without further delay.</p>
<p>4. The Designated Official is directed to appear in person before the Commission on the appointed date along with the entire original case record and a written explanation for previous non-compliance.</p>
<p>5. Notice is hereby given that the case will be heard on <strong>${hearingDate} at 10:30 AM</strong>. Failure to comply will lead to initiation of penal proceedings under <strong>Section 15 of the Act</strong> without further notice.</p>
`;
      break;

    case 'repeat-final-notice':
      parawiseHtml = `
<p>1. That repeated notices issued by the Commission have not yielded compliance from <strong>${rName}</strong> in Complaint No. <strong>${cNo}</strong> filed by <strong>${cName}</strong>.</p>
<p>2. That the persistent failure of the Designated Official to submit parawise comments or appear before the Commission constitutes wilful disregard of statutory obligations under the Sindh Transparency and Right to Information Act, 2016.</p>
<p>3. That this <strong>Repeat Final Notice</strong> is issued as a last and final warning before the Commission exercises its coercive powers under <strong>Section 11(3) and Section 15</strong> of the Act.</p>
<p>4. The Respondent is ordered to furnish the complete requested information to the Complainant under intimation to this Commission within <strong>five (5) days</strong>, or appear before the Bench with parawise justification.</p>
<p>5. Hearing is fixed for <strong>${hearingDate} at 10:30 AM</strong>. If the Respondent remains absent or fails to comply, ex-parte decision and formal penal inquiry shall be ordered on the same date.</p>
`;
      break;

    case 'show-cause-notice':
      parawiseHtml = `
<p>1. <strong>WHEREAS</strong>, a complaint under <strong>Section 11 of the Sindh Transparency and Right to Information Act, 2016</strong> was filed by <strong>${cName}</strong> against <strong>${rName}</strong> for withholding certified public records.</p>
<p>2. <strong>AND WHEREAS</strong>, the Designated Official has repeatedly failed to furnish the requested records or submit parawise comments despite service of notices by this Commission.</p>
<p>3. <strong>NOW THEREFORE</strong>, you, the Designated Official / Public Information Officer of <strong>${rName}</strong>, are hereby called upon to <strong>SHOW CAUSE</strong> in writing within seven (7) days as to why penal proceedings under <strong>Section 15</strong> of the Sindh Transparency and Right to Information Act, 2016 should not be initiated against you for failure to discharge duties without reasonable cause.</p>
<p>4. You are further directed to submit your parawise response to the allegations of mala fide delay and non-provision of public records.</p>
<p>5. Take notice that you are required to appear personally before the Commission on <strong>${hearingDate} at 10:30 AM</strong> to show cause. In case of default, fine up to statutory limits and recommendation for disciplinary action under efficiency and discipline rules may be passed.</p>
`;
      break;

    case 'final-show-cause-notice':
      parawiseHtml = `
<p>1. <strong>WHEREAS</strong>, a Show Cause Notice was previously served upon the Designated Official of <strong>${rName}</strong> regarding wilful non-compliance and withholding of public documents in Complaint No. <strong>${cNo}</strong>.</p>
<p>2. <strong>AND WHEREAS</strong>, the explanation tendered, if any, is unsatisfactory and the requisitioned public records have still not been provided to <strong>${cName}</strong>.</p>
<p>3. <strong>NOW THEREFORE</strong>, this <strong>Final Show Cause Notice</strong> is issued calling upon you to show cause why maximum penalty under <strong>Section 15 of the Act</strong> should not be deducted from your salary and why the Commission should not write to the Competent Authority for initiation of departmental disciplinary proceedings.</p>
<p>4. You are directed to file final parawise comments and provide complete certified records to the Complainant on or before <strong>${hearingDate}</strong>.</p>
<p>5. Personal appearance of the Designated Official is mandatory on <strong>${hearingDate} at 10:30 AM</strong>. No adjournment shall be granted under any circumstances.</p>
`;
      break;

    case 'adjournment-order':
      parawiseHtml = `
<p>1. Case called for hearing. The Complainant (<strong>${cName}</strong>) was represented by ${complaint.counselorComplainant || 'Counsel'}. The Respondent (<strong>${rName}</strong>) was represented by ${complaint.counselorRespondent || 'Representative'}.</p>
<p>2. The representative of the Respondent requested time to file parawise comments and obtain instructions from the Competent Authority regarding disclosure of the requested records.</p>
<p>3. The Complainant raised objection to repeated delays and submitted that the information sought is purely public in nature and does not fall under any exemption clause of <strong>Section 5</strong>.</p>
<p>4. Having heard both sides, the Commission, in the interest of justice and as a final indulgence, adjourns the proceedings subject to the condition that complete parawise comments and records must be submitted at least three days prior to the next date.</p>
<p>5. The matter stands adjourned to <strong>${hearingDate} at 10:30 AM</strong> for final hearing and order. Both parties are directed to note the date.</p>
`;
      break;

    case 'hearing-order':
      parawiseHtml = `
<p>1. Case taken up for hearing at the Sindh Information Commission, Karachi. The Complainant, <strong>${cName}</strong>, and the authorized officer of <strong>${rName}</strong> appeared before the Bench.</p>
<p>2. Parawise comments submitted by the Respondent Public Body were perused by the Commission. The Complainant examined the same and identified specific items still withheld.</p>
<p>3. The Commission observes that under the preamble and provisions of the <strong>Sindh Transparency and Right to Information Act, 2016</strong>, public information must be accessible to citizens with minimum exceptions.</p>
<p>4. The Respondent is hereby directed to provide certified copies of items No. 1 to 4 of the RTI application to the Complainant within <strong>seven (7) days</strong> under receipt.</p>
<p>5. Compliance report along with proof of receipt shall be placed on record on the next date of hearing, i.e., <strong>${hearingDate} at 10:30 AM</strong>.</p>
`;
      break;

    case 'disposed-off-order':
      parawiseHtml = `
<p>1. This order disposes of <strong>Complaint No. ${cNo}</strong> filed by <strong>${cName}</strong> against <strong>${rName}</strong> under <strong>Section 11 of the Sindh Transparency and Right to Information Act, 2016</strong>.</p>
<p>2. During proceedings before the Commission, the Respondent Public Body submitted parawise comments and supplied certified copies of the requisite records to the Complainant.</p>
<p>3. The Complainant has acknowledged receipt of the complete information and expressed satisfaction with the records provided by the department.</p>
<p>4. The Commission records its appreciation for the eventual compliance, and reminds the Respondent Public Body to proactively maintain and disclose public records under <strong>Section 4 of the Act</strong>.</p>
<p>5. The grievance of the Complainant stands resolved. Consequently, the complaint is hereby disposed of with no further orders as to costs or penalties.</p>
`;
      break;

    default:
      if (notice.category === 'Order') {
        parawiseHtml = `
<p>1. <strong>Case Proceedings:</strong> Case taken up for consideration / hearing before the Sindh Information Commission, Karachi in <strong>Complaint No. ${cNo}</strong> titled <em>${cName} V/s ${rName}</em>.</p>
<p>2. <strong>Submissions &amp; Perusal of Record:</strong> Having examined the complaint filed under <strong>Section 11 of the Sindh Transparency and Right to Information Act, 2016</strong>, and having perused the submissions of the parties and departmental file records, the Commission hereby issues the following order:</p>
<p>3. <strong>Directives of the Commission:</strong> [Specify specific bench directions, document production directives, or operative orders here...]</p>
<p>4. <strong>Compliance Directive:</strong> The Respondent Public Body / Designated Official is directed to implement the above directions and submit a formal compliance report to this Commission within <strong>ten (10) days</strong> of receipt of this order.</p>
<p>5. <strong>Next Hearing / Date Fixed:</strong> Both parties are directed to note that the matter stands fixed for further compliance review on <strong>${hearingDate} at 10:30 AM</strong> before the Commission at Karachi.</p>
`;
      } else {
        parawiseHtml = `
<p>1. <strong>Statutory Cognizance:</strong> That the complainant, <strong>${cName}</strong>, has filed a complaint under <strong>Section 11 of the Sindh Transparency and Right to Information Act, 2016</strong> against <strong>${rName}</strong> on grounds of non-provision of certified public information.</p>
<p>2. <strong>Notice Requisition:</strong> Take notice that this <strong>${notice.title}</strong> is hereby issued to the Designated Official / Head of Department regarding [Specify subject matter, document requisition, or explanation required...].</p>
<p>3. <strong>Submission of Response:</strong> You are hereby directed to submit parawise comments along with certified copies of the requisite records, or explain justifiable grounds under Section 5 if any exemption is claimed, within <strong>seven (7) days</strong> of receipt of this notice.</p>
<p>4. <strong>Scheduled Hearing:</strong> Both parties are hereby notified that the hearing of this matter is fixed on <strong>${hearingDate} at 10:30 AM</strong> before the Sindh Information Commission at Karachi.</p>
<p>5. <strong>Consequence of Default:</strong> Failure to comply with this notice or remain absent on the scheduled date shall lead to initiation of proceedings under <strong>Section 15 of the Act</strong> without further notice.</p>
`;
      }
      break;
  }

  return `
<div class="legal-draft-document font-serif" style="font-family: 'Merriweather', Georgia, serif; line-height: 1.65; color: #111827;">
  
  <!-- Header Section with Logo and Outward No -->
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
    <!-- Left Side: Logo -->
    <div style="width: 90px; height: 90px; display: flex; align-items: center; justify-content: center;">
      <img src="https://upload.wikimedia.org/wikipedia/commons/e/ec/Government_of_Sindh_Logo.svg" alt="SIC Logo" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
    </div>
    <!-- Right Side: Details -->
    <div style="text-align: right; font-weight: bold; font-family: ui-sans-serif, system-ui, sans-serif; font-size: 14px; line-height: 1.5; padding-top: 10px;">
      NO.SIC/${noticeTypeUpper}/${compSeq}/${compYear}/${outwardNo}/${shortYear}
    </div>
  </div>

  <!-- Centered Text -->
  <div style="text-align: center; margin-bottom: 20px;">
    <h2 style="font-size: 16px; font-weight: 800; margin: 0;">
      BEFORE THE SINDH INFORMATION COMMISSION AT KARACHI
    </h2>
    <div style="font-size: 14px; font-weight: bold; margin-top: 8px;">
      Complaint No (${compSeq})/Complaint Year (${compYear}) i.e., ${compSeq}/${compYear}
    </div>
  </div>

  <!-- Parties -->
  <div style="margin-bottom: 20px; font-size: 14px; font-weight: bold; padding-left: 20px;">
    <div>${cName} <span style="font-weight: normal;">.................. (Complainant)</span></div>
    <div style="margin: 4px 0; padding-left: 60px; font-weight: normal;">V/s</div>
    <div>${rName} <span style="font-weight: normal;">.............. (Respondent)</span></div>
  </div>

  <!-- Subject Line -->
  <div style="margin-bottom: 20px; font-size: 13.5px; font-weight: bold; text-transform: uppercase; text-align: justify;">
    SUBJECT: RTI (COMPLAINT) UNDER SECTION 11 OF THE SINDH TRANSPARENCY AND RIGHT TO INFORMATION ACT, 2016 (SINDH ACT NO. XV OF 2017).
  </div>

  <!-- Before line -->
  <div style="margin-bottom: 20px; font-size: 14px; display: flex;">
    <div style="font-weight: bold; margin-right: 40px; white-space: nowrap;">Before:</div>
    <div style="font-weight: bold;">
      <div>Mr. Muhammad Saleem Khan (Information Commissioner-I)</div>
      <div>Mr. Noor Muhammad Dayo (Information Commissioner-II)</div>
    </div>
  </div>

  <!-- Parawise Comments Section Heading -->
  <div style="font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #1f2937; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 12px; font-family: ui-sans-serif, system-ui, sans-serif;">
    PARAWISE COMMENTS OF THE DRAFT:
  </div>

  <!-- Parawise Comments Body -->
  <div class="draft-parawise-body" style="font-size: 13.5px; text-align: justify;">
    ${parawiseHtml}
  </div>

  <!-- Sign-off & Seal -->
  <div style="margin-top: 36px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-family: ui-sans-serif, system-ui, sans-serif;">
    <div style="display: flex; justify-content: space-between; align-items: flex-end;">
      
      <!-- Seal -->
      <div style="border: 2px dashed #f87171; border-radius: 9999px; width: 90px; height: 90px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #dc2626; transform: rotate(-5deg); user-select: none;">
        <span style="font-size: 8px; font-weight: 800; text-transform: uppercase; line-height: 1.1;">Sindh Information</span>
        <span style="font-size: 8px; font-weight: 800; text-transform: uppercase; line-height: 1.1;">Commission</span>
        <span style="font-size: 7px; font-weight: 600; margin-top: 2px;">Official Seal</span>
        <span style="font-size: 6.5px; color: #6b7280; margin-top: 2px;">${currentDate}</span>
      </div>

      <!-- Sign-off -->
      <div style="text-align: right;">
        <div style="font-style: italic; font-size: 12.5px; color: #6b7280; margin-bottom: 4px; font-family: 'Merriweather', Georgia, serif;">By Order of the Commission,</div>
        <div style="width: 180px; border-bottom: 1px solid #9ca3af; margin-bottom: 6px; margin-left: auto;"></div>
        <div style="font-weight: 700; font-size: 13px; color: #111827;">Registrar / Authorized Officer</div>
        <div style="font-size: 11.5px; color: #4b5563;">Sindh Information Commission</div>
        <div style="font-size: 10.5px; color: #9ca3af;">Government of Sindh, Karachi</div>
      </div>

    </div>

    <!-- Endorsements -->
    <div style="margin-top: 20px; padding-top: 12px; border-top: 1px solid #f3f4f6; font-size: 11px; color: #6b7280;">
      <div style="font-weight: 700; color: #374151; margin-bottom: 3px; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px;">
        Copy forwarded for information &amp; immediate compliance to:
      </div>
      <ol style="margin: 0; padding-left: 18px; line-height: 1.55;">
        <li>The Complainant: <strong style="color: #1f2937;">${cName}</strong></li>
        <li>The Designated Official / Head of Department: <strong style="color: #1f2937;">${rName}</strong></li>
        <li>Personal Staff Officer to the Chief Information Commissioner, Sindh Information Commission.</li>
        <li>Office Record File / Bench Diary.</li>
      </ol>
    </div>

  </div>

</div>
`.trim();
}

interface NoticeDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  complaint: ComplaintData;
  noticeConfig: NoticeTypeConfig;
}
export function NoticeDraftModal({
  isOpen,
  onClose,
  complaint,
  noticeConfig
}: NoticeDraftModalProps) {
  const { addProceeding, publicBodies } = useAppContext();
  const { user, logActivity } = useAuth();
  
  const containerRef = useRef<DocumentEditorContainerComponent>(null);
  
  const [savedDraftSuccess, setSavedDraftSuccess] = useState<boolean>(false);
  const [draftToastMsg, setDraftToastMsg] = useState<string | null>(null);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState<boolean>(false);
  const [currentDraftRecord, setCurrentDraftRecord] = useState<NoticeDraftRecord | null>(null);
  const [draftStorageKey, setDraftStorageKey] = useState<string>('');

  useEffect(() => {
    if (!isOpen || !complaint) return;
    const key = `draft_${complaint.complaintNo}_${noticeConfig.id}`;
    setDraftStorageKey(key);
    
    const drafts = getDraftsForComplaint(complaint.complaintNo);
    const existingDraft = drafts.find(d => d.noticeTypeId === noticeConfig.id);
    if (existingDraft) {
      setCurrentDraftRecord(existingDraft);
    }
  }, [isOpen, complaint, noticeConfig]);

  const onCreated = () => {
    if (!containerRef.current) return;
    
    // Use the synced draft content if available, falling back to local auto-save if needed
    const existingData = currentDraftRecord?.contentHtml || localStorage.getItem(draftStorageKey);
    
    if (existingData && existingData.startsWith('{')) {
      try {
        containerRef.current.documentEditor.open(existingData);
      } catch(e) {
        console.error("Failed to parse Syncfusion document", e);
      }
    } else {
      const htmlTemplate = generateDefaultDraftHtml(noticeConfig, complaint);
      setTimeout(() => {
        if(containerRef.current) {
          containerRef.current.documentEditor.editor.insertHtml(htmlTemplate);
        }
      }, 500);
    }
  };

  const handleSaveDraft = () => {
    if (!containerRef.current) return;
    const editor = containerRef.current.documentEditor;
    const sfdt = editor.serialize();
    
    let plainText = "Syncfusion Draft";
    try {
      plainText = editor.text || "Draft content";
    } catch(e){}

    const { complainant, respondent } = resolveComplaintContacts(complaint, publicBodies);

    const isNew = !currentDraftRecord;
    const draftId = isNew ? `${complaint.complaintNo}_${Date.now()}` : currentDraftRecord.id;
    
    let outwardNo = currentDraftRecord?.outwardNo;
    if (!outwardNo) {
      const drafts = getDraftsForComplaint(complaint.complaintNo);
      // Determine the next sequential outward number
      outwardNo = (drafts.length + (isNew ? 1 : 0)).toString().padStart(2, '0');
    }

    const record: NoticeDraftRecord = {
      id: draftId,
      complaintNo: complaint.complaintNo,
      outwardNo,
      noticeTypeId: noticeConfig.id,
      title: noticeConfig.title,
      category: noticeConfig.category,
      contentHtml: sfdt, // Using htmlContent field to store sfdt
      contentText: plainText,
      complainant,
      respondent,
      createdAt: currentDraftRecord?.createdAt || new Date().toISOString(),
      status: currentDraftRecord?.status || "draft",
      dispatches: currentDraftRecord?.dispatches || [],
      updatedAt: new Date().toISOString(),
      createdBy: currentDraftRecord?.createdBy || {
        userId: user?.id || 'sys',
        name: user?.name || 'System User',
        role: user?.role as 'superUser' | 'admin'
      }
    };
    saveNoticeDraft(record);

    setCurrentDraftRecord(record);
    setSavedDraftSuccess(true);
    setDraftToastMsg('Draft saved successfully');
    
    if (user) {
      logActivity(user.id, `Saved advanced draft: ${noticeConfig.title} for Complaint #${complaint.complaintNo}`);
    }

    setTimeout(() => {
      setSavedDraftSuccess(false);
      setDraftToastMsg(null);
    }, 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-neutral-50 dark:bg-slate-900 w-full h-[95vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-neutral-200 dark:border-slate-700">
        
        <div className="flex-none px-6 py-4 bg-white dark:bg-slate-800 border-b border-neutral-200 dark:border-slate-700 flex justify-between items-center z-10">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                Draft {noticeConfig.category}
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${noticeConfig.tagColor}`}>
                  {noticeConfig.tag}
                </span>
              </h2>
              <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 flex gap-2">
                <span>Complaint No: <strong className="text-neutral-700 dark:text-neutral-300">{complaint.complaintNo}</strong></span>
                <span>•</span>
                <span>Type: <strong className="text-neutral-700 dark:text-neutral-300">{noticeConfig.title}</strong></span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <button
                type="button"
                onClick={onClose}
                className="p-2 text-neutral-500 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-slate-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
          </div>
        </div>

        <div className="flex-1 w-full bg-neutral-200 dark:bg-slate-900 overflow-hidden relative custom-syncfusion-wrapper">
          <DocumentEditorContainerComponent 
            id="container"
            ref={containerRef}
            height={'100%'}
            enableToolbar={true}
            created={onCreated}
          />
        </div>

        <div className="flex-none px-6 py-4 bg-white dark:bg-slate-800 border-t border-neutral-200 dark:border-slate-700 flex justify-between items-center z-10">
           <div className="flex gap-2 items-center">
             {draftToastMsg && (
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                {draftToastMsg}
              </span>
             )}
           </div>
           
           <div className="flex items-center gap-3">
             <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Close
              </button>
              
              <button
                type="button"
                onClick={handleSaveDraft}
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg border transition-colors ${
                  savedDraftSuccess 
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300' 
                    : 'bg-white dark:bg-slate-800 text-neutral-700 dark:text-neutral-200 border-neutral-300 dark:border-slate-600 hover:bg-neutral-50 dark:hover:bg-slate-700'
                }`}
              >
                {savedDraftSuccess ? 'Saved' : 'Save Draft'}
              </button>
              
              <button
                type="button"
                onClick={() => setIsDispatchModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm"
              >
                <Share2 className="w-4 h-4" />
                Dispatch...
              </button>
           </div>
        </div>
      </div>

      {isDispatchModalOpen && currentDraftRecord && (
        <DraftDispatchModal
          isOpen={isDispatchModalOpen}
          onClose={() => setIsDispatchModalOpen(false)}
          draft={currentDraftRecord}
          
          onDispatchRecorded={() => {
            const drafts = getDraftsForComplaint(complaint.complaintNo);
            const existingDraft = drafts.find(d => d.noticeTypeId === noticeConfig.id);
            if (existingDraft) {
              setCurrentDraftRecord(existingDraft);
            }
          }}
        />
      )}
    </div>
  );
}
