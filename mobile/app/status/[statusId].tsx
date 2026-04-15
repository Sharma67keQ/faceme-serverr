import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MediaAttachmentPreview } from "@/components/media-attachment-preview";
import { ScreenState } from "@/components/screen-state";
import { Avatar } from "@/components/ui/avatar";
import { Screen } from "@/components/ui/screen";
import { statusService } from "@/services/status";
import { colors, radius, spacing } from "@/utils/theme";

const QUICK_REACTIONS = ["🔥", "👏", "❤️"];

export default function StatusDetailScreen() {
  const params = useLocalSearchParams<{ statusId: string | string[] }>();
  const statusId = Array.isArray(params.statusId) ? params.statusId[0] : params.statusId;
  const queryClient = useQueryClient();
  const { data: status, isLoading, isError, refetch } = useQuery({
    queryKey: ["status-detail", statusId],
    queryFn: () => (statusId ? statusService.getById(statusId) : Promise.resolve(null)),
    enabled: Boolean(statusId),
  });

  const viewMutation = useMutation({
    mutationFn: () => statusService.markViewed(statusId!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["status"] });
      await queryClient.invalidateQueries({ queryKey: ["status-detail", statusId] });
    },
  });

  const reactMutation = useMutation({
    mutationFn: (emoji: string) => statusService.react(statusId!, { emoji }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["status"] });
      await queryClient.invalidateQueries({ queryKey: ["status-detail", statusId] });
    },
  });

  useEffect(() => {
    if (status && !status.isViewed) {
      viewMutation.mutate();
    }
  }, [status]);

  if (isLoading) {
    return (
      <Screen>
        <ScreenState variant="loading" title="Opening status" message="Status details are loading." />
      </Screen>
    );
  }

  if (isError || !status) {
    return (
      <Screen>
        <ScreenState
          variant="error"
          title="Could not open status"
          message="This status is unavailable."
          actionLabel="Retry"
          onAction={() => void refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={styles.card}>
        <View style={styles.identity}>
          <Pressable onPress={() => router.push(`/profile/${status.author.username}`)}>
            <Avatar name={status.author.firstName ?? status.author.username} size={52} />
          </Pressable>
          <View style={styles.identityText}>
            <Text style={styles.author}>{status.author.firstName ?? status.author.username}</Text>
            <Text style={styles.meta}>{status.visibility} · {status.viewersCount ?? 0} viewers</Text>
          </View>
        </View>
        {status.text ? <Text style={styles.body}>{status.text}</Text> : null}
        {status.mediaUrl ? (
          <MediaAttachmentPreview
            uri={status.mediaUrl}
            kind={status.kind === "VIDEO" ? "VIDEO" : "IMAGE"}
            height={420}
            autoPlay={status.kind === "VIDEO"}
          />
        ) : null}
        <View style={styles.reactionRow}>
          {QUICK_REACTIONS.map((emoji) => (
            <Pressable key={emoji} style={styles.reactionChip} onPress={() => reactMutation.mutate(emoji)}>
              <Text style={styles.reactionLabel}>{emoji}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(38, 33, 63, 0.94)",
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
  },
  identity: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  identityText: {
    flex: 1,
    gap: 2,
  },
  author: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  meta: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "700",
  },
  body: {
    color: colors.text,
    fontSize: 18,
    lineHeight: 26,
  },
  reactionRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  reactionChip: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  reactionLabel: {
    fontSize: 18,
  },
});
