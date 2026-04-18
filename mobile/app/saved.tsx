import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { FlatList } from "react-native";
import { PostCard } from "@/components/post-card";
import { ScreenState } from "@/components/screen-state";
import { ListCard } from "@/components/ui/list-card";
import { Screen } from "@/components/ui/screen";
import { SectionHeader } from "@/components/ui/section-header";
import { marketplaceService } from "@/services/marketplace";
import { postService } from "@/services/posts";

type SavedRow =
  | { type: "section"; id: string; title: string }
  | { type: "post"; id: string; post: Awaited<ReturnType<typeof postService.getSavedPosts>>[number] }
  | { type: "listing"; id: string; listing: Awaited<ReturnType<typeof marketplaceService.list>>[number] };

export default function SavedScreen() {
  const {
    data: savedPosts = [],
    isLoading: isPostsLoading,
    isError: isPostsError,
    refetch: refetchPosts,
  } = useQuery({
    queryKey: ["saved-posts"],
    queryFn: postService.getSavedPosts,
  });

  const {
    data: savedListings = [],
    isLoading: isListingsLoading,
    isError: isListingsError,
    refetch: refetchListings,
  } = useQuery({
    queryKey: ["saved-listings"],
    queryFn: () => marketplaceService.list({ savedOnly: true }),
  });

  if (isPostsLoading || isListingsLoading) {
    return (
      <Screen>
        <ScreenState variant="loading" title="Loading saved items" message="Collecting the things you saved." />
      </Screen>
    );
  }

  if (isPostsError || isListingsError) {
    return (
      <Screen>
        <ScreenState
          variant="error"
          title="Saved items unavailable"
          message="We could not load your saved content right now."
          actionLabel="Retry"
          onAction={() => {
            void refetchPosts();
            void refetchListings();
          }}
        />
      </Screen>
    );
  }

  const rows: SavedRow[] = [
    { type: "section", id: "saved-posts-header", title: "Saved posts" },
    ...(savedPosts.length
      ? savedPosts.map((post) => ({ type: "post" as const, id: `post-${post.id}`, post }))
      : [{ type: "section" as const, id: "saved-posts-empty", title: "__EMPTY_POSTS__" }]),
    { type: "section", id: "saved-listings-header", title: "Saved listings" },
    ...(savedListings.length
      ? savedListings.map((listing) => ({ type: "listing" as const, id: `listing-${listing.id}`, listing }))
      : [{ type: "section" as const, id: "saved-listings-empty", title: "__EMPTY_LISTINGS__" }]),
  ];

  return (
    <Screen>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, gap: 16, paddingBottom: 96, paddingHorizontal: 16, paddingTop: 8 }}
        ListHeaderComponent={<SectionHeader title="Saved" />}
        renderItem={({ item }) => {
          if (item.type === "section") {
            if (item.title === "__EMPTY_POSTS__") {
              return <ScreenState variant="empty" title="No saved posts" message="Posts you save will appear here." />;
            }

            if (item.title === "__EMPTY_LISTINGS__") {
              return <ScreenState variant="empty" title="No saved listings" message="Marketplace items you save will appear here." />;
            }

            return <SectionHeader title={item.title} />;
          }

          if (item.type === "post") {
            return <PostCard post={item.post} />;
          }

          return (
            <ListCard
              title={item.listing.title}
              subtitle={`${item.listing.city ?? item.listing.countryName ?? "Location pending"} \u2022 ${item.listing.category}`}
              trailing={`${item.listing.currency} ${item.listing.price}`}
              onPress={() => router.push(`/listing/${item.listing.id}`)}
            />
          );
        }}
      />
    </Screen>
  );
}
