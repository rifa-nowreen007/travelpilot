import { io } from 'socket.io-client';

// Socket.io runs on the same Express/HTTP server as the REST API — just
// strip the "/api" suffix that VITE_API_URL uses for axios calls.
const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

let socket = null;

// Lazily creates (or reuses) a single authenticated socket connection for
// the whole app, so switching between pages doesn't open a new connection
// each time.
export function getSocket() {
  if (socket) return socket;
  const token = localStorage.getItem('tp-token');
  socket = io(SOCKET_URL, {
    auth: { token },
    autoConnect: false,
    transports: ['websocket', 'polling'],
  });
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
