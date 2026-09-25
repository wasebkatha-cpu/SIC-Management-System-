import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { apiFetch } from '../lib/apiConfig';
import { generateOfficialNoticeSvg } from '../utils/documentTemplates';
import { parseDateToTimestamp, toDisplayDateFormat } from '../utils/dateUtils';
import { initApiSync } from '../lib/mockDb';
import { initDraftsSync } from '../utils/draftStorage';
import { initInwardsOutwardsSync } from '../utils/inwardOutwardStorage';
import { initCustomNoticesListener } from '../utils/customNoticesStorage';
export { toDisplayDateFormat, parseDateToTimestamp } from '../utils/dateUtils';

export interface AttendanceRecord {
  srNo: number;
  date: string;
  complainant: string;
  respondent: string;
}

export interface ProceedingAttachment {
  name: string;
  type: string; // e.g. 'application/pdf', 'image/png', 'image/jpeg'
  dataUrl: string; // base64 / data URL
  size?: string;
  uploadedAt?: string;
}

export interface ProceedingRecord {
  srNo: number;
  date: string;
  title: string;
  iconType?: string; // e.g. 'Phone', 'Mail', 'Gavel'
  attachment?: ProceedingAttachment;
}

export interface SubmissionRecord {
  id: string;
  inwardNo?: string;
  date: string;
  submittedBy: 'Complainant' | 'Respondent';
  type: string; // e.g. 'Satisfaction', 'Reply', 'Adjournment'
  remarks: string;
  attachment?: ProceedingAttachment;
}

export interface DiaryRecord {
  srNo: number;
  date: string;
  diary: string;
}

export interface EnforcementActionRecord {
  id: string;
  type: string;
  title: string;
  date: string;
  status: string;
  summary: string;
}

// Static Data mappings for Sindh Divisions and Districts
export const SINDH_DIVISIONS: Record<string, string[]> = {
  'Karachi': ['South', 'East', 'West', 'Central', 'Malir', 'Korangi', 'Keamari'],
  'Hyderabad': ['Hyderabad', 'Dadu', 'Jamshoro', 'Matiari', 'Tando Allahyar', 'Tando Muhammad Khan', 'Thatta', 'Sujawal', 'Badin'],
  'Sukkur': ['Sukkur', 'Ghotki', 'Khairpur'],
  'Larkana': ['Larkana', 'Kashmore', 'Jacobabad', 'Shikarpur'],
  'Mirpur Khas': ['Mirpur Khas', 'Umerkot', 'Tharparkar'],
  'Shaheed Benazirabad': ['Nawabshah', 'Sanghar', 'Naushahro Feroze']
};

export interface ReaderData {
  id: string;
  name: string;
  actualName?: string;
  assignedDivisions: string[];
  assignedDistricts: string[];
}

export interface PublicBody {
  id: string;
  srNo: number;
  name: string;
  designatedOfficialName: string;
  designatedOfficialDesignation: string;
  headOfDepartmentName: string;
  headOfDepartmentDesignation: string;
  district: string;
  division: string;
  reader: string;
  website: string;
  email: string;
  contactNumber: string;
  address: string;
  additionalFields?: { name: string; value: string }[];
}

export interface ComplaintData {
  complaintNo: string;
  complainantName: string;
  respondentName: string;
  designatedOfficialName?: string;
  district?: string;
  division?: string;
  counselorComplainant: string;
  counselorRespondent: string;
  previousHearingDate: string;
  nextHearingDate: string;
  statusStage: string;
  remarks: string;
  additionalFields?: { name: string; value: string }[];
  reader: string;
  causeListDates?: string[];
  attendanceHistory: AttendanceRecord[];
  proceedings: ProceedingRecord[];
  diaries: DiaryRecord[];
  submissions?: SubmissionRecord[];
  informationDisclosed?: boolean;
  disclosureDate?: string;
  disclosedInformationSubject?: string;
  disclosureMode?: string;
  disclosureRemarks?: string;
}

/**
 * Checks whether the respondent public body / department has disclosed the information requested by the complainant.
 */
export function isComplaintInformationDisclosed(c: ComplaintData): boolean {
  if (c.informationDisclosed === true) return true;
  if (c.informationDisclosed === false) return false;
  const stage = (c.statusStage || '').toLowerCase();
  const remarks = (c.remarks || '').toLowerCase();
  if (
    stage.includes('disclos') ||
    stage.includes('information provided') ||
    stage.includes('information supplied') ||
    stage.includes('compliance recorded') ||
    stage.includes('satisfaction')
  ) {
    return true;
  }
  if (
    remarks.includes('disclos') ||
    remarks.includes('information provided') ||
    remarks.includes('document submitted') ||
    remarks.includes('supplied') ||
    remarks.includes('provided') ||
    remarks.includes('compliance')
  ) {
    return true;
  }
  if (c.submissions?.some(s => 
    s.type === 'Satisfaction' || 
    (s.remarks && (
      s.remarks.toLowerCase().includes('disclos') || 
      s.remarks.toLowerCase().includes('provided') || 
      s.remarks.toLowerCase().includes('received information')
    ))
  )) {
    return true;
  }
  if (c.proceedings?.some(p => 
    p.title.toLowerCase().includes('information disclosed') ||
    p.title.toLowerCase().includes('compliance recorded') ||
    p.title.toLowerCase().includes('disposed-off order')
  )) {
    return true;
  }
  return false;
}

