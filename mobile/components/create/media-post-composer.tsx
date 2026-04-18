import { Pressable, StyleSheet, Text, View } from "react-native";
import { MediaAttachmentPreview } from "@/components/media-attachment-preview";
import { CreateMediaAttachment } from "@/components/create/media-picker-handler";
import { colors, radius, spacing } from "@/utils/theme";

type MediaPostComposerProps = {
  attachment: CreateMediaAttachment | null;
  isUploading: boolean;
  onPickImage: () => void;
  onPickVideo: () => void;
};

export const MediaPostComposer = ({
  attachment,
  isUploading,
  onPickImage,
  onPickVideo,
}: MediaPostComposerProps) => (
  <View style={styles.wrapper}>
    <View style={styles.row}>
      <Pressable style={styles.mediaButton} onPress={onPickImage}>
        <Text style={styles.mediaButtonLabel}>{isUploading ? "Uploading..." : "Add photo"}</Text>
      </Pressable>
      <Pressable style={styles.mediaButton} onPress={onPickVideo}>
        <Text style={styles.mediaButtonLabel}>{isUploading ? "Uploading..." : "Add video"}</Text>
      </Pressable>
    </View>
    {attachment ? <MediaAttachmentPreview uri={attachment.localUri} kind={attachment.kind} /> : null}
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  mediaButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  mediaButtonLabel: {
    color: colors.primaryDark,
    fontWeight: "800",
  },
});
