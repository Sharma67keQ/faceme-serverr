import { Redirect, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { StyleSheet, Text, View } from "react-native";
import { PostCard } from "@/components/post-card";
import { Screen } from "@/components/ui/screen";
import { postService } from "@/services/posts";
import { useAuthStore } from "@/store/auth-store";
import { colors, radius, spacing } from "@/utils/theme";

export default function SharedPostScreen() {
  const { shareSlug } = useLocalSearchParams<{ shareSlug: string }>();
  const accessToken = useAuthStore((state) => state.accessToken);

  const { data, isLoading } = useQuery({
    queryKey: ["shared-post", shareSlug],
    queryFn: () => postService.getSharedPost(shareSlug),
    enabled: Boolean(accessToken && shareSlug),
  });

  if (!accessToken) {
    return <Redirect href="/(auth)/register" />;
  }

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.title}>Shared post</Text>
        <Text style={styles.subtitle}>Opening a Faceme post shared from the network.</Text>
      </View>
      {isLoading ? <Text style={styles.feedback}>Loading post...</Text> : null}
      {data ? <PostCard post={data} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.textMuted,
    lineHeight: 21,
  },
  feedback: {
    color: colors.textMuted,
  },
});
