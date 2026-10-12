import { createApp } from './app.js';

const initialPort = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const app = createApp();

function startServer(port: number) {
  const server = app.listen(port, () => {
    console.log(`[Backend] System Design Playground API listening on http://localhost:${port}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE' && !process.env.PORT) {
      console.warn(`[Backend] Port ${port} in use, falling back to ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('[Backend] Server listen error:', err);
      process.exit(1);
    }
  });
}

startServer(initialPort);

