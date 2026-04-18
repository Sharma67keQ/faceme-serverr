import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { pickCreateMedia, CreateMediaAttachment } from "@/components/create/media-picker-handler";
import { AudienceSelector } from "@/components/create/audience-selector";
import { MediaPostComposer } from "@/components/create/media-post-composer";
import { TextPostComposer } from "@/components/create/text-post-composer";
import { Button } from "@/components/ui/button";
import { postService } from "@/services/posts";
import { useAuthStore } from "@/store/auth-store";
import { colors, radius, spacing } from "@/utils/theme";

type CreatePostScreenProps = {
  onError: (message: string | null) => void;
};

export const CreatePostScreen = ({ onError }: CreatePostScreenProps) => {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<"STANDARD" | "QUICK">("STANDARD");
  const [visibility, setVisibility] = useState<"PUBLIC" | "FOLLOWERS" | "FRIENDS">("PUBLIC");
  const [attachment, setAttachment] = useState<CreateMediaAttachment | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const createPostMutation = useMutation({
    mutationFn: () =>
      postService.createPost({
        body: body.trim(),
        mediaUrl: attachment?.remoteUrl,
        mediaType: attachment?.kind,
        kind,
        visibility,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["feed"] }),
        queryClient.invalidateQueries({ queryKey: ["explore-hub"] }),
        queryClient.invalidateQueries({ queryKey: ["explore-posts"] }),
        queryClient.invalidateQueries({ queryKey: ["public-profile-posts"] }),
        queryClient.invalidateQueries({ queryKey: ["my-profile-posts"] }),
        ...(currentUser?.username
          ? [queryClient.invalidateQueries({ queryKey: ["profile-posts", currentUser.username] })]
          : []),
      ]);
      setBody("");
      setAttachment(null);
      router.replace("/");
    },
    onError: () => {
      onError("Could not publish post.");
    },
  });

  const handlePickMedia = async (mediaKind: "image" | "video") => {
    await pickCreateMedia({
      kind: mediaKind,
      onStart: () => {
        onError(null);
        setIsUploading(true);
      },
      onComplete: setAttachment,
      onError: () => onError("Could not upload media."),
      onFinally: () => setIsUploading(false),
    });
  };

  return (
    <View style={styles.card}>
      <TextPostComposer body={body} onBodyChange={setBody} kind={kind} onKindChange={setKind} />
      <AudienceSelector value={visibility} onChange={setVisibility} />
      <MediaPostComposer
        attachment={attachment}
        isUploading={isUploading}
        onPickImage={() => void handlePickMedia("image")}
        onPickVideo={() => void handlePickMedia("video")}
      />
      <Button
        label={createPostMutation.isPending ? "Publishing..." : "Publish post"}
        onPress={() => createPostMutation.mutate()}
        disabled={createPostMutation.isPending || !body.trim() || isUploading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(38, 33, 63, 0.92)",
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
});
