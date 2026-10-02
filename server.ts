import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createDefaultState } from './src/data/defaultState';
import { AppState } from './src/types/todo';

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'todo-store.json');

interface DatabaseSchema {
  users: Record<string, AppState>;
}

function loadDatabase(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial: DatabaseSchema = {
        users: {
          'user-iqra-01': createDefaultState(),
        },
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as DatabaseSchema;
    if (!parsed.users || !parsed.users['user-iqra-01']) {
      parsed.users = parsed.users || {};
      parsed.users['user-iqra-01'] = createDefaultState();
    }
    return parsed;
  } catch {
    return {
      users: {
        'user-iqra-01': createDefaultState(),
      },
    };
  }
}

function saveDatabase(db: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist store:', err);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  const db = loadDatabase();

  const getUserId = (req: express.Request): string => {
    const headerId = req.headers['x-user-id'];
    if (typeof headerId === 'string' && headerId.trim().length > 0) {
      return headerId.trim();
    }
    return 'user-iqra-01';
  };

  const ensureUserState = (userId: string): AppState => {
    if (!db.users[userId]) {
      const fresh = createDefaultState();
      fresh.profile.id = userId;
      db.users[userId] = fresh;
      saveDatabase(db);
    }
    return db.users[userId];
  };

  // GET full application state for current user
  app.get('/api/state', (req, res) => {
    const userId = getUserId(req);
    const state = ensureUserState(userId);
    res.json({ ok: true, state });
  });

  // PUT full application state sync with validation
  app.put('/api/state', (req, res) => {
    const userId = getUserId(req);
    const incoming = req.body?.state as AppState | undefined;
    if (!incoming || !incoming.profile || !Array.isArray(incoming.tasks)) {
      res.status(400).json({ ok: false, error: 'Invalid state payload' });
      return;
    }
    db.users[userId] = incoming;
    saveDatabase(db);
    res.json({ ok: true, state: db.users[userId] });
  });

  // POST reset to smart defaults
  app.post('/api/state/reset', (req, res) => {
    const userId = getUserId(req);
    const fresh = createDefaultState();
    fresh.profile.id = userId;
    db.users[userId] = fresh;
    saveDatabase(db);
    res.json({ ok: true, state: fresh });
  });

  // GET JSON backup
  app.get('/api/backup', (req, res) => {
    const userId = getUserId(req);
    const state = ensureUserState(userId);
    res.json({
      ok: true,
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      state,
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ToDo server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
