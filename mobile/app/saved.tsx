import { useQuery } from "@tanstack/react-query";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { PostCard } from "@/components/post-card";
import { Screen } from "@/components/ui/screen";
import { postService } from "@/services/posts";
import { colors, radius, spacing } from "@/utils/theme";

export default function SavedPostsScreen() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["saved-posts"],
    queryFn: postService.getSavedPosts,
  });

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.title}>Saved posts</Text>
        <Text style={styles.subtitle}>Come back to posts you want to re-read, reply to, or share later.</Text>
      </View>
      {isLoading ? <Text style={styles.feedback}>Loading saved posts...</Text> : null}
      {isError ? (
        <Text style={styles.feedback} onPress={() => void refetch()}>
          Could not load saved posts. Tap to retry.
        </Text>
      ) : null}
      {!isLoading && !isError && !data?.length ? (
        <Text style={styles.feedback}>You have not saved any posts yet.</Text>
      ) : null}
      <ScrollView contentContainerStyle={styles.list}>
        {data?.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </ScrollView>
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
  feedback: {
    color: colors.textMuted,
  },
  list: {
    gap: spacing.md,
    paddingBottom: 120,
  },
});
