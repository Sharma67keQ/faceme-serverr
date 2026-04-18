import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { PostCard } from "@/components/post-card";
import { ScreenState } from "@/components/screen-state";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { chatService } from "@/services/chat";
import { reelService } from "@/services/reels";
import { socialService } from "@/services/social";
import { userService } from "@/services/users";
import { colors, radius, spacing } from "@/utils/theme";

type ProfileTab = "POSTS" | "MEDIA" | "REELS";

export default function PublicProfileScreen() {
  const params = useLocalSearchParams<{ username: string | string[] }>();
  const username = Array.isArray(params.username) ? params.username[0] : params.username;
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ProfileTab>("POSTS");

  const profileQuery = useQuery({
    queryKey: ["public-profile", username],
    queryFn: () => (username ? userService.getUserByUsername(username) : Promise.resolve(null)),
    enabled: Boolean(username),
  });
  const user = profileQuery.data;

  const postsQuery = useQuery({
    queryKey: ["public-profile-posts", username],
    queryFn: () => (username ? userService.getUserPostsByUsername(username) : Promise.resolve([])),
    enabled: Boolean(user?.canViewPosts),
  });

  const reelsQuery = useQuery({
    queryKey: ["public-profile-reels", username],
    queryFn: reelService.list,
    enabled: Boolean(user?.canViewPosts && username),
  });

  const relationshipQuery = useQuery({
    queryKey: ["relationship", user?.id],
    queryFn: () => (user?.id ? socialService.getRelationship(user.id) : Promise.resolve(null)),
    enabled: Boolean(user?.id),
  });
  const relationship = relationshipQuery.data;

  const followMutation = useMutation({
    mutationFn: (userId: string) => userService.toggleFollow(userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["public-profile", username] });
      await queryClient.invalidateQueries({ queryKey: ["public-profile-posts", username] });
      await queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const messageMutation = useMutation({
    mutationFn: (peerId: string) => chatService.createDirectConversation(peerId),
    onSuccess: (conversation) => {
      router.push(`/chat/${conversation.id}`);
    },
  });

  const friendMutation = useMutation({
    mutationFn: async (action: "send" | "accept" | "remove") => {
      if (!user?.id) {
        return null;
      }

      if (action === "send") {
        return socialService.sendFriendRequest(user.id);
      }

      if (action === "remove") {
        return socialService.removeFriend(user.id);
      }

      if (!relationship?.friendRequestId) {
        return null;
      }

      return socialService.respondToFriendRequest(relationship.friendRequestId, "accept");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["relationship", user?.id] });
      await queryClient.invalidateQueries({ queryKey: ["launch-summary"] });
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const openConnections = (type: "followers" | "following") => {
    if (!username) {
      return;
    }

    router.push(`/profile/${username}/connections?type=${type}` as never);
  };

  const posts = postsQuery.data ?? [];
  const reels = reelsQuery.data ?? [];
  const mediaPosts = posts.filter((post: any) => Boolean(post.mediaUrl));
  const profileReels = reels.filter((reel) => reel.author.username === username);

  if (profileQuery.isLoading) {
    return (
      <Screen>
        <ScreenState variant="loading" title="Loading profile" message="Profile details are loading." />
      </Screen>
    );
  }

  if (profileQuery.isError || !user) {
    return (
      <Screen>
        <ScreenState
          variant="error"
          title="Could not load profile"
          message="This profile is unavailable right now."
          actionLabel="Retry"
          onAction={() => void profileQuery.refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.hero}>
        <Avatar name={user.firstName ?? user.username} size={72} />
        <Text style={styles.name}>{user.firstName ?? user.username}</Text>
        <Text style={styles.username}>@{user.username}</Text>
        {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
      </View>

      <View style={styles.stats}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{user._count?.posts ?? 0}</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>
        <Pressable style={styles.statCard} onPress={() => openConnections("followers")}>
          <Text style={styles.statValue}>{user._count?.followers ?? 0}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </Pressable>
        <Pressable style={styles.statCard} onPress={() => openConnections("following")}>
          <Text style={styles.statValue}>{user._count?.following ?? 0}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </Pressable>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{user.friendCount ?? 0}</Text>
          <Text style={styles.statLabel}>Friends</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          label={
            friendMutation.isPending
              ? "Updating..."
              : relationship?.isFriend
                ? "Friends"
                : relationship?.hasIncomingRequest
                  ? "Accept friend"
                  : relationship?.hasSentRequest
                    ? "Request sent"
                    : "Add friend"
          }
          variant={relationship?.isFriend ? "secondary" : "primary"}
          onPress={() =>
            friendMutation.mutate(
              relationship?.isFriend ? "remove" : relationship?.hasIncomingRequest ? "accept" : "send",
            )
          }
          disabled={friendMutation.isPending || Boolean(relationship?.hasSentRequest)}
        />
        <Button
          label={followMutation.isPending ? "Updating..." : user.isFollowing ? "Following" : "Follow"}
          variant={user.isFollowing ? "secondary" : "primary"}
          onPress={() => followMutation.mutate(user.id)}
          disabled={followMutation.isPending}
        />
        <Button
          label={messageMutation.isPending ? "Opening..." : "Message"}
          variant="secondary"
          onPress={() => messageMutation.mutate(user.id)}
          disabled={messageMutation.isPending}
        />
      </View>

      {relationship?.mutualFriendsCount ? (
        <View style={styles.relationshipCard}>
          <Text style={styles.relationshipTitle}>{relationship.mutualFriendsCount} mutual friends</Text>
          <Text style={styles.relationshipBody}>
            {relationship.mutualFriends.map((friend) => friend.firstName ?? friend.username).join(", ")}
          </Text>
        </View>
      ) : null}

      {!user.canViewPosts ? (
        <View style={styles.lockedCard}>
          <Text style={styles.lockedTitle}>Private profile</Text>
          <Text style={styles.lockedBody}>
            {user.profileVisibility === "FRIENDS"
              ? "Become friends with this person to view posts and deeper profile activity."
              : "Follow this account to view posts and deeper profile activity."}
          </Text>
        </View>
      ) : null}

      {user.canViewPosts ? (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Content</Text>
            <Text style={styles.sectionMeta}>@{user.username}</Text>
          </View>

          <View style={styles.tabRow}>
            {([
              { key: "POSTS", label: "Posts" },
              { key: "MEDIA", label: "Media" },
              { key: "REELS", label: "Reels" },
            ] as const).map((tab) => (
              <Pressable
                key={tab.key}
                style={[styles.tabChip, activeTab === tab.key ? styles.tabChipActive : null]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabLabel, activeTab === tab.key ? styles.tabLabelActive : null]}>{tab.label}</Text>
              </Pressable>
            ))}
          </View>

          {activeTab === "POSTS" ? (
            <ScrollView contentContainerStyle={styles.postList}>
              {postsQuery.isLoading ? <ScreenState variant="loading" title="Loading posts" message="Fetching this profile's posts." /> : null}
              {postsQuery.isError ? (
                <ScreenState
                  variant="error"
                  title="Posts unavailable"
                  message="We could not load this profile's posts."
                  actionLabel="Retry"
                  onAction={() => void postsQuery.refetch()}
                />
              ) : null}
              {!postsQuery.isLoading && !postsQuery.isError ? posts.map((post: any) => <PostCard key={post.id} post={post} />) : null}
              {!postsQuery.isLoading && !postsQuery.isError && !posts.length ? (
                <ScreenState variant="empty" title="No posts yet" message="This profile has not shared any posts yet." />
              ) : null}
            </ScrollView>
          ) : null}

          {activeTab === "MEDIA" ? (
            <View style={styles.mediaGrid}>
              {postsQuery.isLoading ? <ScreenState variant="loading" title="Loading media" message="Fetching shared photos and videos." /> : null}
              {postsQuery.isError ? (
                <ScreenState
                  variant="error"
                  title="Media unavailable"
                  message="We could not load this profile's media."
                  actionLabel="Retry"
                  onAction={() => void postsQuery.refetch()}
                />
              ) : null}
              {!postsQuery.isLoading && !postsQuery.isError ? mediaPosts.map((post: any) => (
                <View key={post.id} style={styles.mediaTile}>
                  <Text style={styles.mediaBadge}>{post.mediaType === "VIDEO" ? "Video" : "Photo"}</Text>
                  <Text style={styles.mediaCaption} numberOfLines={3}>
                    {post.body || "Shared from Faceme"}
                  </Text>
                </View>
              )) : null}
              {!postsQuery.isLoading && !postsQuery.isError && !mediaPosts.length ? (
                <ScreenState variant="empty" title="No media shared yet" message="Photos and videos will appear here." />
              ) : null}
            </View>
          ) : null}

          {activeTab === "REELS" ? (
            <View style={styles.reelList}>
              {reelsQuery.isLoading ? <ScreenState variant="loading" title="Loading reels" message="Fetching this profile's reels." /> : null}
              {reelsQuery.isError ? (
                <ScreenState
                  variant="error"
                  title="Reels unavailable"
                  message="We could not load this profile's reels."
                  actionLabel="Retry"
                  onAction={() => void reelsQuery.refetch()}
                />
              ) : null}
              {!reelsQuery.isLoading && !reelsQuery.isError ? profileReels.map((reel) => (
                <Pressable key={reel.id} style={styles.reelCard} onPress={() => router.push("/reels")}>
                  <Text style={styles.reelTitle} numberOfLines={2}>
                    {reel.caption ?? "Faceme reel"}
                  </Text>
                  <Text style={styles.reelMeta}>
                    {reel.likesCount} likes {"\u2022"} {reel.commentsCount ?? 0} comments
                  </Text>
                </Pressable>
              )) : null}
              {!reelsQuery.isLoading && !reelsQuery.isError && !profileReels.length ? (
                <ScreenState variant="empty" title="No reels yet" message="This profile has not published any reels yet." />
              ) : null}
            </View>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
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
  name: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
  },
  username: {
    color: colors.textMuted,
  },
  bio: {
    color: colors.text,
    lineHeight: 22,
    textAlign: "center",
  },
  stats: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  statCard: {
    alignItems: "center",
    backgroundColor: "rgba(38, 33, 63, 0.92)",
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    padding: spacing.md,
  },
  statValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 12,
    textTransform: "uppercase",
  },
  actions: {
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
    fontWeight: "700",
  },
  tabRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  tabChip: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    flex: 1,
    paddingVertical: spacing.sm,
  },
  tabChipActive: {
    backgroundColor: colors.primary,
  },
  tabLabel: {
    color: colors.textMuted,
    fontWeight: "800",
  },
  tabLabelActive: {
    color: colors.text,
  },
  mediaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  mediaTile: {
    backgroundColor: "rgba(38, 33, 63, 0.92)",
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    minHeight: 108,
    padding: spacing.sm,
    width: "31.5%",
  },
  mediaBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  mediaCaption: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },
  reelList: {
    gap: spacing.sm,
  },
  reelCard: {
    backgroundColor: "rgba(38, 33, 63, 0.92)",
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  reelTitle: {
    color: colors.text,
    fontWeight: "800",
    lineHeight: 20,
  },
  reelMeta: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "700",
  },
  postList: {
    gap: spacing.md,
    paddingBottom: 140,
  },
  lockedCard: {
    backgroundColor: "rgba(38, 33, 63, 0.92)",
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  lockedTitle: {
    color: colors.text,
    fontWeight: "800",
  },
  lockedBody: {
    color: colors.textMuted,
    lineHeight: 20,
  },
  feedback: {
    color: colors.textMuted,
  },
  relationshipCard: {
    backgroundColor: "rgba(38, 33, 63, 0.92)",
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  relationshipTitle: {
    color: colors.text,
    fontWeight: "800",
  },
  relationshipBody: {
    color: colors.textMuted,
    lineHeight: 20,
  },
});
