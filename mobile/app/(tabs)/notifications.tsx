import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { FlatList, Pressable } from "react-native";
import { ScreenState } from "@/components/screen-state";
import { ListCard } from "@/components/ui/list-card";
import { Screen } from "@/components/ui/screen";
import { SectionHeader } from "@/components/ui/section-header";
import { notificationService } from "@/services/notifications";

const formatTimestamp = (value: string) =>
  Number.isNaN(new Date(value).getTime())
    ? "Unknown"
    : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));

export default function NotificationsScreen() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["notifications"], queryFn: notificationService.getNotifications });
  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) => notificationService.markRead(notificationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  if (query.isLoading) {
    return (
      <Screen>
        <ScreenState title="Loading notifications" message="Checking recent activity." variant="loading" />
      </Screen>
    );
  }

  if (query.isError) {
    return (
      <Screen>
        <ScreenState title="Notifications unavailable" message="We could not load your notifications." variant="error" onAction={() => void query.refetch()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={query.data ?? []}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, gap: 16, paddingBottom: 96, paddingHorizontal: 16, paddingTop: 8 }}
        ListHeaderComponent={<SectionHeader title="Notifications" />}
        ListEmptyComponent={
          <ScreenState title="No notifications yet" message="Activity from likes, comments, and messages will show here." variant="empty" />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              if (!item.isRead) {
                markReadMutation.mutate(item.id);
              }

              if (item.entityType === "conversation" && item.entityId) {
                router.push(`/chat/${item.entityId}` as never);
              }
            }}
          >
            <ListCard
              title={item.title}
              subtitle={`${item.body ?? "Open notification"} \u2022 ${formatTimestamp(item.createdAt)}`}
              trailing={item.isRead ? undefined : "New"}
            />
          </Pressable>
        )}
      />
    </Screen>
  );
}
