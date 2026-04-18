import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { ScreenState } from "@/components/screen-state";
import { Avatar } from "@/components/ui/avatar";
import { Screen } from "@/components/ui/screen";
import { userService } from "@/services/users";
import { colors, radius, spacing } from "@/utils/theme";

export default function ConnectionsScreen() {
  const { username, type } = useLocalSearchParams<{ username: string; type: "followers" | "following" }>();
  const isFollowers = type === "followers";
  const { data = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["connections", username, type],
    queryFn: () => (isFollowers ? userService.getFollowers(username) : userService.getFollowing(username)),
  });

  return (
    <Screen>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListHeaderComponent={(
          <View style={styles.hero}>
            <Text style={styles.title}>{isFollowers ? "Followers" : "Following"}</Text>
            <Text style={styles.subtitle}>People connected to @{username}</Text>
          </View>
        )}
        ListEmptyComponent={
          isLoading ? (
            <ScreenState variant="loading" title="Loading people" message="Fetching this connection list." />
          ) : isError ? (
            <ScreenState
              variant="error"
              title="Connections unavailable"
              message="We could not load this list right now."
              actionLabel="Retry"
              onAction={() => void refetch()}
            />
          ) : (
            <ScreenState variant="empty" title="No users here yet" message="This connection list is empty right now." />
          )
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push(`/profile/${item.username}`)}
          >
            <Avatar name={item.firstName ?? item.username} />
            <View style={styles.meta}>
              <Text style={styles.name}>{item.firstName}</Text>
              <Text style={styles.username}>@{item.username}</Text>
              {item.bio ? <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text> : null}
            </View>
            <Text style={styles.viewProfile}>View Profile</Text>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 28,
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
  },
  list: {
    flexGrow: 1,
    gap: spacing.sm,
    paddingBottom: 140,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  card: {
    alignItems: "center",
    backgroundColor: "rgba(38, 33, 63, 0.92)",
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
  },
  meta: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: colors.text,
    fontWeight: "800",
  },
  username: {
    color: colors.textMuted,
  },
  bio: {
    color: colors.textSoft,
    lineHeight: 18,
  },
  viewProfile: {
    color: colors.primaryDark,
    fontWeight: "700",
  },
});
