import { useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ScreenState } from "@/components/screen-state";
import { NeonLogo } from "@/components/brand/neon-logo";
import { Screen } from "@/components/ui/screen";
import { chatService } from "@/services/chat";
import { useAuthStore } from "@/store/auth-store";
import { useChatStore } from "@/store/chat-store";
import { colors, gradients, radius, spacing } from "@/utils/theme";

const formatBubbleTime = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

export default function ConversationScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const resolvedConversationId = typeof conversationId === "string" ? conversationId : "";
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUserId = useAuthStore((state) => state.user?.id);
  const setMessages = useChatStore((state) => state.setMessages);
  const appendMessage = useChatStore((state) => state.appendMessage);
  const setActiveConversation = useChatStore((state) => state.setActiveConversation);
  const [text, setText] = useState("");
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const [messageStatuses, setMessageStatuses] = useState<Record<string, "SENT" | "DELIVERED" | "SEEN">>({});
  const [composerError, setComposerError] = useState<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["messages", resolvedConversationId],
    queryFn: () => chatService.getMessages(resolvedConversationId),
    enabled: Boolean(resolvedConversationId),
    refetchInterval: 4000,
  });

  useEffect(() => {
    if (!resolvedConversationId) {
      return;
    }

    setActiveConversation(resolvedConversationId);

    return () => {
      setActiveConversation(null);
    };
  }, [resolvedConversationId, setActiveConversation]);

  useEffect(() => {
    if (resolvedConversationId && data) {
      setMessages(resolvedConversationId, data);
    }
  }, [resolvedConversationId, data, setMessages]);

  useEffect(() => {
    if (!accessToken || !resolvedConversationId) {
      return;
    }

    const socket = chatService.connect(accessToken);
    if (!socket) {
      return;
    }

    const handleNewMessage = (message: any) => {
      if (message.conversationId === resolvedConversationId) {
        appendMessage(resolvedConversationId, message);
      }
    };

    const handleTypingUpdate = (payload: { conversationId: string; userId: string; isTyping: boolean }) => {
      if (payload.conversationId !== resolvedConversationId || payload.userId === currentUserId) {
        return;
      }

      setTypingUserId(payload.isTyping ? payload.userId : null);
    };

    const handleMessageStatus = (payload: {
      conversationId: string;
      messageId: string;
      userId: string;
      status: "SENT" | "DELIVERED" | "SEEN";
    }) => {
      if (payload.conversationId !== resolvedConversationId || payload.userId === currentUserId) {
        return;
      }

      setMessageStatuses((currentStatuses) => ({
        ...currentStatuses,
        [payload.messageId]: payload.status,
      }));
    };

    socket.emit("conversation:join", resolvedConversationId);
    socket.on("message:new", handleNewMessage);
    socket.on("typing:update", handleTypingUpdate);
    socket.on("message:status", handleMessageStatus);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("typing:update", handleTypingUpdate);
      socket.off("message:status", handleMessageStatus);
      socket.emit("typing:stop", { conversationId: resolvedConversationId });
    };
  }, [accessToken, appendMessage, currentUserId, resolvedConversationId]);

  const messages = useChatStore((state) => state.messagesByConversation[resolvedConversationId] ?? []);

  useEffect(() => {
    if (!accessToken || !resolvedConversationId || !messages.length) {
      return;
    }

    const socket = chatService.connect(accessToken);
    if (!socket) {
      return;
    }

    const lastIncomingMessage = [...messages].reverse().find((message) => message.senderId !== currentUserId);

    if (!lastIncomingMessage) {
      return;
    }

    socket.emit("message:seen", {
      conversationId: resolvedConversationId,
      messageId: lastIncomingMessage.id,
    });
  }, [accessToken, currentUserId, messages, resolvedConversationId]);

  useEffect(
    () => () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    },
    [],
  );

  const handleTextChange = (value: string) => {
    setText(value);
    setComposerError(null);

    if (!accessToken || !resolvedConversationId) {
      return;
    }

    const socket = chatService.connect(accessToken);
    if (!socket) {
      return;
    }

    if (!value.trim()) {
      socket.emit("typing:stop", { conversationId: resolvedConversationId });
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      return;
    }

    socket.emit("typing:start", { conversationId: resolvedConversationId });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing:stop", { conversationId: resolvedConversationId });
    }, 1200);
  };

  const handleSend = async () => {
    const trimmedText = text.trim();

    if (!trimmedText) {
      return;
    }

    if (!resolvedConversationId) {
      setComposerError("This conversation link is invalid.");
      return;
    }

    try {
      setComposerError(null);

      if (accessToken) {
        const socket = chatService.connect(accessToken);

        if (!socket) {
          throw new Error("Socket connection unavailable.");
        }

        socket.emit("typing:stop", { conversationId: resolvedConversationId });
        socket.emit("message:send", {
          conversationId: resolvedConversationId,
          text: trimmedText,
          type: "TEXT",
        });
      } else {
        await chatService.sendMessage(resolvedConversationId, { text: trimmedText, type: "TEXT" });
      }

      setText("");
    } catch (error) {
      console.error("Failed to send message", error);
      setComposerError("Message could not be sent. Try again.");
    }
  };

  if (!resolvedConversationId) {
    return (
      <Screen>
        <ScreenState variant="error" title="Conversation unavailable" message="The selected chat route is invalid." />
      </Screen>
    );
  }

  if (isLoading && !messages.length) {
    return (
      <Screen>
        <ScreenState variant="loading" title="Opening chat" message="Messages are loading." />
      </Screen>
    );
  }

  if (isError && !messages.length) {
    return (
      <Screen>
        <ScreenState
          variant="error"
          title="Could not load messages"
          message="This chat is temporarily unavailable."
          actionLabel="Retry"
          onAction={() => void refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <LinearGradient colors={gradients.card} style={styles.hero}>
        <View style={styles.heroTitleRow}>
          <NeonLogo size={34} />
          <Text style={styles.title}>Conversation</Text>
        </View>
        <Text style={styles.subtitle}>Real-time text only. No extra controls, no clutter.</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.messages} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {!messages.length ? <Text style={styles.feedback}>No messages yet. Say hello first.</Text> : null}
        {messages.map((message) => {
          const isMine = message.senderId === currentUserId;

          return (
            <View key={message.id} style={[styles.bubbleRow, isMine ? styles.bubbleRowMine : null]}>
              {!isMine ? <Text style={styles.senderLabel}>{message.sender.firstName ?? message.sender.username}</Text> : null}
              <View style={[styles.bubble, isMine ? styles.mine : styles.theirs]}>
                <Text style={[styles.messageText, isMine ? styles.messageTextMine : null]}>{message.text ?? ""}</Text>
              </View>
              <Text style={styles.metaText}>
                {formatBubbleTime(message.createdAt)}
                {isMine ? ` · ${messageStatuses[message.id] ?? "SENT"}` : ""}
              </Text>
            </View>
          );
        })}
        {typingUserId ? <Text style={styles.typing}>Someone is typing...</Text> : null}
      </ScrollView>

      <View style={styles.composer}>
        <TextInput
          value={text}
          onChangeText={handleTextChange}
          placeholder="Write a message"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
        <Pressable style={styles.send} onPress={handleSend}>
          <Text style={styles.sendLabel}>Send</Text>
        </Pressable>
      </View>
      {composerError ? <Text style={styles.composerError}>{composerError}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.7,
  },
  heroTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  subtitle: {
    color: colors.textMuted,
    lineHeight: 21,
  },
  messages: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  bubbleRow: {
    alignItems: "flex-start",
    gap: 6,
  },
  bubbleRowMine: {
    alignItems: "flex-end",
  },
  senderLabel: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "700",
  },
  bubble: {
    borderRadius: radius.lg,
    maxWidth: "82%",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  mine: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
  },
  theirs: {
    backgroundColor: "rgba(38, 33, 63, 0.92)",
    borderColor: colors.border,
    borderWidth: 1,
  },
  messageText: {
    color: colors.text,
    lineHeight: 21,
  },
  messageTextMine: {
    color: colors.text,
  },
  metaText: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: "700",
  },
  typing: {
    color: colors.textMuted,
    fontStyle: "italic",
  },
  feedback: {
    color: colors.textMuted,
  },
  composer: {
    alignItems: "center",
    backgroundColor: "rgba(38, 33, 63, 0.95)",
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.sm,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: radius.pill,
    color: colors.text,
    flex: 1,
    minHeight: 50,
    paddingHorizontal: spacing.md,
  },
  send: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    justifyContent: "center",
    minHeight: 50,
    minWidth: 84,
    paddingHorizontal: spacing.md,
  },
  sendLabel: {
    color: colors.text,
    fontWeight: "800",
  },
  composerError: {
    color: colors.danger,
  },
});
