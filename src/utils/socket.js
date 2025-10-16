import { io } from 'socket.io-client';

// Create a single shared Socket.IO client for the whole app.
// - Explicitly use the default path '/socket.io' (works with nginx location /socket.io/)
// - Prefer WebSocket to avoid long-polling overhead; fall back to polling if WS is unavailable
// - autoConnect: false - connection is established lazily only when needed
// - Components that need socket should call socket.connect() in useEffect
const socket = io('/', {
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  withCredentials: true,
  autoConnect: false, // Lazy connection - only connect when explicitly needed
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 500,
});

export default socket;