/**
 * Sorts proceedings in reverse chronological order (most recent first to oldest).
 * Compares issuance date descending, then srNo descending.
 */
export function getSortedProceedings(proceedings: ProceedingRecord[]): ProceedingRecord[] {
  if (!proceedings || proceedings.length === 0) return [];
  return [...proceedings].sort((a, b) => {
    const timeA = parseDateToTimestamp(a.date);
    const timeB = parseDateToTimestamp(b.date);
    if (timeA !== timeB) {
      return timeB - timeA; // Latest date first
    }
    return b.srNo - a.srNo; // Highest srNo first
  });
}

/**
 * Resolves the "Last Order" for a complaint:
 * Explicitly defined as the most recent notice, order, or whatever proceeding was issued.
 * Does not filter out notices or require the word "order" in the title.
 */
export function getMostRecentProceeding(complaint?: ComplaintData | null): ProceedingRecord | null {
  if (!complaint || !complaint.proceedings || complaint.proceedings.length === 0) {
    return null;
  }
  
  const sorted = getSortedProceedings(complaint.proceedings);
  return sorted[0] || null;
}

/**
 * Returns the current stage / last order title for a complaint,
 * representing the most recent notice, order, or whatever was issued.
 */
export function getComplaintCurrentStage(complaint?: ComplaintData | null): string {
  if (!complaint) return 'Hearing in Progress';
  const mostRecent = getMostRecentProceeding(complaint);
  return mostRecent?.title || complaint.statusStage || 'Hearing in Progress';
}

/**
 * Helper to check if a complaint belongs to a particular cause list date (active scheduled or historical archive)
 */
export function isComplaintOnCauseList(c: ComplaintData, dateStr: string): boolean {
  const normDate = toDisplayDateFormat(dateStr);
  if (!normDate) return false;

  // 1. Explicit causeListDates archival registry
  if (c.causeListDates && c.causeListDates.some(d => toDisplayDateFormat(d) === normDate)) {
    return true;
  }
  // 2. Next hearing date matches this cause list
  if (toDisplayDateFormat(c.nextHearingDate) === normDate) {
    return true;
  }
  // 3. Previous hearing date matches this cause list
  if (toDisplayDateFormat(c.previousHearingDate) === normDate) {
    return true;
  }
  // 4. Any recorded attendance on this date
  if (c.attendanceHistory && c.attendanceHistory.some(a => toDisplayDateFormat(a.date) === normDate)) {
    return true;
  }
  // 5. Any recorded diary on this date
  if (c.diaries && c.diaries.some(d => toDisplayDateFormat(d.date) === normDate)) {
    return true;
  }
  // 6. Any proceeding or order issued on this date
  if (c.proceedings && c.proceedings.some(p => toDisplayDateFormat(p.date) === normDate)) {
    return true;
  }

  return false;
}

