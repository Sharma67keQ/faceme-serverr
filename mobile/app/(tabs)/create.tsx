import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MediaAttachmentPreview } from "@/components/media-attachment-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Screen } from "@/components/ui/screen";
import { mediaService } from "@/services/media";
import { postService } from "@/services/posts";
import { reelService } from "@/services/reels";
import { socialService } from "@/services/social";
import { colors, radius, spacing } from "@/utils/theme";

type CreateMode = "POST" | "PAGE" | "GROUP" | "REEL";

type MediaAttachment = {
  localUri: string;
  remoteUrl: string;
  kind: "IMAGE" | "VIDEO";
};

const modes: Array<{ key: CreateMode; label: string }> = [
  { key: "POST", label: "Post" },
  { key: "PAGE", label: "Page" },
  { key: "GROUP", label: "Group" },
  { key: "REEL", label: "Reel" },
];

export default function CreateScreen() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<CreateMode>("POST");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [postBody, setPostBody] = useState("");
  const [postKind, setPostKind] = useState<"STANDARD" | "QUICK">("STANDARD");
  const [postAttachment, setPostAttachment] = useState<MediaAttachment | null>(null);

  const [pageName, setPageName] = useState("");
  const [pageSlug, setPageSlug] = useState("");
  const [pageDescription, setPageDescription] = useState("");
  const [pageLogo, setPageLogo] = useState<MediaAttachment | null>(null);

  const [groupName, setGroupName] = useState("");
  const [groupSlug, setGroupSlug] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupPrivacy, setGroupPrivacy] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [groupLogo, setGroupLogo] = useState<MediaAttachment | null>(null);

  const [reelCaption, setReelCaption] = useState("");
  const [reelVisibility, setReelVisibility] = useState<"PUBLIC" | "FOLLOWERS" | "FRIENDS">("PUBLIC");
  const [reelVideo, setReelVideo] = useState<MediaAttachment | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const resetErrors = () => setErrorMessage(null);

  const createPostMutation = useMutation({
    mutationFn: () =>
      postService.createPost({
        body: postBody.trim(),
        mediaUrl: postAttachment?.remoteUrl,
        mediaType: postAttachment?.kind,
        kind: postKind,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["feed"] }),
        queryClient.invalidateQueries({ queryKey: ["explore-hub"] }),
        queryClient.invalidateQueries({ queryKey: ["public-profile-posts"] }),
      ]);
      setPostBody("");
      setPostAttachment(null);
      router.replace("/(tabs)");
    },
    onError: () => {
      setErrorMessage("Could not publish post.");
    },
  });

  const createPageMutation = useMutation({
    mutationFn: () =>
      socialService.createPage({
        name: pageName.trim(),
        slug: pageSlug.trim().toLowerCase(),
        description: pageDescription.trim() || undefined,
        logoUrl: pageLogo?.remoteUrl,
      }),
    onSuccess: async (page) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["pages"] }),
        queryClient.invalidateQueries({ queryKey: ["explore-hub"] }),
      ]);
      setPageName("");
      setPageSlug("");
      setPageDescription("");
      setPageLogo(null);
      router.replace(`/page/${page.slug}` as never);
    },
    onError: () => {
      setErrorMessage("Could not create page.");
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: () =>
      socialService.createGroup({
        name: groupName.trim(),
        slug: groupSlug.trim().toLowerCase(),
        description: groupDescription.trim() || undefined,
        privacy: groupPrivacy,
        logoUrl: groupLogo?.remoteUrl,
      }),
    onSuccess: async (group) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["groups"] }),
        queryClient.invalidateQueries({ queryKey: ["explore-hub"] }),
      ]);
      setGroupName("");
      setGroupSlug("");
      setGroupDescription("");
      setGroupLogo(null);
      router.replace(`/group/${group.slug}` as never);
    },
    onError: () => {
      setErrorMessage("Could not create group.");
    },
  });

  const createReelMutation = useMutation({
    mutationFn: () =>
      reelService.create({
        videoUrl: reelVideo!.remoteUrl,
        caption: reelCaption.trim() || undefined,
        visibility: reelVisibility,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["reels"] });
      setReelCaption("");
      setReelVideo(null);
      router.replace("/reels");
    },
    onError: () => {
      setErrorMessage("Could not publish reel.");
    },
  });

  const pickMedia = async (
    kind: "image" | "video",
    onSet: (attachment: MediaAttachment) => void,
  ) => {
    try {
      setIsUploading(true);
      resetErrors();
      const asset = await mediaService.pickFromLibrary(kind);

      if (!asset) {
        return;
      }

      const uploaded = await mediaService.uploadAsset(asset, kind);
      onSet({
        localUri: asset.uri,
        remoteUrl: uploaded.secureUrl,
        kind: uploaded.mediaKind === "VIDEO" ? "VIDEO" : "IMAGE",
      });
    } catch {
      setErrorMessage("Could not upload media.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Screen scroll>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Create on Faceme</Text>
        <Text style={styles.heroBody}>Publish fast, open a new community, launch a page, or drop a reel.</Text>
      </View>

      <View style={styles.modeRow}>
        {modes.map((item) => (
          <Pressable
            key={item.key}
            style={[styles.modeChip, mode === item.key ? styles.modeChipActive : null]}
            onPress={() => {
              setMode(item.key);
              resetErrors();
            }}
          >
            <Text style={[styles.modeChipLabel, mode === item.key ? styles.modeChipLabelActive : null]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.quickLinks}>
        <Pressable style={styles.quickLink} onPress={() => router.push("/status")}>
          <Ionicons name="sparkles-outline" size={16} color={colors.primaryDark} />
          <Text style={styles.quickLinkLabel}>Status</Text>
        </Pressable>
        <Pressable style={styles.quickLink} onPress={() => router.push("/marketplace" as never)}>
          <Ionicons name="bag-outline" size={16} color={colors.primaryDark} />
          <Text style={styles.quickLinkLabel}>Marketplace</Text>
        </Pressable>
      </View>

      {mode === "POST" ? (
        <View style={styles.card}>
          <Input
            label="Post body"
            value={postBody}
            onChangeText={setPostBody}
            multiline
            placeholder="Maxaa maskaxdaada ku jira?"
          />
          <View style={styles.inlineRow}>
            {(["STANDARD", "QUICK"] as const).map((value) => (
              <Pressable
                key={value}
                style={[styles.optionChip, postKind === value ? styles.optionChipActive : null]}
                onPress={() => setPostKind(value)}
              >
                <Text style={[styles.optionLabel, postKind === value ? styles.optionLabelActive : null]}>
                  {value === "STANDARD" ? "Standard" : "Quick"}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.inlineRow}>
            <Pressable style={styles.mediaButton} onPress={() => void pickMedia("image", setPostAttachment)}>
              <Text style={styles.mediaButtonLabel}>{isUploading ? "Uploading..." : "Add photo"}</Text>
            </Pressable>
            <Pressable style={styles.mediaButton} onPress={() => void pickMedia("video", setPostAttachment)}>
              <Text style={styles.mediaButtonLabel}>{isUploading ? "Uploading..." : "Add video"}</Text>
            </Pressable>
          </View>
          {postAttachment ? <MediaAttachmentPreview uri={postAttachment.localUri} kind={postAttachment.kind} /> : null}
          <Button
            label={createPostMutation.isPending ? "Publishing..." : "Publish post"}
            onPress={() => createPostMutation.mutate()}
            disabled={createPostMutation.isPending || !postBody.trim() || isUploading}
          />
        </View>
      ) : null}

      {mode === "PAGE" ? (
        <View style={styles.card}>
          <Input label="Page name" value={pageName} onChangeText={setPageName} placeholder="Faceme Creators" />
          <Input label="Page slug" value={pageSlug} onChangeText={setPageSlug} placeholder="faceme-creators" />
          <Input
            label="Description"
            value={pageDescription}
            onChangeText={setPageDescription}
            multiline
            placeholder="What is this page about?"
          />
          <Pressable style={styles.mediaButton} onPress={() => void pickMedia("image", setPageLogo)}>
            <Text style={styles.mediaButtonLabel}>{isUploading ? "Uploading..." : "Add page logo"}</Text>
          </Pressable>
          {pageLogo ? <MediaAttachmentPreview uri={pageLogo.localUri} kind="IMAGE" height={180} /> : null}
          <Button
            label={createPageMutation.isPending ? "Creating..." : "Create page"}
            onPress={() => createPageMutation.mutate()}
            disabled={createPageMutation.isPending || !pageName.trim() || !pageSlug.trim() || isUploading}
          />
        </View>
      ) : null}

      {mode === "GROUP" ? (
        <View style={styles.card}>
          <Input label="Group name" value={groupName} onChangeText={setGroupName} placeholder="Faceme Creators" />
          <Input label="Group slug" value={groupSlug} onChangeText={setGroupSlug} placeholder="faceme-creators" />
          <Input
            label="Description"
            value={groupDescription}
            onChangeText={setGroupDescription}
            multiline
            placeholder="What brings this group together?"
          />
          <View style={styles.inlineRow}>
            {(["PUBLIC", "PRIVATE"] as const).map((value) => (
              <Pressable
                key={value}
                style={[styles.optionChip, groupPrivacy === value ? styles.optionChipActive : null]}
                onPress={() => setGroupPrivacy(value)}
              >
                <Text style={[styles.optionLabel, groupPrivacy === value ? styles.optionLabelActive : null]}>{value}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={styles.mediaButton} onPress={() => void pickMedia("image", setGroupLogo)}>
            <Text style={styles.mediaButtonLabel}>{isUploading ? "Uploading..." : "Add cover image"}</Text>
          </Pressable>
          {groupLogo ? <MediaAttachmentPreview uri={groupLogo.localUri} kind="IMAGE" height={180} /> : null}
          <Button
            label={createGroupMutation.isPending ? "Creating..." : "Create group"}
            onPress={() => createGroupMutation.mutate()}
            disabled={createGroupMutation.isPending || !groupName.trim() || !groupSlug.trim() || isUploading}
          />
        </View>
      ) : null}

      {mode === "REEL" ? (
        <View style={styles.card}>
          <Input
            label="Caption"
            value={reelCaption}
            onChangeText={setReelCaption}
            multiline
            placeholder="Caption your reel"
          />
          <View style={styles.inlineRow}>
            {(["PUBLIC", "FOLLOWERS", "FRIENDS"] as const).map((value) => (
              <Pressable
                key={value}
                style={[styles.optionChip, reelVisibility === value ? styles.optionChipActive : null]}
                onPress={() => setReelVisibility(value)}
              >
                <Text style={[styles.optionLabel, reelVisibility === value ? styles.optionLabelActive : null]}>{value}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={styles.mediaButton} onPress={() => void pickMedia("video", setReelVideo)}>
            <Text style={styles.mediaButtonLabel}>{isUploading ? "Uploading..." : "Pick reel video"}</Text>
          </Pressable>
          {reelVideo ? <MediaAttachmentPreview uri={reelVideo.localUri} kind="VIDEO" height={220} /> : null}
          <Button
            label={createReelMutation.isPending ? "Publishing..." : "Publish reel"}
            onPress={() => createReelMutation.mutate()}
            disabled={createReelMutation.isPending || !reelVideo || isUploading}
          />
        </View>
      ) : null}

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: "rgba(38, 33, 63, 0.94)",
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "900",
  },
  heroBody: {
    color: colors.textMuted,
    lineHeight: 21,
  },
  modeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  modeChip: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  modeChipActive: {
    backgroundColor: colors.primary,
  },
  modeChipLabel: {
    color: colors.textMuted,
    fontWeight: "800",
  },
  modeChipLabelActive: {
    color: colors.text,
  },
  quickLinks: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  quickLink: {
    alignItems: "center",
    backgroundColor: "rgba(38, 33, 63, 0.92)",
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  quickLinkLabel: {
    color: colors.primaryDark,
    fontWeight: "800",
  },
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
  optionChip: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  optionChipActive: {
    backgroundColor: colors.primary,
  },
  optionLabel: {
    color: colors.textMuted,
    fontWeight: "700",
  },
  optionLabelActive: {
    color: colors.text,
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
  errorText: {
    color: colors.danger,
  },
});
