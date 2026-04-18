import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { PostCard } from "@/components/post-card";
import { ScreenState } from "@/components/screen-state";
import { Input } from "@/components/ui/input";
import { ListCard } from "@/components/ui/list-card";
import { Screen } from "@/components/ui/screen";
import { SectionHeader } from "@/components/ui/section-header";
import { marketplaceService } from "@/services/marketplace";
import { postService } from "@/services/posts";
import { socialService } from "@/services/social";
import { userService } from "@/services/users";

export default function ExploreScreen() {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const isSearching = normalizedQuery.length > 1;

  const { data: hub, isLoading: isHubLoading, isError: isHubError, refetch: refetchHub } = useQuery({
    queryKey: ["explore-hub"],
    queryFn: socialService.getExploreHub,
    enabled: !isSearching,
  });

  const { data: explorePosts = [] } = useQuery({
    queryKey: ["explore-posts"],
    queryFn: postService.getExplore,
    enabled: !isSearching,
  });

  const { data: searchedUsers = [], isLoading: isSearchLoading, isError: isSearchError } = useQuery({
    queryKey: ["search-users", normalizedQuery],
    queryFn: () => userService.searchUsers(normalizedQuery),
    enabled: isSearching,
  });

  const { data: searchedListings = [] } = useQuery({
    queryKey: ["search-marketplace", normalizedQuery],
    queryFn: () => marketplaceService.list({ q: normalizedQuery }),
    enabled: isSearching,
  });

  const filteredGroups = useMemo(
    () =>
      isSearching
        ? (hub?.suggestedGroups ?? []).filter((group) =>
            [group.name, group.description ?? ""].some((value) => value.toLowerCase().includes(normalizedQuery)),
          )
        : hub?.suggestedGroups ?? [],
    [hub?.suggestedGroups, isSearching, normalizedQuery],
  );

  const filteredPages = useMemo(
    () =>
      isSearching
        ? (hub?.suggestedPages ?? []).filter((page) =>
            [page.name, page.description ?? ""].some((value) => value.toLowerCase().includes(normalizedQuery)),
          )
        : hub?.suggestedPages ?? [],
    [hub?.suggestedPages, isSearching, normalizedQuery],
  );

  if (!isSearching && isHubLoading) {
    return (
      <Screen>
        <ScreenState variant="loading" title="Loading explore" message="Discovering people, posts, groups, and pages." />
      </Screen>
    );
  }

  if (!isSearching && isHubError) {
    return (
      <Screen>
        <ScreenState
          variant="error"
          title="Explore is unavailable"
          message="We could not load discovery recommendations right now."
          actionLabel="Retry"
          onAction={() => void refetchHub()}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <SectionHeader title="Search" />
      <Input label="Search across Faceme" value={query} onChangeText={setQuery} placeholder="People, posts, groups, pages, marketplace" />

      {isSearching ? (
        <>
          {isSearchLoading ? <ScreenState variant="loading" title="Searching" message="Looking across people and listings." /> : null}
          {isSearchError ? <ScreenState variant="error" title="Search failed" message="Try a different search term." /> : null}

          <SectionHeader title="People" />
          {searchedUsers.length ? searchedUsers.map((user) => (
            <ListCard
              key={user.id}
              title={user.firstName ?? user.username}
              subtitle={`@${user.username}${user.bio ? ` \u2022 ${user.bio}` : ""}`}
              onPress={() => router.push(`/profile/${user.username}`)}
            />
          )) : <ScreenState variant="empty" title="No people found" message="Try a different name or username." />}

          <SectionHeader title="Groups" />
          {filteredGroups.length ? filteredGroups.map((group) => (
            <ListCard
              key={group.id}
              title={group.name}
              subtitle={`${group.membersCount} members \u2022 ${group.description ?? "No description yet"}`}
              onPress={() => router.push(`/group/${group.slug}`)}
            />
          )) : <ScreenState variant="empty" title="No groups found" message="No matching groups were found." />}

          <SectionHeader title="Pages" />
          {filteredPages.length ? filteredPages.map((page) => (
            <ListCard
              key={page.id}
              title={page.name}
              subtitle={`${page.followersCount} followers \u2022 ${page.description ?? "No description yet"}`}
              onPress={() => router.push(`/page/${page.slug}`)}
            />
          )) : <ScreenState variant="empty" title="No pages found" message="No matching pages were found." />}

          <SectionHeader title="Marketplace" />
          {searchedListings.length ? searchedListings.map((listing) => (
            <ListCard
              key={listing.id}
              title={listing.title}
              subtitle={`${listing.city ?? listing.countryName ?? "Location pending"} \u2022 ${listing.category}`}
              trailing={`${listing.currency} ${listing.price}`}
              onPress={() => router.push(`/listing/${listing.id}`)}
            />
          )) : <ScreenState variant="empty" title="No listings found" message="No matching listings were found." />}
        </>
      ) : (
        <>
          <SectionHeader title="Trending posts" />
          {explorePosts.length ? explorePosts.slice(0, 3).map((post) => <PostCard key={post.id} post={post} />) : <ScreenState variant="empty" title="Nothing trending yet" message="Trending posts will appear here." />}

          <SectionHeader title="Suggested people" />
          {hub?.suggestedUsers?.map((user) => (
            <ListCard
              key={user.id}
              title={user.firstName ?? user.username}
              subtitle={`@${user.username}${user.mutualFriendsCount ? ` \u2022 ${user.mutualFriendsCount} mutual` : ""}`}
              onPress={() => router.push(`/profile/${user.username}`)}
            />
          ))}

          <SectionHeader title="Suggested groups" />
          {hub?.suggestedGroups?.map((group) => (
            <ListCard
              key={group.id}
              title={group.name}
              subtitle={`${group.membersCount} members \u2022 ${group.description ?? "Join the conversation"}`}
              onPress={() => router.push(`/group/${group.slug}`)}
            />
          ))}

          <SectionHeader title="Suggested pages" />
          {hub?.suggestedPages?.map((page) => (
            <ListCard
              key={page.id}
              title={page.name}
              subtitle={`${page.followersCount} followers \u2022 ${page.description ?? "Page updates"}`}
              onPress={() => router.push(`/page/${page.slug}`)}
            />
          ))}
        </>
      )}
    </Screen>
  );
}
