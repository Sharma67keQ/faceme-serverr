import { useQuery } from "@tanstack/react-query";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/post-card";
import { ScreenState } from "@/components/screen-state";
import { Screen } from "@/components/ui/screen";
import { SectionHeader } from "@/components/ui/section-header";
import { reelService } from "@/services/reels";
import { userService } from "@/services/users";
import { useAuthStore } from "@/store/auth-store";
import { Post } from "@/types/domain";
import { colors, radius, spacing } from "@/utils/theme";

export default function ProfileScreen() {
  const currentUser = useAuthStore((state) => state.user);
  const postsQuery = useQuery({
    queryKey: ["profile-posts", currentUser?.username],
    queryFn: () => (currentUser?.username ? userService.getUserPostsByUsername(currentUser.username) : Promise.resolve([])),
    enabled: Boolean(currentUser?.username),
  });
  const reelsQuery = useQuery({ queryKey: ["profile-reels"], queryFn: reelService.list });

  if (!currentUser) {
    return (
      <Screen>
        <ScreenState title="Profile unavailable" message="Sign in again to load your profile." variant="error" />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={styles.cover} />
      <View style={styles.profileCard}>
        <Avatar name={currentUser.firstName ?? currentUser.username} size={96} />
        <Text style={styles.name}>{currentUser.firstName ?? currentUser.username}</Text>
        <Text style={styles.meta}>@{currentUser.username}</Text>
        {currentUser.bio ? <Text style={styles.bio}>{currentUser.bio}</Text> : null}
        <View style={styles.actions}>
          <Button label="Edit profile" onPress={() => router.push("/profile/edit")} />
          <Button
            label="Connections"
            variant="secondary"
            onPress={() => router.push(`/profile/${currentUser.username}/connections?type=followers` as never)}
          />
        </View>
      </View>
      <SectionHeader title="Posts" />
      {postsQuery.isLoading ? <ScreenState title="Loading posts" variant="loading" /> : null}
      {postsQuery.isError ? (
        <ScreenState title="Posts unavailable" message="We could not load your posts." variant="error" onAction={() => void postsQuery.refetch()} />
      ) : null}
      {!postsQuery.isLoading && !postsQuery.isError ? postsQuery.data?.map((post: Post) => <PostCard key={post.id} post={post} />) : null}
      {!postsQuery.isLoading && !postsQuery.isError && !postsQuery.data?.length ? (
        <ScreenState title="No posts yet" message="Create your first post from the composer." />
      ) : null}
      <SectionHeader title="Reels" />
      {reelsQuery.isLoading ? <ScreenState title="Loading reels" message="Fetching your latest video posts." variant="loading" /> : null}
      {reelsQuery.isError ? (
        <ScreenState title="Reels unavailable" message="We could not load your reels." variant="error" onAction={() => void reelsQuery.refetch()} />
      ) : null}
      {!reelsQuery.isLoading && !reelsQuery.isError ? reelsQuery.data?.slice(0, 3).map((reel) => (
        <Pressable key={reel.id} style={styles.reelCard} onPress={() => router.push("/reels")}>
          <Text style={styles.reelTitle}>{reel.caption ?? "Untitled reel"}</Text>
          <Text style={styles.reelMeta}>
            {reel.likesCount} likes {"\u2022"} {reel.commentsCount ?? 0} comments
          </Text>
        </Pressable>
      )) : null}
      {!reelsQuery.isLoading && !reelsQuery.isError && !reelsQuery.data?.length ? (
        <ScreenState title="No reels yet" message="Your published reels will appear here." />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  cover: {
    backgroundColor: colors.backgroundStrong,
    borderRadius: radius.lg,
    height: 180,
  },
  profileCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    marginTop: -24,
    padding: spacing.md,
  },
  name: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
  },
  meta: {
    color: colors.textSoft,
  },
  bio: {
    color: colors.textMuted,
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  reelCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  reelTitle: {
    color: colors.text,
    fontWeight: "700",
  },
  reelMeta: {
    color: colors.textMuted,
    fontSize: 13,
  },
});
