import { io } from 'socket.io-client';

const SERVER_URL = 'http://localhost:3000'; // your backend URL
const MEETING_ID = process.argv[2];

if (!MEETING_ID) {
  console.error('Usage: node test-collab-10.mjs <MEETING_ID>');
  process.exit(1);
}

const clients = [];

for (let i = 1; i <= 100; i++) {
  const socket = io(SERVER_URL, { path: '/socket.io', transports: ['websocket'] });
  const userId = `bot_user_${i}`;
  const userName = `Bot Member ${i}`;

  socket.on('connect', () => {
    console.log(`[${userName}] connected (${socket.id})`);
    socket.emit('join-meeting', {
      meetingId: MEETING_ID,
      user: { id: userId, fullName: userName },
    });
  });

  socket.on('meeting-error', (err) => {
    console.error(`[${userName}] error:`, err);
  });

  // Move cursor periodically so you can see all 10 cursors live
  const timer = setInterval(() => {
    if (socket.connected) {
      socket.emit('cursor-move', {
        x: 200 + Math.random() * 600,
        y: 150 + Math.random() * 400,
      });
    }
  }, 1000 + i * 100);

  clients.push({ socket, timer });
}

process.on('SIGINT', () => {
  clients.forEach(({ socket, timer }) => {
    clearInterval(timer);
    socket.disconnect();
  });
  process.exit(0);
});