interface AppContextType {
  complaints: ComplaintData[];
  enforcementActions: EnforcementActionRecord[];
  readers: ReaderData[];
  publicBodies: PublicBody[];
  addPublicBody: (pb: PublicBody) => void;
  addBulkPublicBodies: (pbs: PublicBody[]) => void;
  updatePublicBody: (id: string, updates: Partial<PublicBody>) => void;
  deletePublicBody: (id: string) => void;
  addAttendance: (complaintNo: string, date: string, complainant: string, respondent: string) => void;
  addProceeding: (
    complaintNo: string,
    date: string,
    title: string,
    iconType?: string,
    attachment?: ProceedingAttachment
  ) => void;
  updateProceedingAttachment: (
    complaintNo: string,
    srNo: number,
    attachment: ProceedingAttachment
  ) => void;
  addDiary: (complaintNo: string, date: string, diary: string) => void;
  addSubmission: (complaintNo: string, submission: Omit<SubmissionRecord, 'id'>) => void;
  generateNextInwardNo: (dateStr: string) => string;
  updateHearingDates: (
    complaintNo: string,
    nextHearingDate: string,
    previousHearingDate: string,
    newStatusStage?: string,
    newRemarks?: string,
    recordProceeding?: boolean,
    currentCauseListDate?: string,
    proactiveUpdates?: {
      informationDisclosed?: boolean;
      disclosureDate?: string;
      disclosedInformationSubject?: string;
      disclosureMode?: string;
      disclosureRemarks?: string;
    }
  ) => void;
  updateComplaint: (complaintNo: string, updates: Partial<ComplaintData>) => void;
  addComplaint: (complaint: ComplaintData) => void;
  addEnforcementAction: (action: Omit<EnforcementActionRecord, 'id'>) => void;
  addReader: (reader: Omit<ReaderData, 'id'>) => void;
  updateReader: (id: string, updates: Partial<ReaderData>) => void;
  deleteReader: (id: string) => void;
  getReaderForComplaint: (complaint: ComplaintData) => string;
  getReaderForLocation: (division?: string, district?: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialEnforcementActions: EnforcementActionRecord[] = [
  {
    id: 'ea-1',
    type: 'Penalty',
    title: 'Fine of Rs. 50,000 imposed on PIO, Health Dept',
    date: '10-09-2026',
    status: 'Recovered',
    summary: 'The PIO continuously failed to provide requested information regarding the budget allocation. Therefore, under section 14 of the RTI Act, a maximum penalty of 50,000 was imposed and successfully recovered.'
  },
  {
    id: 'ea-2',
    type: 'Order',
    title: 'Show Cause Notice to Director Admin, LDA',
    date: '08-09-2026',
    status: 'Pending Reply',
    summary: 'A detailed show-cause notice issued directing the official to explain the delay of 45 days in processing the information request regarding town planning.'
  },
  {
    id: 'ea-3',
    type: 'Non-Maintainable',
    title: 'Complaint rejected under Section 6(b)',
    date: '05-09-2026',
    status: 'Disposed',
    summary: 'The requested information falls under classified state secrets and defense security exemptions. Thus, the complaint was dismissed in limine.'
  },
  {
    id: 'ea-4',
    type: 'Proactive Disclosure',
    title: 'Proactive Disclosure Report submitted by HED',
    date: '01-09-2026',
    status: 'Verified',
    summary: 'Higher Education Department submitted their annual proactive disclosure report as mandated by Section 4. All manuals and organizational structures are now publicly available on their website.'
  },
  {
    id: 'ea-5',
    type: 'Penalty',
    title: 'Fine of Rs. 25,000 on PIO, Board of Revenue',
    date: '28-08-2026',
    status: 'Challenged in HC',
    summary: 'Penalty imposed for deliberate concealment of land records. The PIO has challenged this decision in the High Court.'
  }
];

const initialComplaints: ComplaintData[] = [
  {
    complaintNo: 'SIC-2026-01',
    complainantName: 'WASEEM PARHYAR',
    respondentName: 'SERVICES GENERAL ADMINISTRATION & COORDINATION DEPARTMENT, GOVT. OF SINDH',
    division: 'Karachi',
    district: 'South',
    counselorComplainant: 'Adv. Shams ddin',
    counselorRespondent: 'Adv. Khalid Dino',
    previousHearingDate: '25-04-2026',
    nextHearingDate: '14-09-2026',
    statusStage: 'Disposed-Off Order issued',
    remarks: 'Disposed-Off - Information disclosed and provided to complainant',
    informationDisclosed: true,
    disclosureDate: '14-09-2026',
    disclosedInformationSubject: 'Seniority list & cadre transfer notifications of Secretariat staff',
    reader: 'Reader I',
    causeListDates: ['14-09-2026'],
    attendanceHistory: [
      { srNo: 1, date: "25-04-2026", complainant: "Adv. Shams ddin on behalf of complainant", respondent: "Present" },
      { srNo: 2, date: "10-02-2026", complainant: "Present", respondent: "Adv. Khalid Dino on behalf of respondent" }
    ],
    proceedings: [
      { srNo: 1, date: "25-04-2026", title: "Call report", iconType: "Phone" },
      { 
        srNo: 2, 
        date: "15-05-2026", 
        title: "First Notice issued", 
        iconType: "Mail",
        attachment: {
          name: "First_Hearing_Notice_SIC_2026_01.png",
          type: "image/png",
          dataUrl: generateOfficialNoticeSvg({
            title: "First Notice of Hearing",
            complaintNo: "SIC-2026-01",
            date: "15-05-2026",
            complainantName: "WASEEM PARHYAR",
            respondentName: "SERVICES GENERAL ADMINISTRATION & COORDINATION DEPARTMENT, GOVT. OF SINDH"
          }),
          size: "186 KB",
          uploadedAt: "15-05-2026"
        }
      },
      { srNo: 3, date: "02-06-2026", title: "Final Notice Issued", iconType: "Mail" },
      { srNo: 4, date: "20-06-2026", title: "Repeat Final Notice issued", iconType: "Mail" },
      { 
        srNo: 5, 
        date: "10-07-2026", 
        title: "Order issued", 
        iconType: "Gavel",
        attachment: {
          name: "Commission_Order_SIC_2026_01.png",
          type: "image/png",
          dataUrl: generateOfficialNoticeSvg({
            title: "Interim Order Sheet",
            complaintNo: "SIC-2026-01",
            date: "10-07-2026",
            complainantName: "WASEEM PARHYAR",
            respondentName: "SERVICES GENERAL ADMINISTRATION & COORDINATION DEPARTMENT, GOVT. OF SINDH"
          }),
          size: "215 KB",
          uploadedAt: "10-07-2026"
        }
      },
      { srNo: 6, date: "01-08-2026", title: "Show Cause Notice Issued", iconType: "FileWarning" },
      { srNo: 7, date: "15-08-2026", title: "Final Show Cause Notice Issued", iconType: "FileWarning" },
      { srNo: 8, date: "01-09-2026", title: "Adjournment Order Issued", iconType: "FileText" },
      { srNo: 9, date: "14-09-2026", title: "Disposed-Off Order issued", iconType: "CheckCircle" },
    ],
    diaries: [
      { srNo: 1, date: "14-09-2026", diary: "Case called, complainant present, none appeared for respondent, Commission received Application dated 10-09-2026 from respondent for adjournment of the matter to properly reply the notice issued by Commission." }
    ]
  },
  {
    complaintNo: 'SIC-2026-14',
    complainantName: 'AHMED ALI',
    respondentName: 'HOME DEPARTMENT, GOVT. OF SINDH',
    division: 'Hyderabad',
    district: 'Hyderabad',
    counselorComplainant: 'Adv. Rizwan',
    counselorRespondent: 'Adv. Asif',
    previousHearingDate: '10-05-2026',
    nextHearingDate: '15-09-2026',
    statusStage: 'First Notice issued',
    remarks: 'Pending',
    reader: 'Reader II',
    causeListDates: ['15-09-2026'],
    attendanceHistory: [],
    proceedings: [
      { srNo: 1, date: "10-05-2026", title: "First Notice issued", iconType: "Mail" }
    ],
    diaries: []
  },
  {
    complaintNo: 'SIC-2026-22',
    complainantName: 'SANA ULLAH',
    respondentName: 'HEALTH DEPARTMENT, GOVT. OF SINDH',
    division: 'Karachi',
    district: 'East',
    counselorComplainant: 'None',
    counselorRespondent: 'Adv. Farooq',
    previousHearingDate: '12-08-2026',
    nextHearingDate: '16-09-2026',
    statusStage: 'Information Disclosed',
    remarks: 'Disposed-Off - Complete medicine stock register & purchase orders disclosed to complainant',
    informationDisclosed: true,
    disclosureDate: '12-08-2026',
    disclosedInformationSubject: 'District Hospital essential medicine stock inventory & purchase vouchers',
    reader: 'Reader I',
    causeListDates: ['16-09-2026'],
    attendanceHistory: [],
    proceedings: [
      { srNo: 1, date: "12-08-2026", title: "Information Disclosed", iconType: "CheckCircle" }
    ],
    diaries: []
  },
  {
    complaintNo: 'SIC-2026-30',
    complainantName: 'TARIQ MEHMOOD',
    respondentName: 'EDUCATION DEPARTMENT, GOVT. OF SINDH',
    division: 'Sukkur',
    district: 'Sukkur',
    counselorComplainant: 'Adv. Bilal',
    counselorRespondent: 'None',
    previousHearingDate: '01-09-2026',
    nextHearingDate: '16-09-2026',
    statusStage: 'Information Disclosed',
    remarks: 'Document submitted - Primary school construction budget & teacher payroll disclosed',
    informationDisclosed: true,
    disclosureDate: '01-09-2026',
    disclosedInformationSubject: 'Primary schools rehabilitation expenditure & teacher attendance registers',
    reader: 'Reader III',
    causeListDates: ['16-09-2026'],
    attendanceHistory: [],
    proceedings: [
      { srNo: 1, date: "01-09-2026", title: "Information Disclosed", iconType: "CheckCircle" }
    ],
    diaries: []
  },
  {
    complaintNo: 'SIC-2026-38',
    complainantName: 'ABDUL SATTAR',
    respondentName: 'LOCAL GOVERNMENT & TOWN PLANNING DEPARTMENT, GOVT. OF SINDH',
    division: 'Larkana',
    district: 'Larkana',
    counselorComplainant: 'Adv. M. Ali',
    counselorRespondent: 'None',
    previousHearingDate: '05-09-2026',
    nextHearingDate: '20-09-2026',
    statusStage: 'Information Disclosed',
    remarks: 'Disclosed - Municipal development fund breakdown and contractor contracts supplied',
    informationDisclosed: true,
    disclosureDate: '05-09-2026',
    disclosedInformationSubject: 'Municipal drainage project expenditure and contractor agreements',
    reader: 'Reader II',
    causeListDates: ['20-09-2026'],
    attendanceHistory: [],
    proceedings: [
      { srNo: 1, date: "05-09-2026", title: "Information Disclosed", iconType: "CheckCircle" }
    ],
    diaries: []
  },
  {
    complaintNo: 'SIC-2026-45',
    complainantName: 'GHULAM MUSTAFA',
    respondentName: 'BOARD OF REVENUE, GOVT. OF SINDH',
    division: 'Hyderabad',
    district: 'Hyderabad',
    counselorComplainant: 'Adv. Shams',
    counselorRespondent: 'Adv. K. Dino',
    previousHearingDate: '08-09-2026',
    nextHearingDate: '22-09-2026',
    statusStage: 'Information Disclosed',
    remarks: 'Disposed-Off - Deh map and agricultural survey land mutation extracts provided',
    informationDisclosed: true,
    disclosureDate: '08-09-2026',
    disclosedInformationSubject: 'Deh map records and mutated agricultural land register extracts',
    reader: 'Reader II',
    causeListDates: ['22-09-2026'],
    attendanceHistory: [],
    proceedings: [
      { srNo: 1, date: "08-09-2026", title: "Information Disclosed", iconType: "CheckCircle" }
    ],
    diaries: []
  },
  {
    complaintNo: 'SIC-2026-52',
    complainantName: 'MUHAMMAD FARHAN',
    respondentName: 'POLICE DEPARTMENT, GOVT. OF SINDH',
    division: 'Karachi',
    district: 'Central',
    counselorComplainant: 'Self',
    counselorRespondent: 'Inspector Legal',
    previousHearingDate: '11-09-2026',
    nextHearingDate: '24-09-2026',
    statusStage: 'Information Disclosed',
    remarks: 'Disclosed - Citizen facilitation center logs and inquiry report provided',
    informationDisclosed: true,
    disclosureDate: '11-09-2026',
    disclosedInformationSubject: 'Police station citizen complaint redressal records and standard operating manuals',
    reader: 'Reader I',
    causeListDates: ['24-09-2026'],
    attendanceHistory: [],
    proceedings: [
      { srNo: 1, date: "11-09-2026", title: "Information Disclosed", iconType: "CheckCircle" }
    ],
    diaries: []
  },
  {
    complaintNo: 'SIC-2026-61',
    complainantName: 'NOOR HASSAN',
    respondentName: 'AGRICULTURE, SUPPLY & PRICES DEPARTMENT, GOVT. OF SINDH',
    division: 'Mirpur Khas',
    district: 'Mirpur Khas',
    counselorComplainant: 'Adv. Bilal',
    counselorRespondent: 'None',
    previousHearingDate: '03-09-2026',
    nextHearingDate: '25-09-2026',
    statusStage: 'Information Disclosed',
    remarks: 'Disposed-Off - Wheat seed subsidy beneficiary list and dealer quota disclosed',
    informationDisclosed: true,
    disclosureDate: '03-09-2026',
    disclosedInformationSubject: 'Wheat subsidy distribution lists and authorized dealer quotas',
    reader: 'Reader III',
    causeListDates: ['25-09-2026'],
    attendanceHistory: [],
    proceedings: [
      { srNo: 1, date: "03-09-2026", title: "Information Disclosed", iconType: "CheckCircle" }
    ],
    diaries: []
  }
];

const initialReaders: ReaderData[] = [
  { id: 'r-1', name: 'Reader I', actualName: 'Siraj Ahmed', assignedDivisions: ['Karachi'], assignedDistricts: ['South'] },
  { id: 'r-2', name: 'Reader II', actualName: 'Tariq Mehmood', assignedDivisions: ['Hyderabad'], assignedDistricts: [] },
  { id: 'r-3', name: 'Reader III', actualName: 'Asif Ali', assignedDivisions: [], assignedDistricts: ['Sukkur'] }
];

const initialMockPublicBodies: PublicBody[] = [
  {
    id: "pb-1",
    srNo: 1,
    name: "Department of Health",
    designatedOfficialName: "Dr. Ayesha Khan",
    designatedOfficialDesignation: "Deputy Secretary",
    headOfDepartmentName: "Mr. Ali Jan",
    headOfDepartmentDesignation: "Secretary Health",
    district: "Lahore",
    division: "Lahore",
    reader: "I",
    website: "health.punjab.gov.pk",
    email: "info@health.punjab.gov.pk",
    contactNumber: "042-99200000",
    address: "Civil Secretariat, Lahore"
  },
  {
    id: "pb-2",
    srNo: 2,
    name: "Lahore Development Authority (LDA)",
    designatedOfficialName: "Mr. Tariq Mehmood",
    designatedOfficialDesignation: "Director Admin",
    headOfDepartmentName: "Mr. Muhammad Ali Randhawa",
    headOfDepartmentDesignation: "Director General LDA",
    district: "Lahore",
    division: "Lahore",
    reader: "II",
    website: "lda.gop.pk",
    email: "contact@lda.gop.pk",
    contactNumber: "042-99262222",
    address: "LDA Plaza, Egerton Road, Lahore"
  },
  {
    id: "pb-3",
    srNo: 3,
    name: "Board of Revenue",
    designatedOfficialName: "Syed Ali Raza",
    designatedOfficialDesignation: "Assistant Secretary",
    headOfDepartmentName: "Mr. Nabeel Awan",
    headOfDepartmentDesignation: "Senior Member Board of Revenue",
    district: "Rawalpindi",
    division: "Rawalpindi",
    reader: "III",
    website: "bor.punjab.gov.pk",
    email: "smbr@punjab.gov.pk",
    contactNumber: "051-9270000",
    address: "Revenue Complex, Rawalpindi"
  },
  {
    id: "pb-4",
    srNo: 4,
    name: "Punjab Police",
    designatedOfficialName: "DIG Operations",
    designatedOfficialDesignation: "DIG",
    headOfDepartmentName: "Dr. Usman Anwar",
    headOfDepartmentDesignation: "IG Punjab",
    district: "Lahore",
    division: "Lahore",
    reader: "I",
    website: "punjabpolice.gov.pk",
    email: "igp@punjabpolice.gov.pk",
    contactNumber: "042-99213019",
    address: "CPO Complex, Lahore"
  },
  {
    id: "pb-5",
    srNo: 5,
    name: "Higher Education Department",
    designatedOfficialName: "Dr. Salman Shah",
    designatedOfficialDesignation: "Additional Secretary",
    headOfDepartmentName: "Dr. Farrukh Naveed",
    headOfDepartmentDesignation: "Secretary HED",
    district: "Multan",
    division: "Multan",
    reader: "II",
    website: "hed.punjab.gov.pk",
    email: "info@hed.punjab.gov.pk",
    contactNumber: "061-9200000",
    address: "Civil Secretariat, Multan"
  }
];

import { useAuth } from './AuthContext';
import { MockDB } from '../lib/mockDb';

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { logActivity, user } = useAuth();
  const [complaints, setComplaints] = useState<ComplaintData[]>([]);
  const [enforcementActions, setEnforcementActions] = useState<EnforcementActionRecord[]>([]);
  const [readers, setReaders] = useState<ReaderData[]>([]);
  const [publicBodies, setPublicBodies] = useState<PublicBody[]>([]);

  useEffect(() => {
    // Initial fetch from PostgreSQL via Express API
    const fetchData = async () => {
      try {
        const [compRes, eaRes, readRes, pbRes, msgRes] = await Promise.all([
          apiFetch('/api/complaints'),
          apiFetch('/api/enforcement_actions'),
          apiFetch('/api/readers'),
          apiFetch('/api/public_bodies'),
          apiFetch('/api/messages')
        ]);
        
        if (compRes.ok) setComplaints(await compRes.json());
        if (eaRes.ok) setEnforcementActions(await eaRes.json());
        if (readRes.ok) setReaders(await readRes.json());
        if (pbRes.ok) setPublicBodies(await pbRes.json());
        if (msgRes.ok) {
          const messages = await msgRes.json();
          MockDB.setMessages(messages);
        }
      } catch (err) {
        console.error('Failed to fetch initial data from API:', err);
      }
    };
    
    // Initial fetch
    fetchData();
    initApiSync();
    initDraftsSync();
    initInwardsOutwardsSync();
    initCustomNoticesListener();

    // Global polling loop for client PCs to stay in sync
    const pollInterval = setInterval(() => {
      fetchData();
      initApiSync();
      initDraftsSync();
      initInwardsOutwardsSync();
      initCustomNoticesListener();
    }, 15000); // Poll every 15 seconds

    return () => clearInterval(pollInterval);
  }, []);

  const syncToApi = async (pathName: string, data: any) => {
    try {
      await apiFetch(`/api/${pathName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (e) {
      console.error(`Failed to sync to /api/${pathName}:`, e);
    }
  };

  const deleteFromApi = async (pathName: string, id: string) => {
    try {
      await apiFetch(`/api/${pathName}/${id}`, {
        method: 'DELETE'
      });
    } catch (e) {
      console.error(`Failed to delete from /api/${pathName}:`, e);
    }
  };

  const getReaderForLocation = (division?: string, district?: string): string => {
    // Exact District match
    if (district) {
      const districtMatch = readers.find(r => r.assignedDistricts?.some(d => d.toLowerCase() === district.toLowerCase()));
      if (districtMatch) return districtMatch.name;
    }
    // Exact Division match
    if (division) {
      const divisionMatch = readers.find(r => r.assignedDivisions?.some(d => d.toLowerCase() === division.toLowerCase()));
      if (divisionMatch) return divisionMatch.name;
    }
    return '';
  };

  const getReaderForComplaint = (complaint: ComplaintData) => {
    let assigned = '';

    // 1. Prioritize Explicit complaint location (Division / District)
    if (complaint.division || complaint.district) {
      assigned = getReaderForLocation(complaint.division, complaint.district);
      if (assigned) return assigned;
    }

    // 2. Fallback to Respondent (Public Body/Department) location
    if (complaint.respondentName) {
      const pb = publicBodies.find(p => p.name.toLowerCase() === complaint.respondentName.toLowerCase());
      if (pb) {
        assigned = getReaderForLocation(pb.division, pb.district);
        if (assigned) return assigned;
      }
    }

    // 3. Fallback to static reader if exists, otherwise Unassigned
    return complaint.reader || 'Unassigned';
  };

  const filteredReaders = React.useMemo(() => {
    if (user?.role === 'admin' && user.assignedReaderId) {
      return readers.filter(r => r.id === user.assignedReaderId);
    }
    return readers;
  }, [readers, user]);

  const filteredComplaints = React.useMemo(() => {
    if (user?.role === 'admin' && user.assignedReaderId) {
      const assignedReader = readers.find(r => r.id === user.assignedReaderId);
      if (assignedReader) {
        return complaints.filter(c => getReaderForComplaint(c) === assignedReader.name);
      }
    }
    return complaints;
  }, [complaints, readers, user, publicBodies]);

  const filteredPublicBodies = React.useMemo(() => {
    if (user?.role === 'admin' && user.assignedReaderId) {
      const assignedReader = readers.find(r => r.id === user.assignedReaderId);
      if (assignedReader) {
        return publicBodies.filter(pb => getReaderForLocation(pb.division, pb.district) === assignedReader.name);
      }
    }
    return publicBodies;
  }, [publicBodies, readers, user]);

  const addPublicBody = (pb: PublicBody) => {
    setPublicBodies(prev => [...prev, pb]);
    syncToApi('public_bodies', pb);
    logActivity(`Added new public body: ${pb.name}`);
  };

  const addBulkPublicBodies = (pbs: PublicBody[]) => {
    setPublicBodies(prev => [...prev, ...pbs]);
    pbs.forEach(pb => syncToApi('public_bodies', pb));
    logActivity(`Bulk added ${pbs.length} designated officials/public bodies`);
  };

  const updatePublicBody = (id: string, updates: Partial<PublicBody>) => {
    setPublicBodies(prev => prev.map(pb => {
      if (pb.id === id) {
        const updated = { ...pb, ...updates };
        syncToApi('public_bodies', updated);
        return updated;
      }
      return pb;
    }));
    const updatedPb = publicBodies.find(pb => pb.id === id);
    if (updatedPb) {
      logActivity(`Updated public body details: ${updatedPb.name}`);
    } else {
      logActivity(`Updated public body ID: ${id}`);
    }
  };

  const deletePublicBody = (id: string) => {
    const pb = publicBodies.find(p => p.id === id);
    if (pb) {
      setPublicBodies(prev => prev.filter(p => p.id !== id));
      deleteFromApi('public_bodies', id);
      logActivity(`Deleted public body/official: ${pb.name}`);
    }
  };

  const addReader = (reader: Omit<ReaderData, 'id'>) => {
    const newReader = {
      ...reader,
      id: `r-${Date.now()}`
    };
    setReaders(prev => [...prev, newReader]);
    syncToApi('readers', newReader);
    logActivity(`Added new reader: ${reader.name}`);
  };

  const updateReader = (id: string, updates: Partial<ReaderData>) => {
    setReaders(prev => prev.map(r => {
      if (r.id === id) {
        const updated = { ...r, ...updates };
        syncToApi('readers', updated);
        return updated;
      }
      return r;
    }));
    logActivity(`Updated reader details for ID: ${id}`);
  };

  const deleteReader = (id: string) => {
    setReaders(prev => prev.filter(r => r.id !== id));
    deleteFromApi('readers', id);
    logActivity(`Deleted reader ID: ${id}`);
  };

  const addEnforcementAction = (action: Omit<EnforcementActionRecord, 'id'>) => {
    const newAction = {
      ...action,
      id: `ea-${Date.now()}`
    };
    setEnforcementActions(prev => [...prev, newAction]);
    syncToApi('enforcement_actions', newAction);
    logActivity(`Added enforcement action: ${action.title}`);
  };

  const addAttendance = (complaintNo: string, date: string, complainant: string, respondent: string) => {
    const normalizedDate = toDisplayDateFormat(date);
    setComplaints(prev => prev.map(c => {
      if (c.complaintNo === complaintNo) {
        const srNo = (c.attendanceHistory?.length || 0) + 1;
        const newRecord: AttendanceRecord = {
          srNo,
          date: normalizedDate || date,
          complainant,
          respondent
        };
        const existingDates = c.causeListDates && c.causeListDates.length > 0
          ? c.causeListDates
          : [toDisplayDateFormat(c.nextHearingDate)].filter(Boolean);
        const updatedCauseListDates = Array.from(new Set([...existingDates, normalizedDate])).filter(Boolean);

        const updated = { 
          ...c, 
          attendanceHistory: [newRecord, ...(c.attendanceHistory || [])],
          causeListDates: updatedCauseListDates
        };
        syncToApi('complaints', updated);
        return updated;
      }
      return c;
    }));
    logActivity(`Recorded Cause List attendance for complaint ${complaintNo} on ${date}. Complainant: ${complainant}, Respondent: ${respondent}.`);
  };

  const addProceeding = (
    complaintNo: string,
    date: string,
    title: string,
    iconType: string = 'FileText',
    attachment?: ProceedingAttachment
  ) => {
    const normalizedDate = toDisplayDateFormat(date);
    setComplaints(prev => prev.map(c => {
      if (c.complaintNo === complaintNo) {
        const nextSrNo = (c.proceedings?.length || 0) > 0
          ? Math.max(...c.proceedings.map(p => p.srNo)) + 1
          : 1;
        const newRecord: ProceedingRecord = {
          srNo: nextSrNo,
          date: normalizedDate || date,
          title,
          iconType,
          attachment
        };
        const updatedProceedings = [...(c.proceedings || []), newRecord];
        const mostRecent = getMostRecentProceeding({ ...c, proceedings: updatedProceedings });
        const existingDates = c.causeListDates && c.causeListDates.length > 0
          ? c.causeListDates
          : [toDisplayDateFormat(c.nextHearingDate)].filter(Boolean);
        const updatedCauseListDates = Array.from(new Set([...existingDates, normalizedDate])).filter(Boolean);

        const updated = { 
          ...c, 
          proceedings: updatedProceedings,
          statusStage: mostRecent?.title || title || c.statusStage,
          causeListDates: updatedCauseListDates
        };
        syncToApi('complaints', updated);
        return updated;
      }
      return c;
    }));
    logActivity(`Added Cause List proceeding "${title}" to complaint ${complaintNo} on ${date}.`);
  };

  const updateProceedingAttachment = (
    complaintNo: string,
    srNo: number,
    attachment: ProceedingAttachment
  ) => {
    setComplaints(prev => prev.map(c => {
      if (c.complaintNo === complaintNo) {
        const updated = {
          ...c,
          proceedings: (c.proceedings || []).map(p => {
            if (p.srNo === srNo) {
              return { ...p, attachment };
            }
            return p;
          })
        };
        syncToApi('complaints', updated);
        return updated;
      }
      return c;
    }));
    logActivity(`Updated Cause List proceeding attachment for proceeding SrNo. ${srNo} in complaint ${complaintNo}.`);
  };

  const generateNextInwardNo = (dateStr: string) => {
    if (!dateStr || !dateStr.includes('-')) return '';
    
    const [year, month, day] = dateStr.split('-');
    
    let maxNumber = 0;
    
    complaints.forEach(complaint => {
      if (complaint.submissions) {
        complaint.submissions.forEach(sub => {
          if (sub.inwardNo) {
            const match = sub.inwardNo.match(/Inward No\. (\d+)\/(\d{4})/);
            if (match) {
              const num = parseInt(match[1], 10);
              const subYear = match[2];
              
              if (subYear === year && num > maxNumber) {
                maxNumber = num;
              }
            }
          }
        });
      }
    });
    
    const nextNum = maxNumber + 1;
    const formattedNum = nextNum.toString().padStart(2, '0');
    
    const formattedDate = `${day}.${month}.${year}`;
    
    return `Inward No. ${formattedNum}/${year} dated ${formattedDate}`;
  };

  const addSubmission = (complaintNo: string, submission: Omit<SubmissionRecord, 'id'>) => {
    const normalizedDate = toDisplayDateFormat(submission.date) || submission.date;
    setComplaints(prev => prev.map(c => {
      if (c.complaintNo === complaintNo) {
        const newRecord: SubmissionRecord = {
          ...submission,
          id: `sub-${Math.random().toString(36).substr(2, 9)}`,
          date: normalizedDate
        };
        const currentSubmissions = c.submissions || [];
        const updated = { 
          ...c, 
          submissions: [newRecord, ...currentSubmissions]
        };
        syncToApi('complaints', updated);
        return updated;
      }
      return c;
    }));
    logActivity(`Added "${submission.type}" submission by ${submission.submittedBy} for complaint ${complaintNo}. Date: ${normalizedDate}. Remarks: ${submission.remarks || 'None'}`);
  };

  const addDiary = (complaintNo: string, date: string, diary: string) => {
    const normalizedDate = toDisplayDateFormat(date);
    setComplaints(prev => prev.map(c => {
      if (c.complaintNo === complaintNo) {
        const newRecord: DiaryRecord = {
          srNo: c.diaries.length + 1,
          date: normalizedDate || date,
          diary
        };
        const existingDates = c.causeListDates && c.causeListDates.length > 0
          ? c.causeListDates
          : [toDisplayDateFormat(c.nextHearingDate)].filter(Boolean);
        const updatedCauseListDates = Array.from(new Set([...existingDates, normalizedDate])).filter(Boolean);

        const updated = { 
          ...c, 
          diaries: [newRecord, ...c.diaries],
          causeListDates: updatedCauseListDates
        };
        syncToApi('complaints', updated);
        return updated;
      }
      return c;
    }));
    logActivity(`Added Cause List diary entry for complaint ${complaintNo} on ${date}. Details: "${diary.substring(0, 80)}${diary.length > 80 ? '...' : ''}"`);
  };

  const updateHearingDates = (
    complaintNo: string,
    nextHearingDate: string,
    previousHearingDate: string,
    newStatusStage?: string,
    newRemarks?: string,
    recordProceeding: boolean = true,
    currentCauseListDate?: string,
    proactiveUpdates?: {
      informationDisclosed?: boolean;
      disclosureDate?: string;
      disclosedInformationSubject?: string;
      disclosureMode?: string;
      disclosureRemarks?: string;
    }
  ) => {
    const normalizedNext = toDisplayDateFormat(nextHearingDate.trim());
    const normalizedPrev = toDisplayDateFormat(previousHearingDate.trim());
    const normalizedCurrent = currentCauseListDate ? toDisplayDateFormat(currentCauseListDate.trim()) : '';

    setComplaints(prev => prev.map(c => {
      if (c.complaintNo === complaintNo) {
        const updatedProceedings = [...c.proceedings];
        const effectiveStage = newStatusStage !== undefined && newStatusStage.trim() !== '' 
          ? newStatusStage.trim() 
          : c.statusStage;

        if (recordProceeding && effectiveStage && effectiveStage !== c.statusStage) {
          updatedProceedings.push({
            srNo: updatedProceedings.length + 1,
            date: normalizedCurrent || normalizedPrev || toDisplayDateFormat(new Date().toISOString().split('T')[0]),
            title: effectiveStage,
            iconType: 'FileText'
          });
        }

        // Preserve all historical cause list dates for archival, and register new scheduled hearing date
        const existingDates = (c.causeListDates && c.causeListDates.length > 0)
          ? c.causeListDates
          : [toDisplayDateFormat(c.nextHearingDate)].filter(Boolean);

        const updatedCauseListDates = Array.from(
          new Set([
            ...existingDates,
            normalizedCurrent,
            normalizedPrev,
            normalizedNext,
            toDisplayDateFormat(c.nextHearingDate)
          ])
        ).filter(Boolean);

        const updated = {
          ...c,
          ...(proactiveUpdates || {}),
          nextHearingDate: normalizedNext,
          previousHearingDate: normalizedCurrent || normalizedPrev,
          statusStage: effectiveStage,
          remarks: newRemarks !== undefined && newRemarks.trim() !== '' ? newRemarks.trim() : c.remarks,
          proceedings: updatedProceedings,
          causeListDates: updatedCauseListDates
        };
        syncToApi('complaints', updated);
        return updated;
      }
      return c;
    }));
    logActivity(`Updated Cause List schedule for complaint ${complaintNo}. Next hearing: ${nextHearingDate}, Last hearing: ${previousHearingDate}, Status/Stage: ${newStatusStage || 'Unchanged'}`);
  };

  const updateComplaint = async (complaintNo: string, updates: Partial<ComplaintData>) => {
    setComplaints(prev => prev.map(c => {
      if (c.complaintNo === complaintNo) {
        const updated = { ...c, ...updates };
        syncToApi('complaints', updated);
        return updated;
      }
      return c;
    }));
    logActivity(`Updated details for complaint ${complaintNo}`);
  };

  const addComplaint = (complaint: ComplaintData) => {
    setComplaints(prev => [complaint, ...prev]);
    syncToApi('complaints', complaint);
  };

  return (
    <AppContext.Provider value={{ 
      complaints: filteredComplaints, 
      enforcementActions, 
      readers: filteredReaders,
      publicBodies: filteredPublicBodies,
      addPublicBody,
      addBulkPublicBodies,
      updatePublicBody,
      deletePublicBody,
      addAttendance, 
      addProceeding, 
      updateProceedingAttachment, 
      addDiary, 
      addSubmission,
      generateNextInwardNo,
      updateHearingDates, 
      updateComplaint, 
      addComplaint,
      addEnforcementAction,
      addReader,
      updateReader,
      deleteReader,
      getReaderForComplaint,
      getReaderForLocation
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
