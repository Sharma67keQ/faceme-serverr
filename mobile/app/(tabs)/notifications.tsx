import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Screen } from "@/components/ui/screen";
import { notificationService } from "@/services/notifications";
import { colors, radius, spacing } from "@/utils/theme";

const formatTimestamp = (value: string) =>
  Number.isNaN(new Date(value).getTime())
    ? "Unknown time"
    : new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(value));

export default function NotificationsScreen() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationService.getNotifications,
  });
  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) => notificationService.markRead(notificationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  return (
    <Screen scroll>
      <View style={styles.hero}>
        <Text style={styles.title}>Notifications</Text>
        <Text style={styles.subtitle}>Updates from your Faceme graph, messages, stories, and communities.</Text>
      </View>
      {!data?.length ? <Text style={styles.empty}>No activity yet.</Text> : null}
      {data?.map((item) => (
        <Pressable
          key={item.id}
          style={[styles.card, item.isRead ? styles.cardRead : null]}
          onPress={() => {
            if (!item.isRead) {
              markReadMutation.mutate(item.id);
            }

            if (item.entityType === "user" && item.actor?.username) {
              router.push(`/profile/${item.actor.username}`);
              return;
            }

            if (item.entityType === "status" && item.entityId) {
              router.push(`/status/${item.entityId}` as never);
              return;
            }

            if (item.entityType === "story" && item.entityId) {
              router.push(`/story/${item.entityId}`);
              return;
            }

            if (item.entityType === "page" && item.entityId) {
              router.push("/explore");
              return;
            }

            if (item.entityType === "group" && item.entityId) {
              router.push("/communities");
              return;
            }

            if (item.entityType === "reel") {
              router.push("/reels");
              return;
            }

            if (item.entityType === "conversation" && item.entityId) {
              router.push(`/chat/${item.entityId}`);
              return;
            }

            if (item.entityType === "post") {
              router.push("/explore");
            }
          }}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            {!item.isRead ? <View style={styles.unreadDot} /> : null}
          </View>
          <Text style={styles.meta}>
            {item.actor ? `${item.actor.firstName ?? item.actor.username} • ` : ""}
            {formatTimestamp(item.createdAt)}
          </Text>
          <Text style={styles.body}>{item.body ?? "No additional details."}</Text>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "800",
  },
  hero: {
    backgroundColor: "rgba(38, 33, 63, 0.94)",
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
  },
  subtitle: {
    color: colors.textMuted,
    lineHeight: 21,
  },
  card: {
    backgroundColor: "rgba(38, 33, 63, 0.92)",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardRead: {
    opacity: 0.75,
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  cardTitle: {
    color: colors.text,
    fontWeight: "700",
    flex: 1,
  },
  body: {
    color: colors.textMuted,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
    textTransform: "uppercase",
  },
  unreadDot: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  empty: {
    color: colors.textMuted,
  },
});
