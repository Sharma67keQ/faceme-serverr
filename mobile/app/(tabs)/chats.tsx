import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, View } from "react-native";
import { ChatListItem } from "@/components/chat-list-item";
import { ScreenState } from "@/components/screen-state";
import { Input } from "@/components/ui/input";
import { Screen } from "@/components/ui/screen";
import { SectionHeader } from "@/components/ui/section-header";
import { chatService } from "@/services/chat";
import { useAuthStore } from "@/store/auth-store";
import { getErrorMessage } from "@/utils/errors";

export default function ChatsScreen() {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [search, setSearch] = useState("");
  const query = useQuery({ queryKey: ["chat", "conversations"], queryFn: chatService.getConversations });

  const conversations = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    const items = query.data ?? [];

    if (!normalized) {
      return items;
    }

    return items.filter((conversation) =>
      (conversation.title ?? conversation.participants.map((item) => item.user.firstName ?? item.user.username).join(" "))
        .toLowerCase()
        .includes(normalized),
    );
  }, [query.data, search]);

  if (query.isLoading) {
    return (
      <Screen>
        <ScreenState title="Loading chats" message="Preparing your inbox." variant="loading" />
      </Screen>
    );
  }

  if (query.isError) {
    return (
      <Screen>
        <ScreenState
          title="Chats unavailable"
          message={getErrorMessage(query.error, "We could not load your conversations.")}
          variant="error"
          onAction={() => void query.refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={conversations}
        keyExtractor={(conversation) => conversation.id}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 16, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 96 }}
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews
        ListHeaderComponent={(
          <View style={{ gap: 16 }}>
            <SectionHeader title="Messages" />
            <Input label="Search chats" value={search} onChangeText={setSearch} placeholder="Search people or groups" />
          </View>
        )}
        ListEmptyComponent={<ScreenState title="No conversations yet" message="Start a new message from profile or marketplace flows." />}
        renderItem={({ item: conversation }) => (
          <ChatListItem
            conversation={conversation}
            currentUserId={currentUserId}
            onPress={() => router.push(`/chat/${conversation.id}` as never)}
          />
        )}
      />
    </Screen>
  );
}
