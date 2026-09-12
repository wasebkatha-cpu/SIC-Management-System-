import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface AttendanceRecord {
  srNo: number;
  date: string;
  complainant: string;
  respondent: string;
}

export interface ProceedingRecord {
  srNo: number;
  date: string;
  title: string;
  iconType?: string; // e.g. 'Phone', 'Mail', 'Gavel'
}

export interface DiaryRecord {
  srNo: number;
  date: string;
  diary: string;
}

export interface ComplaintData {
  complaintNo: string;
  complainantName: string;
  respondentName: string;
  counselorComplainant: string;
  counselorRespondent: string;
  previousHearingDate: string;
  nextHearingDate: string;
  statusStage: string;
  remarks: string;
  reader: string;
  attendanceHistory: AttendanceRecord[];
  proceedings: ProceedingRecord[];
  diaries: DiaryRecord[];
}

interface AppContextType {
  complaints: ComplaintData[];
  addAttendance: (complaintNo: string, date: string, complainant: string, respondent: string) => void;
  addProceeding: (complaintNo: string, date: string, title: string) => void;
  addDiary: (complaintNo: string, date: string, diary: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialComplaints: ComplaintData[] = [
  {
    complaintNo: 'SIC-2026-01',
    complainantName: 'WASEEM PARHYAR',
    respondentName: 'SERVICES GENERAL ADMINISTRATION & COORDINATION DEPARTMENT, GOVT. OF SINDH',
    counselorComplainant: 'Adv. Shams ddin',
    counselorRespondent: 'Adv. Khalid Dino',
    previousHearingDate: '25-04-2026',
    nextHearingDate: '14-09-2026',
    statusStage: 'Final Notice issued',
    remarks: 'Adjourned',
    reader: 'Reader I',
    attendanceHistory: [
      { srNo: 1, date: "25-04-2026", complainant: "Adv. Shams ddin on behalf of complainant", respondent: "Present" },
      { srNo: 2, date: "10-02-2026", complainant: "Present", respondent: "Adv. Khalid Dino on behalf of respondent" }
    ],
    proceedings: [
      { srNo: 1, date: "25-04-2026", title: "Call report", iconType: "Phone" },
      { srNo: 2, date: "15-05-2026", title: "First Notice issued", iconType: "Mail" },
      { srNo: 3, date: "02-06-2026", title: "Final Notice Issued", iconType: "Mail" },
      { srNo: 4, date: "20-06-2026", title: "Repeat Final Notice issued", iconType: "Mail" },
      { srNo: 5, date: "10-07-2026", title: "Order issued", iconType: "Gavel" },
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
    counselorComplainant: 'Adv. Rizwan',
    counselorRespondent: 'Adv. Asif',
    previousHearingDate: '10-05-2026',
    nextHearingDate: '15-09-2026',
    statusStage: 'First Notice',
    remarks: 'Pending',
    reader: 'Reader II',
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
    counselorComplainant: 'None',
    counselorRespondent: 'Adv. Farooq',
    previousHearingDate: '12-08-2026',
    nextHearingDate: '16-09-2026',
    statusStage: 'Order',
    remarks: 'Disposed-Off',
    reader: 'Reader I',
    attendanceHistory: [],
    proceedings: [
      { srNo: 1, date: "12-08-2026", title: "Order issued", iconType: "Gavel" }
    ],
    diaries: []
  },
  {
    complaintNo: 'SIC-2026-30',
    complainantName: 'TARIQ MEHMOOD',
    respondentName: 'EDUCATION DEPARTMENT, GOVT. OF SINDH',
    counselorComplainant: 'Adv. Bilal',
    counselorRespondent: 'None',
    previousHearingDate: '01-09-2026',
    nextHearingDate: '16-09-2026',
    statusStage: 'Call Report',
    remarks: 'Document submitted',
    reader: 'Reader III',
    attendanceHistory: [],
    proceedings: [
      { srNo: 1, date: "01-09-2026", title: "Call report", iconType: "Phone" }
    ],
    diaries: []
  }
];

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [complaints, setComplaints] = useState<ComplaintData[]>(initialComplaints);

  const addAttendance = (complaintNo: string, date: string, complainant: string, respondent: string) => {
    setComplaints(prev => prev.map(c => {
      if (c.complaintNo === complaintNo) {
        const newRecord: AttendanceRecord = {
          srNo: c.attendanceHistory.length + 1,
          date,
          complainant,
          respondent
        };
        return { ...c, attendanceHistory: [newRecord, ...c.attendanceHistory] };
      }
      return c;
    }));
  };

  const addProceeding = (complaintNo: string, date: string, title: string) => {
    setComplaints(prev => prev.map(c => {
      if (c.complaintNo === complaintNo) {
        const newRecord: ProceedingRecord = {
          srNo: c.proceedings.length + 1,
          date,
          title,
          iconType: 'FileText' // Default icon
        };
        return { ...c, proceedings: [...c.proceedings, newRecord] };
      }
      return c;
    }));
  };

  const addDiary = (complaintNo: string, date: string, diary: string) => {
    setComplaints(prev => prev.map(c => {
      if (c.complaintNo === complaintNo) {
        const newRecord: DiaryRecord = {
          srNo: c.diaries.length + 1,
          date,
          diary
        };
        return { ...c, diaries: [...c.diaries, newRecord] };
      }
      return c;
    }));
  };

  return (
    <AppContext.Provider value={{ complaints, addAttendance, addProceeding, addDiary }}>
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
