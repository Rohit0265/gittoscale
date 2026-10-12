import { createApp } from './app.js';

import { execSync } from 'node:child_process';

const PORT = 3000;
const app = createApp();

function killPortProcess(port: number) {
  try {
    console.log(`[Backend] Port ${port} is in use. Terminating existing process occupying port ${port}...`);
    // Find PID using fuser or lsof and kill
    try {
      execSync(`fuser -k -n tcp ${port} 2>/dev/null || true`);
    } catch {
      // fallback to lsof kill
      try {
        execSync(`lsof -t -i :${port} | xargs -r kill -9 2>/dev/null || true`);
      } catch {}
    }
  } catch (e) {
    console.warn(`[Backend] Could not automatically kill process on port ${port}:`, e);
  }
}

function startServer() {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Backend] System Design Playground API listening strictly on http://0.0.0.0:${PORT}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[Backend] Port ${PORT} is occupied! Freeing port ${PORT} and restarting...`);
      killPortProcess(PORT);
      setTimeout(() => {
        startServer();
      }, 500);
    } else {
      console.error('[Backend] Server listen error:', err);
      process.exit(1);
    }
  });
}

startServer();

