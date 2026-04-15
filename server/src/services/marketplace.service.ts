import { StatusCodes } from "http-status-codes";
import { prisma } from "../lib/prisma.js";
import { emitRealtime } from "../lib/realtime.js";
import { chatService } from "./chat.service.js";
import { ApiError } from "../utils/api-error.js";

const sellerSelect = {
  id: true,
  username: true,
  firstName: true,
  avatarUrl: true,
  location: true,
} as const;

const listingInclude = {
  seller: {
    select: sellerSelect,
  },
  images: {
    orderBy: { sortOrder: "asc" },
  },
  savedBy: {
    select: {
      userId: true,
    },
  },
} as const;

const toSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);

const serializeListing = (listing: any, viewerId: string) => ({
  id: listing.id,
  slug: listing.slug,
  title: listing.title,
  description: listing.description,
  price: Number(listing.price),
  currency: listing.currency,
  category: listing.category,
  conditionLabel: listing.conditionLabel,
  countryCode: listing.countryCode,
  countryName: listing.countryName,
  city: listing.city,
  primaryImageUrl: listing.primaryImageUrl,
  status: listing.status,
  isPromoted: listing.isPromoted,
  premiumFeatureTag: listing.premiumFeatureTag,
  createdAt: listing.createdAt,
  updatedAt: listing.updatedAt,
  seller: listing.seller,
  images: listing.images.map((image: any) => image.imageUrl),
  isSaved: listing.savedBy.some((entry: { userId: string }) => entry.userId === viewerId),
  canEdit: listing.sellerId === viewerId,
  canDelete: listing.sellerId === viewerId,
});

const ensureListingOwner = async (userId: string, listingId: string) => {
  const listing = await prisma.marketplaceListing.findUnique({
    where: { id: listingId },
    select: { id: true, sellerId: true },
  });

  if (!listing) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Listing not found");
  }

  if (listing.sellerId !== userId) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Only the seller can manage this listing");
  }

  return listing;
};

