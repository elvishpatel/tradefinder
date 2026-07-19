import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import useMarketStore from '../store/marketStore';
import useAuthStore from '../store/authStore';

const SOCKET_SERVER_URL = 'https://tradefinder-zvp0.onrender.com';

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
    // Only establish WebSocket connection if user is logged in and Fyers broker is linked
    if (!token || !fyersConnected) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    const socketInstance = io(SOCKET_SERVER_URL, {
      transports: ['websocket'],
      auth: { token },
    });

    socketInstance.on('connect', () => {
      setConnected(true);
      console.log('Socket.IO connection established with backend:', socketInstance.id);
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
