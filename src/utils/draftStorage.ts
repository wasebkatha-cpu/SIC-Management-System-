import { ComplaintData, PublicBody } from '../context/AppContext';

export interface NoticeDraftDispatchHistory {
  id: string;
  channel: 'gmail' | 'whatsapp';
  recipientRole: 'complainant' | 'respondent' | 'other';
  recipientName: string;
  recipientAddress: string;
  dispatchedAt: string;
  dispatchedBy: string;
}

export interface NoticeDraftRecord {
  id: string;
  complaintNo: string;
  noticeTypeId: string;
  title: string;
  category: 'Notice' | 'Order';
  contentHtml: string;
  contentText: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    userId: string;
    name: string;
    role: 'superUser' | 'admin';
  };
  complainant: {
    name: string;
    email?: string;
    contactNumber?: string;
  };
  respondent: {
    department: string;
    officialName?: string;
    designation?: string;
    email?: string;
    contactNumber?: string;
  };
  nextHearingDate?: string;
  status: 'draft' | 'dispatched' | 'issued';
  dispatches: NoticeDraftDispatchHistory[];
  isReadBySuperUser?: boolean;
}

const STORAGE_KEY = 'sic_notice_drafts_v1';

export function getStoredDrafts(): NoticeDraftRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading notice drafts from storage:', err);
    return [];
  }
}

export function getDraftsForComplaint(complaintNo: string): NoticeDraftRecord[] {
  const all = getStoredDrafts();
  return all.filter(d => d.complaintNo.toLowerCase() === complaintNo.toLowerCase());
}

export function getUnreadDraftsCount(): number {
  const drafts = getStoredDrafts();
  return drafts.filter(d => d.isReadBySuperUser === false).length;
}

export function markAllDraftsAsRead(): void {
  const all = getStoredDrafts();
  all.forEach(d => {
    d.isReadBySuperUser = true;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  window.dispatchEvent(new CustomEvent('notice_drafts_updated', { detail: all }));
}

export function saveNoticeDraft(draft: NoticeDraftRecord): NoticeDraftRecord {
  const all = getStoredDrafts();
  const existingIdx = all.findIndex(d => d.id === draft.id);

  let updatedList: NoticeDraftRecord[];
  if (existingIdx >= 0) {
    updatedList = [...all];
    updatedList[existingIdx] = {
      ...updatedList[existingIdx],
      ...draft,
      updatedAt: new Date().toISOString()
    };
  } else {
    updatedList = [draft, ...all];
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));

  // Dispatch events for real-time reactivity across components
  window.dispatchEvent(new CustomEvent('notice_draft_added', { detail: draft }));
  window.dispatchEvent(new CustomEvent('notice_drafts_updated', { detail: updatedList }));
  window.dispatchEvent(new Event('storage'));

  return draft;
}

export function markDraftAsRead(draftId: string): void {
  const all = getStoredDrafts();
  let changed = false;
  const updated = all.map(d => {
    if (d.id === draftId && !d.isReadBySuperUser) {
      changed = true;
      return { ...d, isReadBySuperUser: true };
    }
    return d;
  });

  if (changed) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('notice_drafts_updated', { detail: updated }));
    window.dispatchEvent(new Event('storage'));
  }
}

