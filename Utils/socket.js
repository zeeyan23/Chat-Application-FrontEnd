// socket.js
import { io } from "socket.io-client";
import { mainURL } from "./urls";

const SOCKET_URL = mainURL;

class SocketService {
  constructor() {
    if (!SocketService.instance) {
      this.socket = io(SOCKET_URL, {
        transports: ["websocket"],
        autoConnect: true,           // Automatically connect on app start
        reconnection: true,          // Enable auto-reconnection
        reconnectionAttempts: 10,    // Retry up to 10 times
        reconnectionDelay: 3000,
      });

      this.setupListeners();
      SocketService.instance = this;
    }
    return SocketService.instance;
  }

  // Ensure the socket is always connected
  ensureConnected() {
    if (!this.socket.connected) {
      console.log("🔌 Reconnecting socket...");
      this.socket.connect();
    }
  }

  getSocket() {
    this.ensureConnected();
    return this.socket;
  }

  setupListeners() {
    this.socket.on("connect", () => {
      console.log("✅ Socket connected:", this.socket.id);
    });

    this.socket.on("disconnect", (reason) => {
      console.warn("⚠️ Socket disconnected:", reason);
      if (reason !== "io client disconnect") {
        console.log("🔄 Attempting to reconnect...");
        this.socket.connect();
      }
    });

    this.socket.on("connect_error", (error) => {
      console.error("❌ Connection error:", error);
    });

    this.socket.on("reconnect_attempt", (attempt) => {
      console.log(`🔁 Reconnect attempt: ${attempt}`);
    });

    this.socket.on("reconnect", () => {
      console.log("✅ Successfully reconnected!");
    });
  }

  // Custom method to join a room
  joinRoom(userId) {
    this.ensureConnected();
    this.socket.emit("join", userId);
    console.log(`📢 Joined room: ${userId}`);
  }

  // Custom method to manually disconnect (only when needed)
  disconnect() {
    console.log("❌ Manually disconnecting socket...");
    this.socket.disconnect();
  }
}

// Preserve singleton instance across hot reloads
const socketInstance = globalThis.socketInstance || new SocketService();
Object.freeze(socketInstance);
globalThis.socketInstance = socketInstance;

export default socketInstance;
