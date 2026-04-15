import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MediaAttachmentPreview } from "@/components/media-attachment-preview";
import { ScreenState } from "@/components/screen-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Screen } from "@/components/ui/screen";
import { marketplaceService } from "@/services/marketplace";
import { mediaService } from "@/services/media";
import { MarketplaceListing } from "@/types/domain";
import { colors, radius, spacing } from "@/utils/theme";

type ListingAttachment = {
  localUri: string;
  remoteUrl: string;
};

export default function MarketplaceScreen() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [category, setCategory] = useState("");
  const [conditionLabel, setConditionLabel] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [countryName, setCountryName] = useState("");
  const [city, setCity] = useState("");
  const [images, setImages] = useState<ListingAttachment[]>([]);
  const [marketplaceError, setMarketplaceError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["marketplace-categories"],
    queryFn: marketplaceService.categories,
  });
  const { data: listings = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["marketplace-listings", query, selectedCategory],
    queryFn: () =>
      marketplaceService.list({
        q: query.trim() || undefined,
        category: selectedCategory,
      }),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      marketplaceService.create({
        title: title.trim(),
        description: description.trim() || undefined,
        price: Number(price),
        currency: currency.trim().toUpperCase(),
        category: category.trim(),
        conditionLabel: conditionLabel.trim() || undefined,
        countryCode: countryCode.trim().toUpperCase() || undefined,
        countryName: countryName.trim() || undefined,
        city: city.trim() || undefined,
        images: images.map((image) => image.remoteUrl),
      }),
    onError: (error) => {
      console.error("Failed to create marketplace listing", error);
      setMarketplaceError("Could not create listing.");
    },
    onSuccess: async () => {
      setMarketplaceError(null);
      setTitle("");
      setDescription("");
      setPrice("");
      setCategory("");
      setConditionLabel("");
      setCountryCode("");
      setCountryName("");
      setCity("");
      setImages([]);
      setShowCreate(false);
      await queryClient.invalidateQueries({ queryKey: ["marketplace-listings"] });
      await queryClient.invalidateQueries({ queryKey: ["marketplace-categories"] });
    },
  });

  const saveMutation = useMutation({
    mutationFn: (listingId: string) => marketplaceService.toggleSave(listingId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["marketplace-listings"] });
    },
  });

  const contactMutation = useMutation({
    mutationFn: (listingId: string) =>
      marketplaceService.contactSeller(listingId, "Salaan, waxaan xiiseynayaa listing-kan."),
    onSuccess: (conversation) => {
      router.push(`/chat/${conversation.id}`);
    },
    onError: (error) => {
      console.error("Failed to contact seller", error);
      setMarketplaceError("Could not open seller chat.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (listingId: string) => marketplaceService.remove(listingId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["marketplace-listings"] });
      await queryClient.invalidateQueries({ queryKey: ["marketplace-categories"] });
    },
  });

  const handlePickImage = async () => {
    try {
      setIsUploading(true);
      const asset = await mediaService.pickFromLibrary("image");

      if (!asset) {
        return;
      }

      const uploaded = await mediaService.uploadAsset(asset, "image");
      setImages((current) => [...current, { localUri: asset.uri, remoteUrl: uploaded.secureUrl }].slice(0, 8));
    } catch (error) {
      console.error("Failed to pick marketplace image", error);
      setMarketplaceError("Could not upload listing image.");
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading && !listings.length) {
    return (
      <Screen>
        <ScreenState variant="loading" title="Loading marketplace" message="Global listings are loading." />
      </Screen>
    );
  }

  if (isError && !listings.length) {
    return (
      <Screen>
        <ScreenState
          variant="error"
          title="Could not load marketplace"
          message="Marketplace is temporarily unavailable."
          actionLabel="Retry"
          onAction={() => void refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Marketplace</Text>
          <Text style={styles.subtitle}>Buy and sell globally across countries, cities, and categories.</Text>
        </View>
        <Pressable style={styles.createToggle} onPress={() => setShowCreate((current) => !current)}>
          <Text style={styles.createToggleLabel}>{showCreate ? "Close" : "Sell"}</Text>
        </Pressable>
      </View>

      <View style={styles.searchCard}>
        <Input
          label="Search marketplace"
          value={query}
          onChangeText={setQuery}
          placeholder="Phone, laptop, furniture..."
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          <Pressable
            style={[styles.categoryChip, !selectedCategory ? styles.categoryChipActive : null]}
            onPress={() => setSelectedCategory(undefined)}
          >
            <Text style={[styles.categoryChipLabel, !selectedCategory ? styles.categoryChipLabelActive : null]}>
              All
            </Text>
          </Pressable>
          {categories.map((item) => (
            <Pressable
              key={item.slug}
              style={[styles.categoryChip, selectedCategory === item.name ? styles.categoryChipActive : null]}
              onPress={() => setSelectedCategory(item.name)}
            >
              <Text
                style={[styles.categoryChipLabel, selectedCategory === item.name ? styles.categoryChipLabelActive : null]}
              >
                {item.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {showCreate ? (
        <View style={styles.createCard}>
          <Input label="Title" value={title} onChangeText={setTitle} placeholder="iPhone 15 Pro Max" />
          <Input label="Description" value={description} onChangeText={setDescription} multiline />
          <View style={styles.inlineRow}>
            <View style={styles.inlineField}>
              <Input label="Price" value={price} onChangeText={setPrice} placeholder="1200" />
            </View>
            <View style={styles.inlineField}>
              <Input label="Currency" value={currency} onChangeText={setCurrency} placeholder="USD" />
            </View>
          </View>
          <Input label="Category" value={category} onChangeText={setCategory} placeholder="Phones" />
          <Input label="Condition" value={conditionLabel} onChangeText={setConditionLabel} placeholder="Used - like new" />
          <View style={styles.inlineRow}>
            <View style={styles.inlineField}>
              <Input label="Country code" value={countryCode} onChangeText={setCountryCode} placeholder="US" />
            </View>
            <View style={styles.inlineField}>
              <Input label="City" value={city} onChangeText={setCity} placeholder="New York" />
            </View>
          </View>
          <Input label="Country name" value={countryName} onChangeText={setCountryName} placeholder="United States" />
          <Pressable style={styles.mediaButton} onPress={() => void handlePickImage()}>
            <Ionicons name="image-outline" size={18} color={colors.primaryDark} />
            <Text style={styles.mediaButtonLabel}>{isUploading ? "Uploading..." : "Add listing images"}</Text>
          </Pressable>
          {images.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.previewRow}>
              {images.map((image, index) => (
                <View key={`${image.remoteUrl}-${index}`} style={styles.previewCard}>
                  <MediaAttachmentPreview uri={image.localUri} kind="IMAGE" height={120} />
                </View>
              ))}
            </ScrollView>
          ) : null}
          {marketplaceError ? <Text style={styles.errorText}>{marketplaceError}</Text> : null}
          <Button
            label={createMutation.isPending ? "Creating..." : "Create listing"}
            onPress={() => createMutation.mutate()}
            disabled={!title.trim() || !category.trim() || !price.trim() || !images.length || createMutation.isPending || isUploading}
          />
        </View>
      ) : null}

      <View style={styles.listings}>
        {listings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            onOpen={() => router.push(`/listing/${listing.id}` as never)}
            onSave={() => saveMutation.mutate(listing.id)}
            onContact={() => contactMutation.mutate(listing.id)}
            onDelete={() => deleteMutation.mutate(listing.id)}
          />
        ))}
        {!listings.length ? (
          <ScreenState variant="empty" title="No listings yet" message="Create the first global marketplace listing." />
        ) : null}
      </View>
    </Screen>
  );
}

const ListingCard = ({
  listing,
  onOpen,
  onSave,
  onContact,
  onDelete,
}: {
  listing: MarketplaceListing;
  onOpen: () => void;
  onSave: () => void;
  onContact: () => void;
  onDelete: () => void;
}) => (
  <Pressable style={styles.listingCard} onPress={onOpen}>
    {listing.primaryImageUrl ? (
      <MediaAttachmentPreview uri={listing.primaryImageUrl} kind="IMAGE" height={220} />
    ) : null}
    <View style={styles.listingBody}>
      <Text style={styles.listingPrice}>
        {listing.currency} {listing.price.toLocaleString()}
      </Text>
      <Text style={styles.listingTitle}>{listing.title}</Text>
      <Text style={styles.listingMeta}>
        {listing.category}
        {listing.city ? ` · ${listing.city}` : ""}
        {listing.countryName ? `, ${listing.countryName}` : ""}
      </Text>
      {listing.description ? (
        <Text style={styles.listingDescription} numberOfLines={3}>
          {listing.description}
        </Text>
      ) : null}
      <View style={styles.sellerRow}>
        <Pressable onPress={() => router.push(`/profile/${listing.seller.username}`)}>
          <Text style={styles.sellerName}>{listing.seller.firstName ?? listing.seller.username}</Text>
        </Pressable>
        <View style={styles.inlineActions}>
          <Pressable style={styles.actionChip} onPress={onSave}>
            <Text style={styles.actionChipLabel}>{listing.isSaved ? "Saved" : "Save"}</Text>
          </Pressable>
          <Pressable style={styles.actionChip} onPress={onContact}>
            <Text style={styles.actionChipLabel}>Message</Text>
          </Pressable>
          {listing.canDelete ? (
            <Pressable style={styles.removeChip} onPress={onDelete}>
              <Text style={styles.removeChipLabel}>Delete</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    backgroundColor: "rgba(38, 33, 63, 0.94)",
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    padding: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.textMuted,
    lineHeight: 20,
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
  searchCard: {
    backgroundColor: "rgba(38, 33, 63, 0.92)",
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  categoryRow: {
    gap: spacing.sm,
  },
  categoryChip: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  categoryChipActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  categoryChipLabel: {
    color: colors.text,
    fontWeight: "700",
  },
  categoryChipLabelActive: {
    color: colors.text,
  },
  createCard: {
    backgroundColor: "rgba(38, 33, 63, 0.92)",
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  inlineRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  inlineField: {
    flex: 1,
  },
  mediaButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  mediaButtonLabel: {
    color: colors.primaryDark,
    fontWeight: "700",
  },
  previewRow: {
    gap: spacing.sm,
  },
  previewCard: {
    width: 140,
  },
  listings: {
    gap: spacing.md,
    paddingBottom: 140,
  },
  listingCard: {
    backgroundColor: "rgba(38, 33, 63, 0.92)",
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: "hidden",
  },
  listingBody: {
    gap: spacing.xs,
    padding: spacing.md,
  },
  listingPrice: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
  },
  listingTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
  },
  listingMeta: {
    color: colors.textSoft,
    fontWeight: "700",
  },
  listingDescription: {
    color: colors.textMuted,
    lineHeight: 20,
  },
  sellerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  sellerName: {
    color: colors.primaryDark,
    fontWeight: "800",
  },
  inlineActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  actionChip: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  actionChipLabel: {
    color: colors.primaryDark,
    fontWeight: "700",
  },
  removeChip: {
    backgroundColor: "rgba(255, 92, 138, 0.12)",
    borderColor: "rgba(255, 92, 138, 0.28)",
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  removeChipLabel: {
    color: colors.danger,
    fontWeight: "700",
  },
  errorText: {
    color: colors.danger,
    lineHeight: 20,
  },
});
