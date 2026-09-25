import { getStoreData, setStoreData } from '../lib/store';
import { apiFetch } from '../lib/apiConfig';

export interface InwardRecord {
  id: string;
  inwardNo: string;
  dateReceived: string;
  senderName: string;
  senderType: 'complainant' | 'respondent' | 'public_body' | 'other';
  subject: string;
  complaintNo?: string;
  description?: string;
  attachments: { name: string; type: string; url: string; size?: number }[];
  status: 'pending' | 'processed';
  createdAt: string;
  createdBy: {
    userId: string;
    name: string;
  };
}

export interface OutwardRecord {
  id: string;
  outwardNo: string;
  dateDispatched: string;
  recipientName: string;
  recipientType: 'complainant' | 'respondent' | 'public_body' | 'other';
  subject: string;
  complaintNo?: string;
  description?: string;
  attachments: { name: string; type: string; url: string; size?: number }[];
  trackingId?: string;
  createdAt: string;
  createdBy: {
    userId: string;
    name: string;
  };
}

const INWARD_STORAGE_KEY = 'sic_inwards_registry_v1';
const OUTWARD_STORAGE_KEY = 'sic_outwards_registry_v1';

export function getStoredInwards(): InwardRecord[] {
  const inwards = getStoreData('inwards');
  return inwards || [];
}

export function saveInward(record: InwardRecord): InwardRecord {
  const all = getStoredInwards();
  const existingIdx = all.findIndex(d => d.id === record.id);

  let updatedList: InwardRecord[];
  if (existingIdx >= 0) {
    updatedList = [...all];
    updatedList[existingIdx] = record;
  } else {
    updatedList = [record, ...all];
  }

  setStoreData('inwards', updatedList);
  window.dispatchEvent(new CustomEvent('inwards_updated', { detail: updatedList }));

  apiFetch('/api/inwards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record)
  }).catch(e => console.error('Failed to sync inward to API:', e));

  return record;
}

export function getStoredOutwards(): OutwardRecord[] {
  const outwards = getStoreData('outwards');
  return outwards || [];
}

export function saveOutward(record: OutwardRecord): OutwardRecord {
  const all = getStoredOutwards();
  const existingIdx = all.findIndex(d => d.id === record.id);

  let updatedList: OutwardRecord[];
  if (existingIdx >= 0) {
    updatedList = [...all];
    updatedList[existingIdx] = record;
  } else {
    updatedList = [record, ...all];
  }

  setStoreData('outwards', updatedList);
  window.dispatchEvent(new CustomEvent('outwards_updated', { detail: updatedList }));

  apiFetch('/api/outwards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record)
  }).catch(e => console.error('Failed to sync outward to API:', e));

  return record;
}

export function initInwardsOutwardsSync(): void {
  apiFetch('/api/inwards')
    .then(res => res.json())
    .then(data => {
      setStoreData('inwards', data);
      window.dispatchEvent(new CustomEvent('inwards_updated', { detail: data }));
    })
    .catch(e => console.error('Failed to init inwards from API:', e));

  apiFetch('/api/outwards')
    .then(res => res.json())
    .then(data => {
      setStoreData('outwards', data);
      window.dispatchEvent(new CustomEvent('outwards_updated', { detail: data }));
    })
    .catch(e => console.error('Failed to init outwards from API:', e));
}
