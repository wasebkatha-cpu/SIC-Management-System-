import { NoticeTypeConfig } from '../components/noticeDraftModal';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, deleteDoc, getDocs, onSnapshot } from 'firebase/firestore';

const STORAGE_KEY = 'sic_custom_notice_templates_v1';

export function getStoredCustomNotices(): NoticeTypeConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.error('Failed to parse custom notices from localStorage:', err);
    return [];
  }
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Dispatch global events so all components across the app update immediately
    window.dispatchEvent(new CustomEvent('custom_notices_updated', { detail: updated }));
    window.dispatchEvent(new Event('storage'));

    // Asynchronously sync to Firestore if available
    try {
      const docRef = doc(db, 'notice_templates', notice.id);
      setDoc(docRef, {
        ...notice,
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch(err => {
        console.warn('Notice template Firestore sync deferred:', err?.message || err);
      });
    } catch (e) {
      // Non-blocking Firestore sync
    }

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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Dispatch global events so all components across the app update immediately
    window.dispatchEvent(new CustomEvent('custom_notices_updated', { detail: updated }));
    window.dispatchEvent(new Event('storage'));

    // Asynchronously remove from Firestore if available
    try {
      const docRef = doc(db, 'notice_templates', id);
      deleteDoc(docRef).catch(err => {
        console.warn('Notice template Firestore deletion deferred:', err?.message || err);
      });
    } catch (e) {
      // Non-blocking Firestore sync
    }

    return updated;
  } catch (err) {
    console.error('Failed to remove custom notice from localStorage:', err);
    return [];
  }
}

let isListenerActive = false;

/**
 * Initializes Firestore listener and remote sync for custom notice templates
 */
export function initCustomNoticesListener(onUpdate?: (notices: NoticeTypeConfig[]) => void) {
  if (typeof window === 'undefined') return;

  // Initial fetch from Firestore to hydrate local cache
  try {
    const colRef = collection(db, 'notice_templates');
    getDocs(colRef).then((snapshot) => {
      if (!snapshot.empty) {
        const remoteTemplates: NoticeTypeConfig[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data() as NoticeTypeConfig;
          if (data && data.title) {
            remoteTemplates.push({
              id: docSnap.id,
              title: data.title,
              stageName: data.stageName || data.title,
              category: data.category || (data.title.toLowerCase().includes('order') ? 'Order' : 'Notice'),
              tag: data.tag || (data.category === 'Order' ? 'Bench Order' : 'Special Notice'),
              tagColor: data.tagColor || (data.category === 'Order' 
                ? 'bg-indigo-50 text-indigo-800 border-indigo-200' 
                : 'bg-amber-50 text-amber-800 border-amber-200'),
              iconType: data.iconType || (data.category === 'Order' ? 'Scale' : 'Mail'),
              description: data.description || `Custom drafted ${data.category || 'document'}`,
              isCustom: true
            });
          }
        });

        if (remoteTemplates.length > 0) {
          const local = getStoredCustomNotices();
          const localIds = new Set(local.map(l => l.id));
          let merged = [...local];
          remoteTemplates.forEach(rt => {
            if (!localIds.has(rt.id)) {
              merged.push(rt);
            }
          });
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          window.dispatchEvent(new CustomEvent('custom_notices_updated', { detail: merged }));
          if (onUpdate) onUpdate(merged);
        }
      }
    }).catch(err => {
      console.warn('Initial Firestore notice templates fetch deferred:', err?.message || err);
    });

    if (!isListenerActive) {
      isListenerActive = true;
      onSnapshot(colRef, (snapshot) => {
        if (!snapshot.empty) {
          const remoteList: NoticeTypeConfig[] = [];
          snapshot.forEach(docSnap => {
            const data = docSnap.data() as NoticeTypeConfig;
            if (data && data.title) {
              remoteList.push({
                id: docSnap.id,
                title: data.title,
                stageName: data.stageName || data.title,
                category: data.category || (data.title.toLowerCase().includes('order') ? 'Order' : 'Notice'),
                tag: data.tag || (data.category === 'Order' ? 'Bench Order' : 'Special Notice'),
                tagColor: data.tagColor || (data.category === 'Order' 
                  ? 'bg-indigo-50 text-indigo-800 border-indigo-200' 
                  : 'bg-amber-50 text-amber-800 border-amber-200'),
                iconType: data.iconType || (data.category === 'Order' ? 'Scale' : 'Mail'),
                description: data.description || `Custom drafted ${data.category || 'document'}`,
                isCustom: true
              });
            }
          });

          if (remoteList.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteList));
            window.dispatchEvent(new CustomEvent('custom_notices_updated', { detail: remoteList }));
            if (onUpdate) onUpdate(remoteList);
          }
        }
      }, (err) => {
        console.warn('Firestore onSnapshot notice templates deferred:', err?.message || err);
      });
    }
  } catch (e) {
    // Non-blocking
  }
}
