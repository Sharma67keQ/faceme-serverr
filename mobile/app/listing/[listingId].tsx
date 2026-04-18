import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MediaAttachmentPreview } from "@/components/media-attachment-preview";
import { ScreenState } from "@/components/screen-state";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { marketplaceService } from "@/services/marketplace";
import { colors, radius, spacing } from "@/utils/theme";

export default function ListingDetailScreen() {
  const params = useLocalSearchParams<{ listingId: string | string[] }>();
  const listingId = Array.isArray(params.listingId) ? params.listingId[0] : params.listingId;
  const queryClient = useQueryClient();
  const { data: listing, isLoading, isError, refetch } = useQuery({
    queryKey: ["marketplace-listing", listingId],
    queryFn: () => (listingId ? marketplaceService.getById(listingId) : Promise.resolve(null)),
    enabled: Boolean(listingId),
  });

  const saveMutation = useMutation({
    mutationFn: () => marketplaceService.toggleSave(listing!.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["marketplace-listings"] });
      await queryClient.invalidateQueries({ queryKey: ["marketplace-listing", listingId] });
    },
  });

  const contactMutation = useMutation({
    mutationFn: () => marketplaceService.contactSeller(listing!.id, "Salaan, waxaan xiiseynayaa listing-kan."),
    onSuccess: (conversation) => {
      router.push(`/chat/${conversation.id}`);
    },
  });

  if (isLoading) {
    return (
      <Screen>
        <ScreenState variant="loading" title="Opening listing" message="Listing details are loading." />
      </Screen>
    );
  }

  if (isError || !listing) {
    return (
      <Screen>
        <ScreenState
          variant="error"
          title="Could not open listing"
          message="This marketplace listing is unavailable."
          actionLabel="Retry"
          onAction={() => void refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={styles.hero}>
        <Text style={styles.price}>
          {listing.currency} {listing.price.toLocaleString()}
        </Text>
        <Text style={styles.title}>{listing.title}</Text>
        <Text style={styles.meta}>
          {listing.category}
          {listing.conditionLabel ? ` \u2022 ${listing.conditionLabel}` : ""}
          {listing.city ? ` \u2022 ${listing.city}` : ""}
          {listing.countryName ? `, ${listing.countryName}` : ""}
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
        {(listing.images?.length ? listing.images : listing.primaryImageUrl ? [listing.primaryImageUrl] : []).map((image: string, index: number) => (
          <View key={`${image}-${index}`} style={styles.imageCard}>
            <MediaAttachmentPreview uri={image} kind="IMAGE" height={240} />
          </View>
        ))}
      </ScrollView>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{listing.description ?? "No description provided."}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Seller</Text>
        <Pressable onPress={() => router.push(`/profile/${listing.seller.username}`)}>
          <Text style={styles.sellerName}>{listing.seller.firstName ?? listing.seller.username}</Text>
        </Pressable>
        {listing.seller.location ? <Text style={styles.description}>{listing.seller.location}</Text> : null}
      </View>

      <View style={styles.actionRow}>
        <Button
          label={saveMutation.isPending ? "Saving..." : listing.isSaved ? "Saved" : "Save listing"}
          variant="secondary"
          onPress={() => saveMutation.mutate()}
        />
        <Button label={contactMutation.isPending ? "Opening..." : "Message seller"} onPress={() => contactMutation.mutate()} />
      </View>
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
  price: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: "900",
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
  },
  meta: {
    color: colors.textMuted,
    lineHeight: 21,
  },
  imageRow: {
    gap: spacing.sm,
  },
  imageCard: {
    width: 260,
  },
  card: {
    backgroundColor: "rgba(38, 33, 63, 0.92)",
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 17,
  },
  description: {
    color: colors.textMuted,
    lineHeight: 21,
  },
  sellerName: {
    color: colors.primaryDark,
    fontWeight: "800",
    fontSize: 16,
  },
  actionRow: {
    gap: spacing.sm,
  },
});
