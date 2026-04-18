import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Avatar } from "@/components/ui/avatar";
import { Conversation } from "@/types/domain";
import { colors, radius, spacing } from "@/utils/theme";

type ChatListItemProps = {
  conversation: Conversation;
  currentUserId?: string;
  onPress?: () => void;
};

const formatTimestamp = (value?: string | null) => {
  if (!value) {
    return "Now";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Now";
  }

  const diffMinutes = Math.max(1, Math.floor((Date.now() - date.getTime()) / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours}h`;
  }

  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
};

export const ChatListItem = memo(({ conversation, currentUserId, onPress }: ChatListItemProps) => {
  const peer =
    conversation.participants.find((participant) => participant.user.id !== currentUserId)?.user ??
    conversation.participants[0]?.user;
  const title =
    conversation.type === "DIRECT"
      ? peer?.firstName ?? peer?.username ?? "Conversation"
      : conversation.title ?? `${conversation.type === "COMMUNITY" ? "Community" : "Group"} chat`;
  const preview =
    conversation.lastMessage?.text ??
    (conversation.type === "DIRECT" ? "Start the conversation" : "Open the group conversation");
  const isOnline = peer?.presenceStatus === "ONLINE";

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.avatarWrap}>
        <Avatar name={title} size={52} />
        <View style={[styles.presenceDot, isOnline ? styles.presenceDotOnline : styles.presenceDotOffline]} />
      </View>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>{title}</Text>
          <Text style={styles.time}>{formatTimestamp(conversation.lastMessageAt ?? conversation.updatedAt)}</Text>
        </View>
        <View style={styles.bottomRow}>
          <Text style={styles.preview} numberOfLines={1}>{preview}</Text>
          {conversation.unreadCount ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadLabel}>{conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.meta}>{isOnline ? "Online now" : "Offline"} {"\u2022"} {conversation.type.toLowerCase()}</Text>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
  },
  avatarWrap: {
    position: "relative",
  },
  presenceDot: {
    borderColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 2,
    bottom: 0,
    height: 14,
    position: "absolute",
    right: 0,
    width: 14,
  },
  presenceDotOnline: {
    backgroundColor: colors.success,
  },
  presenceDotOffline: {
    backgroundColor: colors.textSoft,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  name: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
  },
  time: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "700",
  },
  bottomRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  preview: {
    color: colors.textMuted,
    flex: 1,
  },
  unreadBadge: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    justifyContent: "center",
    minWidth: 26,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  unreadLabel: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  meta: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
  },
});
