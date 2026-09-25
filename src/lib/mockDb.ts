import { getStoreData, setStoreData, GlobalStore } from './store';
import { apiFetch } from './apiConfig';

export type Permission = 
  | 'dashboard' | 'activityHistory'
  | 'adminManagement' | 'admin_create' | 'admin_edit' | 'admin_delete'
  | 'complaints' | 'complaints_create' | 'complaints_edit' | 'complaints_delete'
  | 'publicBodies' | 'publicbody_create' | 'publicbody_edit' | 'publicbody_delete' | 'publicbody_bulk_upload'
  | 'designatedOfficials' | 'official_create' | 'official_edit' | 'official_delete' | 'official_bulk_upload'
  | 'causeList' | 'causelist_update_hearing' | 'causelist_update_attendance' | 'causelist_update_future_proceedings' | 'causelist_update_proceedings_history' | 'causelist_update_submissions' | 'causelist_add_diary'
  | 'readers' | 'reader_create' | 'reader_edit' | 'reader_delete';

export interface MockUser {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: 'superUser' | 'admin';
  permissions?: Permission[];
  assignedReaderId?: string;
  createdAt: string;
  avatarUrl?: string;
}

export interface ChatAttachment {
  name: string;
  type: string;
  data: string; // base64
}

export interface ChatReplyInfo {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string; // 'group' for group chat, or userId for direct
  text: string;
  attachment?: ChatAttachment;
  attachments?: ChatAttachment[];
  timestamp: string;
  receivedBy?: string[];
  readBy?: string[];
  reactions?: { [userId: string]: string };
  replyTo?: ChatReplyInfo;
}

export interface TypingUser {
  userId: string;
  userName: string;
  chatId: string;
  timestamp: number;
}

export const getMessageAttachments = (msg: ChatMessage): ChatAttachment[] => {
  if (msg.attachments && msg.attachments.length > 0) return msg.attachments;
  if (msg.attachment) return [msg.attachment];
  return [];
};

export interface MockLog {
  id: string;
  userId: string;
  username: string;
  role: string;
  activity: string;
  timestamp: string;
}

const DEFAULT_USERS: MockUser[] = [
  {
    id: 'super-1',
    username: 'superuser',
    password: 'password123',
    name: 'Master Admin',
    role: 'superUser',
    createdAt: new Date().toISOString()
  }
];

