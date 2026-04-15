import { Router } from "express";
import { marketplaceController } from "../controllers/marketplace.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

export const marketplaceRouter = Router();

marketplaceRouter.use(requireAuth);
marketplaceRouter.get("/categories", asyncHandler(marketplaceController.categories));
marketplaceRouter.get("/listings", asyncHandler(marketplaceController.list));
marketplaceRouter.get("/listings/:listingId", asyncHandler(marketplaceController.detail));
marketplaceRouter.post("/listings", asyncHandler(marketplaceController.create));
marketplaceRouter.patch("/listings/:listingId", asyncHandler(marketplaceController.update));
marketplaceRouter.delete("/listings/:listingId", asyncHandler(marketplaceController.remove));
marketplaceRouter.post("/listings/:listingId/save", asyncHandler(marketplaceController.toggleSave));
marketplaceRouter.post("/listings/:listingId/contact", asyncHandler(marketplaceController.contactSeller));
