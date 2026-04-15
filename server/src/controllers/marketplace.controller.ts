import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { marketplaceService } from "../services/marketplace.service.js";
import { secureUrlSchema, trimmedString } from "../utils/validation.js";

const listingSchema = z.object({
  title: trimmedString(2, 120),
  description: trimmedString(3, 2000).optional(),
  price: z.number().nonnegative(),
  currency: z.string().trim().min(3).max(8),
  category: trimmedString(2, 80),
  conditionLabel: trimmedString(2, 80).optional(),
  countryCode: z.string().trim().min(2).max(8).optional(),
  countryName: trimmedString(2, 80).optional(),
  city: trimmedString(2, 80).optional(),
  images: z.array(secureUrlSchema).min(1).max(8),
});

const updateListingSchema = z.object({
  title: trimmedString(2, 120).optional(),
  description: z.string().trim().min(3).max(2000).nullable().optional(),
  price: z.number().nonnegative().optional(),
  currency: z.string().trim().min(3).max(8).optional(),
  category: trimmedString(2, 80).optional(),
  conditionLabel: z.string().trim().min(2).max(80).nullable().optional(),
  countryCode: z.string().trim().min(2).max(8).nullable().optional(),
  countryName: z.string().trim().min(2).max(80).nullable().optional(),
  city: z.string().trim().min(2).max(80).nullable().optional(),
  images: z.array(secureUrlSchema).min(1).max(8).optional(),
  status: z.enum(["ACTIVE", "SOLD", "ARCHIVED"]).optional(),
});

const contactSchema = z.object({
  message: z.string().trim().min(3).max(500).optional(),
});

const listFiltersSchema = z.object({
  q: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  countryCode: z.string().trim().min(2).max(8).optional(),
  city: z.string().trim().min(1).optional(),
  sellerId: z.string().trim().min(1).optional(),
  savedOnly: z.coerce.boolean().optional(),
});

export const marketplaceController = {
  async list(req: Request, res: Response) {
    const filters = listFiltersSchema.parse(req.query);
    const listings = await marketplaceService.listListings(req.user!.id, filters);
    return res.status(StatusCodes.OK).json(listings);
  },

  async categories(_req: Request, res: Response) {
    const categories = await marketplaceService.getCategories();
    return res.status(StatusCodes.OK).json(categories);
  },

  async detail(req: Request, res: Response) {
    const listingId = z.string().min(1).parse(req.params.listingId);
    const listing = await marketplaceService.getListing(req.user!.id, listingId);
    return res.status(StatusCodes.OK).json(listing);
  },

  async create(req: Request, res: Response) {
    const payload = listingSchema.parse(req.body);
    const listing = await marketplaceService.createListing(req.user!.id, payload);
    return res.status(StatusCodes.CREATED).json(listing);
  },

  async update(req: Request, res: Response) {
    const listingId = z.string().min(1).parse(req.params.listingId);
    const payload = updateListingSchema.parse(req.body);
    const listing = await marketplaceService.updateListing(req.user!.id, listingId, payload);
    return res.status(StatusCodes.OK).json(listing);
  },

  async remove(req: Request, res: Response) {
    const listingId = z.string().min(1).parse(req.params.listingId);
    const result = await marketplaceService.deleteListing(req.user!.id, listingId);
    return res.status(StatusCodes.OK).json(result);
  },

  async toggleSave(req: Request, res: Response) {
    const listingId = z.string().min(1).parse(req.params.listingId);
    const result = await marketplaceService.toggleSave(req.user!.id, listingId);
    return res.status(StatusCodes.OK).json(result);
  },

  async contactSeller(req: Request, res: Response) {
    const listingId = z.string().min(1).parse(req.params.listingId);
    const payload = contactSchema.parse(req.body ?? {});
    const conversation = await marketplaceService.contactSeller(req.user!.id, listingId, payload.message);
    return res.status(StatusCodes.OK).json(conversation);
  },
};