export function recordDraftDispatch(
  draftId: string, 
  dispatch: Omit<NoticeDraftDispatchHistory, 'id' | 'dispatchedAt'>
): NoticeDraftRecord | null {
  const all = getStoredDrafts();
  const idx = all.findIndex(d => d.id === draftId);
  if (idx < 0) return null;

  const newHistory: NoticeDraftDispatchHistory = {
    ...dispatch,
    id: `disp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    dispatchedAt: new Date().toISOString()
  };

  const updatedDraft: NoticeDraftRecord = {
    ...all[idx],
    status: 'dispatched',
    dispatches: [newHistory, ...(all[idx].dispatches || [])],
    updatedAt: new Date().toISOString()
  };

  all[idx] = updatedDraft;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

  window.dispatchEvent(new CustomEvent('notice_draft_dispatched', { detail: { draft: updatedDraft, dispatch: newHistory } }));
  window.dispatchEvent(new CustomEvent('notice_drafts_updated', { detail: all }));
  window.dispatchEvent(new Event('storage'));

  return updatedDraft;
}

export function deleteDraft(draftId: string): void {
  const all = getStoredDrafts();
  const filtered = all.filter(d => d.id !== draftId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  window.dispatchEvent(new CustomEvent('notice_drafts_updated', { detail: filtered }));
  window.dispatchEvent(new Event('storage'));
}

/**
 * Resolves contact details for complainant and respondent/designated officer
 * using complaint records, additionalFields, and publicBodies directory.
 */
export function resolveComplaintContacts(
  complaint?: ComplaintData | null,
  publicBodies: PublicBody[] = []
): {
  complainant: { name: string; email: string; contactNumber: string };
  respondent: { department: string; officialName: string; designation: string; email: string; contactNumber: string };
  nextHearingDate: string;
} {
  if (!complaint) {
    return {
      complainant: { name: '', email: '', contactNumber: '' },
      respondent: { department: '', officialName: '', designation: '', email: '', contactNumber: '' },
      nextHearingDate: ''
    };
  }

  // 1. Resolve Complainant details
  let compPhone = '';
  let compEmail = '';

  // Check additionalFields
  if (complaint.additionalFields && Array.isArray(complaint.additionalFields)) {
    for (const field of complaint.additionalFields) {
      const fn = (field.name || '').toLowerCase().trim();
      if (!compPhone && (fn.includes('contact') || fn.includes('phone') || fn.includes('mobile') || fn.includes('cell') || fn.includes('whatsapp'))) {
        compPhone = field.value || '';
      }
      if (!compEmail && (fn.includes('email') || fn.includes('mail') || fn.includes('gmail'))) {
        compEmail = field.value || '';
      }
    }
  }

  // 2. Resolve Respondent / Designated Official details
  const respDept = complaint.respondentName || '';
  let officialName = complaint.designatedOfficialName || '';
  let officialDesignation = '';
  let respEmail = '';
  let respPhone = '';

  // Find matching public body in publicBodies directory
  const matchedPB = publicBodies.find(pb => {
    const pbName = (pb.name || '').toLowerCase().trim();
    const cDept = respDept.toLowerCase().trim();
    if (pbName && cDept && (pbName === cDept || pbName.includes(cDept) || cDept.includes(pbName))) {
      return true;
    }
    if (officialName && pb.designatedOfficialName) {
      return pb.designatedOfficialName.toLowerCase().trim() === officialName.toLowerCase().trim();
    }
    return false;
  });

  if (matchedPB) {
    if (!officialName) officialName = matchedPB.designatedOfficialName || '';
    officialDesignation = matchedPB.designatedOfficialDesignation || '';
    respEmail = matchedPB.email || '';
    respPhone = matchedPB.contactNumber || '';
  }

  // Fallback to complaint.additionalFields for respondent details if missing
  if (complaint.additionalFields && Array.isArray(complaint.additionalFields)) {
    for (const field of complaint.additionalFields) {
      const fn = (field.name || '').toLowerCase().trim();
      if (!officialDesignation && (fn.includes('designation') || fn.includes('official designation'))) {
        officialDesignation = field.value || '';
      }
      if (!respEmail && (fn.includes('official email') || fn.includes('respondent email') || fn.includes('public body email'))) {
        respEmail = field.value || '';
      }
      if (!respPhone && (fn.includes('official contact') || fn.includes('respondent contact') || fn.includes('official phone'))) {
        respPhone = field.value || '';
      }
    }
  }

  return {
    complainant: {
      name: complaint.complainantName || 'Complainant',
      email: compEmail,
      contactNumber: compPhone
    },
    respondent: {
      department: respDept || 'Public Body / Department',
      officialName: officialName,
      designation: officialDesignation,
      email: respEmail,
      contactNumber: respPhone
    },
    nextHearingDate: complaint.nextHearingDate || ''
  };
}

/**
 * Formats a phone number for international WhatsApp link
 * E.g., '0300-1234567' -> '923001234567'
 */
export function formatWhatsAppNumber(phone: string): string {
  if (!phone) return '';
  // Remove spaces, hyphens, brackets, plus
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (!cleaned) return '';

  // If local Pakistani format starting with 0, replace with 92
  if (cleaned.startsWith('0')) {
    cleaned = '92' + cleaned.substring(1);
  }
  return cleaned;
}
