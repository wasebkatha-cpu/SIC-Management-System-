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
      const raw = localStorage.getItem('mock_typing');
      let list: TypingUser[] = raw ? JSON.parse(raw) : [];
      const now = Date.now();
      // Filter out stale typing states (> 3500ms) or current user in this chat
      list = list.filter(item => item.timestamp > now - 3500 && !(item.userId === userId && item.chatId === chatId));
      if (isTyping) {
        list.push({ userId, userName, chatId, timestamp: now });
      }
      localStorage.setItem('mock_typing', JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('mock_typing_update'));
    } catch (e) {
      console.error('Error updating typing state', e);
    }
  },

  getTypingUsers: (chatId: string, currentUserId: string): string[] => {
    try {
      const raw = localStorage.getItem('mock_typing');
      if (!raw) return [];
      const list: TypingUser[] = JSON.parse(raw);
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


  updateMessage: (messageId: string, updates: Partial<ChatMessage>) => {
    const messages = MockDB.getMessages();
    const index = messages.findIndex(m => m.id === messageId);
    if (index !== -1) {
      messages[index] = { ...messages[index], ...updates };
      localStorage.setItem('mock_messages', JSON.stringify(messages));
    }
  },
  getMessages: (): ChatMessage[] => {
    const stored = localStorage.getItem('mock_messages');
    return stored ? JSON.parse(stored) : [];
  },
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const messages = MockDB.getMessages();
    const newMessage: ChatMessage = {
      ...msg,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString()
    };
    messages.push(newMessage);
    // Keep only last 200 messages to save space
    if (messages.length > 200) {
      messages.shift();
    }
    try {
      localStorage.setItem('mock_messages', JSON.stringify(messages));
      window.dispatchEvent(new CustomEvent('mock_new_message', { detail: newMessage }));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error("Local storage quota exceeded, clearing old messages");
      localStorage.setItem('mock_messages', JSON.stringify(messages.slice(-50)));
      window.dispatchEvent(new CustomEvent('mock_new_message', { detail: newMessage }));
      window.dispatchEvent(new Event('storage'));
    }
    return newMessage;
  },

  getUsers: (): MockUser[] => {
    const stored = localStorage.getItem('mock_users');
    if (!stored) {
      localStorage.setItem('mock_users', JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    return JSON.parse(stored);
  },
  addUser: (user: Omit<MockUser, 'id' | 'createdAt'>) => {
    const users = MockDB.getUsers();
    // Check if username exists
    if (users.some(u => u.username.toLowerCase() === user.username.toLowerCase())) {
      throw new Error("Username already exists");
    }
    const newUser: MockUser = {
      ...user,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    localStorage.setItem('mock_users', JSON.stringify(users));
    return newUser;
  },
  deleteUser: (id: string) => {
    let users = MockDB.getUsers();
    users = users.filter(u => u.id !== id);
    localStorage.setItem('mock_users', JSON.stringify(users));
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
      localStorage.setItem('mock_users', JSON.stringify(users));
      return users[index];
    }
    throw new Error("User not found");
  },
  getLogs: (): MockLog[] => {
    const stored = localStorage.getItem('mock_logs');
    return stored ? JSON.parse(stored) : [];
  },
  addLog: (log: Omit<MockLog, 'id' | 'timestamp'>) => {
    const logs = MockDB.getLogs();
    const newLog: MockLog = {
      ...log,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString()
    };
    logs.unshift(newLog); // Add to beginning for descending order
    localStorage.setItem('mock_logs', JSON.stringify(logs));
  }
};