export const marketplaceService = {
  async listListings(
    userId: string,
    filters: {
      q?: string;
      category?: string;
      minPrice?: number;
      maxPrice?: number;
      countryCode?: string;
      city?: string;
      sellerId?: string;
      savedOnly?: boolean;
    },
  ) {
    const listings = await prisma.marketplaceListing.findMany({
      where: {
        hiddenAt: null,
        status: "ACTIVE",
        ...(filters.q
          ? {
              OR: [
                { title: { contains: filters.q, mode: "insensitive" } },
                { description: { contains: filters.q, mode: "insensitive" } },
                { city: { contains: filters.q, mode: "insensitive" } },
                { countryName: { contains: filters.q, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(filters.category ? { category: filters.category } : {}),
        ...(filters.countryCode ? { countryCode: filters.countryCode.toUpperCase() } : {}),
        ...(filters.city ? { city: { equals: filters.city, mode: "insensitive" } } : {}),
        ...(filters.sellerId ? { sellerId: filters.sellerId } : {}),
        ...(typeof filters.minPrice === "number" || typeof filters.maxPrice === "number"
          ? {
              price: {
                ...(typeof filters.minPrice === "number" ? { gte: filters.minPrice } : {}),
                ...(typeof filters.maxPrice === "number" ? { lte: filters.maxPrice } : {}),
              },
            }
          : {}),
        ...(filters.savedOnly
          ? {
              savedBy: {
                some: {
                  userId,
                },
              },
            }
          : {}),
      },
      orderBy: [{ isPromoted: "desc" }, { createdAt: "desc" }],
      include: listingInclude,
      take: 60,
    });

    return listings.map((listing: any) => serializeListing(listing, userId));
  },

  async getListing(userId: string, listingId: string) {
    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: listingId },
      include: listingInclude,
    });

    if (!listing || listing.hiddenAt) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Listing not found");
    }

    return serializeListing(listing, userId);
  },

  async getCategories() {
    const categories = await prisma.marketplaceListing.groupBy({
      by: ["category"],
      where: {
        hiddenAt: null,
        status: "ACTIVE",
      },
      _count: {
        _all: true,
      },
      orderBy: {
        category: "asc",
      },
    });

    return categories.map((entry: { category: string; _count: { _all: number } }) => ({
      slug: toSlug(entry.category),
      name: entry.category,
      listingCount: entry._count._all,
    }));
  },

  async createListing(
    userId: string,
    input: {
      title: string;
      description?: string;
      price: number;
      currency: string;
      category: string;
      conditionLabel?: string;
      countryCode?: string;
      countryName?: string;
      city?: string;
      images: string[];
    },
  ) {
    const slugBase = toSlug(input.title) || `listing-${Date.now()}`;
    const slug = `${slugBase}-${Math.random().toString(36).slice(2, 8)}`;
    const primaryImageUrl = input.images[0] ?? null;

    const listing = await prisma.marketplaceListing.create({
      data: {
        sellerId: userId,
        title: input.title,
        slug,
        description: input.description,
        price: input.price,
        currency: input.currency.toUpperCase(),
        category: input.category,
        conditionLabel: input.conditionLabel,
        countryCode: input.countryCode?.toUpperCase(),
        countryName: input.countryName,
        city: input.city,
        primaryImageUrl,
        images: {
          create: input.images.map((imageUrl, index) => ({
            imageUrl,
            sortOrder: index,
          })),
        },
      },
      include: listingInclude,
    });

    emitRealtime("marketplace:changed", { reason: "listing_created", listingId: listing.id, sellerId: userId });
    return serializeListing(listing, userId);
  },

  async updateListing(
    userId: string,
    listingId: string,
    input: {
      title?: string;
      description?: string | null;
      price?: number;
      currency?: string;
      category?: string;
      conditionLabel?: string | null;
      countryCode?: string | null;
      countryName?: string | null;
      city?: string | null;
      images?: string[];
      status?: "ACTIVE" | "SOLD" | "ARCHIVED";
    },
  ) {
    await ensureListingOwner(userId, listingId);

    const listing = await prisma.$transaction(async (tx: typeof prisma) => {
      if (input.images) {
        await tx.marketplaceListingImage.deleteMany({
          where: { listingId },
        });
      }

      return tx.marketplaceListing.update({
        where: { id: listingId },
        data: {
          title: input.title,
          description: input.description,
          price: input.price,
          currency: input.currency?.toUpperCase(),
          category: input.category,
          conditionLabel: input.conditionLabel,
          countryCode: input.countryCode?.toUpperCase() ?? input.countryCode,
          countryName: input.countryName,
          city: input.city,
          status: input.status,
          primaryImageUrl: input.images ? input.images[0] ?? null : undefined,
          ...(input.images
            ? {
                images: {
                  create: input.images.map((imageUrl, index) => ({
                    imageUrl,
                    sortOrder: index,
                  })),
                },
              }
            : {}),
        },
        include: listingInclude,
      });
    });

    emitRealtime("marketplace:changed", { reason: "listing_updated", listingId, sellerId: userId });
    return serializeListing(listing, userId);
  },

  async deleteListing(userId: string, listingId: string) {
    await ensureListingOwner(userId, listingId);
    await prisma.marketplaceListing.delete({
      where: { id: listingId },
    });
    emitRealtime("marketplace:changed", { reason: "listing_deleted", listingId, sellerId: userId });
    return { deleted: true };
  },

  async toggleSave(userId: string, listingId: string) {
    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: listingId },
      select: { id: true, hiddenAt: true },
    });

    if (!listing || listing.hiddenAt) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Listing not found");
    }

    const existing = await prisma.marketplaceSavedListing.findUnique({
      where: {
        listingId_userId: {
          listingId,
          userId,
        },
      },
    });

    if (existing) {
      await prisma.marketplaceSavedListing.delete({
        where: {
          listingId_userId: {
            listingId,
            userId,
          },
        },
      });
      return { isSaved: false };
    }

    await prisma.marketplaceSavedListing.create({
      data: {
        listingId,
        userId,
      },
    });

    return { isSaved: true };
  },

  async contactSeller(userId: string, listingId: string, message?: string) {
    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        title: true,
        sellerId: true,
        hiddenAt: true,
      },
    });

    if (!listing || listing.hiddenAt) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Listing not found");
    }

    if (listing.sellerId === userId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "You cannot contact yourself about your own listing");
    }

    const conversation = await chatService.getOrCreateDirectConversation(userId, listing.sellerId);

    if (message?.trim()) {
      await chatService.createMessage(prisma, userId, conversation.id, {
        text: `Marketplace inquiry: ${listing.title}\n\n${message.trim()}`,
        type: "TEXT",
      });
    }

    return conversation;
  },
};