export const MockDB = {
  setTyping: (userId: string, userName: string, chatId: string, isTyping: boolean) => {
    try {
      let list = getStoreData('typingUsers');
      const now = Date.now();
      // Filter out stale typing states (> 3500ms) or current user in this chat
      list = list.filter(item => item.timestamp > now - 3500 && !(item.userId === userId && item.chatId === chatId));
      if (isTyping) {
        list.push({ userId, userName, chatId, timestamp: now });
      }
      setStoreData('typingUsers', list);
      window.dispatchEvent(new CustomEvent('mock_typing_update'));
    } catch (e) {
      console.error('Error updating typing state', e);
    }
  },

  getTypingUsers: (chatId: string, currentUserId: string): string[] => {
    try {
      const list = getStoreData('typingUsers');
      const now = Date.now();
      return list
        .filter(item => {
          if (item.userId === currentUserId) return false;
          if (item.timestamp <= now - 3500) return false;
          if (chatId === 'group') {
            return item.chatId === 'group';
          } else {
            return item.userId === chatId && item.chatId === currentUserId;
          }
        })
        .map(item => item.userName);
    } catch (e) {
      return [];
    }
  },

  getAllTypingUsers: (currentUserId: string): Record<string, string[]> => {
    try {
      const list = getStoreData('typingUsers');
      const now = Date.now();
      
      const typingMap: Record<string, string[]> = {};
      
      list.forEach(item => {
        if (item.userId === currentUserId) return;
        if (item.timestamp <= now - 3500) return;
        
        let targetChatId = item.chatId;
        if (item.chatId === currentUserId) {
          targetChatId = item.userId;
        }
        
        if (!typingMap[targetChatId]) {
          typingMap[targetChatId] = [];
        }
        if (!typingMap[targetChatId].includes(item.userName)) {
          typingMap[targetChatId].push(item.userName);
        }
      });
      return typingMap;
    } catch (e) {
      return {};
    }
  },

  updateMessage: (messageId: string, updates: Partial<ChatMessage>) => {
    const messages = MockDB.getMessages();
    const index = messages.findIndex(m => m.id === messageId);
    if (index !== -1) {
      messages[index] = { ...messages[index], ...updates };
      setStoreData('messages', messages);
      window.dispatchEvent(new CustomEvent('mock_messages_update'));
      
      // Sync to API
      apiFetch(`/api/messages/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      }).catch(e => console.error('Failed to sync message update:', e));
    }
  },
  getMessages: (): ChatMessage[] => {
    return getStoreData('messages') || [];
  },
  setMessages: (messages: ChatMessage[]) => {
    setStoreData('messages', messages);
    window.dispatchEvent(new CustomEvent('mock_messages_update'));
  },
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const messages = MockDB.getMessages();
    const newMessage: ChatMessage = {
      ...msg,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString()
    };
    messages.push(newMessage);
    if (messages.length > 200) {
      messages.shift();
    }
    setStoreData('messages', messages);
    window.dispatchEvent(new CustomEvent('mock_new_message', { detail: newMessage }));
    
    // Sync to API
    apiFetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg)
    }).catch(e => console.error(e));
    
    return newMessage;
  },

  getUsers: (): MockUser[] => {
    const users = getStoreData('users');
    if (!users || users.length === 0) {
      if (!GlobalStore.isInitialized) return DEFAULT_USERS;
    }
    return users || [];
  },
  addUser: (user: Omit<MockUser, 'id' | 'createdAt'>) => {
    const users = MockDB.getUsers();
    if (users.some(u => u.username.toLowerCase() === user.username.toLowerCase())) {
      throw new Error("Username already exists");
    }
    const newUser: MockUser = {
      ...user,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    setStoreData('users', users);
    
    apiFetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    }).catch(e => console.error(e));
    
    return newUser;
  },
  deleteUser: (id: string) => {
    let users = MockDB.getUsers();
    users = users.filter(u => u.id !== id);
    setStoreData('users', users);
    
    apiFetch(`/api/users/${id}`, { method: 'DELETE' }).catch(e => console.error(e));
  },
  updateUser: (id: string, updates: Partial<MockUser>) => {
    let users = MockDB.getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index >= 0) {
      if (updates.username) {
        const usernameExists = users.some(u => u.id !== id && u.username.toLowerCase() === updates.username!.toLowerCase());
        if (usernameExists) throw new Error("Username already exists");
      }
      users[index] = { ...users[index], ...updates };
      setStoreData('users', users);
      
      apiFetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      }).catch(e => console.error(e));
      
      return users[index];
    }
    throw new Error("User not found");
  },
  getLogs: (): MockLog[] => {
    return getStoreData('logs') || [];
  },
  addLog: (log: Omit<MockLog, 'id' | 'timestamp'>) => {
    const logs = MockDB.getLogs();
    const newLog: MockLog = {
      ...log,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString()
    };
    logs.unshift(newLog);
    setStoreData('logs', logs);
    
    apiFetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log)
    }).catch(e => console.error(e));
  }
};

export const initApiSync = async () => {
  try {
    const [usersRes, msgsRes, logsRes] = await Promise.all([
      apiFetch('/api/users'),
      apiFetch('/api/messages'),
      apiFetch('/api/logs')
    ]);
    if (usersRes.ok) {
      const users = await usersRes.json();
      const mappedUsers = users.map((found: any) => ({
        ...found,
        assignedReaderId: found.assigned_reader_id,
        username: found.username,
        role: found.role,
        permissions: Array.isArray(found.permissions) ? found.permissions : (typeof found.permissions === 'string' ? JSON.parse(found.permissions) : []),
        avatarUrl: found.avatar_url
      }));
      setStoreData('users', mappedUsers.length ? mappedUsers : DEFAULT_USERS);
    }
    if (msgsRes.ok) setStoreData('messages', await msgsRes.json());
    if (logsRes.ok) setStoreData('logs', await logsRes.json());
    
    GlobalStore.isInitialized = true;
    window.dispatchEvent(new Event('global_store_updated'));
  } catch (e) {
    console.error('Failed to init API sync:', e);
  }
};
