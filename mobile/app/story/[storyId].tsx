import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { MediaAttachmentPreview } from "@/components/media-attachment-preview";
import { ScreenState } from "@/components/screen-state";
import { Screen } from "@/components/ui/screen";
import { storyService } from "@/services/stories";
import { colors, radius, spacing } from "@/utils/theme";

export default function StoryViewerScreen() {
  const { storyId } = useLocalSearchParams<{ storyId: string }>();
  const queryClient = useQueryClient();
  const { data: stories = [], isLoading } = useQuery({
    queryKey: ["stories"],
    queryFn: storyService.getFollowingStories,
  });
  const markViewedMutation = useMutation({
    mutationFn: (id: string) => storyService.markViewed(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });
  const story = stories.find((item) => item.id === storyId);

  useEffect(() => {
    if (story && !story.isViewed) {
      markViewedMutation.mutate(story.id);
    }
  }, [story, markViewedMutation]);

  return (
    <Screen>
      {isLoading ? <ScreenState variant="loading" title="Loading story" message="Story media is loading." /> : null}
      {story ? (
        <View style={styles.card}>
          <Text style={styles.author}>{story.author.firstName ?? story.author.username}</Text>
          <Text style={styles.mediaLabel}>{story.mediaType} story</Text>
          <MediaAttachmentPreview
            uri={story.mediaUrl}
            kind={story.mediaType === "VIDEO" ? "VIDEO" : "IMAGE"}
            height={420}
            autoPlay={story.mediaType === "VIDEO"}
          />
          {story.caption ? <Text style={styles.caption}>{story.caption}</Text> : null}
        </View>
      ) : !isLoading ? (
        <ScreenState variant="empty" title="Story not found" message="This story is no longer available." />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(38, 33, 63, 0.94)",
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.xl,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
  },
  author: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
  },
  mediaLabel: {
    color: colors.primary,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  caption: {
    color: colors.text,
    lineHeight: 22,
  },
  feedback: {
    color: colors.textMuted,
  },
});
