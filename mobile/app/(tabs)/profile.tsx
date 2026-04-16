import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { PostCard } from "@/components/post-card";
import { monetizationService } from "@/services/monetization";
import { reelService } from "@/services/reels";
import { userService } from "@/services/users";
import { useAuthStore } from "@/store/auth-store";
import { colors, radius, spacing } from "@/utils/theme";

type ProfileTab = "POSTS" | "MEDIA" | "REELS";

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const [activeTab, setActiveTab] = useState<ProfileTab>("POSTS");
  const stats = [
    { label: "Followers", value: user?._count?.followers ?? 0, type: "followers" },
    { label: "Following", value: user?._count?.following ?? 0, type: "following" },
    { label: "Posts", value: user?._count?.posts ?? 0, type: "posts" },
  ] as const;
  const { data: posts = [] } = useQuery({
    queryKey: ["my-profile-posts", user?.username],
    queryFn: () => (user?.username ? userService.getUserPostsByUsername(user.username) : Promise.resolve([])),
    enabled: Boolean(user?.username),
  });
  const { data: reels = [] } = useQuery({
    queryKey: ["my-profile-reels", user?.username],
    queryFn: reelService.list,
    enabled: Boolean(user?.username),
  });
  const { data: wallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: monetizationService.getWallet,
    enabled: Boolean(user),
  });
  const mediaPosts = posts.filter((post: any) => Boolean(post.mediaUrl));
  const userReels = reels.filter((reel) => reel.author.username === user?.username);

  const openConnections = (type: "followers" | "following") => {
    if (!user?.username) {
      return;
    }

    router.push(`/profile/${user.username}/connections?type=${type}` as never);
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace("/(auth)/login");
  };

  return (
    <Screen>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <Avatar name={user?.firstName ?? user?.username ?? "?"} size={82} />
          <View style={styles.heroMeta}>
            <Text style={styles.name}>{user?.firstName ?? "Your profile"}</Text>
            <Text style={styles.username}>@{user?.username ?? "faceme"}</Text>
            <Text style={styles.bio}>
              {user?.bio ?? "Show your people what you care about, post often, and keep your corner of Faceme alive."}
            </Text>
          </View>
        </View>

        <View style={styles.statRow}>
          {stats.map((stat) => (
            <Pressable
              key={stat.label}
              style={styles.statPill}
              onPress={() => {
                if (stat.type === "followers" || stat.type === "following") {
                  openConnections(stat.type);
                }
              }}
            >
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.actionRow}>
          <Button label="Edit profile" onPress={() => router.push("/profile/edit")} />
          <Button label="Messages" variant="secondary" onPress={() => router.push("/(tabs)/chats")} />
        </View>
      </View>

      <View style={styles.infoStrip}>
        <View style={styles.infoCard}>
          <Ionicons name="sparkles-outline" size={18} color={colors.primaryDark} />
          <Text style={styles.infoValue}>{wallet?.balanceCoins ?? 0}</Text>
          <Text style={styles.infoLabel}>Coins</Text>
        </View>
        <View style={styles.infoCard}>
          <Ionicons name="globe-outline" size={18} color={colors.primaryDark} />
          <Text style={styles.infoValue}>{user?.location ?? "World"}</Text>
          <Text style={styles.infoLabel}>Location</Text>
        </View>
        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.primaryDark} />
          <Text style={styles.infoValue}>{user?.accountType ?? "PERSONAL"}</Text>
          <Text style={styles.infoLabel}>Account</Text>
        </View>
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

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {activeTab === "POSTS" ? "Posts" : activeTab === "MEDIA" ? "Media" : "Reels"}
        </Text>
        <Text style={styles.sectionMeta}>
          {activeTab === "POSTS" ? posts.length : activeTab === "MEDIA" ? mediaPosts.length : userReels.length}
        </Text>
      </View>

      {activeTab === "MEDIA" ? (
        <View style={styles.grid}>
          {mediaPosts.map((post: any) => (
            <View key={post.id} style={styles.mediaTile}>
              <Text style={styles.mediaBadge}>{post.mediaType === "VIDEO" ? "Video" : "Photo"}</Text>
              <Text style={styles.mediaCaption} numberOfLines={3}>
                {post.body || "Shared from your Faceme feed"}
              </Text>
            </View>
          ))}
          {!mediaPosts.length ? <Text style={styles.empty}>No media yet. Add photos or videos from the create hub.</Text> : null}
        </View>
      ) : null}

      {activeTab === "REELS" ? (
        <View style={styles.reelList}>
          {userReels.map((reel) => (
            <Pressable key={reel.id} style={styles.reelCard} onPress={() => router.push("/reels")}>
              <Text style={styles.reelTitle} numberOfLines={2}>
                {reel.caption ?? "Faceme reel"}
              </Text>
              <Text style={styles.reelMeta}>
                {reel.likesCount} likes {"\u2022"} {reel.commentsCount ?? 0} comments
              </Text>
            </Pressable>
          ))}
          {!userReels.length ? <Text style={styles.empty}>No reels yet. Publish your first reel from Create.</Text> : null}
        </View>
      ) : null}

      {activeTab === "POSTS" ? (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Latest updates</Text>
            <Pressable onPress={() => router.push("/profile/edit")}>
              <Text style={styles.sectionLink}>Edit profile</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.postList} showsVerticalScrollIndicator={false}>
            {posts.map((post: any) => (
              <PostCard key={post.id} post={post} />
            ))}
            {!posts.length ? <Text style={styles.empty}>No posts yet. Publish your first update from Home.</Text> : null}
          </ScrollView>
        </>
      ) : null}

      <Button label="Sign out" variant="secondary" onPress={handleSignOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: "rgba(38, 33, 63, 0.94)",
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
  },
  heroTop: {
    flexDirection: "row",
    gap: spacing.md,
  },
  heroMeta: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.7,
  },
  username: {
    color: colors.primary,
    fontWeight: "800",
  },
  bio: {
    color: colors.textMuted,
    lineHeight: 21,
  },
  statRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  statPill: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: radius.lg,
    flex: 1,
    gap: 4,
    paddingVertical: spacing.md,
  },
  statValue: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "900",
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  infoStrip: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  infoCard: {
    alignItems: "center",
    backgroundColor: "rgba(38, 33, 63, 0.92)",
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  infoValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  infoLabel: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  tabRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  tabChip: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
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
  sectionLink: {
    color: colors.primary,
    fontWeight: "800",
  },
  grid: {
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
    backgroundColor: "rgba(255,255,255,0.07)",
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
    paddingBottom: spacing.sm,
  },
  empty: {
    color: colors.textMuted,
  },
});
