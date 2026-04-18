import { useQuery } from "@tanstack/react-query";
import { FlatList, View } from "react-native";
import { ComposerPromptCard } from "@/components/composer-prompt-card";
import { PostCard } from "@/components/post-card";
import { ScreenState } from "@/components/screen-state";
import { StoryTray } from "@/components/story-tray";
import { SectionHeader } from "@/components/ui/section-header";
import { Screen } from "@/components/ui/screen";
import { postService } from "@/services/posts";
import { storyService } from "@/services/stories";
import { useAuthStore } from "@/store/auth-store";
import { getErrorMessage } from "@/utils/errors";

export default function FeedScreen() {
  const currentUser = useAuthStore((state) => state.user);
  const feedQuery = useQuery({ queryKey: ["feed"], queryFn: postService.getFeed });
  const storiesQuery = useQuery({ queryKey: ["stories", "following"], queryFn: storyService.getFollowingStories });

  if (feedQuery.isLoading) {
    return (
      <Screen>
        <ScreenState title="Loading feed" message="Pulling the latest posts." variant="loading" />
      </Screen>
    );
  }

  if (feedQuery.isError) {
    return (
      <Screen>
        <ScreenState
          title="Feed unavailable"
          message={getErrorMessage(feedQuery.error, "We could not load your feed.")}
          variant="error"
          onAction={() => void feedQuery.refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={feedQuery.data ?? []}
        keyExtractor={(post) => post.id}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ gap: 16, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 96 }}
        initialNumToRender={4}
        maxToRenderPerBatch={6}
        windowSize={7}
        removeClippedSubviews
        ListHeaderComponent={(
          <View style={{ gap: 16 }}>
            <ComposerPromptCard name={currentUser?.firstName ?? currentUser?.username ?? "You"} />
            <SectionHeader title="Stories" actionLabel="Create" href="/status" />
            {storiesQuery.isLoading ? <ScreenState title="Loading stories" message="Checking recent updates." variant="loading" /> : null}
            {storiesQuery.isError ? (
              <ScreenState
                title="Stories unavailable"
                message={getErrorMessage(storiesQuery.error, "We could not load stories right now.")}
                variant="error"
                onAction={() => void storiesQuery.refetch()}
              />
            ) : null}
            {!storiesQuery.isLoading && !storiesQuery.isError && storiesQuery.data?.length ? <StoryTray stories={storiesQuery.data} /> : null}
            {!storiesQuery.isLoading && !storiesQuery.isError && !storiesQuery.data?.length ? (
              <ScreenState title="No active stories" message="Fresh status updates will appear here." />
            ) : null}
            <SectionHeader title="Feed" />
          </View>
        )}
        ListEmptyComponent={<ScreenState title="No posts yet" message="Start by creating a post or following more people." />}
        renderItem={({ item: post }) => <PostCard post={post} />}
      />
    </Screen>
  );
}
