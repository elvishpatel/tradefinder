import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import useMarketStore from '../store/marketStore';
import useAuthStore from '../store/authStore';

const getSocketUrl = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:5000';
    }
  }
  return 'https://tradefinder-zvp0.onrender.com';
};

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const { token, fyersConnected } = useAuthStore();
  const {
    setDashboardData,
    setSectorsList,
    setLongScannerResults,
    setShortScannerResults,
  } = useMarketStore();

  useEffect(() => {
    // Establish WebSocket connection if user is logged in
    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    const socketUrl = getSocketUrl();
    const socketInstance = io(socketUrl, {
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketInstance.on('connect', () => {
      setConnected(true);
      console.log('Socket.IO live feed connected:', socketInstance.id);
    });

    socketInstance.on('disconnect', () => {
      setConnected(false);
      console.log('Socket.IO connection closed.');
    });

    // Wire up live broadcast streams
    socketInstance.on('dashboard-update', (data) => {
      setDashboardData(data);
    });

    socketInstance.on('sectors-update', (data) => {
      setSectorsList(data);
    });

    socketInstance.on('scanner-update-long', (data) => {
      setLongScannerResults(data);
    });

    socketInstance.on('scanner-update-short', (data) => {
      setShortScannerResults(data);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [token, fyersConnected]);

  return { socket, connected };
};

export default useSocket;
