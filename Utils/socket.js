// socket.js
import { io } from "socket.io-client";
import { mainURL } from "./urls";
import { navigationRef } from "../App";

const SOCKET_URL = mainURL;

class SocketService {
  constructor() {
    if (!SocketService.instance) {
      this.socket = io(SOCKET_URL, {
        transports: ["websocket"],
        autoConnect: true,           // Automatically connect on app start
        reconnection: true,          // Enable auto-reconnection
        reconnectionDelay: 1000,     // Retry immediately without limit
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

    this.socket.on("incoming_voice_call", (data) => {
      console.log("📲 Incoming Voice Call:", data);
  
      // Ensure we navigate only if the user is the recipient
      // if (data.calleeId === this.recipentId) {
        this.socket.emit("send_call_notification", {
          calleeId: data.calleeId,
          callerInfo: data.callerInfo,
        });
        navigationRef.navigate("VoiceScreen", {
          callerId: data.callerId,
          calleeId: data.calleeId,
          isCaller: false,
          callerInfo: data.callerInfo,
          calleeInfo: data.calleeInfo,
        });
      // }
    });

    this.socket.on("incoming_video_call", (data) => {
        navigationRef.navigate("VideoScreen", {
          callerId: data.callerId,
          calleeId: data.calleeId,
          isCaller: false,
          callerInfo: data.callerInfo,
          calleeInfo: data.calleeInfo,
        });
      // }
    });

    this.socket.on("disconnect", (reason) => {
      console.warn("⚠️ Socket disconnected:", reason);
      if (reason !== "io client disconnect") {
        console.log("🔄 Attempting to reconnect...");
        this.ensureConnected();
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
    if (this.socket.connected) {
      console.log("❌ Manually disconnecting socket...");
      this.socket.disconnect();
    }
  }
}

// Preserve singleton instance across hot reloads
const socketInstance = globalThis.socketInstance || new SocketService();
Object.freeze(socketInstance);
globalThis.socketInstance = socketInstance;

export default socketInstance;