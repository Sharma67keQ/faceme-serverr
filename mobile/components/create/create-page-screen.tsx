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

type CreatePageScreenProps = {
  onError: (message: string | null) => void;
};

export const CreatePageScreen = ({ onError }: CreatePageScreenProps) => {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState<CreateMediaAttachment | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const createPageMutation = useMutation({
    mutationFn: () =>
      socialService.createPage({
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        description: description.trim() || undefined,
        logoUrl: logo?.remoteUrl,
      }),
    onSuccess: async (page) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["pages"] }),
        queryClient.invalidateQueries({ queryKey: ["explore-hub"] }),
      ]);
      setName("");
      setSlug("");
      setDescription("");
      setLogo(null);
      router.replace(`/page/${page.slug}` as never);
    },
    onError: () => {
      onError("Could not create page.");
    },
  });

  const handlePickLogo = async () => {
    await pickCreateMedia({
      kind: "image",
      onStart: () => {
        onError(null);
        setIsUploading(true);
      },
      onComplete: setLogo,
      onError: () => onError("Could not upload media."),
      onFinally: () => setIsUploading(false),
    });
  };

  return (
    <View style={styles.card}>
      <Input label="Page name" value={name} onChangeText={setName} placeholder="Faceme Creators" />
      <Input label="Page slug" value={slug} onChangeText={setSlug} placeholder="faceme-creators" />
      <Input
        label="Description"
        value={description}
        onChangeText={setDescription}
        multiline
        placeholder="What is this page about?"
      />
      <Button
        label={isUploading ? "Uploading..." : "Add page logo"}
        variant="secondary"
        onPress={() => void handlePickLogo()}
      />
      {logo ? <MediaAttachmentPreview uri={logo.localUri} kind="IMAGE" height={180} /> : null}
      <Button
        label={createPageMutation.isPending ? "Creating..." : "Create page"}
        onPress={() => createPageMutation.mutate()}
        disabled={createPageMutation.isPending || !name.trim() || !slug.trim() || isUploading}
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
