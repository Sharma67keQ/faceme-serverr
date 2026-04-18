import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { pickCreateMedia, CreateMediaAttachment } from "@/components/create/media-picker-handler";
import { MediaAttachmentPreview } from "@/components/media-attachment-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { socialService } from "@/services/social";
import { colors, radius, spacing } from "@/utils/theme";

type CreateGroupScreenProps = {
  onError: (message: string | null) => void;
};

export const CreateGroupScreen = ({ onError }: CreateGroupScreenProps) => {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [coverImage, setCoverImage] = useState<CreateMediaAttachment | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const createGroupMutation = useMutation({
    mutationFn: () =>
      socialService.createGroup({
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        description: description.trim() || undefined,
        privacy,
        coverImageUrl: coverImage?.remoteUrl,
      }),
    onSuccess: async (group) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["groups"] }),
        queryClient.invalidateQueries({ queryKey: ["explore-hub"] }),
      ]);
      setName("");
      setSlug("");
      setDescription("");
      setCoverImage(null);
      router.replace(`/group/${group.slug}` as never);
    },
    onError: () => {
      onError("Could not create group.");
    },
  });

  const handlePickCover = async () => {
    await pickCreateMedia({
      kind: "image",
      onStart: () => {
        onError(null);
        setIsUploading(true);
      },
      onComplete: setCoverImage,
      onError: () => onError("Could not upload media."),
      onFinally: () => setIsUploading(false),
    });
  };

  return (
    <View style={styles.card}>
      <Input label="Group name" value={name} onChangeText={setName} placeholder="Faceme Creators" />
      <Input label="Group slug" value={slug} onChangeText={setSlug} placeholder="faceme-creators" />
      <Input
        label="Description"
        value={description}
        onChangeText={setDescription}
        multiline
        placeholder="What brings this group together?"
      />
      <View style={styles.inlineRow}>
        {(["PUBLIC", "PRIVATE"] as const).map((value) => (
          <Button
            key={value}
            label={value}
            variant={privacy === value ? "primary" : "secondary"}
            onPress={() => setPrivacy(value)}
          />
        ))}
      </View>
      <Button
        label={isUploading ? "Uploading..." : "Add cover image"}
        variant="secondary"
        onPress={() => void handlePickCover()}
      />
      {coverImage ? <MediaAttachmentPreview uri={coverImage.localUri} kind="IMAGE" height={180} /> : null}
      <Button
        label={createGroupMutation.isPending ? "Creating..." : "Create group"}
        onPress={() => createGroupMutation.mutate()}
        disabled={createGroupMutation.isPending || !name.trim() || !slug.trim() || isUploading}
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
  inlineRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
});
