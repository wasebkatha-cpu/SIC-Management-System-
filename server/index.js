import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { query } from './db.js';
import { initDb } from './init-db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Support for large attachments/drafts

// Network Auto-Discovery Ping
app.get('/api/ping', (req, res) => {
  res.json({ sic_server: true, timestamp: Date.now() });
});

// Emergency Superuser Reset
app.put('/api/reset-superuser', async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }
  try {
    const result = await query(
      "UPDATE users SET password = $1 WHERE role = 'superUser' RETURNING id",
      [newPassword]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Superuser account not found.' });
    }
    res.json({ success: true, message: 'Superuser password updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Users
app.get('/api/users', async (req, res) => {
  try {
    const result = await query('SELECT * FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const id = Math.random().toString(36).substr(2, 9);
    const { username, password, name, role, permissions, assignedReaderId, avatarUrl } = req.body;
    await query(
      `INSERT INTO users (id, username, password, name, role, permissions, assigned_reader_id, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, username, password, name, role, JSON.stringify(permissions || []), assignedReaderId, avatarUrl]
    );
    const newUser = await query('SELECT * FROM users WHERE id = $1', [id]);
    res.json(newUser.rows[0]);
  } catch (err) {
    if (err.code === '23505') res.status(400).json({ error: 'Username already exists' });
    else res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const setFields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (key === 'id' || key === 'created_at') continue;
      
      const dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      setFields.push(`${dbKey} = $${paramIndex}`);
      values.push(typeof value === 'object' ? JSON.stringify(value) : value);
      paramIndex++;
    }

    if (setFields.length === 0) return res.json({ success: true });

    values.push(id);
    const result = await query(
      `UPDATE users SET ${setFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Superuser Reset Endpoint (Restricted to Localhost)
app.put('/api/reset-superuser', async (req, res) => {
  try {
    // SECURITY: Only allow requests originating from the Server PC itself (localhost)
    const clientIp = req.ip || req.connection.remoteAddress;
    const isLocalhost = clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === '::ffff:127.0.0.1';
    
    if (!isLocalhost) {
      return res.status(403).json({ error: 'Forbidden: Password reset can only be performed physically on the Server PC.' });
    }

    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const result = await query(
      'UPDATE users SET password = $1 WHERE username = $2 RETURNING id',
      [newPassword, 'superuser']
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Superuser account not found.' });
    }

    res.json({ success: true, message: 'Superuser password has been updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Logs
app.get('/api/logs', async (req, res) => {
  try {
    const result = await query('SELECT * FROM logs ORDER BY timestamp DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/logs', async (req, res) => {
  try {
    const id = Math.random().toString(36).substr(2, 9);
    const { userId, username, role, activity } = req.body;
    await query(
      `INSERT INTO logs (id, user_id, username, role, activity)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, userId, username, role, activity]
    );
    res.json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Messages
app.get('/api/messages', async (req, res) => {
  try {
    const result = await query('SELECT * FROM messages ORDER BY timestamp ASC LIMIT 200');
    // Map db column names back to camelCase for frontend
    const messages = result.rows.map(row => ({
      id: row.id,
      senderId: row.sender_id,
      receiverId: row.receiver_id,
      text: row.text,
      attachments: row.attachments,
      timestamp: row.timestamp,
      receivedBy: row.received_by,
      readBy: row.read_by,
      reactions: row.reactions,
      replyTo: row.reply_to
    }));
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const id = Math.random().toString(36).substr(2, 9);
    const { senderId, receiverId, text, attachments, receivedBy, readBy, reactions, replyTo } = req.body;
    await query(
      `INSERT INTO messages (id, sender_id, receiver_id, text, attachments, received_by, read_by, reactions, reply_to)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, senderId, receiverId, text, 
       attachments ? JSON.stringify(attachments) : null,
       receivedBy ? JSON.stringify(receivedBy) : null,
       readBy ? JSON.stringify(readBy) : null,
       reactions ? JSON.stringify(reactions) : null,
       replyTo ? JSON.stringify(replyTo) : null]
    );
    const newMsg = await query('SELECT * FROM messages WHERE id = $1', [id]);
    res.json(newMsg.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { receivedBy, readBy, reactions } = req.body;
    
    // Fetch existing message to merge JSON arrays (simpler to just overwrite with frontend's merged arrays for mock logic)
    await query(
      `UPDATE messages 
       SET received_by = COALESCE($1, received_by),
           read_by = COALESCE($2, read_by),
           reactions = COALESCE($3, reactions)
       WHERE id = $4`,
      [
        receivedBy ? JSON.stringify(receivedBy) : null,
        readBy ? JSON.stringify(readBy) : null,
        reactions ? JSON.stringify(reactions) : null,
        id
      ]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Notice Templates
app.get('/api/notices', async (req, res) => {
  try {
    const result = await query('SELECT * FROM notice_templates ORDER BY updated_at DESC');
    res.json(result.rows.map(row => ({
      id: row.id,
      title: row.title,
      stageName: row.stage_name,
      category: row.category,
      tag: row.tag,
      tagColor: row.tag_color,
      iconType: row.icon_type,
      description: row.description,
      isCustom: row.is_custom
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notices', async (req, res) => {
  try {
    const { id, title, stageName, category, tag, tagColor, iconType, description, isCustom } = req.body;
    await query(
      `INSERT INTO notice_templates (id, title, stage_name, category, tag, tag_color, icon_type, description, is_custom, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       ON CONFLICT (id) DO UPDATE SET
       title = $2, stage_name = $3, category = $4, tag = $5, tag_color = $6, icon_type = $7, description = $8, is_custom = $9, updated_at = NOW()`,
      [id, title, stageName, category, tag, tagColor, iconType, description, isCustom]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/notices/:id', async (req, res) => {
  try {
    await query('DELETE FROM notice_templates WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const generateCrudRoutes = (tableName, pathName) => {
  app.get(`/api/${pathName}`, async (req, res) => {
    try {
      const result = await query(`SELECT * FROM ${tableName} ORDER BY updated_at DESC`);
      res.json(result.rows.map(row => row.data));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post(`/api/${pathName}`, async (req, res) => {
    try {
      // Assuming req.body has an 'id' or we generate one. 
      // For complaints, it's complaintNo. For others, it's id.
      const id = req.body.id || req.body.complaintNo || Math.random().toString(36).substr(2, 9);
      if (!req.body.id && !req.body.complaintNo) {
        req.body.id = id;
      }
      await query(
        `INSERT INTO ${tableName} (id, data, updated_at) VALUES ($1, $2, NOW())
         ON CONFLICT (id) DO UPDATE SET data = $2, updated_at = NOW()`,
        [id, JSON.stringify(req.body)]
      );
      res.json({ success: true, id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete(`/api/${pathName}/:id`, async (req, res) => {
    try {
      await query(`DELETE FROM ${tableName} WHERE id = $1`, [req.params.id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
};

generateCrudRoutes('complaints', 'complaints');
generateCrudRoutes('public_bodies', 'public_bodies');
generateCrudRoutes('readers', 'readers');
generateCrudRoutes('enforcement_actions', 'enforcement_actions');
generateCrudRoutes('drafts', 'drafts');
generateCrudRoutes('inwards', 'inwards');
generateCrudRoutes('outwards', 'outwards');

// Serve static React frontend files in production
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  
  // Catch-all route to serve index.html for client-side routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get('*', (req, res) => {
    res.status(404).send('Frontend build not found. Please run "npm run build" first.');
  });
}

const PORT = 3001;

// Initialize database then start server
initDb().then(() => {
  console.log("Database initialized successfully.");
}).catch(err => {
  console.error("Failed to initialize database (Continuing anyway, but API calls will fail):", err);
}).finally(() => {
  // Bind to 0.0.0.0 to accept connections from all devices on the network
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express API & Application running on port ${PORT}`);
    console.log(`Access on network at http://<this-computer-ip>:${PORT}`);
  });
});
