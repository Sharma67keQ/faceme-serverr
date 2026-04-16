import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { PostCard } from "@/components/post-card";
import { ScreenState } from "@/components/screen-state";
import { Avatar } from "@/components/ui/avatar";
import { Screen } from "@/components/ui/screen";
import { storyService } from "@/services/stories";
import { postService } from "@/services/posts";
import { useAuthStore } from "@/store/auth-store";
import { colors, gradients, radius, spacing } from "@/utils/theme";

const updateFeedPosts = (current: any[] | undefined, updater: (posts: any[]) => any[]) =>
  current ? updater([...current]) : current;

export default function FeedScreen() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const { data: feed = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["feed"],
    queryFn: postService.getFeed,
  });
  const { data: stories = [], isError: storiesError } = useQuery({
    queryKey: ["stories"],
    queryFn: storyService.getFollowingStories,
  });

  const likePostMutation = useMutation({
    mutationFn: (postId: string) => postService.likePost(postId),
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["feed"] });
      const previousFeed = queryClient.getQueryData<any[]>(["feed"]);
      queryClient.setQueryData(["feed"], (current: any[] | undefined) =>
        updateFeedPosts(current, (posts) =>
          posts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  _count: {
                    ...post._count,
                    likes: post._count.likes + 1,
                  },
                }
              : post,
          ),
        ),
      );
      return { previousFeed };
    },
    onError: (_error, _postId, context) => {
      if (context?.previousFeed) {
        queryClient.setQueryData(["feed"], context.previousFeed);
      }
    },
  });

  const commentMutation = useMutation({
    mutationFn: ({ postId, body }: { postId: string; body: string }) => postService.commentOnPost(postId, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const saveMutation = useMutation({
    mutationFn: (postId: string) => postService.toggleSavedPost(postId),
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["feed"] });
      const previousFeed = queryClient.getQueryData<any[]>(["feed"]);
      queryClient.setQueryData(["feed"], (current: any[] | undefined) =>
        updateFeedPosts(current, (posts) =>
          posts.map((post) => (post.id === postId ? { ...post, isSaved: !post.isSaved } : post)),
        ),
      );
      return { previousFeed };
    },
    onError: (_error, _vars, context) => {
      if (context?.previousFeed) {
        queryClient.setQueryData(["feed"], context.previousFeed);
      }
    },
  });

  const shareMutation = useMutation({
    mutationFn: (postId: string) => postService.sharePost(postId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  if (isLoading && !feed.length) {
    return (
      <Screen>
        <ScreenState variant="loading" title="Loading home" message="Faceme is pulling in your latest updates." />
      </Screen>
    );
  }

  if (isError && !feed.length) {
    return (
      <Screen>
        <ScreenState
          variant="error"
          title="Home feed unavailable"
          message="The feed did not load, but the rest of the app is still available."
          actionLabel="Retry"
          onAction={() => void refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <LinearGradient colors={gradients.card} style={styles.hero}>
        <View style={styles.heroText}>
          <Text style={styles.heroTitle}>Faceme</Text>
          <Text style={styles.heroBody}>Fast posts, live status, and conversations moving in one flow.</Text>
        </View>
        <Pressable style={styles.statusPulse} onPress={() => router.push("/status")}>
          <Ionicons name="sparkles-outline" size={18} color={colors.primaryDark} />
          <Text style={styles.statusPulseLabel}>Status</Text>
        </Pressable>
      </LinearGradient>

      <View style={styles.composerCard}>
        <View style={styles.composerRow}>
          <Avatar name={user?.firstName ?? user?.username ?? "?"} size={46} />
          <Pressable style={styles.composerInput} onPress={() => router.push("/(tabs)/create")}>
            <Text style={styles.composerPlaceholder}>Maxaa maskaxdaada ku jira?</Text>
          </Pressable>
        </View>
        <View style={styles.composerActions}>
          <Pressable style={styles.composerChip} onPress={() => router.push("/(tabs)/create")}>
            <Ionicons name="create-outline" size={16} color={colors.primaryDark} />
            <Text style={styles.composerChipLabel}>Post</Text>
          </Pressable>
          <Pressable style={styles.composerChip} onPress={() => router.push("/reels")}>
            <Ionicons name="play-circle-outline" size={16} color={colors.accent} />
            <Text style={styles.composerChipLabel}>Reel</Text>
          </Pressable>
          <Pressable style={styles.composerChip} onPress={() => router.push("/explore")}>
            <Ionicons name="compass-outline" size={16} color={colors.success} />
            <Text style={styles.composerChipLabel}>Explore</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.storySection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Stories</Text>
          <Text style={styles.sectionMeta}>Quick moments</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storyRow}>
          <Pressable style={styles.storyCreateCard} onPress={() => router.push("/status")}>
            <View style={styles.storyCreateBadge}>
              <Ionicons name="add" size={18} color={colors.surfaceRaised} />
            </View>
            <Text style={styles.storyCreateLabel}>Your story</Text>
          </Pressable>
          {stories.map((story) => (
            <Pressable key={story.id} style={styles.storyCard} onPress={() => router.push(`/story/${story.id}`)}>
              <View style={[styles.storyHalo, story.isViewed ? styles.storyHaloMuted : null]}>
                <Avatar name={story.author.firstName ?? story.author.username} size={54} />
              </View>
              <Text style={styles.storyLabel} numberOfLines={1}>
                {story.author.firstName ?? story.author.username}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        {storiesError ? <Text style={styles.feedback}>Stories are temporarily unavailable.</Text> : null}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Fresh in Faceme</Text>
        <Text style={styles.sectionMeta}>{feed.length} posts</Text>
      </View>

      <View style={styles.feedSection}>
        {isLoading ? <Text style={styles.feedback}>Refreshing feed...</Text> : null}
        {isError ? (
          <Text style={styles.feedback} onPress={() => void refetch()}>
            Could not refresh feed. Tap to retry.
          </Text>
        ) : null}
        {!isLoading && !isError && !feed.length ? <Text style={styles.feedback}>No posts yet. Start the flow.</Text> : null}
        {feed.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onLike={() => likePostMutation.mutate(post.id)}
            onComment={(body) => commentMutation.mutateAsync({ postId: post.id, body })}
            onSave={() => saveMutation.mutate(post.id)}
            onShare={() => shareMutation.mutate(post.id)}
            isCommenting={commentMutation.isPending}
          />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
    borderRadius: radius.xl,
    borderColor: colors.border,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    overflow: "hidden",
    padding: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 28,
  },
  heroText: {
    flex: 1,
    gap: spacing.xs,
  },
  heroTitle: {
    color: colors.surfaceRaised,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  heroBody: {
    color: colors.textMuted,
    lineHeight: 21,
  },
  statusPulse: {
    alignItems: "center",
    backgroundColor: colors.accentSoft,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    borderRadius: radius.lg,
    gap: 2,
    minWidth: 86,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  statusPulseLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800",
  },
  composerCard: {
    backgroundColor: "rgba(38, 33, 63, 0.92)",
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  composerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  composerInput: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: radius.pill,
    flex: 1,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  composerPlaceholder: {
    color: colors.textMuted,
    fontSize: 15,
  },
  composerActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  composerChip: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: radius.pill,
    flex: 1,
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "center",
    paddingVertical: spacing.sm,
  },
  composerChipLabel: {
    color: colors.primaryDark,
    fontWeight: "800",
  },
  storySection: {
    gap: spacing.sm,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
  },
  sectionMeta: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "700",
  },
  storyRow: {
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  storyCreateCard: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    gap: spacing.sm,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    width: 104,
  },
  storyCreateBadge: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: radius.pill,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  storyCreateLabel: {
    color: colors.surfaceRaised,
    fontSize: 13,
    fontWeight: "800",
  },
  storyCard: {
    alignItems: "center",
    backgroundColor: "rgba(38, 33, 63, 0.92)",
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    width: 104,
  },
  storyHalo: {
    borderColor: colors.accent,
    borderRadius: radius.pill,
    borderWidth: 2,
    padding: 3,
  },
  storyHaloMuted: {
    borderColor: colors.borderStrong,
  },
  storyLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "700",
  },
  feedSection: {
    gap: spacing.md,
  },
  feedback: {
    color: colors.textMuted,
  },
});
