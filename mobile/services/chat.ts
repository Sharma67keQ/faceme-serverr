import { io, Socket } from "socket.io-client";
import { ChatListResponse, MessageListResponse } from "@/types/api";
import { logger } from "@/utils/logger";
import { api } from "./api";
import { runtimeConfig } from "./runtime-config";

let socket: Socket | null = null;

export const chatService = {
  async getConversations() {
    const { data } = await api.get<ChatListResponse>("/chat/conversations");
    return data;
  },
  async getMessages(conversationId: string) {
    const { data } = await api.get<MessageListResponse>(
      `/chat/conversations/${conversationId}/messages`,
    );
    return data;
  },
  async createDirectConversation(peerId: string) {
    const { data } = await api.post("/chat/conversations/direct", { peerId });
    return data;
  },
  async createGroupConversation(payload: { title: string; participantIds: string[] }) {
    const { data } = await api.post("/chat/conversations/group", payload);
    return data;
  },
  async sendMessage(
    conversationId: string,
    payload: {
      text?: string;
      mediaUrl?: string;
      type?: "TEXT" | "IMAGE" | "VIDEO";
      replyToMessageId?: string;
    },
  ) {
    const { data } = await api.post(`/chat/conversations/${conversationId}/messages`, payload);
    return data;
  },
  connect(token: string) {
    if (socket) {
      return socket;
    }

    try {
      socket = io(runtimeConfig.socketUrl, {
        auth: { token },
        transports: ["websocket"],
      });

      socket.on("connect_error", (error) => {
        logger.error("Socket connection error", error);
      });

      socket.on("disconnect", (reason) => {
        logger.warn("Socket disconnected", reason);
      });
    } catch (error) {
      logger.error("Failed to initialize socket", error);
      socket = null;
    }

    return socket;
  },
  on(event: string, listener: (...args: any[]) => void) {
    socket?.on(event, listener);
  },
  off(event: string, listener: (...args: any[]) => void) {
    socket?.off(event, listener);
  },
  onPresenceUpdate(listener: (payload: { userId: string; status: "ONLINE" | "OFFLINE" | "AWAY" }) => void) {
    socket?.on("presence:update", listener);
  },
  offPresenceUpdate(listener: (payload: { userId: string; status: "ONLINE" | "OFFLINE" | "AWAY" }) => void) {
    socket?.off("presence:update", listener);
  },
  disconnect() {
    socket?.disconnect();
    socket = null;
  },
};
