const STORAGE_KEY = 'sic_custom_submissions_v1';

export interface CustomSubmissionStorage {
  Complainant: string[];
  Respondent: string[];
}

export function getStoredCustomSubmissions(): CustomSubmissionStorage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { Complainant: [], Respondent: [] };
    const parsed = JSON.parse(raw);
    return {
      Complainant: Array.isArray(parsed.Complainant) ? parsed.Complainant : [],
      Respondent: Array.isArray(parsed.Respondent) ? parsed.Respondent : []
    };
  } catch (err) {
    console.error('Failed to parse custom submissions from localStorage:', err);
    return { Complainant: [], Respondent: [] };
  }
}

export function saveCustomSubmission(party: 'Complainant' | 'Respondent', type: string): CustomSubmissionStorage {
  try {
    const current = getStoredCustomSubmissions();
    if (!current[party].includes(type)) {
      current[party].push(type);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    }
    return current;
  } catch (err) {
    console.error('Failed to save custom submission to localStorage:', err);
    return getStoredCustomSubmissions();
  }
}
