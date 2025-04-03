import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { AppState } from "react-native";

const SOCKET_SERVER_URL = "https://inifinityos.pro";

export const useSocket = () => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const appState = useRef(AppState.currentState);

  const connectSocket = () => {
    if (!socketRef.current || !socketRef.current.connected) {
      socketRef.current = io(SOCKET_SERVER_URL, {
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 5000,
      });

      socketRef.current.on("connect", () => {
        console.log("✅ Socket connected");
        setIsConnected(true);
      });

      socketRef.current.on("disconnect", (reason) => {
        console.log("❌ Socket disconnected:", reason);
        setIsConnected(false);
      });

      socketRef.current.on("connect_error", (error) => {
        console.log("⚠️ Connection error:", error);
      });
    }
  };

  useEffect(() => {
    connectSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        console.log("🔄 App is active, checking socket connection...");
        if (!socketRef.current?.connected) {
          connectSocket(); // Reconnect if not connected
        }
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => subscription.remove();
  }, []);

  return { socket: socketRef.current, isConnected };
};
