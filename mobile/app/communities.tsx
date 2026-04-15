import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenState } from "@/components/screen-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Screen } from "@/components/ui/screen";
import { socialService } from "@/services/social";
import { useAuthStore } from "@/store/auth-store";
import { colors, radius, spacing } from "@/utils/theme";

export default function GroupsScreen() {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [showCreate, setShowCreate] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { data: groups = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["groups"],
    queryFn: socialService.getGroups,
  });

  const createMutation = useMutation({
    mutationFn: () => socialService.createGroup({ name, slug, description, privacy }),
    onSuccess: async (group) => {
      await queryClient.invalidateQueries({ queryKey: ["groups"] });
      setErrorMessage(null);
      setName("");
      setSlug("");
      setDescription("");
      router.push(`/group/${group.slug}` as never);
    },
    onError: () => {
      setErrorMessage("Could not create group. Try a different name or slug.");
    },
  });

  const joinMutation = useMutation({
    mutationFn: (groupId: string) => socialService.joinGroup(groupId),
    onSuccess: async (_, groupId) => {
      await queryClient.invalidateQueries({ queryKey: ["groups"] });
      const group = groups.find((item) => item.id === groupId);
      if (group) {
        router.push(`/group/${group.slug}` as never);
      }
    },
    onError: () => {
      setErrorMessage("Could not join group. Try again.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (groupId: string) => socialService.deleteGroup(groupId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["groups"] });
      setErrorMessage(null);
    },
    onError: () => {
      setErrorMessage("Could not delete group.");
    },
  });

  if (isLoading && !groups.length) {
    return (
      <Screen>
        <ScreenState variant="loading" title="Loading groups" message="Faceme groups are loading." />
      </Screen>
    );
  }

  if (isError && !groups.length) {
    return (
      <Screen>
        <ScreenState
          variant="error"
          title="Could not load groups"
          message="Groups are temporarily unavailable."
          onAction={() => void refetch()}
          actionLabel="Retry"
        />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Groups</Text>
          <Text style={styles.subtitle}>Find public circles, request private access, and build community around shared interests.</Text>
        </View>
        <Pressable style={styles.createToggle} onPress={() => setShowCreate((current) => !current)}>
          <Text style={styles.createToggleLabel}>{showCreate ? "Close" : "Create"}</Text>
        </Pressable>
      </View>

      {showCreate ? (
        <View style={styles.form}>
          <Input label="Name" value={name} onChangeText={setName} placeholder="Faceme Creators" />
          <Input label="Slug" value={slug} onChangeText={setSlug} placeholder="faceme-creators" />
          <Input
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="What is this group about?"
          />
          <View style={styles.privacyRow}>
            {(["PUBLIC", "PRIVATE"] as const).map((value) => (
              <Pressable
                key={value}
                style={[styles.privacyChip, privacy === value ? styles.privacyChipActive : null]}
                onPress={() => setPrivacy(value)}
              >
                <Text style={[styles.privacyChipLabel, privacy === value ? styles.privacyChipLabelActive : null]}>{value}</Text>
              </Pressable>
            ))}
          </View>
          <Button
            label={createMutation.isPending ? "Creating..." : "Create group"}
            onPress={() => createMutation.mutate()}
            disabled={createMutation.isPending || name.trim().length < 2 || slug.trim().length < 2}
          />
          {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.list}>
        {groups.map((group) => {
          const isOwner = group.owner.id === currentUserId;
          const joinLabel = group.isMember ? "Open group" : group.privacy === "PRIVATE" ? "Request join" : "Join group";

          return (
            <View key={group.id} style={styles.card}>
              <Text style={styles.name}>{group.name}</Text>
              <Text style={styles.slug}>/{group.slug}</Text>
              {group.description ? <Text style={styles.description}>{group.description}</Text> : null}
              <Text style={styles.meta}>
                {group.membersCount} members · {group.postsCount} posts · {group.privacy}
              </Text>
              <View style={styles.actionRow}>
                <Pressable
                  style={styles.primaryAction}
                  onPress={() => (group.isMember ? router.push(`/group/${group.slug}` as never) : joinMutation.mutate(group.id))}
                >
                  <Text style={styles.primaryActionLabel}>{joinLabel}</Text>
                </Pressable>
                {isOwner ? (
                  <Pressable style={styles.secondaryAction} onPress={() => deleteMutation.mutate(group.id)}>
                    <Text style={styles.secondaryActionLabel}>
                      {deleteMutation.isPending ? "Deleting..." : "Delete"}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          );
        })}
        {!isLoading && !isError && !groups.length ? <Text style={styles.feedback}>No groups yet. Create the first one.</Text> : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.textMuted,
    lineHeight: 20,
  },
  header: {
    alignItems: "center",
    backgroundColor: "rgba(38, 33, 63, 0.94)",
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    padding: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
  },
  createToggle: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  createToggleLabel: {
    color: colors.primaryDark,
    fontWeight: "800",
  },
  form: {
    backgroundColor: "rgba(38, 33, 63, 0.92)",
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  privacyRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  privacyChip: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  privacyChipActive: {
    backgroundColor: colors.primary,
  },
  privacyChipLabel: {
    color: colors.textMuted,
    fontWeight: "700",
  },
  privacyChipLabelActive: {
    color: colors.text,
  },
  list: {
    gap: spacing.md,
    paddingBottom: 120,
  },
  card: {
    backgroundColor: "rgba(38, 33, 63, 0.92)",
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  name: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  slug: {
    color: colors.primary,
    fontWeight: "700",
  },
  description: {
    color: colors.textMuted,
  },
  meta: {
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: "700",
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  primaryAction: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  primaryActionLabel: {
    color: colors.text,
    fontWeight: "800",
  },
  secondaryAction: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  secondaryActionLabel: {
    color: colors.danger,
    fontWeight: "800",
  },
  feedback: {
    color: colors.textMuted,
  },
  error: {
    color: colors.danger,
  },
});
