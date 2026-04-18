import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { ScreenState } from "@/components/screen-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListCard } from "@/components/ui/list-card";
import { Screen } from "@/components/ui/screen";
import { SectionHeader } from "@/components/ui/section-header";
import { marketplaceService } from "@/services/marketplace";
import { getErrorMessage } from "@/utils/errors";
import { colors, spacing } from "@/utils/theme";

export default function MarketplaceScreen() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const { data: categories = [], isLoading: isCategoriesLoading, error: categoriesError } = useQuery({
    queryKey: ["marketplace-categories"],
    queryFn: marketplaceService.categories,
  });
  const listingsQuery = useQuery({
    queryKey: ["marketplace-listings", query, category],
    queryFn: () => marketplaceService.list({ q: query.trim() || undefined, category }),
  });

  const listings = listingsQuery.data ?? [];
  const topCategories = useMemo(() => categories.slice(0, 5), [categories]);

  if (listingsQuery.isLoading || isCategoriesLoading) {
    return (
      <Screen>
        <ScreenState variant="loading" title="Loading marketplace" message="Finding active listings and categories." />
      </Screen>
    );
  }

  if (listingsQuery.isError || categoriesError) {
    return (
      <Screen>
        <ScreenState
          variant="error"
          title="Marketplace unavailable"
          message={getErrorMessage(listingsQuery.error ?? categoriesError, "We could not load listings right now.")}
          actionLabel="Retry"
          onAction={() => void listingsQuery.refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={listings}
        keyExtractor={(listing) => listing.id}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ gap: 16, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 96 }}
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews
        ListHeaderComponent={(
          <View style={{ gap: 16 }}>
            <SectionHeader title="Marketplace" actionLabel="Sell" href="/create" />
            <Input label="Search marketplace" value={query} onChangeText={setQuery} placeholder="Search listings" />
            <View style={styles.categoryRow}>
              <Button label="All" variant={category ? "secondary" : "primary"} onPress={() => setCategory(undefined)} />
              {topCategories.map((item) => (
                <Button
                  key={item.slug}
                  label={item.name}
                  variant={category === item.slug ? "primary" : "secondary"}
                  onPress={() => setCategory(item.slug)}
                />
              ))}
            </View>
          </View>
        )}
        ListEmptyComponent={<ScreenState variant="empty" title="No listings found" message="Try another search or category." />}
        renderItem={({ item: listing }) => (
          <View style={styles.listingCard}>
            <ListCard
              title={listing.title}
              subtitle={`${listing.city ?? listing.countryName ?? "Location pending"} \u2022 ${listing.category}`}
              trailing={`${listing.currency} ${listing.price}`}
              onPress={() => router.push(`/listing/${listing.id}`)}
            />
            <Text style={styles.meta}>{listing.isSaved ? "Saved item" : "Available now"}</Text>
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  listingCard: {
    gap: spacing.xs,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 13,
  },
});
