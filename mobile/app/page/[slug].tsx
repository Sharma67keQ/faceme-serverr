import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MediaAttachmentPreview } from "@/components/media-attachment-preview";
import { PostCard } from "@/components/post-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Screen } from "@/components/ui/screen";
import { mediaService } from "@/services/media";
import { postService } from "@/services/posts";
import { socialService } from "@/services/social";
import { useAuthStore } from "@/store/auth-store";
import { colors, radius, spacing } from "@/utils/theme";
import { useState } from "react";

export default function PageScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [body, setBody] = useState("");
  const [mediaAttachment, setMediaAttachment] = useState<{ localUri: string; remoteUrl: string; kind: "IMAGE" | "VIDEO" } | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [pageName, setPageName] = useState("");
  const [pageDescription, setPageDescription] = useState("");

  const { data: page } = useQuery({
    queryKey: ["page", slug],
    queryFn: () => socialService.getPage(slug),
  });
  const isOwner = page?.owner.id === currentUserId;
  const { data: posts = [] } = useQuery({
    queryKey: ["page-posts", page?.id],
    queryFn: () => postService.getPostsByPage(page!.id),
    enabled: Boolean(page?.id),
  });

  const followMutation = useMutation({
    mutationFn: () => socialService.togglePageFollow(page!.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["page", slug] });
      await queryClient.invalidateQueries({ queryKey: ["launch-summary"] });
      await queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const postMutation = useMutation({
    mutationFn: () =>
      postService.createPost({
        body: body.trim(),
        mediaUrl: mediaAttachment?.remoteUrl,
        mediaType: mediaAttachment?.kind,
        pageId: page!.id,
      }),
    onSuccess: async () => {
      setBody("");
      setMediaAttachment(null);
      await queryClient.invalidateQueries({ queryKey: ["page-posts", page?.id] });
      await queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      socialService.updatePage(page!.id, {
        name: pageName.trim() || undefined,
        description: pageDescription.trim() || undefined,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["page", slug] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => socialService.deletePage(page!.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["pages"] });
      router.replace("/explore");
    },
  });

  const handlePickAttachment = async (kind: "image" | "video") => {
    try {
      setIsUploadingMedia(true);
      const asset = await mediaService.pickFromLibrary(kind);

      if (!asset) {
        return;
      }

      const uploaded = await mediaService.uploadAsset(asset, kind);
      setMediaAttachment({
        localUri: asset.uri,
        remoteUrl: uploaded.secureUrl,
        kind: uploaded.mediaKind === "VIDEO" ? "VIDEO" : "IMAGE",
      });
    } finally {
      setIsUploadingMedia(false);
    }
  };

  return (
    <Screen scroll>
      {page ? (
        <>
          <View style={styles.hero}>
            <Text style={styles.title}>{page.name}</Text>
            <Text style={styles.meta}>{page.followersCount} followers</Text>
            <Text style={styles.body}>{page.description ?? "Page updates and posts."}</Text>
            <Button
              label={followMutation.isPending ? "Updating..." : page.isFollowing ? "Following" : "Follow page"}
              onPress={() => followMutation.mutate()}
              variant={page.isFollowing ? "secondary" : "primary"}
            />
          </View>
          {isOwner ? (
            <View style={styles.compose}>
              <Text style={styles.sectionTitle}>Manage page</Text>
              <Input label="Page name" value={pageName} onChangeText={setPageName} placeholder={page.name} />
              <Input
                label="Description"
                value={pageDescription}
                onChangeText={setPageDescription}
                placeholder={page.description ?? "Describe this page"}
              />
              <Button
                label={updateMutation.isPending ? "Saving..." : "Save page changes"}
                variant="secondary"
                onPress={() => updateMutation.mutate()}
                disabled={updateMutation.isPending}
              />
              <Button
                label={deleteMutation.isPending ? "Deleting..." : "Delete page"}
                onPress={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
              />
            </View>
          ) : null}
          {isOwner ? (
            <View style={styles.compose}>
              <Text style={styles.sectionTitle}>Post as page owner</Text>
              <Input label="Post body" value={body} onChangeText={setBody} multiline />
              <View style={styles.mediaActions}>
                <Pressable style={styles.mediaButton} onPress={() => void handlePickAttachment("image")}>
                  <Text style={styles.mediaButtonLabel}>{isUploadingMedia ? "Uploading..." : "Add photo"}</Text>
                </Pressable>
                <Pressable style={styles.mediaButton} onPress={() => void handlePickAttachment("video")}>
                  <Text style={styles.mediaButtonLabel}>{isUploadingMedia ? "Uploading..." : "Add video"}</Text>
                </Pressable>
              </View>
              {mediaAttachment ? (
                <MediaAttachmentPreview uri={mediaAttachment.localUri} kind={mediaAttachment.kind} height={220} />
              ) : null}
              <Button
                label={postMutation.isPending ? "Publishing..." : "Publish page post"}
                onPress={() => postMutation.mutate()}
                disabled={!body.trim() || postMutation.isPending || isUploadingMedia}
              />
            </View>
          ) : null}
          <View style={styles.list}>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </View>
        </>
      ) : (
        <Text style={styles.body}>Loading page...</Text>
      )}
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
    shadowOpacity: 0.16,
    shadowRadius: 24,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "800",
  },
  meta: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  body: {
    color: colors.textMuted,
    lineHeight: 22,
  },
  compose: {
    backgroundColor: "rgba(38, 33, 63, 0.92)",
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  list: {
    gap: spacing.md,
    paddingBottom: 80,
  },
  mediaActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  mediaButton: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  mediaButtonLabel: {
    color: colors.primaryDark,
    fontWeight: "700",
  },
});
