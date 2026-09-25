// Centralized In-Memory Store
// Replaces localStorage to ensure data is not saved locally on Client PCs
// This cache is populated from the central PostgreSQL server.

export const GlobalStore = {
  users: [] as any[],
  messages: [] as any[],
  logs: [] as any[],
  drafts: [] as any[],
  inwards: [] as any[],
  outwards: [] as any[],
  customNotices: [] as any[],
  
  // Ephemeral typing states
  typingUsers: [] as any[],
  
  isInitialized: false,
};

export const setStoreData = <K extends keyof typeof GlobalStore>(key: K, data: typeof GlobalStore[K]) => {
  GlobalStore[key] = data;
};

export const getStoreData = <K extends keyof typeof GlobalStore>(key: K): typeof GlobalStore[K] => {
  return GlobalStore[key];
};
