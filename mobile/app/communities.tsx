import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { ScreenState } from "@/components/screen-state";
import { Button } from "@/components/ui/button";
import { ListCard } from "@/components/ui/list-card";
import { Screen } from "@/components/ui/screen";
import { SectionHeader } from "@/components/ui/section-header";
import { socialService } from "@/services/social";
import { getErrorMessage } from "@/utils/errors";
import { colors, spacing } from "@/utils/theme";

export default function CommunitiesScreen() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["groups"],
    queryFn: socialService.getGroups,
  });

  const joinMutation = useMutation({
    mutationFn: (groupId: string) => socialService.joinGroup(groupId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });

  if (query.isLoading) {
    return (
      <Screen>
        <ScreenState variant="loading" title="Loading groups" message="Bringing your communities into view." />
      </Screen>
    );
  }

  if (query.isError) {
    return (
      <Screen>
        <ScreenState
          variant="error"
          title="Groups unavailable"
          message={getErrorMessage(query.error, "We could not load groups right now.")}
          actionLabel="Retry"
          onAction={() => void query.refetch()}
        />
      </Screen>
    );
  }

  const groups = query.data ?? [];

  return (
    <Screen>
      <FlatList
        data={groups}
        keyExtractor={(group) => group.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 16, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 96 }}
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews
        ListHeaderComponent={(
          <View style={{ gap: 16 }}>
            <SectionHeader title="Groups" actionLabel="Create group" href="/create" />
            <View style={styles.segmentRow}>
              <Button label="Explore" variant="secondary" onPress={() => router.push("/explore")} />
              <Button label="Create" variant="secondary" onPress={() => router.push("/create")} />
            </View>
          </View>
        )}
        ListEmptyComponent={<ScreenState variant="empty" title="No groups yet" message="Create a group to start a new community." />}
        renderItem={({ item: group }) => (
          <View style={styles.card}>
            <ListCard
              title={group.name}
              subtitle={`${group.membersCount} members \u2022 ${group.privacy}`}
              onPress={() => router.push(`/group/${group.slug}`)}
            />
            <Text style={styles.blurb}>{group.description ?? "Group discussion and updates."}</Text>
            <Button
              label={
                joinMutation.isPending
                  ? "Updating..."
                  : group.isMember
                    ? "Open group"
                    : group.privacy === "PRIVATE"
                      ? "Request join"
                      : "Join group"
              }
              onPress={() => (group.isMember ? router.push(`/group/${group.slug}`) : joinMutation.mutate(group.id))}
              variant={group.isMember ? "secondary" : "primary"}
            />
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  segmentRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  card: {
    gap: spacing.sm,
  },
  blurb: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
});
