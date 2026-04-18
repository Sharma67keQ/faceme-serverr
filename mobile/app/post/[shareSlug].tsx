import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { PostCard } from "@/components/post-card";
import { ScreenState } from "@/components/screen-state";
import { Screen } from "@/components/ui/screen";
import { postService } from "@/services/posts";

export default function PostDetailScreen() {
  const params = useLocalSearchParams<{ shareSlug: string | string[] }>();
  const shareSlug = Array.isArray(params.shareSlug) ? params.shareSlug[0] : params.shareSlug;
  const { data: post, isLoading, isError, refetch } = useQuery({
    queryKey: ["shared-post", shareSlug],
    queryFn: () => (shareSlug ? postService.getSharedPost(shareSlug) : Promise.resolve(null)),
    enabled: Boolean(shareSlug),
  });

  if (isLoading) {
    return (
      <Screen>
        <ScreenState variant="loading" title="Opening post" message="Loading this conversation." />
      </Screen>
    );
  }

  if (isError || !post) {
    return (
      <Screen>
        <ScreenState
          variant="error"
          title="Could not open post"
          message="This post is unavailable or the link is invalid."
          actionLabel="Retry"
          onAction={() => void refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <PostCard post={post} />
    </Screen>
  );
}
