// socket.js
import { io } from "socket.io-client";
import { mainURL } from "./urls";
import { navigationRef } from "../App";
import { Toast } from "native-base";

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
        this.socket.emit("send_call_notification", {
          calleeId: data.calleeId,
          callerInfo: data.callerInfo,
        });

        Toast.show({
          title: "Incoming Call",
          description: `is calling you!`,
          status: "info",
          duration: 5000,
          placement: "top",
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
    this.socket.on("incoming_group_voice_call", (data) => {
      navigationRef.navigate("VoiceScreen", {
        isGroup: true,
        groupId: data.groupId,
        participants: data.participants,
        isCaller: data.isCaller,
        callerId: data.callerId,
        callerName: data.callerName,
        callerImage: data.callerImage,
        memberId: data.memberId
      });
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

    this.socket.on("incoming_group_video_call", (data) => {
      navigationRef.navigate("VideoScreen", {
        isGroup: true,
        isCaller: data.isCaller,
        groupId: data.groupId,
        participants: data.participants,
        callerId: data.callerId,
        callerName: data.callerName,
        callerImage: data.callerImage,
        memberId: data.memberId
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