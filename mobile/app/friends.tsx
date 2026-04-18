import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { FlatList, ListRenderItem, StyleSheet, View } from "react-native";
import { ScreenState } from "@/components/screen-state";
import { socialService } from "@/services/social";
import { Button } from "@/components/ui/button";
import { ListCard } from "@/components/ui/list-card";
import { Screen } from "@/components/ui/screen";
import { SectionHeader } from "@/components/ui/section-header";
import { spacing } from "@/utils/theme";

type FriendRequest = Awaited<ReturnType<typeof socialService.getFriendRequests>>["incoming"][number];
type Friend = Awaited<ReturnType<typeof socialService.getFriends>>[number];
type Suggestion = Awaited<ReturnType<typeof socialService.getPeopleYouMayKnow>>[number];

type FriendRow =
  | { key: string; type: "screen-header" }
  | { key: string; type: "section-header"; title: string }
  | { key: string; type: "request"; request: FriendRequest }
  | { key: string; type: "friend"; friend: Friend }
  | { key: string; type: "suggestion"; person: Suggestion }
  | { key: string; type: "empty"; title: string; message: string };

export default function FriendsScreen() {
  const queryClient = useQueryClient();
  const { data: friendRequests, isLoading: isRequestsLoading } = useQuery({
    queryKey: ["friend-requests"],
    queryFn: socialService.getFriendRequests,
  });
  const { data: friends = [], isLoading: isFriendsLoading, isError, refetch } = useQuery({
    queryKey: ["friends"],
    queryFn: socialService.getFriends,
  });
  const { data: suggestions = [], isLoading: isSuggestionsLoading } = useQuery({
    queryKey: ["people-you-may-know"],
    queryFn: socialService.getPeopleYouMayKnow,
  });

  const respondMutation = useMutation({
    mutationFn: ({ requestId, action }: { requestId: string; action: "accept" | "reject" }) =>
      socialService.respondToFriendRequest(requestId, action),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
      await queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });

  const sendRequestMutation = useMutation({
    mutationFn: (userId: string) => socialService.sendFriendRequest(userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["people-you-may-know"] });
      await queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
    },
  });

  if (isRequestsLoading || isFriendsLoading || isSuggestionsLoading) {
    return (
      <Screen>
        <ScreenState variant="loading" title="Loading friends" message="Bringing your people and requests into view." />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <ScreenState
          variant="error"
          title="Friends unavailable"
          message="We could not load your people right now."
          actionLabel="Retry"
          onAction={() => void refetch()}
        />
      </Screen>
    );
  }

  const incoming = friendRequests?.incoming ?? [];
  const rows: FriendRow[] = [
    { key: "screen-header", type: "screen-header" },
    { key: "requests-header", type: "section-header", title: "Requests" },
    ...(incoming.length
      ? incoming.map((request) => ({ key: `request-${request.id}`, type: "request" as const, request }))
      : [
          {
            key: "requests-empty",
            type: "empty" as const,
            title: "No requests",
            message: "Incoming friend requests will appear here.",
          },
        ]),
    { key: "friends-header", type: "section-header", title: "All friends" },
    ...(friends.length
      ? friends.map((friend) => ({ key: `friend-${friend.id}`, type: "friend" as const, friend }))
      : [
          {
            key: "friends-empty",
            type: "empty" as const,
            title: "No friends yet",
            message: "Accepted friends will appear here.",
          },
        ]),
    { key: "suggestions-header", type: "section-header", title: "Suggestions" },
    ...(suggestions.length
      ? suggestions.map((person) => ({ key: `suggestion-${person.id}`, type: "suggestion" as const, person }))
      : [
          {
            key: "suggestions-empty",
            type: "empty" as const,
            title: "No suggestions",
            message: "Suggested people will appear here.",
          },
        ]),
  ];

  const renderItem: ListRenderItem<FriendRow> = ({ item }) => {
    switch (item.type) {
      case "screen-header":
        return <SectionHeader title="Friends" />;
      case "section-header":
        return <SectionHeader title={item.title} />;
      case "request":
        return (
          <View style={styles.card}>
            <ListCard
              title={item.request.user.firstName ?? item.request.user.username}
              subtitle={`@${item.request.user.username}${item.request.user.mutualFriendsCount ? ` \u2022 ${item.request.user.mutualFriendsCount} mutual` : ""}`}
              onPress={() => router.push(`/profile/${item.request.user.username}`)}
            />
            <View style={styles.row}>
              <Button
                label="Confirm"
                onPress={() => respondMutation.mutate({ requestId: item.request.id, action: "accept" })}
              />
              <Button
                label="Delete"
                variant="secondary"
                onPress={() => respondMutation.mutate({ requestId: item.request.id, action: "reject" })}
              />
            </View>
          </View>
        );
      case "friend":
        return (
          <ListCard
            title={item.friend.firstName ?? item.friend.username}
            subtitle={`@${item.friend.username}${item.friend.location ? ` \u2022 ${item.friend.location}` : ""}`}
            onPress={() => router.push(`/profile/${item.friend.username}`)}
          />
        );
      case "suggestion":
        return (
          <View style={styles.card}>
            <ListCard
              title={item.person.firstName ?? item.person.username}
              subtitle={`@${item.person.username}${item.person.mutualFriendsCount ? ` \u2022 ${item.person.mutualFriendsCount} mutual` : ""}`}
              onPress={() => router.push(`/profile/${item.person.username}`)}
            />
            <Button label="Add friend" variant="secondary" onPress={() => sendRequestMutation.mutate(item.person.id)} />
          </View>
        );
      case "empty":
        return <ScreenState variant="empty" title={item.title} message={item.message} />;
    }
  };

  return (
    <Screen>
      <FlatList
        data={rows}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
    gap: spacing.md,
    paddingBottom: 96,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  card: {
    gap: spacing.sm,
  },
});
