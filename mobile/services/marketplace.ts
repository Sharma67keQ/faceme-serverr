import { MarketplaceCategoryResponse, MarketplaceListingResponse } from "@/types/api";
import { api } from "./api";

export const marketplaceService = {
  async list(filters?: {
    q?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    countryCode?: string;
    city?: string;
    sellerId?: string;
    savedOnly?: boolean;
  }) {
    const { data } = await api.get<MarketplaceListingResponse>("/marketplace/listings", {
      params: filters,
    });
    return data;
  },
  async categories() {
    const { data } = await api.get<MarketplaceCategoryResponse>("/marketplace/categories");
    return data;
  },
  async getById(listingId: string) {
    const { data } = await api.get(`/marketplace/listings/${listingId}`);
    return data;
  },
  async create(payload: {
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
  }) {
    const { data } = await api.post("/marketplace/listings", payload);
    return data;
  },
  async update(
    listingId: string,
    payload: {
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
    const { data } = await api.patch(`/marketplace/listings/${listingId}`, payload);
    return data;
  },
  async remove(listingId: string) {
    const { data } = await api.delete(`/marketplace/listings/${listingId}`);
    return data;
  },
  async toggleSave(listingId: string) {
    const { data } = await api.post(`/marketplace/listings/${listingId}/save`);
    return data;
  },
  async contactSeller(listingId: string, message?: string) {
    const { data } = await api.post(`/marketplace/listings/${listingId}/contact`, { message });
    return data;
  },
};
