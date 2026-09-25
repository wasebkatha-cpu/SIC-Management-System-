import { NoticeTypeConfig } from '../components/noticeDraftModal';
import { GlobalStore, getStoreData, setStoreData } from '../lib/store';
import { apiFetch } from '../lib/apiConfig';

export function getStoredCustomNotices(): NoticeTypeConfig[] {
  const notices = getStoreData('customNotices');
  return notices || [];
}

export function saveCustomNotice(notice: NoticeTypeConfig): NoticeTypeConfig[] {
  try {
    const current = getStoredCustomNotices();
    // Check if notice already exists by id
    const existingIndex = current.findIndex(n => n.id === notice.id);
    let updated: NoticeTypeConfig[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = notice;
    } else {
      updated = [notice, ...current];
    }
    setStoreData('customNotices', updated);

    // Dispatch global events so all components across the app update immediately
    window.dispatchEvent(new CustomEvent('custom_notices_updated', { detail: updated }));

    // Asynchronously sync to API
    apiFetch('/api/notices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notice)
    }).catch(err => {
      console.warn('Notice template API sync deferred:', err);
    });

    return updated;
  } catch (err) {
    console.error('Failed to save custom notice to localStorage:', err);
    return [];
  }
}

export function removeCustomNotice(id: string): NoticeTypeConfig[] {
  try {
    const current = getStoredCustomNotices();
    const updated = current.filter(n => n.id !== id);
    setStoreData('customNotices', updated);

    // Dispatch global events so all components across the app update immediately
    window.dispatchEvent(new CustomEvent('custom_notices_updated', { detail: updated }));

    // Asynchronously remove from API
    apiFetch(`/api/notices/${id}`, {
      method: 'DELETE'
    }).catch(err => {
      console.warn('Notice template API deletion deferred:', err);
    });

    return updated;
  } catch (err) {
    console.error('Failed to remove custom notice from localStorage:', err);
    return [];
  }
}

/**
 * Initializes API listener and remote sync for custom notice templates
 */
export function initCustomNoticesListener(onUpdate?: (notices: NoticeTypeConfig[]) => void) {
  if (typeof window === 'undefined') return;

  // Initial fetch from API to hydrate local cache
  apiFetch('/api/notices')
    .then(res => res.json())
    .then((remoteTemplates: NoticeTypeConfig[]) => {
      if (remoteTemplates && remoteTemplates.length > 0) {
        setStoreData('customNotices', remoteTemplates);
        window.dispatchEvent(new CustomEvent('custom_notices_updated', { detail: remoteTemplates }));
        if (onUpdate) onUpdate(remoteTemplates);
      }
    })
    .catch(err => {
      console.warn('Initial API notice templates fetch deferred:', err);
    });
}
