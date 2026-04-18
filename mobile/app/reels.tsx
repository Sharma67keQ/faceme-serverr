import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { MediaAttachmentPreview } from "@/components/media-attachment-preview";
import { ScreenState } from "@/components/screen-state";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { SectionHeader } from "@/components/ui/section-header";
import { reelService } from "@/services/reels";
import { colors, radius, spacing } from "@/utils/theme";

export default function ReelsScreen() {
  const queryClient = useQueryClient();
  const { data: reels = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["reels"],
    queryFn: reelService.list,
  });

  const likeMutation = useMutation({
    mutationFn: (reelId: string) => reelService.like(reelId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["reels"] });
    },
  });

  const shareMutation = useMutation({
    mutationFn: (reelId: string) => reelService.share(reelId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["reels"] });
    },
  });

  if (isLoading) {
    return (
      <Screen>
        <ScreenState variant="loading" title="Loading video" message="Preparing your reel feed." />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <ScreenState
          variant="error"
          title="Video unavailable"
          message="We could not load reels right now."
          actionLabel="Retry"
          onAction={() => void refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <SectionHeader title="Video" />
      {reels.length ? (
        reels.map((reel) => (
          <View key={reel.id} style={styles.card}>
            <View style={styles.videoFrame}>
              <MediaAttachmentPreview uri={reel.videoUrl} kind="VIDEO" height={220} autoPlay />
            </View>
            <Text style={styles.title}>{reel.caption ?? "Untitled reel"}</Text>
            <Text style={styles.videoLabel}>
              @{reel.author.username} {"\u2022"} {reel.likesCount} likes {"\u2022"} {reel.commentsCount ?? 0} comments
            </Text>
            <View style={styles.actions}>
              <Button label={reel.isLiked ? "Liked" : "Like"} variant="secondary" onPress={() => likeMutation.mutate(reel.id)} />
              <Button label="Creator" variant="secondary" onPress={() => router.push(`/profile/${reel.author.username}`)} />
              <Button label="Share" variant="secondary" onPress={() => shareMutation.mutate(reel.id)} />
            </View>
          </View>
        ))
      ) : (
        <ScreenState variant="empty" title="No reels yet" message="Video posts will appear here when creators publish them." />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  videoFrame: {
    overflow: "hidden",
    borderRadius: radius.lg,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  videoLabel: {
    color: colors.textMuted,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
});
