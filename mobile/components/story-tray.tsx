import { memo } from "react";
import { router } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Avatar } from "@/components/ui/avatar";
import { Story } from "@/types/domain";
import { colors, radius, spacing } from "@/utils/theme";

export const StoryTray = memo(({ stories }: { stories: Story[] }) => (
  <FlatList
    horizontal
    data={stories}
    keyExtractor={(story) => story.id}
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.row}
    initialNumToRender={6}
    maxToRenderPerBatch={8}
    windowSize={5}
    removeClippedSubviews
    renderItem={({ item: story }) => (
      <Pressable style={styles.card} onPress={() => router.push(`/story/${story.id}` as never)}>
        <View style={styles.mediaPlaceholder} />
        <View style={styles.avatarWrap}>
          <Avatar name={story.author.firstName ?? story.author.username} size={38} />
        </View>
        <Text style={styles.name} numberOfLines={2}>{story.author.firstName ?? story.author.username}</Text>
      </Pressable>
    )}
  />
));

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    height: 168,
    overflow: "hidden",
    width: 108,
  },
  mediaPlaceholder: {
    backgroundColor: colors.backgroundStrong,
    flex: 1,
  },
  avatarWrap: {
    left: spacing.sm,
    position: "absolute",
    top: spacing.sm,
  },
  name: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "700",
    padding: spacing.sm,
  },
});
