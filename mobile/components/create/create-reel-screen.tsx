import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { AudienceSelector } from "@/components/create/audience-selector";
import { pickCreateMedia, CreateMediaAttachment } from "@/components/create/media-picker-handler";
import { MediaAttachmentPreview } from "@/components/media-attachment-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { reelService } from "@/services/reels";
import { colors, radius, spacing } from "@/utils/theme";

type CreateReelScreenProps = {
  onError: (message: string | null) => void;
};

export const CreateReelScreen = ({ onError }: CreateReelScreenProps) => {
  const queryClient = useQueryClient();
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "FOLLOWERS" | "FRIENDS">("PUBLIC");
  const [video, setVideo] = useState<CreateMediaAttachment | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const createReelMutation = useMutation({
    mutationFn: () =>
      reelService.create({
        videoUrl: video!.remoteUrl,
        caption: caption.trim() || undefined,
        visibility,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["reels"] });
      setCaption("");
      setVideo(null);
      router.replace("/reels");
    },
    onError: () => {
      onError("Could not publish reel.");
    },
  });

  const handlePickVideo = async () => {
    await pickCreateMedia({
      kind: "video",
      onStart: () => {
        onError(null);
        setIsUploading(true);
      },
      onComplete: setVideo,
      onError: () => onError("Could not upload media."),
      onFinally: () => setIsUploading(false),
    });
  };

  return (
    <View style={styles.card}>
      <Input
        label="Caption"
        value={caption}
        onChangeText={setCaption}
        multiline
        placeholder="Caption your reel"
      />
      <AudienceSelector value={visibility} onChange={setVisibility} />
      <Button
        label={isUploading ? "Uploading..." : "Pick reel video"}
        variant="secondary"
        onPress={() => void handlePickVideo()}
      />
      {video ? <MediaAttachmentPreview uri={video.localUri} kind="VIDEO" height={220} /> : null}
      <Button
        label={createReelMutation.isPending ? "Publishing..." : "Publish reel"}
        onPress={() => createReelMutation.mutate()}
        disabled={createReelMutation.isPending || !video || isUploading}
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
