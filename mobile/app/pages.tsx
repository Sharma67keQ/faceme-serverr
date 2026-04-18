import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { FlatList, View, StyleSheet } from "react-native";
import { ScreenState } from "@/components/screen-state";
import { socialService } from "@/services/social";
import { Button } from "@/components/ui/button";
import { ListCard } from "@/components/ui/list-card";
import { Screen } from "@/components/ui/screen";
import { SectionHeader } from "@/components/ui/section-header";
import { spacing } from "@/utils/theme";

export default function PagesScreen() {
  const queryClient = useQueryClient();
  const { data: pages = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["pages"],
    queryFn: socialService.getPages,
  });
  const followMutation = useMutation({
    mutationFn: (pageId: string) => socialService.togglePageFollow(pageId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["pages"] });
    },
  });

  if (isLoading) {
    return (
      <Screen>
        <ScreenState variant="loading" title="Loading pages" message="Fetching page recommendations and follows." />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <ScreenState
          variant="error"
          title="Pages unavailable"
          message="We could not load pages right now."
          actionLabel="Retry"
          onAction={() => void refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={pages}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, gap: 16, paddingBottom: 96, paddingHorizontal: 16, paddingTop: 8 }}
        ListHeaderComponent={(
          <>
            <SectionHeader title="Pages" actionLabel="Create page" href="/create" />
            <View style={styles.row}>
              <Button label="Explore" variant="secondary" onPress={() => router.push("/explore")} />
              <Button label="Create" variant="secondary" onPress={() => router.push("/create")} />
            </View>
          </>
        )}
        ListEmptyComponent={<ScreenState variant="empty" title="No pages yet" message="Create a page to start publishing updates." />}
        renderItem={({ item: page }) => (
          <View style={styles.pageCard}>
          <ListCard
            title={page.name}
            subtitle={`${page.followersCount} followers \u2022 ${page.description ?? "Page updates"}`}
            onPress={() => router.push(`/page/${page.slug}`)}
          />
          <Button
            label={followMutation.isPending ? "Updating..." : page.isFollowing ? "Following" : "Follow page"}
            variant={page.isFollowing ? "secondary" : "primary"}
            onPress={() => followMutation.mutate(page.id)}
          />
        </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  pageCard: {
    gap: spacing.sm,
  },
});
