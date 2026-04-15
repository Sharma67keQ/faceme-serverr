import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ChatListItem } from "@/components/chat-list-item";
import { ScreenState } from "@/components/screen-state";
import { Input } from "@/components/ui/input";
import { Screen } from "@/components/ui/screen";
import { chatService } from "@/services/chat";
import { userService } from "@/services/users";
import { useAuthStore } from "@/store/auth-store";
import { colors, radius, spacing } from "@/utils/theme";

export default function ChatsScreen() {
  const currentUser = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const trimmedSearchQuery = searchQuery.trim();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["conversations"],
    queryFn: chatService.getConversations,
    refetchInterval: 5000,
  });
  const conversations = data ?? [];
  const unreadTotal = conversations.reduce((sum, conversation) => sum + (conversation.unreadCount ?? 0), 0);
  const onlineCount = conversations.filter((conversation) =>
    conversation.participants.some(
      (participant) => participant.user.id !== currentUser?.id && participant.user.presenceStatus === "ONLINE",
    ),
  ).length;
  const { data: users = [], isFetching: isSearching } = useQuery({
    queryKey: ["user-search", trimmedSearchQuery],
    queryFn: () => userService.searchUsers(trimmedSearchQuery),
    enabled: trimmedSearchQuery.length > 0,
  });
  const createDirectConversationMutation = useMutation({
    mutationFn: (peerId: string) => chatService.createDirectConversation(peerId),
    onSuccess: async (conversation) => {
      await queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setSearchQuery("");
      router.push(`/chat/${conversation.id}`);
    },
  });

  if (isLoading && !conversations.length) {
    return (
      <Screen>
        <ScreenState variant="loading" title="Loading messages" message="Faceme is preparing your conversations." />
      </Screen>
    );
  }

  if (isError && !conversations.length) {
    return (
      <Screen>
        <ScreenState
          variant="error"
          title="Messaging unavailable"
          message="Your inbox could not load right now."
          actionLabel="Retry"
          onAction={() => void refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.hero}>
        <View style={styles.heroBadge}>
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primaryDark} />
          <Text style={styles.heroBadgeLabel}>Messaging</Text>
        </View>
        <Text style={styles.heroTitle}>Strong messaging, simple flow</Text>
        <Text style={styles.heroBody}>Open fast, reply fast, stay present. Text-first and live.</Text>
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{conversations.length}</Text>
            <Text style={styles.heroStatLabel}>Chats</Text>
          </View>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{unreadTotal}</Text>
            <Text style={styles.heroStatLabel}>Unread</Text>
          </View>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{onlineCount}</Text>
            <Text style={styles.heroStatLabel}>Online</Text>
          </View>
        </View>
      </View>

      <View style={styles.searchPanel}>
        <Input
          label="Find people"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by name or username"
        />
        <Text style={styles.helperText}>Start a direct text chat instantly from search.</Text>
      </View>

      {trimmedSearchQuery ? (
        <View style={styles.searchResults}>
          <Text style={styles.sectionTitle}>People</Text>
          {users
            .filter((user) => user.id !== currentUser?.id)
            .map((user) => (
              <Pressable key={user.id} style={styles.personRow} onPress={() => router.push(`/profile/${user.username}`)}>
                <View style={styles.personMeta}>
                  <View style={styles.personDot} />
                  <View>
                    <Text style={styles.personName}>{user.firstName ?? user.username}</Text>
                    <Text style={styles.personHandle}>@{user.username}</Text>
                  </View>
                </View>
                <Pressable style={styles.messageAction} onPress={() => createDirectConversationMutation.mutate(user.id)}>
                  <Text style={styles.messageActionLabel}>
                    {createDirectConversationMutation.isPending ? "Opening..." : "Message"}
                  </Text>
                </Pressable>
              </Pressable>
            ))}
          {!isSearching && !users.filter((user) => user.id !== currentUser?.id).length ? (
            <Text style={styles.helperText}>No matching people found.</Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Chat list</Text>
        <Text style={styles.sectionMeta}>Real-time updates</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {conversations.map((conversation) => (
          <ChatListItem
            key={conversation.id}
            conversation={conversation}
            currentUserId={currentUser?.id}
            onPress={() => router.push(`/chat/${conversation.id}`)}
          />
        ))}
        {!conversations.length ? <Text style={styles.helperText}>Search for someone to begin your first chat.</Text> : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: "rgba(38, 33, 63, 0.94)",
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 26,
    elevation: 8,
  },
  heroBadge: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.accentSoft,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    borderRadius: radius.pill,
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  heroBadgeLabel: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "800",
  },
  heroTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.7,
  },
  heroBody: {
    color: colors.textMuted,
    lineHeight: 21,
  },
  heroStats: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  heroStat: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: radius.lg,
    flex: 1,
    gap: 2,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  heroStatValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  heroStatLabel: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "700",
  },
  searchPanel: {
    backgroundColor: "rgba(38, 33, 63, 0.92)",
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  helperText: {
    color: colors.textMuted,
  },
  searchResults: {
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
    fontSize: 12,
    fontWeight: "700",
  },
  personRow: {
    alignItems: "center",
    backgroundColor: "rgba(38, 33, 63, 0.92)",
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.md,
  },
  personMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  personDot: {
    backgroundColor: colors.success,
    borderRadius: radius.pill,
    height: 12,
    width: 12,
  },
  personName: {
    color: colors.text,
    fontWeight: "800",
  },
  personHandle: {
    color: colors.textMuted,
  },
  messageAction: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  messageActionLabel: {
    color: colors.text,
    fontWeight: "800",
  },
  list: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
});
